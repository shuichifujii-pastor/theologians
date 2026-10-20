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
    return [d ? [d.life, ...(d.points || []), d.influence].join(" ") : "", c ? c.text : ""].join(" ");
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

  // ---------- 絞り込み ----------
  function filtered() {
    const terms = state.q.split(/\s+/).map(normalize).filter(Boolean);
    return sorted.filter((t) => {
      if (state.era && t.era !== state.era) return false;
      if (state.country && countryButton(t) !== state.country) return false;
      if (state.field && !t.fields.includes(state.field)) return false;
      if (state.tradition && t.tradition !== state.tradition) return false;
      if (state.theme && !t.themes.includes(state.theme)) return false;
      const hay = haystack.get(t.id);
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
          <span class="meta">${ERAS[t.era].label}・${escapeHtml(t.tradition)}・${escapeHtml(t.years)}</span>
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
  const shownKinds = new Set(Object.keys(EVENT_KINDS));

  function renderTimeline() {
    $("#timeline-kinds").innerHTML = Object.entries(EVENT_KINDS).map(([k, label]) => `
      <label class="tl-toggle tl-kind-${k}"><input type="checkbox" data-kind="${k}" ${shownKinds.has(k) ? "checked" : ""}>${label}</label>`).join("");

    $("#timeline").innerHTML = Object.entries(ERAS).map(([key, era]) => {
      const people = sorted.filter((t) => t.era === key);
      const events = HISTORY_EVENTS.filter((ev) => shownKinds.has(ev.kind) && eventEra(ev.year) === key);
      if (!people.length && !events.length) return "";
      const rows = [
        ...people.map((t) => ({ y: t.born, html: `
              <li><button data-id="${t.id}">
                <span class="tl-years">${escapeHtml(t.years)}</span><span class="tl-name">${escapeHtml(t.name)}</span><span class="tl-trad">${escapeHtml(t.tradition)}</span>
              </button></li>` })),
        ...events.map((ev) => ({ y: ev.year - 0.1, html: `
              <li class="tl-event tl-kind-${ev.kind}">
                <span class="tl-years">${escapeHtml(ev.label)}</span><span class="tl-badge">${EVENT_KINDS[ev.kind]}</span><span class="tl-event-text">${escapeHtml(ev.text)}</span>
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
    const sts = streamsOf(t.id);
    $("#d-streams-wrap").hidden = !sts.length;
    $("#d-streams").innerHTML = sts.map((s) => `<button class="st-chip" data-stream="${s.id}">${escapeHtml(s.title)}</button>`).join("");
    dialog.style.setProperty("--era-color", eraColor(t.era));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    if (push) history.replaceState(null, "", `#${t.id}`);
  }

  function closeDetail() {
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener("close", () => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  });

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

  // ---------- 画面切り替え ----------
  function showView(name) {
    document.querySelectorAll(".tab").forEach((b) => {
      const on = b.dataset.view === name;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on);
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
  if (location.hash.startsWith("#stream-")) goToStream(location.hash.slice(8));
  else if (location.hash.length > 1) openDetail(decodeURIComponent(location.hash.slice(1)), false);
})();
