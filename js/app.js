(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const byId = Object.fromEntries(THEOLOGIANS.map((t) => [t.id, t]));
  const sorted = [...THEOLOGIANS].sort((a, b) => a.born - b.born);

  const state = { q: "", era: "", country: "", field: "", tradition: "", theme: "" };

  // 出身国の一覧（人数の多い順）
  // 出身国ボタン（少人数の国は COUNTRY_GROUPS で地域にまとめる）
  const groupOf = {};
  Object.entries(COUNTRY_GROUPS).forEach(([g, list]) => list.forEach((c) => { groupOf[c] = g; }));
  const countryButton = (t) => groupOf[t.country] || t.country;
  const countryCounts = {};
  THEOLOGIANS.forEach((t) => { const b = countryButton(t); countryCounts[b] = (countryCounts[b] || 0) + 1; });
  const COUNTRIES = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a] || a.localeCompare(b, "ja"));

  // ---------- 検索用の正規化（カタカナ/ひらがな・全角/半角・中黒を吸収） ----------
  const normalize = (s) =>
    s.normalize("NFKC")
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[・･\s\-‐–―「」『』（）()、。]/g, "");

  const detailText = (id) => {
    const d = typeof DETAILS !== "undefined" && DETAILS[id];
    const c = typeof CRITIQUES !== "undefined" && CRITIQUES[id];
    const es = typeof ESSAYS !== "undefined" && ESSAYS[id] ? [ESSAYS[id].lead, ...ESSAYS[id].sections.flatMap((s) => [s.h, ...s.body]), ...(ESSAYS[id].terms || []).flat()].join(" ") : "";
    const ins = typeof INSTITUTIONS !== "undefined" ? INSTITUTIONS.filter((x) => x.people.some((p) => p[0] === id)).map((x) => x.name).join(" ") : "";
    const dbs = typeof DEBATES !== "undefined" ? DEBATES.filter((x) => x.people.some((p) => p[0] === id)).map((x) => x.title).join(" ") : "";
    return [d ? [d.life, ...(d.points || []), d.influence].join(" ") : "", c ? c.text : "", ins, es, dbs].join(" ");
  };
  const haystack = new Map(
    THEOLOGIANS.map((t) => [
      t.id,
      normalize([detailText(t.id), t.name, t.original, t.region, t.country, ...t.fields, t.tradition, t.affiliation || "", t.summary, ...t.works, ...t.themes, ...t.keywords].join(" "))
    ])
  );

  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const highlight = (text, q) => {
    const safe = escapeHtml(text);
    if (!q) return safe;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return safe.replace(re, (m) => `<mark>${m}</mark>`);
  };

  const eraColor = (era) => `var(--era-${era})`;

  const hasNotes = typeof NOTES !== "undefined";
  if (hasNotes) document.addEventListener("notes-changed", () => renderResults());

  // ---------- 絞り込み ----------
  function filtered() {
    const terms = state.q.split(/\s+/).map(normalize).filter(Boolean);
    return sorted.filter((t) => {
      if (state.era && t.era !== state.era) return false;
      if (state.country && countryButton(t) !== state.country) return false;
      if (state.field && !t.fields.includes(state.field)) return false;
      if (state.tradition && t.tradition !== state.tradition) return false;
      if (state.theme && !t.themes.includes(state.theme)) return false;
      const hay = haystack.get(t.id) + (hasNotes && NOTES.has(t.id) ? normalize(NOTES.get(t.id)) : "");
      return terms.every((term) => hay.includes(term));
    });
  }

  // 名前・原語名で当たったものを上に
  function ranked(list) {
    const terms = state.q.split(/\s+/).map(normalize).filter(Boolean);
    if (!terms.length) return list;
    const score = (t) => {
      const name = normalize(t.name + t.original);
      return terms.some((term) => name.includes(term)) ? 0 : 1;
    };
    return [...list].sort((a, b) => score(a) - score(b) || a.born - b.born);
  }

  // ---------- 描画：カード一覧 ----------
  function renderResults() {
    const list = ranked(filtered());
    const raw = state.q.trim();
    $("#count").textContent = `${list.length} 名`;
    $("#results").innerHTML = list.length
      ? list.map((t) => `
        <button class="card" data-id="${t.id}" style="--era-color:${eraColor(t.era)}">
          <span class="meta">${ERAS[t.era].label}・${escapeHtml(t.tradition)}・${escapeHtml(t.years)}${hasEssay(t.id) ? '<span class="essay-badge">詳解</span>' : ""}${hasNotes && NOTES.has(t.id) ? '<span class="note-badge">メモ</span>' : ""}</span>
          <span class="name">${highlight(t.name, raw)}</span>
          <span class="orig">${highlight(t.original, raw)}</span>
          <p class="sum">${highlight(t.summary, raw)}</p>
          <span class="mini-tags">${t.themes.map((th) => `<span>${escapeHtml(th)}</span>`).join("")}</span>
        </button>`).join("")
      : `<p class="empty">該当する神学者が見つかりませんでした。</p>`;

    const box = $("#active-theme");
    if (state.theme) {
      box.hidden = false;
      box.innerHTML = `テーマ：<strong>${escapeHtml(state.theme)}</strong> <button type="button" id="clear-theme">解除</button>`;
      $("#clear-theme").onclick = () => { state.theme = ""; update(); };
    } else {
      box.hidden = true;
    }
  }

  function renderFilters() {
    const eras = [["", "すべて"], ...Object.entries(ERAS).map(([k, v]) => [k, v.label])];
    $("#era-chips").innerHTML = eras
      .map(([k, label]) => `<button class="chip ${state.era === k ? "is-on" : ""}" data-era="${k}">${label}</button>`)
      .join("");
    $("#country-chips").innerHTML =
      `<button class="chip ${state.country ? "" : "is-on"}" data-country="">すべて</button>` +
      COUNTRIES.map((c) =>
        `<button class="chip ${state.country === c ? "is-on" : ""}" data-country="${escapeHtml(c)}"${COUNTRY_GROUPS[c] ? ` title="${escapeHtml(COUNTRY_GROUPS[c].join("・"))}"` : ""}>${escapeHtml(c)}<span class="chip-n">${countryCounts[c]}</span></button>`
      ).join("");
    const fieldCount = (f) => THEOLOGIANS.filter((t) => t.fields.includes(f)).length;
    $("#field-chips").innerHTML =
      `<button class="chip ${state.field ? "" : "is-on"}" data-field="">すべて</button>` +
      FIELDS.map((f) =>
        `<button class="chip ${state.field === f ? "is-on" : ""}" data-field="${f}">${f}<span class="chip-n">${fieldCount(f)}</span></button>`
      ).join("");
    const sel = $("#tradition-select");
    sel.innerHTML = `<option value="">すべての教派・伝統</option>` +
      TRADITIONS.map((t) => `<option ${state.tradition === t ? "selected" : ""}>${t}</option>`).join("");
  }

  // ---------- 描画：テーマ一覧 ----------
  function renderThemes() {
    const counts = Object.fromEntries(THEMES.map((th) => [th, 0]));
    THEOLOGIANS.forEach((t) => t.themes.forEach((th) => { counts[th] = (counts[th] || 0) + 1; }));
    $("#theme-cloud").innerHTML = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([th, n]) => `<button class="theme-btn" data-theme="${escapeHtml(th)}"><span>${escapeHtml(th)}</span><span class="n">${n}</span></button>`)
      .join("");
  }

  // ---------- 描画：年表 ----------
  // 年表に挿入する出来事の時代区分（年で振り分け）
  const ERA_END = { ancient: 600, medieval: 1500, reformation: 1650, "early-modern": 1800, modern: 1914, contemporary: Infinity };
  const eventEra = (year) => Object.keys(ERA_END).find((k) => year < ERA_END[k]);
  // 論争・会議と神学教育機関の創立も、年表に出来事として加える
  const TL_KINDS = { ...EVENT_KINDS, debate: "論争・会議", inst: "教育機関の創立" };
  const shownKinds = new Set(Object.keys(TL_KINDS));
  function foundedYear(s) {
    const y = String(s).match(/(\d{3,4})年/);
    if (y) return { year: Number(y[1]), label: String(s).match(/^\d{3,4}年代/) ? `${y[1]}年代` : y[1] };
    const c = String(s).match(/^(\d{1,2})世紀$/);
    if (c && Number(c[1]) < 20) return { year: (Number(c[1]) - 1) * 100 + 50, label: `${c[1]}世紀` };
    return null; // 「20世紀」などおおまかすぎるものは年表に載せない
  }
  function timelineEvents() {
    // 教会史の出来事と同じ会議は、教会史の行をリンクにして重複させない
    const hasDb = typeof DEBATES !== "undefined";
    const evs = HISTORY_EVENTS.map((ev) => (hasDb && ev.debate && DEBATES.some((d) => d.id === ev.debate)
      ? { ...ev, attr: "data-debate", id: ev.debate, alsoKind: "debate" } : { ...ev }));
    const merged = new Set(evs.filter((ev) => ev.alsoKind).map((ev) => ev.id));
    if (hasDb) {
      DEBATES.filter((d) => !merged.has(d.id)).forEach((d) => evs.push({ year: d.year, label: d.date, kind: "debate", text: d.title, attr: "data-debate", id: d.id }));
    }
    if (typeof INSTITUTIONS !== "undefined") {
      INSTITUTIONS.forEach((x) => {
        const f = foundedYear(x.founded);
        if (f) evs.push({ year: f.year, label: f.label, kind: "inst", text: `${x.name} 創立（${x.place}）`, attr: "data-inst", id: x.id });
      });
    }
    return evs;
  }

  function renderTimeline() {
    $("#timeline-kinds").innerHTML = Object.entries(TL_KINDS).map(([k, label]) => `
      <label class="tl-toggle tl-kind-${k}"><input type="checkbox" data-kind="${k}" ${shownKinds.has(k) ? "checked" : ""}>${label}</label>`).join("");

    $("#timeline").innerHTML = Object.entries(ERAS).map(([key, era]) => {
      const people = sorted.filter((t) => t.era === key);
      const events = timelineEvents().filter((ev) => (shownKinds.has(ev.kind) || (ev.alsoKind && shownKinds.has(ev.alsoKind))) && eventEra(ev.year) === key);
      if (!people.length && !events.length) return "";
      const rows = [
        ...people.map((t) => ({ y: t.born, html: `
              <li><button data-id="${t.id}">
                <span class="tl-years">${escapeHtml(t.years)}</span><span class="tl-name">${escapeHtml(t.name)}</span><span class="tl-trad">${escapeHtml(t.tradition)}</span>
              </button></li>` })),
        ...events.map((ev) => ({ y: ev.year - 0.1, html: `
              <li class="tl-event tl-kind-${ev.kind}">
                <span class="tl-years">${escapeHtml(ev.label)}</span><span class="tl-badge">${TL_KINDS[ev.kind]}</span>${ev.alsoKind ? `<span class="tl-badge tl-kind-${ev.alsoKind}">${TL_KINDS[ev.alsoKind]}</span>` : ""}${ev.attr
                  ? `<button class="tl-event-text tl-event-link" ${ev.attr}="${ev.id}">${escapeHtml(ev.text)}</button>`
                  : `<span class="tl-event-text">${escapeHtml(ev.text)}</span>`}
              </li>` }))
      ].sort((a, b) => a.y - b.y);
      return `
        <section class="tl-era" style="--era-color:${eraColor(key)}">
          <h2>${era.label}<small>${era.range}・${people.length}名</small></h2>
          <ul class="tl-list">${rows.map((r) => r.html).join("")}
          </ul>
        </section>`;
    }).join("");
  }

  // ---------- 詳細ダイアログ ----------
  function related(t) {
    return THEOLOGIANS
      .filter((o) => o.id !== t.id)
      .map((o) => ({ o, n: o.themes.filter((th) => t.themes.includes(th)).length, d: Math.abs(o.born - t.born) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || a.d - b.d)
      .slice(0, 6)
      .map((x) => x.o);
  }

  const dialog = $("#detail");

  function openDetail(id, push = true) {
    const t = byId[id];
    if (!t) return;
    $("#d-meta").textContent = `${ERAS[t.era].label}・${t.fields.join("／")}・${t.tradition}・出身：${t.country}（${t.region}）・${t.years}`;
    $("#d-affil-wrap").hidden = !t.affiliation;
    $("#d-affil").textContent = t.affiliation || "";
    $("#d-name").textContent = t.name;
    $("#d-original").textContent = t.original;
    $("#d-summary").textContent = t.summary;
    $("#d-essay-wrap").hidden = !hasEssay(t.id);
    $("#d-essay-btn").dataset.essay = t.id;
    const crit = (typeof CRITIQUES !== "undefined" && CRITIQUES[t.id]) || null;
    $("#d-crit-wrap").hidden = !crit;
    if (crit) {
      $("#d-crit").textContent = crit.text;
      const cs = (crit.critics || []).filter((id) => byId[id] && id !== t.id);
      $("#d-critics-wrap").hidden = !cs.length;
      $("#d-critics").innerHTML = cs.map((id) => `<button data-id="${id}">${escapeHtml(byId[id].name)}</button>`).join("");
    }
    const more = (typeof DETAILS !== "undefined" && DETAILS[t.id]) || null;
    $("#d-more").hidden = !more;
    if (more) {
      $("#d-life").textContent = more.life || "";
      $("#d-points").innerHTML = (more.points || []).map((p) => `<li>${escapeHtml(p)}</li>`).join("");
      $("#d-influence").textContent = more.influence || "";
    }
    $("#d-works").innerHTML = t.works.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
    $("#d-themes").innerHTML = t.themes.map((th) => `<button data-theme="${escapeHtml(th)}">${escapeHtml(th)}</button>`).join("");
    $("#d-keywords").innerHTML = t.keywords.map((k) => `<span>${escapeHtml(k)}</span>`).join("");
    $("#d-related").innerHTML = related(t).map((o) => `<button data-id="${o.id}">${escapeHtml(o.name)}</button>`).join("");
    const ins = instOf(t.id);
    $("#d-inst-wrap").hidden = !ins.length;
    $("#d-inst").innerHTML = ins.map((o) => `<button class="st-chip" data-inst="${o.inst.id}">${escapeHtml(o.inst.name)}<small>（${escapeHtml(o.role)}）</small></button>`).join("");
    const dbs = debatesOf(t.id);
    $("#d-debates-wrap").hidden = !dbs.length;
    $("#d-debates").innerHTML = dbs.map((o) => `<button class="st-chip" data-debate="${o.debate.id}">${escapeHtml(o.debate.title)}<small>（${escapeHtml(o.role)}）</small></button>`).join("");
    const sts = streamsOf(t.id);
    $("#d-streams-wrap").hidden = !sts.length;
    $("#d-streams").innerHTML = sts.map((s) => `<button class="st-chip" data-stream="${s.id}">${escapeHtml(s.title)}</button>`).join("");
    dialog.style.setProperty("--era-color", eraColor(t.era));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    if (push) history.replaceState(null, "", `#${t.id}`);
    document.dispatchEvent(new CustomEvent("detail-open", { detail: { id: t.id } }));
  }

  function closeDetail() {
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener("close", () => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  });

  // ---------- 詳解ページ ----------
  const hasEssay = (id) => typeof ESSAYS !== "undefined" && !!ESSAYS[id];
  let essayReturnView = "search";

  function openEssay(id) {
    const e = hasEssay(id) && ESSAYS[id];
    const t = byId[id];
    if (!e || !t) return;
    const active = document.querySelector(".tab.is-active");
    if (active) essayReturnView = active.dataset.view;
    closeDetail();
    const people = (e.related || []).filter((x) => byId[x]);
    $("#essay").innerHTML = `
      <nav class="es-nav">
        <button class="es-back" data-essay-back>← 戻る</button>
        <button class="es-back" data-id="${t.id}">人物の概要を開く</button>
      </nav>
      <header class="es-head" style="--era-color:${eraColor(t.era)}">
        <p class="es-meta">${ERAS[t.era].label}・${escapeHtml(t.tradition)}・${escapeHtml(t.years)}</p>
        <h1>${escapeHtml(t.name)}の神学・思想</h1>
        <p class="es-orig">${escapeHtml(t.original)}</p>
        <p class="es-lead">${escapeHtml(e.lead)}</p>
      </header>
      <ol class="es-toc">${e.sections.map((s, i) => `<li><a href="#es-${i}" data-es-jump="${i}">${escapeHtml(s.h)}</a></li>`).join("")}
        ${e.terms && e.terms.length ? `<li><a href="#es-terms" data-es-jump="terms">キーワード解説</a></li>` : ""}
        ${e.reading && e.reading.length ? `<li><a href="#es-reading" data-es-jump="reading">読書案内</a></li>` : ""}</ol>
      ${e.sections.map((s, i) => `
        <section class="es-sec" id="es-${i}">
          <h2>${escapeHtml(s.h)}</h2>
          ${s.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
        </section>`).join("")}
      ${e.terms && e.terms.length ? `
        <section class="es-sec" id="es-terms">
          <h2>キーワード解説</h2>
          <dl class="es-terms">${e.terms.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>
        </section>` : ""}
      ${e.reading && e.reading.length ? `
        <section class="es-sec" id="es-reading">
          <h2>読書案内</h2>
          <ul>${e.reading.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
        </section>` : ""}
      ${people.length ? `
        <section class="es-sec">
          <h2>あわせて読みたい人物</h2>
          <div class="related">${people.map((x) => `<button data-id="${x}">${escapeHtml(byId[x].name)}</button>`).join("")}</div>
        </section>` : ""}
      <p class="es-note">この解説は概説です。研究や説教準備では、原典と専門の研究書で確認してください。</p>
      <nav class="es-nav es-nav-bottom"><button class="es-back" data-essay-back>← 戻る</button></nav>`;
    showView("essay");
    window.scrollTo({ top: 0 });
    history.replaceState(null, "", `#essay-${id}`);
  }

  // ---------- 現代神学略解（潮流） ----------
  const hasStreams = typeof STREAMS !== "undefined";
  const streamById = hasStreams ? Object.fromEntries(STREAMS.map((s) => [s.id, s])) : {};
  const streamsOf = (id) => (hasStreams ? STREAMS.filter((s) => s.people.includes(id)) : []);

  function renderStreams() {
    if (!hasStreams || !$("#streams")) return;
    const map = STREAM_ERAS.map((era) => {
      const items = STREAMS.filter((s) => s.start >= era.from && s.start <= era.to).sort((x, y) => x.start - y.start);
      if (!items.length) return "";
      return `<div class="st-map-row"><span class="st-map-era">${escapeHtml(era.label)}</span>
        <div class="st-map-items">${items.map((s) => `<button class="st-chip" data-stream="${s.id}">${escapeHtml(s.title.replace(/（.*?）/, ""))}</button>`).join("")}</div></div>`;
    }).join("");
    const sections = STREAMS.map((s, i) => `
      <section class="st-sec" id="stream-${s.id}">
        <p class="st-period"><span class="st-no">${i + 1}</span>${escapeHtml(s.period)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <p class="st-lead">${escapeHtml(s.lead)}</p>
        ${s.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
        <h3>要点</h3>
        <ul>${s.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
        <h3>関連する神学者</h3>
        <div class="related">${s.people.filter((id) => byId[id]).map((id) => `<button data-id="${id}">${escapeHtml(byId[id].name)}</button>`).join("")}</div>
        ${s.related.length ? `<h3>前後・関連する潮流</h3>
        <div class="st-links">${s.related.filter((x) => streamById[x]).map((x) => `<button class="st-chip" data-stream="${x}">${escapeHtml(streamById[x].title)}</button>`).join("")}</div>` : ""}
        <p class="st-top"><button class="st-totop" data-stream-top>▲ 潮流の地図に戻る</button></p>
      </section>`).join("");
    $("#streams").innerHTML = `
      <div class="st-intro">
        <h2>現代神学略解 ― バルト以降の神学の潮流</h2>
        <p>20世紀以降の神学は、弁証法神学を起点に、さまざまな流れへと枝分かれしてきました。下の地図から潮流を選ぶと解説に移動し、解説の中の名前を押すと各神学者の詳しい説明が開きます。</p>
      </div>
      <div class="st-map" id="stream-map">${map}</div>
      ${sections}`;
  }

  function goToStream(id) {
    const el = document.getElementById(`stream-${id}`);
    if (!el) return;
    closeDetail();
    showView("streams");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("st-flash");
    void el.offsetWidth;
    el.classList.add("st-flash");
  }

  // ---------- 論争・会議 ----------
  const hasDebates = typeof DEBATES !== "undefined";
  const debatesSorted = hasDebates ? [...DEBATES].sort((x, y) => x.year - y.year) : [];
  const debateById = Object.fromEntries(debatesSorted.map((x) => [x.id, x]));
  const debatesOf = (id) => debatesSorted.flatMap((x) => x.people.filter((p) => p[0] === id).map((p) => ({ debate: x, role: p[1] })));
  const debateState = { era: "", kind: "", q: "" };

  function renderDebates() {
    if (!hasDebates || !$("#debates")) return;
    const eraCounts = {}, kindCounts = {};
    debatesSorted.forEach((x) => {
      eraCounts[x.era] = (eraCounts[x.era] || 0) + 1;
      kindCounts[x.kind] = (kindCounts[x.kind] || 0) + 1;
    });
    $("#debate-eras").innerHTML =
      `<button class="chip ${debateState.era ? "" : "is-on"}" data-debate-era="">すべて<span class="chip-n">${debatesSorted.length}</span></button>` +
      DEBATE_ERAS.filter((e) => eraCounts[e]).map((e) =>
        `<button class="chip ${debateState.era === e ? "is-on" : ""}" data-debate-era="${escapeHtml(e)}">${escapeHtml(e)}<span class="chip-n">${eraCounts[e]}</span></button>`).join("");
    $("#debate-kinds").innerHTML =
      `<button class="chip ${debateState.kind ? "" : "is-on"}" data-debate-kind="">すべて</button>` +
      ["会議", "論争"].filter((k) => kindCounts[k]).map((k) =>
        `<button class="chip ${debateState.kind === k ? "is-on" : ""}" data-debate-kind="${k}">${k}<span class="chip-n">${kindCounts[k]}</span></button>`).join("");
    const terms = debateState.q.split(/\s+/).map(normalize).filter(Boolean);
    const list = debatesSorted.filter((x) => {
      if (debateState.era && x.era !== debateState.era) return false;
      if (debateState.kind && x.kind !== debateState.kind) return false;
      if (!terms.length) return true;
      const hay = normalize([x.title, x.date, x.summary, ...x.points, x.outcome,
        ...x.people.map((p) => (byId[p[0]] ? byId[p[0]].name + byId[p[0]].original : "") + p[1])].join(" "));
      return terms.every((term) => hay.includes(term));
    });
    $("#debate-count").textContent = `${list.length} 項目`;
    $("#debates").innerHTML = list.length ? list.map((x) => {
      const ppl = x.people.filter((p) => byId[p[0]]);
      return `
      <section class="inst-card db-card" id="debate-${x.id}">
        <p class="inst-meta"><span class="db-kind db-kind-${x.kind === "会議" ? "council" : "debate"}">${escapeHtml(x.kind)}</span>${escapeHtml(x.era)}・${escapeHtml(x.date)}</p>
        <h2>${escapeHtml(x.title)}</h2>
        <p>${escapeHtml(x.summary)}</p>
        ${x.points.length ? `<h3>争点・経過</h3><ul>${x.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
        ${x.outcome ? `<h3>結果とその後</h3><p>${escapeHtml(x.outcome)}</p>` : ""}
        ${ppl.length ? `<h3>関わった神学者（${ppl.length}名）</h3>` : ""}
        <div class="inst-people">${ppl.map((p) =>
          `<button data-id="${p[0]}"><span>${escapeHtml(byId[p[0]].name)}</span><small>${escapeHtml(p[1])}</small></button>`).join("")}</div>
      </section>`;
    }).join("") : `<p class="empty">該当する論争・会議が見つかりませんでした。</p>`;
  }

  function goToDebate(id) {
    if (!debateById[id]) return;
    closeDetail();
    debateState.era = ""; debateState.kind = ""; debateState.q = "";
    if ($("#debate-q")) $("#debate-q").value = "";
    renderDebates();
    showView("debates");
    const el = document.getElementById(`debate-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("st-flash");
    void el.offsetWidth;
    el.classList.add("st-flash");
  }

  // ---------- 神学教育機関 ----------
  const hasInst = typeof INSTITUTIONS !== "undefined";
  const instById = hasInst ? Object.fromEntries(INSTITUTIONS.map((x) => [x.id, x])) : {};
  const instOf = (id) => (hasInst ? INSTITUTIONS.flatMap((x) => x.people.filter((p) => p[0] === id).map((p) => ({ inst: x, role: p[1] }))) : []);
  const instState = { region: "", q: "" };

  function renderInstitutions() {
    if (!hasInst || !$("#institutions")) return;
    const counts = {};
    INSTITUTIONS.forEach((x) => { counts[x.region] = (counts[x.region] || 0) + 1; });
    $("#inst-regions").innerHTML =
      `<button class="chip ${instState.region ? "" : "is-on"}" data-inst-region="">すべて<span class="chip-n">${INSTITUTIONS.length}</span></button>` +
      INST_REGIONS.filter((rg) => counts[rg]).map((rg) =>
        `<button class="chip ${instState.region === rg ? "is-on" : ""}" data-inst-region="${escapeHtml(rg)}">${escapeHtml(rg)}<span class="chip-n">${counts[rg]}</span></button>`).join("");
    const terms = instState.q.split(/\s+/).map(normalize).filter(Boolean);
    const list = INSTITUTIONS.filter((x) => {
      if (instState.region && x.region !== instState.region) return false;
      if (!terms.length) return true;
      const hay = normalize([x.name, x.original, x.place, x.tradition, x.summary, ...x.points,
        ...x.people.map((p) => (byId[p[0]] ? byId[p[0]].name + byId[p[0]].original : "") + p[1])].join(" "));
      return terms.every((term) => hay.includes(term));
    });
    $("#inst-count").textContent = `${list.length} 機関`;
    $("#institutions").innerHTML = list.length ? list.map((x) => `
      <section class="inst-card" id="inst-${x.id}">
        <p class="inst-meta">${escapeHtml(x.region)}・${escapeHtml(x.place)}・創立 ${escapeHtml(x.founded)}</p>
        <h2>${escapeHtml(x.name)}</h2>
        <p class="inst-orig">${escapeHtml(x.original)}</p>
        <p class="inst-trad">${escapeHtml(x.tradition)}</p>
        <p>${escapeHtml(x.summary)}</p>
        ${x.points.length ? `<ul>${x.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
        ${x.people.some((p) => byId[p[0]]) ? `<h3>関わった神学者（${x.people.filter((p) => byId[p[0]]).length}名）</h3>` : ""}
        <div class="inst-people">${x.people.filter((p) => byId[p[0]]).map((p) =>
          `<button data-id="${p[0]}"><span>${escapeHtml(byId[p[0]].name)}</span><small>${escapeHtml(p[1])}</small></button>`).join("")}</div>
      </section>`).join("") : `<p class="empty">該当する教育機関が見つかりませんでした。</p>`;
  }

  function goToInst(id) {
    if (!instById[id]) return;
    closeDetail();
    instState.region = ""; instState.q = "";
    if ($("#inst-q")) $("#inst-q").value = "";
    renderInstitutions();
    showView("institutions");
    const el = document.getElementById(`inst-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("st-flash");
    void el.offsetWidth;
    el.classList.add("st-flash");
  }

  // ---------- 画面切り替え ----------
  function showView(name) {
    document.querySelectorAll(".tab").forEach((b) => {
      const on = b.dataset.view === name;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on);
      if (on && b.parentElement.scrollWidth > b.parentElement.clientWidth) {
        b.parentElement.scrollLeft = b.offsetLeft - (b.parentElement.clientWidth - b.offsetWidth) / 2;
      }
    });
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== `view-${name}`; });
  }

  function selectTheme(theme) {
    state.theme = theme;
    state.q = "";
    $("#q").value = "";
    closeDetail();
    showView("search");
    update();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function update() {
    renderFilters();
    renderResults();
  }

  // ---------- イベント ----------
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; renderResults(); });
  $("#country-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-country]");
    if (b) { state.country = b.dataset.country; update(); }
  });
  $("#field-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-field]");
    if (b) { state.field = b.dataset.field; update(); }
  });
  $("#era-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-era]");
    if (b) { state.era = b.dataset.era; update(); }
  });
  $("#tradition-select").addEventListener("change", (e) => { state.tradition = e.target.value; renderResults(); });
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));

  document.addEventListener("click", (e) => {
    const essayBtn = e.target.closest("[data-essay]");
    if (essayBtn) return openEssay(essayBtn.dataset.essay);
    if (e.target.closest("[data-essay-back]")) {
      showView(essayReturnView);
      if (location.hash.startsWith("#essay-")) history.replaceState(null, "", location.pathname + location.search);
      return;
    }
    const jump = e.target.closest("[data-es-jump]");
    if (jump) {
      e.preventDefault();
      const el = document.getElementById(`es-${jump.dataset.esJump}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const debateBtn = e.target.closest("[data-debate]");
    if (debateBtn) return goToDebate(debateBtn.dataset.debate);
    const dEra = e.target.closest("[data-debate-era]");
    if (dEra) { debateState.era = dEra.dataset.debateEra; return renderDebates(); }
    const dKind = e.target.closest("[data-debate-kind]");
    if (dKind) { debateState.kind = dKind.dataset.debateKind; return renderDebates(); }
    const instBtn = e.target.closest("[data-inst]");
    if (instBtn) return goToInst(instBtn.dataset.inst);
    const regionBtn = e.target.closest("[data-inst-region]");
    if (regionBtn) { instState.region = regionBtn.dataset.instRegion; return renderInstitutions(); }
    const streamBtn = e.target.closest("[data-stream]");
    if (streamBtn) return goToStream(streamBtn.dataset.stream);
    if (e.target.closest("[data-stream-top]")) return $("#stream-map").scrollIntoView({ behavior: "smooth", block: "center" });
    const themeBtn = e.target.closest("[data-theme]");
    if (themeBtn) return selectTheme(themeBtn.dataset.theme);
    const idBtn = e.target.closest("[data-id]");
    if (idBtn) return openDetail(idBtn.dataset.id);
  });
  $("#timeline-kinds").addEventListener("change", (e) => {
    const k = e.target.dataset.kind;
    if (!k) return;
    e.target.checked ? shownKinds.add(k) : shownKinds.delete(k);
    renderTimeline();
  });
  $("#d-close").addEventListener("click", closeDetail);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDetail(); });

  // ---------- 初期化 ----------
  $("#total").textContent = THEOLOGIANS.length;
  update();
  renderThemes();
  renderTimeline();
  renderStreams();
  renderInstitutions();
  renderDebates();
  if ($("#debate-q")) $("#debate-q").addEventListener("input", (e) => { debateState.q = e.target.value; renderDebates(); });
  if ($("#inst-q")) $("#inst-q").addEventListener("input", (e) => { instState.q = e.target.value; renderInstitutions(); });
  if (location.hash.startsWith("#essay-")) openEssay(decodeURIComponent(location.hash.slice(7)));
  else if (location.hash.startsWith("#debate-")) goToDebate(location.hash.slice(8));
  else if (location.hash.startsWith("#inst-")) goToInst(location.hash.slice(6));
  else if (location.hash.startsWith("#stream-")) goToStream(location.hash.slice(8));
  else if (location.hash.length > 1) openDetail(decodeURIComponent(location.hash.slice(1)), false);
})();
