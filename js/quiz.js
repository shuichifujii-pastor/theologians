/*
 * 神学者クイズ
 * ----------------------------------------------------------------
 * js/data.js・details.js・critiques.js・debates.js・institutions.js・
 * streams.js・essays.js のデータから問題を自動で作ります。
 * 神学者や論争・会議などを追加すれば、そのぶん問題も自動で増えます。
 */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const root = $("#quiz");
  if (!root) return;

  const BEST_KEY = "theologian-quiz-best";
  const MISSED_KEY = "theologian-quiz-missed";
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
  const firstSentences = (text, n, max = 160) => {
    const s = text.split("。").filter(Boolean).slice(0, n).join("。") + "。";
    return s.length > max ? s.slice(0, max) + "…" : s;
  };

  const byId = Object.fromEntries(THEOLOGIANS.map((t) => [t.id, t]));
  const DEBATE_LIST = typeof DEBATES !== "undefined" ? DEBATES : [];
  const INST_LIST = typeof INSTITUTIONS !== "undefined" ? INSTITUTIONS : [];
  const STREAM_LIST = typeof STREAMS !== "undefined" ? STREAMS : [];
  const debatesOf = (id) => DEBATE_LIST.filter((d) => d.people.some((p) => p[0] === id));
  const instsOf = (id) => INST_LIST.filter((x) => x.people.some((p) => p[0] === id));
  const streamsOf = (id) => STREAM_LIST.filter((s) => s.people.includes(id));
  const roleIn = (list, id) => (list.find((p) => p[0] === id) || [])[1] || "";

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
  function distractors(t, pool, n, exclude = new Set()) {
    const others = pool.filter((o) => o.id !== t.id && !exclude.has(o.id));
    const near = shuffle(others.filter((o) => Math.abs(o.born - t.born) <= 150 || o.country === t.country));
    const rest = shuffle(others.filter((o) => !near.includes(o)));
    return [...near, ...rest].slice(0, n);
  }
  const personChoices = (t, pool, exclude) =>
    shuffle([t, ...distractors(t, pool, 3, exclude)]).map((o) => ({ text: o.name, ok: o.id === t.id }));

  // 正解以外の選択肢（文字列）を、近いものを優先して3つ選ぶ
  function wrongOptions(correct, near, far) {
    const seen = new Set([correct]);
    const out = [];
    for (const x of [...shuffle(near), ...shuffle(far)]) {
      if (!seen.has(x)) { seen.add(x); out.push(x); }
      if (out.length === 3) break;
    }
    return out.length === 3 ? out : null;
  }
  const textChoices = (correct, wrong) =>
    shuffle([correct, ...wrong]).map((x) => ({ text: x, ok: x === correct }));

  // ---------- 問題の型 ----------
  // make(t, pool) は問題を返す。作れないときは null。
  // extra: 回答後に表示する補足 { text, attr, id, label }
  const TYPES = {
    // ===== 人物を当てる =====
    summary: {
      group: "人物を当てる", label: "人物当て",
      make(t, pool) {
        return { prompt: "次の説明にあてはまるのは誰？", body: mask(t.summary, t), choices: personChoices(t, pool) };
      }
    },
    keyword: {
      group: "人物を当てる", label: "キーワード",
      make(t, pool) {
        // 人名そのもの（本人や他の神学者の名前）を含むキーワードはヒントにしない
        const kws = t.keywords.filter((k) => keywordCount[k] === 1 && !allNameParts.some((p) => k.includes(p)));
        if (kws.length < 1) return null;
        const shown = shuffle(kws).slice(0, 2);
        return { prompt: "このキーワードで知られるのは誰？", body: shown.map((k) => `「${k}」`).join("　"), choices: personChoices(t, pool) };
      }
    },
    life: {
      group: "人物を当てる", label: "生涯",
      make(t, pool) {
        const d = typeof DETAILS !== "undefined" && DETAILS[t.id];
        if (!d || !d.life) return null;
        return { prompt: "この生涯を送ったのは誰？", body: mask(firstSentences(d.life, 2, 200), t), choices: personChoices(t, pool) };
      }
    },
    thought: {
      group: "人物を当てる", label: "思想",
      make(t, pool) {
        const d = typeof DETAILS !== "undefined" && DETAILS[t.id];
        if (!d || !d.points || !d.points.length) return null;
        const body = mask(pick(d.points), t);
        if (body.includes("〇〇") && body.replace(/〇〇/g, "").length < 20) return null;
        return { prompt: "次の考え方を示したのは誰？", body, choices: personChoices(t, pool) };
      }
    },
    critique: {
      group: "人物を当てる", label: "批判と論争",
      make(t, pool) {
        const c = typeof CRITIQUES !== "undefined" && CRITIQUES[t.id];
        if (!c || !c.text) return null;
        // 本文に名前の出てくる批判者は選択肢から外す（答えが明らかになるため）
        const critics = new Set(c.critics || []);
        return {
          prompt: "次のような批判を受けたのは誰？",
          body: mask(firstSentences(c.text, 2, 200), t),
          choices: personChoices(t, pool, critics)
        };
      }
    },
    term: {
      group: "人物を当てる", label: "神学用語",
      make(t, pool) {
        const e = typeof ESSAYS !== "undefined" && ESSAYS[t.id];
        if (!e || !e.terms || !e.terms.length) return null;
        const [k, v] = pick(e.terms);
        return {
          prompt: "次の用語は、誰の神学・思想のキーワード？",
          body: `「${k}」――${mask(v, t)}`,
          choices: personChoices(t, pool),
          extra: { text: `詳解ページで「${t.name}の神学・思想」を読めます。`, attr: "data-essay", id: t.id, label: "詳解を読む" }
        };
      }
    },
    // ===== 著作と年代 =====
    works: {
      group: "著作と年代", label: "主著",
      make(t, pool) {
        const real = t.works.filter((w) => !/^（/.test(w));
        if (!real.length) return null;
        const answer = pick(real);
        const others = shuffle(distractors(t, pool, 12)).map((o) => pick(o.works)).filter((w) => w && !/^（/.test(w) && w !== answer);
        const wrong = [...new Set(others)].slice(0, 3);
        if (wrong.length < 3) return null;
        return { prompt: `${t.name} の著作はどれ？`, body: "", choices: textChoices(answer, wrong) };
      }
    },
    era: {
      group: "著作と年代", label: "時代",
      make(t) {
        const correct = ERAS[t.era].label;
        const wrong = shuffle(Object.values(ERAS).map((e) => e.label).filter((l) => l !== correct)).slice(0, 3);
        return { prompt: `${t.name} が活躍した時代は？`, body: t.original, choices: textChoices(correct, wrong) };
      }
    },
    order: {
      group: "著作と年代", label: "年代順",
      make(t, pool) {
        // t が最も早く生まれた人になるように、少し後の時代の3人を選ぶ
        const later = shuffle(pool.filter((o) => o.born - t.born >= 10 && o.born - t.born <= 250));
        const chosen = [];
        for (const o of later) {
          if (chosen.every((c) => Math.abs(c.born - o.born) >= 5)) chosen.push(o);
          if (chosen.length === 3) break;
        }
        if (chosen.length < 3) return null;
        const all = [t, ...chosen];
        return {
          prompt: "この中で、最も早く生まれたのは誰？",
          body: "",
          choices: shuffle(all).map((o) => ({ text: o.name, ok: o.id === t.id })),
          extra: { text: all.sort((a, b) => a.born - b.born).map((o) => `${o.name}（${o.years}）`).join(" → ") }
        };
      }
    },
    tradition: {
      group: "著作と年代", label: "教派",
      make(t) {
        if (/未確認|属さない/.test(t.tradition)) return null;
        const all = [...new Set(THEOLOGIANS.map((o) => o.tradition))].filter((x) => x !== t.tradition && !/未確認/.test(x));
        return { prompt: `${t.name} の教派・伝統は？`, body: t.original, choices: textChoices(t.tradition, shuffle(all).slice(0, 3)) };
      }
    },
    // ===== つながり =====
    debatePerson: {
      group: "つながり", label: "論争の当事者",
      make(t, pool) {
        const ds = debatesOf(t.id);
        if (!ds.length) return null;
        const d = pick(ds);
        const involved = new Set(d.people.map((p) => p[0]));
        const role = mask(roleIn(d.people, t.id), t);
        return {
          prompt: `「${mask(d.title, t)}」（${d.date}）で、次の役割を果たしたのは誰？`,
          body: role,
          choices: personChoices(t, pool, involved),
          extra: { text: firstSentences(d.summary, 1, 140), attr: "data-debate", id: d.id, label: "論争・会議を見る" }
        };
      }
    },
    debateOf: {
      group: "つながり", label: "論争・会議",
      make(t) {
        const ds = debatesOf(t.id);
        if (!ds.length) return null;
        const d = pick(ds);
        const notMine = DEBATE_LIST.filter((x) => !ds.includes(x));
        const near = notMine.filter((x) => Math.abs(x.year - d.year) <= 300).map((x) => x.title);
        const wrong = wrongOptions(d.title, near, notMine.map((x) => x.title));
        if (!wrong) return null;
        return {
          prompt: `${t.name} が関わった論争・会議はどれ？`,
          body: t.original,
          choices: textChoices(d.title, wrong).map((c) => ({ ...c, text: mask(c.text, t) })),
          extra: { text: `${t.name}：${roleIn(d.people, t.id)}`, attr: "data-debate", id: d.id, label: "論争・会議を見る" }
        };
      }
    },
    inst: {
      group: "つながり", label: "教育機関",
      make(t) {
        const xs = instsOf(t.id);
        if (!xs.length) return null;
        const x = pick(xs);
        const notMine = INST_LIST.filter((o) => !xs.includes(o));
        const wrong = wrongOptions(x.name, notMine.filter((o) => o.region === x.region).map((o) => o.name), notMine.map((o) => o.name));
        if (!wrong) return null;
        return {
          prompt: `${t.name} が関わった神学教育機関はどれ？`,
          body: t.original,
          choices: textChoices(x.name, wrong),
          extra: { text: `${x.name}：${roleIn(x.people, t.id)}`, attr: "data-inst", id: x.id, label: "教育機関を見る" }
        };
      }
    },
    stream: {
      group: "つながり", label: "神学の潮流",
      make(t) {
        const ss = streamsOf(t.id);
        if (!ss.length) return null;
        const s = pick(ss);
        const notMine = STREAM_LIST.filter((o) => !ss.includes(o)).map((o) => o.title);
        const wrong = wrongOptions(s.title, notMine, notMine);
        if (!wrong) return null;
        return {
          prompt: `${t.name} と関わりの深い神学の潮流はどれ？`,
          body: t.original,
          choices: textChoices(s.title, wrong),
          extra: { text: firstSentences(s.lead || "", 1, 140), attr: "data-stream", id: s.id, label: "現代神学略解で読む" }
        };
      }
    }
  };
  const GROUPS = [...new Set(Object.values(TYPES).map((ty) => ty.group))];

  // ---------- 出題範囲 ----------
  const essayIds = new Set(typeof ESSAYS !== "undefined" ? Object.keys(ESSAYS) : []);
  const debaterIds = new Set(DEBATE_LIST.flatMap((d) => d.people.map((p) => p[0])));
  const RANGES = {
    all:      { label: "すべて",          test: () => true },
    japan:    { label: "日本",            test: (t) => t.country === "日本" },
    overseas: { label: "海外",            test: (t) => t.country !== "日本" },
    ancient:  { label: "古代・中世",       test: (t) => t.era === "ancient" || t.era === "medieval" },
    reform:   { label: "宗教改革〜近代",   test: (t) => ["reformation", "early-modern", "modern"].includes(t.era) },
    modern:   { label: "現代",            test: (t) => t.era === "contemporary" },
    debaters: { label: "論争・会議の人物", test: (t) => debaterIds.has(t.id) },
    essay:    { label: "詳解のある人物",   test: (t) => essayIds.has(t.id) },
    philo:    { label: "哲学者",          test: (t) => t.fields.includes("哲学") },
    review:   { label: "復習（間違えた人）", test: (t) => loadMissed().includes(t.id) }
  };

  const RANKS = [
    [95, "教会博士", "見事です。辞典の編者になれます。"],
    [80, "牧師", "よく学んでいます。あと一歩で満点。"],
    [60, "伝道師", "基礎はばっちり。詳しい解説も読んでみましょう。"],
    [40, "神学生", "これから伸びます。間違えた人物を復習しましょう。"],
    [0,  "求道者", "まずは年表や解説をのぞいてから再挑戦！"]
  ];

  const state = { range: "all", count: 10, types: Object.keys(TYPES), questions: [], i: 0, score: 0, streak: 0, bestStreak: 0, missed: [], typeStats: {} };

  // ---------- 記録（ブラウザに保存） ----------
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 保存できない環境でも遊べるようにする */ }
  }
  const loadBest = () => load(BEST_KEY, {});
  function saveBest(key, value) {
    const b = loadBest();
    if (!b[key] || value > b[key]) { b[key] = value; save(BEST_KEY, b); return true; }
    return false;
  }
  const loadMissed = () => load(MISSED_KEY, []).filter((id) => byId[id]);
  function markMissed(id, wrong) {
    const set = new Set(loadMissed());
    wrong ? set.add(id) : set.delete(id);
    save(MISSED_KEY, [...set]);
  }

  // ---------- 画面：スタート ----------
  function renderStart() {
    const best = loadBest();
    const bestKey = `${state.range}-${state.count}`;
    root.innerHTML = `
      <div class="qz-card qz-start">
        <h2 class="qz-title">神学者クイズ</h2>
        <p class="qz-lead">説明・思想・批判・主著・論争・教育機関などから出題する4択クイズです。連続正解でボーナス点！間違えた人物は記録され、「復習」で出題できます。</p>
        <div class="qz-setting">
          <span class="filter-label">出題範囲</span>
          <div class="chips chips-small">${Object.entries(RANGES).map(([k, r]) => {
            const n = THEOLOGIANS.filter(r.test).length;
            return `<button class="chip ${state.range === k ? "is-on" : ""}" data-range="${k}" ${n ? "" : "disabled"}>${r.label}<span class="chip-n">${n}</span></button>`;
          }).join("")}</div>
        </div>
        <div class="qz-setting">
          <span class="filter-label">問題数</span>
          <div class="chips chips-small">${[5, 10, 20, 30].map((n) =>
            `<button class="chip ${state.count === n ? "is-on" : ""}" data-count="${n}">${n}問</button>`).join("")}</div>
        </div>
        <div class="qz-setting">
          <span class="filter-label">問題の種類</span>
          <div class="qz-groups">
            ${GROUPS.map((g) => `
              <div class="qz-group">
                <span class="qz-group-label">${g}</span>
                <div class="chips chips-small">${Object.entries(TYPES).filter(([, ty]) => ty.group === g).map(([k, ty]) =>
                  `<button class="chip ${state.types.includes(k) ? "is-on" : ""}" data-type="${k}">${ty.label}</button>`).join("")}</div>
              </div>`).join("")}
            <div class="qz-type-tools">
              <button class="qz-mini" data-types="all">すべて選ぶ</button>
              ${GROUPS.map((g) => `<button class="qz-mini" data-types="${g}">「${g}」だけ</button>`).join("")}
            </div>
          </div>
        </div>
        <p class="qz-best">${best[bestKey] ? `この設定の最高得点：<strong>${best[bestKey]}点</strong>` : "この設定ではまだ記録がありません"}</p>
        <button class="qz-go" id="qz-start">スタート</button>
      </div>`;
  }

  // ---------- 問題を作る ----------
  // 種類が偏らないよう、まず種類を決めてから、それに合う人物を探す
  function buildQuestions() {
    const pool = THEOLOGIANS.filter(RANGES[state.range].test);
    const choicePool = pool.length >= 8 ? pool : THEOLOGIANS;
    const used = new Set();
    const qs = [];
    let typeQueue = [];
    let failures = 0;
    while (qs.length < state.count && failures < state.types.length * 3) {
      if (!typeQueue.length) typeQueue = shuffle(state.types);
      const type = typeQueue.pop();
      let made = null;
      for (const t of shuffle(pool.filter((p) => !used.has(p.id)))) {
        const q = TYPES[type].make(t, choicePool);
        if (q) { made = { ...q, person: t, type }; break; }
      }
      if (made) { qs.push(made); used.add(made.person.id); failures = 0; }
      else failures += 1;
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
    const st = state.typeStats[q.type] || (state.typeStats[q.type] = { ok: 0, n: 0 });
    st.n += 1;
    let gained = 0;
    if (ok) {
      st.ok += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gained = 10 + Math.min(state.streak - 1, 5) * 2; // 連続正解ボーナス（最大+10）
      state.score += gained;
    } else {
      state.streak = 0;
      state.missed.push(q.person);
    }
    markMissed(q.person.id, !ok);
    const t = q.person;
    const x = q.extra;
    const fb = $("#qz-feedback");
    fb.hidden = false;
    fb.className = `qz-feedback ${ok ? "ok" : "ng"}`;
    fb.innerHTML = `
      <p class="qz-verdict">${ok ? `正解！ +${gained}点` : "残念…"}</p>
      <p class="qz-answer"><strong>${escapeHtml(t.name)}</strong>（${escapeHtml(t.years)}・${escapeHtml(ERAS[t.era].label)}・${escapeHtml(t.tradition)}）</p>
      <p class="qz-sum">${escapeHtml(t.summary)}</p>
      ${x && x.text ? `<p class="qz-extra">${escapeHtml(x.text)}</p>` : ""}
      <div class="qz-actions">
        ${x && x.attr ? `<button class="qz-link" ${x.attr}="${escapeHtml(x.id)}">${escapeHtml(x.label)}</button>` : ""}
        <button class="qz-link" data-id="${t.id}">人物を詳しく見る</button>
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
    const stats = Object.entries(state.typeStats);
    const reviewN = loadMissed().length;
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
        ${stats.length > 1 ? `
          <h3>種類別の成績</h3>
          <div class="qz-typestats">${stats.map(([k, s]) =>
            `<span class="${s.ok === s.n ? "is-full" : s.ok === 0 ? "is-zero" : ""}">${TYPES[k].label} ${s.ok}/${s.n}</span>`).join("")}</div>` : ""}
        ${missed.length ? `
          <h3>復習しよう</h3>
          <div class="related">${missed.map((t) => `<button data-id="${t.id}">${escapeHtml(t.name)}</button>`).join("")}</div>` : ""}
        <div class="qz-actions">
          <button class="qz-link" id="qz-settings">設定を変える</button>
          ${reviewN ? `<button class="qz-link" id="qz-review">間違えた人を復習（${reviewN}人）</button>` : ""}
          <button class="qz-go" id="qz-again">もう一度挑戦</button>
        </div>
      </div>`;
  }

  function start() {
    state.questions = buildQuestions();
    state.i = 0; state.score = 0; state.streak = 0; state.bestStreak = 0; state.missed = []; state.typeStats = {};
    if (!state.questions.length) {
      renderStart();
      root.querySelector(".qz-card").insertAdjacentHTML("beforeend", `<p class="empty">この設定では問題を作れませんでした。範囲や種類を変えてください。</p>`);
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
    else if (b.dataset.types) {
      const g = b.dataset.types;
      state.types = Object.keys(TYPES).filter((k) => g === "all" || TYPES[k].group === g);
      renderStart();
    }
    else if (b.id === "qz-start" || b.id === "qz-again") start();
    else if (b.id === "qz-review") { state.range = "review"; start(); }
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
    if (e.target.matches && e.target.matches("input, textarea")) return;
    const q = state.questions[state.i];
    const idx = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
    if (q && !q.answered && idx >= 0 && $(".qz-choice")) answer(idx);
    else if (e.key === "Enter" && $("#qz-next") && document.activeElement !== $("#qz-next")) $("#qz-next").click();
  });

  // タブを開いたとき、復習の人数などを最新にする
  document.querySelectorAll('.tab[data-view="quiz"]').forEach((tab) =>
    tab.addEventListener("click", () => { if ($(".qz-start")) renderStart(); }));

  renderStart();
})();
