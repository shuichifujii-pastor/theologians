/*
 * 読み上げ
 * ----------------------------------------------------------------
 * 画面下部のボタンで、いま表示している画面の文章を読み上げます。
 * ブラウザの音声合成（Web Speech API）を使います。
 * 画面に見えている位置から下へ順に読み、読んでいる箇所に色を付けます。
 * 人物の詳細画面が開いているときは、その内容を読みます。
 * 文章をタップ（クリック）すると、そこから読み上げます。
 *   ・読み上げ中／一時停止中：タップした段落へすぐに移って読む
 *   ・止まっているとき：タップした段落に印を付け、▶ を押すとそこから読む
 */
(() => {
  "use strict";

  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
  const synth = window.speechSynthesis;
  const RATE_KEY = "theologian-tts-rate";
  const RATES = [0.8, 1, 1.2, 1.5];

  // 読み上げる単位（見出し・段落・一覧の項目・カードなど）
  const BLOCKS = "h1, h2, h3, h4, p, li, dt, dd, .card, .qz-choice, .inst-people button, .theme-btn";
  // 読み上げない部分（タブ・絞り込みボタン・入力欄・読み上げバー自身など）
  const SKIP = ".tabs, .d-essay, .chips, .filter-row, .search-box, .tradition-row, #timeline-kinds, .tts-bar, .close, .es-nav, .qz-actions, .qz-head, .qz-setting, .qz-type-tools, [hidden]";

  const loadRate = () => {
    try { const r = Number(localStorage.getItem(RATE_KEY)); return RATES.includes(r) ? r : 1; } catch (e) { return 1; }
  };
  let rate = loadRate();
  let queue = [];        // [{ el, chunks: [文…] }]
  let qi = 0;            // 読んでいる要素の番号
  let ci = 0;            // その要素の中で読んでいる文の番号
  let state = "idle";    // idle / playing / paused
  let current = null;    // いま読んでいる要素
  let token = 0;         // 停止後に古い発話の続きが動かないようにする
  let anchor = null;     // タップして選んだ読み始めの段落

  // ---------- バー ----------
  const bar = document.createElement("div");
  bar.className = "tts-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "読み上げ");
  bar.innerHTML = `
    <button type="button" class="tts-main" aria-label="画面を読み上げる"><span class="tts-icon" aria-hidden="true">▶</span><span class="tts-label">読み上げ</span></button>
    <button type="button" class="tts-stop" aria-label="読み上げを停止" hidden>■</button>
    <button type="button" class="tts-rate" aria-label="読み上げの速さ">×${rate}</button>`;
  document.body.appendChild(bar);
  document.body.classList.add("has-tts");
  const mainBtn = bar.querySelector(".tts-main");
  const stopBtn = bar.querySelector(".tts-stop");
  const rateBtn = bar.querySelector(".tts-rate");

  function setState(s) {
    state = s;
    bar.classList.toggle("is-playing", s === "playing");
    stopBtn.hidden = s === "idle";
    const [icon, label, aria] = s === "playing" ? ["❚❚", "一時停止", "読み上げを一時停止"]
      : s === "paused" ? ["▶", "続きを読む", "読み上げを再開"]
      : anchor ? ["▶", "ここから読む", "選んだ段落から読み上げる"]
      : ["▶", "読み上げ", "画面を読み上げる"];
    bar.querySelector(".tts-icon").textContent = icon;
    bar.querySelector(".tts-label").textContent = label;
    mainBtn.setAttribute("aria-label", aria);
  }

  // ---------- 読む内容を集める ----------
  const dialog = document.getElementById("detail");
  function targetRoot() {
    if (dialog && dialog.open) return dialog;
    return document.querySelector(".view:not([hidden])") || document.querySelector("main") || document.body;
  }
  const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const clean = (s) => s.replace(/\s+/g, " ").replace(/[→←▶■×]/g, "").trim();

  // 長い文章は句点で区切る（長すぎる発話が途中で止まるブラウザがあるため）
  function splitText(text) {
    const parts = text.match(/[^。！？!?]+[。！？!?」』）]*/g) || [text];
    const out = [];
    parts.forEach((p) => {
      p = p.trim();
      if (!p) return;
      while (p.length > 140) {
        const cut = Math.max(p.lastIndexOf("、", 140), 60);
        out.push(p.slice(0, cut + 1));
        p = p.slice(cut + 1);
      }
      if (p) out.push(p);
    });
    return out;
  }

  function collect(root, fromViewport) {
    const all = [...root.querySelectorAll(BLOCKS)]
      .filter((el) => !el.closest(SKIP) && isVisible(el));
    // 入れ子になっている要素は、外側のまとまり（カードなど）だけを読む
    const chosen = [];
    all.forEach((el) => {
      if (chosen.length && chosen[chosen.length - 1].contains(el)) return;
      chosen.push(el);
    });
    let list = chosen;
    if (fromViewport && root !== dialog) {
      const top = document.querySelector(".tabs") ? document.querySelector(".tabs").getBoundingClientRect().bottom : 0;
      const idx = list.findIndex((el) => el.getBoundingClientRect().bottom > Math.max(top, 0) + 4);
      if (idx > 0) list = list.slice(idx);
    }
    return list
      .map((el) => ({ el, chunks: splitText(clean(el.innerText || el.textContent || "")) }))
      .filter((x) => x.chunks.length);
  }

  // ---------- 声 ----------
  let voice = null;
  function pickVoice() {
    const vs = synth.getVoices().filter((v) => /^ja(-|_|$)/i.test(v.lang));
    voice = vs.find((v) => /google/i.test(v.name)) || vs.find((v) => /nanami|keita|online|natural/i.test(v.name)) || vs[0] || null;
  }
  pickVoice();
  if ("onvoiceschanged" in synth) synth.addEventListener("voiceschanged", pickVoice);

  // ---------- 読み上げ ----------
  function mark(el) {
    if (current) current.classList.remove("tts-reading");
    current = el;
    if (!el) return;
    el.classList.add("tts-reading");
    const r = el.getBoundingClientRect();
    const h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < 60 || r.bottom > h - 90) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function speakNext() {
    if (state !== "playing") return;
    if (qi >= queue.length) return stop();
    const item = queue[qi];
    if (!item.el.isConnected) { qi += 1; ci = 0; return speakNext(); }
    if (ci === 0 || current !== item.el) mark(item.el);
    const u = new SpeechSynthesisUtterance(item.chunks[ci]);
    u.lang = "ja-JP";
    if (voice) u.voice = voice;
    u.rate = rate;
    const my = token;
    const advance = () => {
      if (my !== token || state !== "playing") return;
      ci += 1;
      if (ci >= item.chunks.length) { qi += 1; ci = 0; }
      speakNext();
    };
    u.onend = advance;
    u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") advance(); };
    synth.speak(u);
  }

  // 選んだ段落（またはそれを含むまとまり）の位置
  const indexOfBlock = (list, el) => list.findIndex((x) => x.el === el || x.el.contains(el) || el.contains(x.el));

  function setAnchor(el) {
    if (anchor) anchor.classList.remove("tts-anchor");
    anchor = el;
    if (el) el.classList.add("tts-anchor");
    if (state === "idle") setState("idle");
  }

  function start() {
    const root = targetRoot();
    qi = 0; ci = 0;
    if (anchor && anchor.isConnected && root.contains(anchor)) {
      queue = collect(root, false);
      qi = Math.max(0, indexOfBlock(queue, anchor));
    } else {
      queue = collect(root, true);
    }
    setAnchor(null);
    if (!queue.length) return;
    token += 1;
    synth.cancel();
    setState("playing");
    speakNext();
  }
  // 一時停止は「止めて位置を覚える」方式（スマホでも確実に再開できるように）
  function pause() {
    token += 1;
    setState("paused");
    synth.cancel();
  }
  function resume() {
    token += 1;
    synth.cancel();
    setState("playing");
    speakNext();
  }
  function stop() {
    token += 1;
    synth.cancel();
    setState("idle");
    mark(null);
    setAnchor(null);
    queue = []; qi = 0; ci = 0;
  }

  // ---------- タップした所から読む ----------
  document.addEventListener("click", (e) => {
    // ボタン・リンク・入力欄などは、本来の働き（詳細を開くなど）を優先する
    if (e.target.closest("button, a, input, select, textarea, label, summary, .tts-bar")) return;
    // 文字を選択（なぞってコピー）しているときは反応しない
    const sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && String(sel).trim()) return;
    const root = targetRoot();
    const el = e.target.closest(BLOCKS);
    if (!el || !root.contains(el) || el.closest(SKIP)) return;
    if (state === "idle") {
      setAnchor(anchor === el ? null : el); // 同じ所をもう一度タップすると解除
      return;
    }
    // 読み上げ中・一時停止中は、その段落へ移って読む
    let i = indexOfBlock(queue, el);
    if (i < 0) { queue = collect(root, false); i = indexOfBlock(queue, el); }
    if (i < 0) return;
    qi = i; ci = 0;
    resume();
  });

  mainBtn.addEventListener("click", () => {
    if (state === "playing") pause();
    else if (state === "paused") resume();
    else start();
  });
  stopBtn.addEventListener("click", stop);
  rateBtn.addEventListener("click", () => {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    rateBtn.textContent = `×${rate}`;
    try { localStorage.setItem(RATE_KEY, String(rate)); } catch (e) { /* 保存できなくても読み上げは使える */ }
    if (state === "playing") resume(); // 新しい速さで、いまの文から読み直す
  });

  // 詳細画面の開閉に合わせて、バーをその中へ移す（開いている間も押せるように）
  if (dialog) {
    new MutationObserver(() => {
      if (state !== "idle") stop();
      if (anchor && !targetRoot().contains(anchor)) setAnchor(null);
      (dialog.open ? dialog : document.body).appendChild(bar);
    }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
    if (dialog.open) dialog.appendChild(bar); // URL（#人物）から直接開いた場合
  }
  // 画面（タブや詳解ページなど）を切り替えたら止める
  document.addEventListener("click", (e) => {
    if (e.target.closest(".tab, [data-essay], [data-essay-back], [data-debate], [data-inst], [data-stream]")) {
      if (state !== "idle") stop(); else setAnchor(null);
    }
  });
  // ページを離れるときは止める
  window.addEventListener("pagehide", () => synth.cancel());
})();
