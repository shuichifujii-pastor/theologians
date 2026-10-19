/*
 * 神学者クイズ
 * ----------------------------------------------------------------
 * js/data.js と js/details.js のデータから問題を自動で作ります。
 * 神学者を追加すれば、そのぶん問題も自動で増えます。
 */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const root = $("#quiz");
  if (!root) return;

  const BEST_KEY = "theologian-quiz-best";
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 多くの人に共通するキーワードはヒントにならないので除く
  const keywordCount = {};
  THEOLOGIANS.forEach((t) => t.keywords.forEach((k) => { keywordCount[k] = (keywordCount[k] || 0) + 1; }));

  // 名前の一部（「ルター」「アウグスティヌス」など）を伏せ字にする
  function nameParts(t) {
    return t.name
      .replace(/[（）()]/g, "・")
      .split(/[・＝\s]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && !/^(の|聖)$/.test(s))
      .flatMap((s) => [s, s.replace(/^.*の/, "")])
      .filter((s) => s.length >= 2);
  }
  function mask(text, t) {
    let out = text;
    nameParts(t).sort((a, b) => b.length - a.length).forEach((p) => { out = out.split(p).join("〇〇"); });
    return out;
  }

  const allNameParts = [...new Set(THEOLOGIANS.flatMap(nameParts))];

  // 似た時代・同じ地域の人を選択肢に混ぜて、少し難しくする
  function distractors(t, pool, n) {
    const others = pool.filter((o) => o.id !== t.id);
    const near = shuffle(others.filter((o) => Math.abs(o.born - t.born) <= 150 || o.country === t.country));
    const rest = shuffle(others.filter((o) => !near.includes(o)));
    return [...near, ...rest].slice(0, n);
  }

  // ---------- 問題の型 ----------
  const TYPES = {
    summary: {
      label: "人物当て",
      make(t, pool) {
        return {
          prompt: "次の説明にあてはまるのは誰？",
          body: mask(t.summary, t),
          choices: shuffle([t, ...distractors(t, pool, 3)]).map((o) => ({ text: o.name, ok: o.id === t.id }))
        };
      }
    },
    keyword: {
      label: "キーワード",
      make(t, pool) {
        // 人名そのもの（本人や他の神学者の名前）を含むキーワードはヒントにしない
        const kws = t.keywords.filter((k) => keywordCount[k] === 1 && !allNameParts.some((p) => k.includes(p)));
        if (kws.length < 1) return null;
        const shown = shuffle(kws).slice(0, 2);
        return {
          prompt: "このキーワードで知られるのは誰？",
          body: shown.map((k) => `「${k}」`).join("　"),
          choices: shuffle([t, ...distractors(t, pool, 3)]).map((o) => ({ text: o.name, ok: o.id === t.id }))
        };
      }
    },
    works: {
      label: "主著",
      make(t, pool) {
        if (!t.works.length) return null;
        const answer = pick(t.works);
        const others = shuffle(distractors(t, pool, 12))
          .map((o) => pick(o.works))
          .filter((w) => w && w !== answer);
        const wrong = [...new Set(others)].slice(0, 3);
        if (wrong.length < 3) return null;
        return {
          prompt: `${t.name} の著作はどれ？`,
          body: "",
          choices: shuffle([{ text: answer, ok: true }, ...wrong.map((w) => ({ text: w, ok: false }))])
        };
      }
    },
    era: {
      label: "時代",
      make(t) {
        const correct = ERAS[t.era].label;
        const wrong = shuffle(Object.values(ERAS).map((e) => e.label).filter((l) => l !== correct)).slice(0, 3);
        return {
          prompt: `${t.name} が活躍した時代は？`,
          body: t.original,
          choices: shuffle([correct, ...wrong]).map((l) => ({ text: l, ok: l === correct }))
        };
      }
    },
    tradition: {
      label: "教派",
      make(t) {
        if (/未確認|属さない/.test(t.tradition)) return null;
        const all = [...new Set(THEOLOGIANS.map((o) => o.tradition))].filter((x) => x !== t.tradition && !/未確認/.test(x));
        return {
          prompt: `${t.name} の教派・伝統は？`,
          body: t.original,
          choices: shuffle([t.tradition, ...shuffle(all).slice(0, 3)]).map((x) => ({ text: x, ok: x === t.tradition }))
        };
      }
    },
    life: {
      label: "生涯",
      make(t, pool) {
        const d = typeof DETAILS !== "undefined" && DETAILS[t.id];
        if (!d || !d.life) return null;
        const first = d.life.split("。").slice(0, 2).join("。") + "。";
        return {
          prompt: "この生涯を送ったのは誰？",
          body: mask(first, t),
          choices: shuffle([t, ...distractors(t, pool, 3)]).map((o) => ({ text: o.name, ok: o.id === t.id }))
        };
      }
    }
  };

  // ---------- 出題範囲 ----------
  const RANGES = {
    all:      { label: "すべて",        test: () => true },
    japan:    { label: "日本",          test: (t) => t.country === "日本" },
    overseas: { label: "海外",          test: (t) => t.country !== "日本" },
    ancient:  { label: "古代・中世",     test: (t) => t.era === "ancient" || t.era === "medieval" },
    reform:   { label: "宗教改革〜近代", test: (t) => ["reformation", "early-modern", "modern"].includes(t.era) },
    modern:   { label: "現代",          test: (t) => t.era === "contemporary" },
    philo:    { label: "哲学者",        test: (t) => t.fields.includes("哲学") }
  };

  const RANKS = [
    [95, "教会博士", "見事です。辞典の編者になれます。"],
    [80, "牧師", "よく学んでいます。あと一歩で満点。"],
    [60, "伝道師", "基礎はばっちり。詳しい解説も読んでみましょう。"],
    [40, "神学生", "これから伸びます。間違えた人物を復習しましょう。"],
    [0,  "求道者", "まずは年表や解説をのぞいてから再挑戦！"]
  ];

  const state = { range: "all", count: 10, types: Object.keys(TYPES), questions: [], i: 0, score: 0, streak: 0, bestStreak: 0, missed: [] };

  function loadBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveBest(key, value) {
    try {
      const b = loadBest();
      if (!b[key] || value > b[key]) { b[key] = value; localStorage.setItem(BEST_KEY, JSON.stringify(b)); return true; }
    } catch (e) { /* 保存できない環境でも遊べるようにする */ }
    return false;
  }

  // ---------- 画面：スタート ----------
  function renderStart() {
    const best = loadBest();
    const bestKey = `${state.range}-${state.count}`;
    root.innerHTML = `
      <div class="qz-card qz-start">
        <h2 class="qz-title">神学者クイズ</h2>
        <p class="qz-lead">説明・キーワード・主著・生涯などから神学者を当てる4択クイズです。連続正解でボーナス点！</p>
        <div class="qz-setting">
          <span class="filter-label">出題範囲</span>
          <div class="chips chips-small">${Object.entries(RANGES).map(([k, r]) =>
            `<button class="chip ${state.range === k ? "is-on" : ""}" data-range="${k}">${r.label}<span class="chip-n">${THEOLOGIANS.filter(r.test).length}</span></button>`).join("")}</div>
        </div>
        <div class="qz-setting">
          <span class="filter-label">問題数</span>
          <div class="chips chips-small">${[5, 10, 20].map((n) =>
            `<button class="chip ${state.count === n ? "is-on" : ""}" data-count="${n}">${n}問</button>`).join("")}</div>
        </div>
        <div class="qz-setting">
          <span class="filter-label">問題の種類</span>
          <div class="chips chips-small">${Object.entries(TYPES).map(([k, ty]) =>
            `<button class="chip ${state.types.includes(k) ? "is-on" : ""}" data-type="${k}">${ty.label}</button>`).join("")}</div>
        </div>
        <p class="qz-best">${best[bestKey] ? `この設定の最高得点：<strong>${best[bestKey]}点</strong>` : "この設定ではまだ記録がありません"}</p>
        <button class="qz-go" id="qz-start">スタート</button>
      </div>`;
  }

  // ---------- 問題を作る ----------
  function buildQuestions() {
    const pool = THEOLOGIANS.filter(RANGES[state.range].test);
    const choicePool = pool.length >= 8 ? pool : THEOLOGIANS;
    const people = shuffle(pool);
    const qs = [];
    for (const t of people) {
      if (qs.length >= state.count) break;
      for (const type of shuffle(state.types)) {
        const q = TYPES[type].make(t, choicePool);
        if (q) { qs.push({ ...q, person: t, type }); break; }
      }
    }
    return qs;
  }

  // ---------- 画面：問題 ----------
  function renderQuestion() {
    const q = state.questions[state.i];
    const n = state.questions.length;
    root.innerHTML = `
      <div class="qz-card">
        <div class="qz-head">
          <span>第 ${state.i + 1} 問 / ${n}</span>
          <span class="qz-type">${TYPES[q.type].label}</span>
          <span class="qz-score">得点 <strong>${state.score}</strong></span>
        </div>
        <div class="qz-bar"><span style="width:${(state.i / n) * 100}%"></span></div>
        ${state.streak >= 2 ? `<p class="qz-streak">${state.streak}問連続正解中！</p>` : ""}
        <p class="qz-prompt">${escapeHtml(q.prompt)}</p>
        ${q.body ? `<p class="qz-body">${escapeHtml(q.body)}</p>` : ""}
        <div class="qz-choices">
          ${q.choices.map((c, k) => `<button class="qz-choice" data-choice="${k}"><span class="qz-key">${"ABCD"[k]}</span>${escapeHtml(c.text)}</button>`).join("")}
        </div>
        <div class="qz-feedback" id="qz-feedback" hidden></div>
      </div>`;
  }

  function answer(k) {
    const q = state.questions[state.i];
    if (q.answered) return;
    q.answered = true;
    const ok = q.choices[k].ok;
    root.querySelectorAll(".qz-choice").forEach((b, idx) => {
      b.disabled = true;
      if (q.choices[idx].ok) b.classList.add("is-correct");
      else if (idx === k) b.classList.add("is-wrong");
    });
    let gained = 0;
    if (ok) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gained = 10 + Math.min(state.streak - 1, 5) * 2; // 連続正解ボーナス（最大+10）
      state.score += gained;
    } else {
      state.streak = 0;
      state.missed.push(q.person);
    }
    const t = q.person;
    const fb = $("#qz-feedback");
    fb.hidden = false;
    fb.className = `qz-feedback ${ok ? "ok" : "ng"}`;
    fb.innerHTML = `
      <p class="qz-verdict">${ok ? `正解！ +${gained}点` : "残念…"}</p>
      <p class="qz-answer"><strong>${escapeHtml(t.name)}</strong>（${escapeHtml(t.years)}・${escapeHtml(ERAS[t.era].label)}・${escapeHtml(t.tradition)}）</p>
      <p class="qz-sum">${escapeHtml(t.summary)}</p>
      <div class="qz-actions">
        <button class="qz-link" data-id="${t.id}">詳しく見る</button>
        <button class="qz-go" id="qz-next">${state.i + 1 < state.questions.length ? "次の問題へ" : "結果を見る"}</button>
      </div>`;
    $("#qz-next").focus();
  }

  // ---------- 画面：結果 ----------
  function renderResult() {
    const n = state.questions.length;
    const correct = n - state.missed.length;
    const pct = Math.round((correct / n) * 100);
    const [, title, msg] = RANKS.find(([min]) => pct >= min);
    const isBest = saveBest(`${state.range}-${state.count}`, state.score);
    const missed = [...new Map(state.missed.map((t) => [t.id, t])).values()];
    root.innerHTML = `
      <div class="qz-card qz-result">
        <p class="qz-rank-label">あなたの称号</p>
        <p class="qz-rank">${title}</p>
        <p class="qz-lead">${msg}</p>
        <div class="qz-stats">
          <div><span>${correct}/${n}</span>正解</div>
          <div><span>${state.score}</span>得点${isBest ? "<em>自己ベスト！</em>" : ""}</div>
          <div><span>${state.bestStreak}</span>最大連続正解</div>
        </div>
        ${missed.length ? `
          <h3>復習しよう</h3>
          <div class="related">${missed.map((t) => `<button data-id="${t.id}">${escapeHtml(t.name)}</button>`).join("")}</div>` : ""}
        <div class="qz-actions">
          <button class="qz-link" id="qz-settings">設定を変える</button>
          <button class="qz-go" id="qz-again">もう一度挑戦</button>
        </div>
      </div>`;
  }

  function start() {
    state.questions = buildQuestions();
    state.i = 0; state.score = 0; state.streak = 0; state.bestStreak = 0; state.missed = [];
    if (!state.questions.length) {
      root.insertAdjacentHTML("beforeend", `<p class="empty">この設定では問題を作れませんでした。範囲や種類を変えてください。</p>`);
      return;
    }
    renderQuestion();
  }

  // ---------- 操作 ----------
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.range) { state.range = b.dataset.range; renderStart(); }
    else if (b.dataset.count) { state.count = Number(b.dataset.count); renderStart(); }
    else if (b.dataset.type) {
      const k = b.dataset.type;
      if (state.types.includes(k)) { if (state.types.length > 1) state.types = state.types.filter((x) => x !== k); }
      else state.types.push(k);
      renderStart();
    }
    else if (b.id === "qz-start" || b.id === "qz-again") start();
    else if (b.id === "qz-settings") renderStart();
    else if (b.dataset.choice !== undefined) answer(Number(b.dataset.choice));
    else if (b.id === "qz-next") {
      state.i += 1;
      state.i < state.questions.length ? renderQuestion() : renderResult();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  });

  // キーボード（1〜4 / A〜D で回答、Enter で次へ）
  document.addEventListener("keydown", (e) => {
    if (root.closest(".view").hidden || document.querySelector("dialog[open]")) return;
    const q = state.questions[state.i];
    const idx = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
    if (q && !q.answered && idx >= 0 && $(".qz-choice")) answer(idx);
    else if (e.key === "Enter" && $("#qz-next") && document.activeElement !== $("#qz-next")) $("#qz-next").click();
  });

  renderStart();
})();
