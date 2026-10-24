/*
 * 画面下部の人物検索（どのページからでも使える）
 * ----------------------------------------------------------------
 * ・名前（カタカナ・ひらがな・原語名）やキーワードを入れると、候補の人物が出ます
 *   候補を押すと、その人物の詳細画面が開きます
 * ・Enter（または「すべて表示」）で「名前で探す」タブに移り、全文検索の結果を表示します
 * ・🎤 ボタンで音声入力ができます（Chrome など音声認識に対応したブラウザ）
 * ・人物の詳細画面が開いているときも、その画面の下に表示されます
 */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (s) =>
    String(s).normalize("NFKC").toLowerCase()
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[・･\s\-‐–―「」『』（）()、。.,，．＝=]/g, "");

  // 検索用の索引（名前を重く、キーワード・説明を軽く）
  const index = THEOLOGIANS.map((t) => ({
    t,
    name: normalize(t.name),
    orig: normalize(t.original),
    parts: t.name.split(/[・＝（）()\s]/).map(normalize).filter((p) => p.length >= 2),
    kw: normalize([t.keywords.join(" "), t.region, t.country, t.tradition, (t.affiliation || "")].join(" ")),
    sum: normalize(t.summary)
  }));

  function scoreOf(x, term) {
    if (x.name === term || x.parts.includes(term)) return 100;
    if (x.name.startsWith(term) || x.parts.some((p) => p.startsWith(term))) return 80;
    if (x.name.includes(term)) return 60;
    if (x.orig.includes(term)) return 50;
    if (x.kw.includes(term)) return 30;
    if (x.sum.includes(term)) return 15;
    return 0;
  }
  function search(q) {
    const terms = q.split(/[\s　]+/).map(normalize).filter(Boolean);
    if (!terms.length) return [];
    return index
      .map((x) => {
        let s = 0;
        for (const term of terms) { const v = scoreOf(x, term); if (!v) return null; s += v; }
        return { t: x.t, s };
      })
      .filter(Boolean)
      .sort((a, b) => b.s - a.s || a.t.born - b.t.born);
  }

  // ---------- 部品 ----------
  const dock = document.createElement("div");
  dock.className = "qs-dock";
  dock.innerHTML = `
    <form class="qs-form" role="search" autocomplete="off">
      <ul class="qs-list" id="qs-list" role="listbox" hidden></ul>
      <span class="qs-icon" aria-hidden="true">🔍</span>
      <input class="qs-input" id="qs-input" type="search" enterkeyhint="search"
        placeholder="人物を検索（名前・キーワード）" aria-label="人物を検索" aria-controls="qs-list" aria-autocomplete="list">
      <button type="button" class="qs-mic" id="qs-mic" aria-label="音声で入力" title="音声で入力" hidden>🎤</button>
    </form>
    <p class="qs-voice" id="qs-voice" hidden></p>`;
  document.body.appendChild(dock);
  document.body.classList.add("has-qs");
  const form = dock.querySelector(".qs-form");
  const input = dock.querySelector("#qs-input");
  const list = dock.querySelector("#qs-list");
  const micBtn = dock.querySelector("#qs-mic");
  const voiceMsg = dock.querySelector("#qs-voice");
  let results = [];
  let active = -1;

  function renderList() {
    const q = input.value.trim();
    if (!q) { list.hidden = true; list.innerHTML = ""; active = -1; return; }
    results = search(q);
    const top = results.slice(0, 7);
    active = Math.min(active, top.length - 1);
    list.innerHTML = (top.length
      ? top.map(({ t }, i) => `
        <li role="option" aria-selected="${i === active}">
          <button type="button" class="qs-item ${i === active ? "is-active" : ""}" data-id="${t.id}" data-qs-index="${i}">
            <span class="qs-name">${escapeHtml(t.name)}</span>
            <span class="qs-meta">${escapeHtml(ERAS[t.era] ? ERAS[t.era].label : "")}・${escapeHtml(t.years)}・${escapeHtml(t.tradition)}</span>
          </button>
        </li>`).join("")
      : `<li class="qs-none">「${escapeHtml(q)}」に当てはまる人物は見つかりませんでした</li>`)
      + (results.length ? `<li><button type="button" class="qs-all" data-qs-all>「${escapeHtml(q)}」の検索結果をすべて表示（${results.length}名）→</button></li>` : "");
    list.hidden = false;
  }

  // 「名前で探す」タブで全文検索する
  function showAll() {
    const q = input.value.trim();
    const dialog = $("#detail");
    if (dialog && dialog.open) { const c = $("#d-close"); if (c) c.click(); }
    const tab = $('.tab[data-view="search"]');
    if (tab) tab.click();
    const main = $("#q");
    if (main) {
      main.value = q;
      main.dispatchEvent(new Event("input", { bubbles: true }));
    }
    closeList();
    input.blur();
    const target = $("#count") || $("#results");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function closeList() { list.hidden = true; active = -1; }

  input.addEventListener("input", () => { active = -1; renderList(); });
  input.addEventListener("focus", () => { if (input.value.trim()) renderList(); });
  input.addEventListener("keydown", (e) => {
    const items = list.querySelectorAll(".qs-item");
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!items.length) return;
      e.preventDefault();
      active = e.key === "ArrowDown" ? (active + 1) % items.length : (active <= 0 ? items.length - 1 : active - 1);
      renderList();
    } else if (e.key === "Escape") {
      closeList();
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const items = list.querySelectorAll(".qs-item");
    if (active >= 0 && items[active]) { items[active].click(); return; }
    // 名前がぴったり一人に当たるときは、その人を開く
    if (results.length === 1 || (results.length && results[0].s >= 100 && (!results[1] || results[1].s < 100))) {
      const b = list.querySelector(".qs-item");
      if (b) { b.click(); return; }
    }
    if (input.value.trim()) showAll();
  });
  list.addEventListener("click", (e) => {
    if (e.target.closest("[data-qs-all]")) { showAll(); return; }
    if (e.target.closest(".qs-item")) {
      // 人物を開くのは app.js（data-id のボタン）に任せる
      setTimeout(() => { closeList(); input.blur(); }, 0);
    }
  });
  document.addEventListener("click", (e) => { if (!dock.contains(e.target)) closeList(); });

  // 「/」キーで検索欄へ
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches && e.target.matches("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    input.focus();
  });

  // ---------- 音声入力 ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    micBtn.hidden = false;
    let rec = null;
    const stopRec = () => { if (rec) { try { rec.stop(); } catch (e) { /* 無視 */ } } };
    const say = (msg) => { voiceMsg.textContent = msg; voiceMsg.hidden = !msg; };

    micBtn.addEventListener("click", () => {
      if (rec) { stopRec(); return; }
      // 読み上げ中なら止める（自分の声を拾わないように）
      const ttsStop = document.querySelector(".tts-stop:not([hidden])");
      if (ttsStop) ttsStop.click();
      rec = new SR();
      rec.lang = "ja-JP";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      let finalText = "";
      rec.onstart = () => { micBtn.classList.add("is-listening"); micBtn.setAttribute("aria-label", "音声入力を止める"); say("お話しください…（例：「バルト」「希望の神学」）"); };
      rec.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const txt = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) finalText += txt; else interim += txt;
        }
        input.value = (finalText + interim).replace(/[。、．，.\s]+$/g, "").trim();
        active = -1;
        renderList();
      };
      rec.onerror = (ev) => {
        const m = ev.error === "not-allowed" || ev.error === "service-not-allowed"
          ? "マイクの使用が許可されていません。アドレスバーの左のアイコンから、このサイトのマイクを許可してください。"
          : ev.error === "no-speech" ? "声が聞き取れませんでした。もう一度🎤を押して話してください。"
          : ev.error === "network" ? "音声認識に接続できませんでした。インターネットの接続を確認してください。"
          : ev.error === "aborted" ? "" : "音声入力がうまくいきませんでした。もう一度お試しください。";
        say(m);
      };
      rec.onend = () => {
        micBtn.classList.remove("is-listening");
        micBtn.setAttribute("aria-label", "音声で入力");
        rec = null;
        if (voiceMsg.textContent.startsWith("お話しください")) say("");
        if (input.value.trim()) { renderList(); input.focus(); }
      };
      try { rec.start(); } catch (e) { rec = null; say("音声入力を始められませんでした。もう一度お試しください。"); }
    });
  }

  // ---------- 人物の詳細画面が開いているときも使えるように ----------
  const dialog = $("#detail");
  if (dialog) {
    const place = () => { (dialog.open ? dialog : document.body).appendChild(dock); closeList(); };
    new MutationObserver(place).observe(dialog, { attributes: true, attributeFilter: ["open"] });
    if (dialog.open) place();
  }
})();
