/*
 * メモの同期（Googleアカウント）
 * ----------------------------------------------------------------
 * Googleアカウントでログインすると、メモを Firebase（Cloud Firestore）に保存し、
 * 同じアカウントでログインしたどの端末からでも同じメモを読み書きできます。
 *
 *   保存場所： users/{ログインした人のID}/notes/{神学者のid}  { text, updated }
 *   ・ほかの人のメモは読めません（Firestore のセキュリティルールで制限）
 *   ・ログインしていないときや電波がないときも、メモはこの端末に保存され、
 *     次にログインして接続したときに、新しい方が両方に反映されます
 *
 * js/firebase-config.js が未設定（null）のときは何もしません。
 * 読み込みを軽くするため、Firebase の部品はページ表示の少し後で読み込みます。
 */
(() => {
  "use strict";

  const box = document.getElementById("notes-sync");
  if (!box || typeof NOTES === "undefined") return;
  if (typeof FIREBASE_CONFIG === "undefined" || !FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey) return; // 未設定

  const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  const FILES = ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js"];
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hhmm = (d = new Date()) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;

  const UID_KEY = "theologian-sync-uid"; // この端末で最後に同期したアカウント
  const lastUid = () => { try { return localStorage.getItem(UID_KEY); } catch (e) { return null; } };
  const setLastUid = (v) => { try { v ? localStorage.setItem(UID_KEY, v) : localStorage.removeItem(UID_KEY); } catch (e) { /* 無視 */ } };
  let auth = null, db = null, user = null, unsub = null;
  let phase = "loading";   // loading / out / signing / syncing / on / error / unavailable
  let message = "";
  let lastSync = "";

  function render() {
    box.hidden = false;
    document.body.classList.toggle("sync-on", phase === "on" || phase === "syncing");
    let html = "";
    if (phase === "loading") {
      html = `<span class="sy-text">☁ 同期の準備中…</span>`;
    } else if (phase === "unavailable") {
      html = `<span class="sy-text">☁ いまは同期機能に接続できません（電波の状態を確認して、ページを再読み込みしてください）。メモはこの端末に保存されます。</span>`;
    } else if (phase === "out" || phase === "signing" || phase === "error") {
      html = `
        <span class="sy-text">☁ Googleアカウントでログインすると、同じアカウントのどの端末（スマホ・パソコン）からでも、同じメモを読み書きできます。</span>
        <button class="sy-btn sy-login" id="sync-login" ${phase === "signing" ? "disabled" : ""}>${phase === "signing" ? "ログイン中…" : "Googleでログインして同期"}</button>
        ${message ? `<span class="sy-msg">${escapeHtml(message)}</span>` : ""}`;
    } else {
      const who = user ? (user.email || user.displayName || "") : "";
      html = `
        <span class="sy-text"><span class="sy-dot" aria-hidden="true"></span>${escapeHtml(who)} で同期${phase === "syncing" ? "しています…" : `中${lastSync ? `（最終同期 ${lastSync}）` : ""}`}</span>
        <button class="sy-btn" id="sync-logout">ログアウト</button>
        ${message ? `<span class="sy-msg">${escapeHtml(message)}</span>` : ""}`;
    }
    box.innerHTML = html;
  }
  const set = (p, msg = "") => { phase = p; message = msg; render(); };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("load failed: " + src));
      document.head.appendChild(s);
    });
  }

  async function init() {
    try {
      for (const f of FILES) await loadScript(SDK + f); // 順番に読み込む（app が先）
      firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
    } catch (e) {
      set("unavailable");
      return;
    }
    auth.onAuthStateChanged(onUser);
  }

  const notesCol = (uid) => db.collection("users").doc(uid).collection("notes");

  async function onUser(u) {
    if (unsub) { unsub(); unsub = null; }
    user = u;
    if (!u) { set("out"); return; }
    set("syncing");
    // 前に別のアカウントで使っていた端末なら、その人のメモを混ぜないように、いったん空にする
    if (lastUid() && lastUid() !== u.uid) NOTES.clearLocal();
    setLastUid(u.uid);
    try {
      const col = notesCol(u.uid);
      // 1) クラウドにある方が新しいメモを、この端末に取り込む
      const snap = await col.get();
      const remote = {};
      snap.forEach((d) => { remote[d.id] = d.data(); });
      NOTES.applyRemote(Object.entries(remote));
      // 2) この端末の方が新しいメモ（ログイン前に書いたものなど）を、クラウドに送る
      const pending = Object.entries(NOTES.entries())
        .filter(([id, n]) => !remote[id] || (Number(remote[id].updated) || 0) < n.updated);
      for (let i = 0; i < pending.length; i += 400) {
        const batch = db.batch();
        pending.slice(i, i + 400).forEach(([id, n]) => batch.set(col.doc(id), { text: n.text, updated: n.updated }));
        await batch.commit();
      }
      // 3) ほかの端末での変更を、その場で受け取る
      unsub = col.onSnapshot((s) => {
        const list = [];
        s.docChanges().forEach((ch) => { if (ch.type !== "removed") list.push([ch.doc.id, ch.doc.data()]); });
        NOTES.applyRemote(list);
        if (!s.metadata.hasPendingWrites) { lastSync = hhmm(); if (phase === "on") render(); }
      }, () => set("on", "ほかの端末の変更を受け取れませんでした。ページを再読み込みしてください。"));
      lastSync = hhmm();
      set("on");
    } catch (e) {
      set("on", "同期できませんでした。電波の状態を確認して、ページを再読み込みしてください。");
    }
  }

  // この端末で書いたメモを、クラウドにも保存する
  NOTES.onLocalChange((id, rec) => {
    if (!user || !db) return;
    notesCol(user.uid).doc(id).set({ text: rec.text, updated: rec.updated })
      .then(() => { lastSync = hhmm(); if (phase === "on") { message = ""; render(); } })
      .catch(() => { if (phase === "on") set("on", "クラウドに保存できませんでした（この端末には保存済み）。次に接続したときに同期します。"); });
  });

  box.addEventListener("click", async (e) => {
    if (e.target.closest("#sync-login") && auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      set("signing");
      try {
        await auth.signInWithPopup(provider);
      } catch (err) {
        const code = err && err.code ? err.code : "";
        if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
          try { await auth.signInWithRedirect(provider); return; } catch (e2) { /* 下で表示 */ }
        }
        const msg = code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" ? ""
          : code === "auth/unauthorized-domain" ? "このサイトのアドレスが Firebase に登録されていません（設定を確認してください）。"
          : "ログインできませんでした。もう一度お試しください。";
        set("out", msg);
      }
    } else if (e.target.closest("#sync-logout") && auth) {
      if (!window.confirm("ログアウトしますか？\nメモはクラウドに保存されているので、もう一度ログインすれば読み出せます。")) return;
      const wipe = window.confirm("この端末に残っているメモの写しも消しますか？\n\n教会などの共用のパソコンでは「OK」（消す）をおすすめします。\n自分専用の端末なら「キャンセル」（残す）で構いません。");
      await auth.signOut();
      if (wipe) { NOTES.clearLocal(); setLastUid(null); }
    }
  });

  render();
  // ページの表示を優先し、少し後で Firebase を読み込む
  const start = () => init();
  if (document.readyState === "complete") setTimeout(start, 800);
  else window.addEventListener("load", () => setTimeout(start, 800));
})();
