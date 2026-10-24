/*
 * メモ
 * ----------------------------------------------------------------
 * 神学者ごとのメモを、このブラウザ（端末）に保存します。
 *   ・人物の詳細画面の「メモ」欄に書くと、自動で保存されます
 *   ・「メモ」タブで、書いたメモを一覧・検索・編集・削除できます
 *   ・テキストで書き出したり、バックアップ（JSON）を保存・読み込みして
 *     別の端末に移したりできます
 * メモはサーバーには送られません。ブラウザのデータを消すと消えるので、
 * 大切なメモはときどきバックアップを保存してください。
 */
const NOTES = (() => {
  "use strict";

  const KEY = "theologian-notes";
  let cache = null;

  function load() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cache = {}; }
    return cache;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); return true; } catch (e) { return false; }
  }
  const changed = () => document.dispatchEvent(new CustomEvent("notes-changed"));

  return {
    get: (id) => (load()[id] ? load()[id].text : ""),
    updated: (id) => (load()[id] ? load()[id].updated : 0),
    has: (id) => !!(load()[id] && load()[id].text.trim()),
    all: () => Object.entries(load()).filter(([, n]) => n.text.trim()).map(([id, n]) => ({ id, ...n })),
    count: () => Object.values(load()).filter((n) => n.text.trim()).length,
    set(id, text) {
      load();
      if (text.trim()) cache[id] = { text, updated: Date.now() };
      else delete cache[id];
      const ok = persist();
      changed();
      return ok;
    },
    // バックアップの読み込み：同じ人物のメモは、新しい方を残す
    merge(data) {
      load();
      let n = 0;
      Object.entries(data || {}).forEach(([id, v]) => {
        if (!v || typeof v.text !== "string" || !v.text.trim()) return;
        const updated = Number(v.updated) || Date.now();
        if (!cache[id] || cache[id].updated < updated) { cache[id] = { text: v.text, updated }; n += 1; }
      });
      persist();
      changed();
      return n;
    },
    raw: () => ({ ...load() })
  };
})();

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const byId = Object.fromEntries(THEOLOGIANS.map((t) => [t.id, t]));
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (s) =>
    String(s).normalize("NFKC").toLowerCase()
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[・･\s\-‐–―「」『』（）()、。]/g, "");
  const fmt = (ms) => {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const eraLabel = (t) => (typeof ERAS !== "undefined" && ERAS[t.era] ? ERAS[t.era].label : "");

  // 入力が止まってから保存する
  function debounce(fn, ms) {
    let timer = null;
    const run = (...a) => { clearTimeout(timer); timer = setTimeout(() => fn(...a), ms); };
    run.flush = (...a) => { clearTimeout(timer); fn(...a); };
    return run;
  }

  // ---------- 人物の詳細画面のメモ欄 ----------
  const box = $("#d-note");
  const status = $("#d-note-status");
  let currentId = null;
  const showStatus = (id) => {
    const u = NOTES.updated(id);
    status.textContent = u ? `保存済み（${fmt(u)}）` : "書くと自動で保存されます（この端末のみ）";
  };
  const saveDetail = debounce((id, text) => {
    if (!id) return;
    const ok = NOTES.set(id, text);
    status.textContent = ok ? `保存しました（${fmt(Date.now())}）` : "保存できませんでした（ブラウザの設定を確認してください）";
  }, 500);

  if (box) {
    document.addEventListener("detail-open", (e) => {
      if (currentId && box.value !== NOTES.get(currentId)) saveDetail.flush(currentId, box.value);
      currentId = e.detail.id;
      box.value = NOTES.get(currentId);
      autoGrow(box);
      showStatus(currentId);
    });
    box.addEventListener("input", () => { autoGrow(box); status.textContent = "保存中…"; saveDetail(currentId, box.value); });
    box.addEventListener("blur", () => { if (currentId && box.value !== NOTES.get(currentId)) saveDetail.flush(currentId, box.value); });
    const dialog = $("#detail");
    if (dialog) dialog.addEventListener("close", () => {
      if (currentId && box.value !== NOTES.get(currentId)) saveDetail.flush(currentId, box.value);
    });
  }

  function autoGrow(el) {
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight + 2, 84), 420) + "px";
  }

  // ---------- メモ一覧 ----------
  const list = $("#notes");
  if (!list) return;
  const st = { q: "", sort: "updated" };

  function sortNotes(items) {
    if (st.sort === "born") return items.sort((a, b) => byId[a.id].born - byId[b.id].born);
    if (st.sort === "name") return items.sort((a, b) => byId[a.id].name.localeCompare(byId[b.id].name, "ja"));
    return items.sort((a, b) => b.updated - a.updated);
  }

  function render() {
    const all = NOTES.all().filter((n) => byId[n.id]);
    const tabCount = $("#notes-tab-n");
    if (tabCount) tabCount.textContent = all.length ? String(all.length) : "";
    const terms = st.q.split(/\s+/).map(normalize).filter(Boolean);
    const shown = sortNotes(all.filter((n) => {
      if (!terms.length) return true;
      const t = byId[n.id];
      const hay = normalize([t.name, t.original, n.text].join(" "));
      return terms.every((x) => hay.includes(x));
    }));
    $("#notes-count").textContent = all.length
      ? (terms.length ? `${shown.length} 件 / 全 ${all.length} 件` : `${all.length} 件`)
      : "";
    $("#notes-tools").hidden = !all.length;
    if (!all.length) {
      list.innerHTML = `
        <div class="nt-empty">
          <p>まだメモはありません。</p>
          <p>人物の詳細画面を開くと、下のほうに「メモ」欄があります。書いた内容は自動で保存され、ここに一覧で表示されます。</p>
        </div>`;
      return;
    }
    list.innerHTML = shown.length ? shown.map((n) => {
      const t = byId[n.id];
      return `
      <section class="nt-card" data-note="${n.id}" style="--era-color:var(--era-${t.era})">
        <div class="nt-head">
          <button class="nt-name" data-id="${t.id}">${escapeHtml(t.name)}</button>
          <span class="nt-meta">${escapeHtml(eraLabel(t))}・${escapeHtml(t.years)}</span>
        </div>
        <textarea class="nt-text" data-note-edit="${n.id}" aria-label="${escapeHtml(t.name)}のメモ">${escapeHtml(n.text)}</textarea>
        <div class="nt-foot">
          <span class="nt-date" data-note-date="${n.id}">更新 ${fmt(n.updated)}</span>
          <span class="nt-actions">
            <button class="nt-btn" data-id="${t.id}">人物を開く</button>
            <button class="nt-btn nt-del" data-note-del="${n.id}">削除</button>
          </span>
        </div>
      </section>`;
    }).join("") : `<p class="empty">該当するメモが見つかりませんでした。</p>`;
    list.querySelectorAll(".nt-text").forEach(autoGrow);
  }

  // 一覧の中で直接書き換える
  const saveInline = debounce((id, text, dateEl) => {
    NOTES.set(id, text);
    if (dateEl) dateEl.textContent = `更新 ${fmt(Date.now())}（保存しました）`;
  }, 500);
  list.addEventListener("input", (e) => {
    const ta = e.target.closest("[data-note-edit]");
    if (!ta) return;
    autoGrow(ta);
    saveInline(ta.dataset.noteEdit, ta.value, list.querySelector(`[data-note-date="${ta.dataset.noteEdit}"]`));
  });
  list.addEventListener("focusout", (e) => {
    const ta = e.target.closest("[data-note-edit]");
    if (!ta) return;
    saveInline.flush(ta.dataset.noteEdit, ta.value, list.querySelector(`[data-note-date="${ta.dataset.noteEdit}"]`));
    if (!ta.value.trim()) setTimeout(render, 0);
  });
  list.addEventListener("click", (e) => {
    const del = e.target.closest("[data-note-del]");
    if (!del) return;
    const t = byId[del.dataset.noteDel];
    if (window.confirm(`「${t ? t.name : ""}」のメモを削除しますか？\nこの操作は元に戻せません。`)) {
      NOTES.set(del.dataset.noteDel, "");
    }
  });

  // 一覧で書いている最中は描き直さない（カーソルが飛ばないように）
  const editingInList = () => { const a = document.activeElement; return !!(a && a.matches && a.matches("[data-note-edit]") && list.contains(a)); };
  document.addEventListener("notes-changed", () => { if (editingInList()) updateTabCount(); else render(); });
  function updateTabCount() {
    const tabCount = $("#notes-tab-n");
    if (tabCount) { const n = NOTES.count(); tabCount.textContent = n ? String(n) : ""; }
  }

  $("#notes-q").addEventListener("input", (e) => { st.q = e.target.value; render(); });
  $("#notes-sort").addEventListener("change", (e) => { st.sort = e.target.value; render(); });

  // ---------- 書き出し・バックアップ ----------
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; };

  $("#notes-export-txt").addEventListener("click", () => {
    const items = sortNotes(NOTES.all().filter((n) => byId[n.id]));
    const body = items.map((n) => {
      const t = byId[n.id];
      return `■ ${t.name}（${t.original}／${t.years}）\n更新：${fmt(n.updated)}\n\n${n.text.trim()}\n`;
    }).join("\n――――――――――\n\n");
    download(`神学者メモ_${today()}.txt`, `神学（哲学）者辞典　メモ（${items.length}件）\n\n${body}`, "text/plain;charset=utf-8");
  });
  $("#notes-backup").addEventListener("click", () => {
    download(`神学者メモ_バックアップ_${today()}.json`, JSON.stringify({ app: "theologians-notes", version: 1, notes: NOTES.raw() }, null, 2), "application/json");
  });
  const fileInput = $("#notes-import-file");
  $("#notes-import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const notes = data && data.notes ? data.notes : data;
        const n = NOTES.merge(notes);
        window.alert(`バックアップを読み込みました（${n}件を追加・更新）。`);
      } catch (e) {
        window.alert("読み込めませんでした。この辞典で保存したバックアップ（.json）を選んでください。");
      }
      fileInput.value = "";
    };
    reader.readAsText(f);
  });

  render();
})();
