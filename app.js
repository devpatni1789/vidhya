/* ============================================================
   GTU PREP — Semester 3 exam preparation tracker
   Vanilla JS · localStorage · works from file:// directly
   ============================================================ */
(function () {
  "use strict";

  const LS_KEY = "gtu-prep-v1";
  const DATA = window.GTU_DATA;

  /* ---------------- state ---------------- */
  const defaultState = () => ({ completed: {}, revision: {}, theme: "light" });
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return {
        completed: parsed.completed || {},
        revision: parsed.revision || {},
        theme: parsed.theme === "dark" ? "dark" : "light",
      };
    } catch {
      return defaultState();
    }
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* storage full */ }
  }

  /* ---------------- question index ---------------- */
  const subjects = DATA.subjects;
  const allQuestions = [];

  subjects.forEach((sub) => {
    sub.questionBank.forEach((q) => {
      allQuestions.push({
        id: `${sub.id}-QB-${q.no}`,
        subject: sub.id,
        subjectName: sub.name,
        sourceKey: "QB",
        sourceName: "Question Bank",
        num: q.no,
        label: `Q${q.no}`,
        or: false,
        marks: null,
        co: q.co,
        bl: q.bl,
        text: q.text,
        table: false,
      });
    });
    sub.papers.forEach((p) => {
      const pk = `${p.season === "Summer" ? "S" : "W"}${p.year}`;
      const pname = `${p.season} ${p.year} GTU Paper`;
      p.questions.forEach((q) => {
        allQuestions.push({
          id: `${sub.id}-${pk}-${q.q}-${q.label.includes("OR") ? "or" : "m"}-${q.label.replace(/[^a-z0-9]/gi, "")}`,
          subject: sub.id,
          subjectName: sub.name,
          sourceKey: pk,
          sourceName: pname,
          paper: p,
          num: null,
          label: q.label,
          or: q.or,
          marks: q.marks,
          co: null,
          bl: null,
          text: q.text,
          table: !!q.table,
        });
      });
    });
  });
  const byId = Object.fromEntries(allQuestions.map((q) => [q.id, q]));

  /* ---------------- stats ---------------- */
  const isDone = (id) => !!state.completed[id];
  const isRev = (id) => !!state.revision[id];
  function stats(list) {
    const total = list.length;
    let done = 0;
    list.forEach((q) => { if (isDone(q.id)) done++; });
    return { total, done, pending: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  const totalStats = () => stats(allQuestions);
  const subjectStats = (sid) => stats(allQuestions.filter((q) => q.subject === sid));

  /* ---------------- helpers ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function questionCard(q) {
    const done = isDone(q.id);
    const rev = isRev(q.id);
    const tags = [];
    tags.push(`<span class="pill">${esc(q.sourceName)}</span>`);
    if (q.or) tags.push(`<span class="pill or">OR</span>`);
    if (q.marks) tags.push(`<span class="pill marks">${q.marks} marks</span>`);
    if (q.co) tags.push(`<span class="pill marks">${esc(q.co)}</span>`);
    if (q.bl) tags.push(`<span class="pill marks">BL ${esc(q.bl)}</span>`);
    // image-transcribed tables are stored as "a | b | c" lines — render them in a mono block
    const lines = q.text.split("\n");
    const tableLines = lines.filter((l) => l.includes("|"));
    const mainText = (tableLines.length ? lines.filter((l) => !l.includes("|")).join("\n") : q.text).trim();
    return `
      <article class="qcard ${done ? "completed" : ""}" data-qid="${esc(q.id)}">
        <div class="qnum">${q.num ? esc(q.num) : esc(q.label.replace(/^Q\.?(\d).*/, "Q$1"))}</div>
        <div class="qbody">
          <div class="qtext">
            ${mainText ? `<div class="qmain">${esc(mainText)}</div>` : ""}
            ${tableLines.length ? `<div class="qtable">${esc(tableLines.join("\n"))}</div>` : ""}
          </div>
          <div class="qtags">${tags.join("")}</div>
        </div>
        <button class="icon-btn ${rev ? "on" : ""}" data-rev="${esc(q.id)}" title="${rev ? "Remove from revision" : "Practise again — add to revision"}" aria-pressed="${rev}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 1 2.5 6"/><path d="M3.5 21v-5h5"/></svg>
        </button>
        <label class="switch" title="Mark completed">
          <input type="checkbox" data-toggle="${esc(q.id)}" ${done ? "checked" : ""} aria-label="Completed" />
          <span class="track"></span><span class="thumb"></span>
        </label>
      </article>`;
  }

  function renderGrouped(list) {
    if (!list.length) {
      return `<div class="empty card"><div class="big">Nothing here yet</div>No questions match your filters.</div>`;
    }
    let html = "";
    let lastKey = null;
    list.forEach((q) => {
      const key = q.subject + "|" + q.sourceKey;
      if (key !== lastKey) {
        const st = stats(list.filter((x) => x.subject === q.subject && x.sourceKey === q.sourceKey));
        const title = q.sourceKey === "QB" ? `${q.subjectName} — Question Bank` : `${q.subjectName} — ${q.sourceName}`;
        html += `<div class="qgroup"><h2>${esc(title)}</h2><span class="cnt">${st.done}/${st.total} done</span><span class="line"></span></div>`;
        lastKey = key;
      }
      html += questionCard(q);
    });
    return `<div class="qlist">${html}</div>`;
  }

  /* ---------------- counters refresh ---------------- */
  function refreshCounters() {
    $$("[data-counter]").forEach((el) => {
      const kind = el.dataset.counter;
      let st;
      if (kind === "total") st = totalStats();
      else st = subjectStats(kind);
      if (el.dataset.stat === "pct") el.textContent = st.pct + "%";
      else if (el.dataset.stat === "done") el.textContent = st.done;
      else if (el.dataset.stat === "pending") el.textContent = st.pending;
      else el.textContent = st.total;
    });
    $$("[data-bar]").forEach((el) => {
      const st = el.dataset.bar === "total" ? totalStats() : subjectStats(el.dataset.bar);
      const fill = el.querySelector("span");
      if (fill) {
        fill.style.width = st.pct + "%";
        fill.parentElement.classList.toggle("done", st.pct === 100);
      }
    });
    $$(".ring-fill").forEach((el) => {
      const st = totalStats();
      const c = 2 * Math.PI * 54;
      el.setAttribute("stroke-dashoffset", (c * (1 - st.pct / 100)).toFixed(1));
    });
    $$(".qcard").forEach((card) => {
      card.classList.toggle("completed", isDone(card.dataset.qid));
    });
  }

  /* ---------------- theme ---------------- */
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    save();
    applyTheme();
    toast(state.theme === "dark" ? "Dark theme on" : "Light theme on");
  }

  /* ---------------- toast & modal ---------------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
  function showModal(title, body, onConfirm) {
    $("#modalTitle").textContent = title;
    $("#modalBody").textContent = body;
    const backdrop = $("#modalBackdrop");
    backdrop.hidden = false;
    const close = () => { backdrop.hidden = true; };
    $("#modalCancel").onclick = close;
    $("#modalConfirm").onclick = () => { close(); onConfirm(); };
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
  }

  /* ---------------- views ---------------- */
  function head(eyebrow, title, sub) {
    return `<header class="page-head"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}</header>`;
  }

  /* ---------------- dashboard extras ---------------- */
  const DAY = 86400000;
  const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); };
  const doneTs = (id) => (typeof state.completed[id] === "number" ? state.completed[id] : 0);
  const doneEntries = () =>
    allQuestions.map((q) => ({ q, ts: doneTs(q.id) })).filter((e) => e.ts).sort((a, b) => b.ts - a.ts);
  function todayCount() { const t = dayKey(Date.now()); return doneEntries().filter((e) => dayKey(e.ts) === t).length; }
  function weekCount() { const since = Date.now() - 7 * DAY; return doneEntries().filter((e) => e.ts >= since).length; }
  function streak() {
    const days = new Set(doneEntries().map((e) => dayKey(e.ts)));
    let n = 0;
    let d = days.has(dayKey(Date.now())) ? new Date() : new Date(Date.now() - DAY);
    while (days.has(dayKey(d.getTime()))) { n++; d = new Date(d.getTime() - DAY); }
    return n;
  }
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }
  function questionOfDay() {
    const pending = allQuestions.filter((q) => !isDone(q.id) && !q.text.includes("|"));
    const pool = pending.length ? pending : allQuestions;
    const seed = new Date().toDateString();
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return pool[h % pool.length];
  }

  function viewDashboard() {
    const t = totalStats();
    const rows = subjects.map((s) => {
      const st = subjectStats(s.id);
      return `<div class="row">
        <div class="top">
          <span class="name">${esc(s.name)}<span>${esc(s.code)}</span></span>
          <span class="nums"><b data-counter="${esc(s.id)}" data-stat="done">${st.done}</b>/${st.total} · <span data-counter="${esc(s.id)}" data-stat="pct">${st.pct}%</span></span>
        </div>
        <div class="bar" data-bar="${esc(s.id)}"><span style="width:${st.pct}%"></span></div>
      </div>`;
    }).join("");

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const dateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const revCount = Object.keys(state.revision).length;
    const GOAL = 30;
    const wk = weekCount();
    const wkPct = Math.min(100, Math.round((wk / GOAL) * 100));
    const circ = (2 * Math.PI * 54).toFixed(1);
    const off = (2 * Math.PI * 54 * (1 - t.pct / 100)).toFixed(1);

    const qd = questionOfDay();
    const qdDone = isDone(qd.id);
    const qdLines = qd.text.split("\n").filter((l) => !l.includes("|"));

    const acts = doneEntries().slice(0, 5);
    const activity = acts.length
      ? `<ul class="activity">${acts.map((a) => `
        <li><a href="#/subject/${esc(a.q.subject)}">
          <span class="dot"></span>
          <span class="act-text">${esc(a.q.text.replace(/\n/g, " ").length > 62 ? a.q.text.replace(/\n/g, " ").slice(0, 62) + "…" : a.q.text.replace(/\n/g, " "))}</span>
          <span class="act-time">${timeAgo(a.ts)}</span>
        </a></li>`).join("")}</ul>`
      : `<div class="act-empty">Flip your first switch in <a href="#/study">Study</a> and your progress will show up here.</div>`;

    return `
      <section class="hero">
        <div class="hero-left">
          <div class="hero-eyebrow">${greeting} · ${esc(dateLabel)}</div>
          <h1>Semester 3 Exam Prep</h1>
          <p class="hero-sub">${t.total} questions across 5 subjects — question banks and 10 official GTU papers, tracked automatically as you study.</p>
          <div class="hero-chips">
            <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s5.5 4.7 5.5 10a5.5 5.5 0 0 1-11 0c0-2 .8-3.9 1.8-5.5.6 1.2 1.6 2 2.7 2.3C11.3 7.2 11.6 4.6 12 2.5Z"/></svg><b>${streak()}-day</b> streak</span>
            <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg><b>${todayCount()}</b> done today</span>
            <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 1 2.5 6"/><path d="M3.5 21v-5h5"/></svg><b>${revCount}</b> in revision</span>
          </div>
          <div class="hero-actions">
            <a class="btn btn-hero" href="#/study">Start studying</a>
            <a class="btn btn-hero-ghost" href="#/subjects">Browse subjects</a>
          </div>
        </div>
        <div class="hero-ring">
          <svg viewBox="0 0 128 128" width="138" height="138" aria-hidden="true">
            <circle class="ring-track" cx="64" cy="64" r="54"/>
            <circle class="ring-fill" cx="64" cy="64" r="54" stroke-dasharray="${circ}" stroke-dashoffset="${off}" transform="rotate(-90 64 64)"/>
          </svg>
          <div class="ring-center">
            <span class="ring-pct" data-counter="total" data-stat="pct">${t.pct}%</span>
            <span class="ring-cap">complete</span>
          </div>
        </div>
      </section>
      <div class="stat-grid">
        <div class="stat"><div class="k">Total questions</div><div class="v" data-counter="total">${t.total}</div></div>
        <div class="stat"><div class="k">Completed</div><div class="v good" data-counter="total" data-stat="done">${t.done}</div></div>
        <div class="stat"><div class="k">Pending</div><div class="v" data-counter="total" data-stat="pending">${t.pending}</div></div>
        <div class="stat"><div class="k">This week</div><div class="v">${wk} <small>of ${GOAL} goal</small></div></div>
      </div>
      <div class="home-grid">
        <div class="card subject-progress">
          <div class="panel-head"><h2>Subject progress</h2><a class="mini-link" href="#/subjects">All subjects →</a></div>
          ${rows}
        </div>
        <div class="home-side">
          <article class="qcard qotd ${qdDone ? "completed" : ""}" data-qid="${esc(qd.id)}">
            <div class="panel-head qotd-head"><h2>Question of the day</h2><span class="pill accent">Daily pick</span></div>
            <div class="qtext"><div class="qmain">${esc(qdLines.join("\n"))}</div></div>
            <div class="qtags">
              <span class="pill">${esc(qd.subjectName)}</span>
              <span class="pill">${esc(qd.sourceName)}</span>
              ${qd.marks ? `<span class="pill marks">${qd.marks} marks</span>` : ""}
            </div>
            <div class="qotd-actions">
              <button class="icon-btn ${isRev(qd.id) ? "on" : ""}" data-rev="${esc(qd.id)}" title="${isRev(qd.id) ? "Remove from revision" : "Practise again — add to revision"}" aria-pressed="${isRev(qd.id)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 1 2.5 6"/><path d="M3.5 21v-5h5"/></svg>
              </button>
              <label class="switch" title="Mark completed">
                <input type="checkbox" data-toggle="${esc(qd.id)}" ${qdDone ? "checked" : ""} aria-label="Completed" />
                <span class="track"></span><span class="thumb"></span>
              </label>
            </div>
          </article>
          <div class="card activity-card">
            <div class="panel-head"><h2>Recent activity</h2></div>
            ${activity}
          </div>
          <div class="card week-card">
            <div class="panel-head"><h2>Weekly goal</h2><span class="nums">${wk}/${GOAL} questions</span></div>
            <div class="bar ${wkPct === 100 ? "done" : ""}"><span style="width:${wkPct}%"></span></div>
          </div>
        </div>
      </div>`;
  }

  function viewSubjects() {
    const cards = subjects.map((s) => {
      const st = subjectStats(s.id);
      return `<a class="subject-card card" href="#/subject/${esc(s.id)}">
        <div class="code"><span>${esc(s.code)}</span><span>${esc(s.id)}</span></div>
        <h3>${esc(s.name)}</h3>
        <div class="meta">${s.questionBank.length} question bank · ${s.papers.length} GTU papers · ${allQuestions.filter((q) => q.subject === s.id).length} questions</div>
        <div class="bar" data-bar="${esc(s.id)}"><span style="width:${st.pct}%"></span></div>
        <div class="foot">
          <span class="pill ${st.pct === 100 ? "done" : "accent"}" data-counter="${esc(s.id)}" data-stat="pct">${st.pct}%</span>
          <span><b data-counter="${esc(s.id)}" data-stat="done">${st.done}</b> of ${st.total} completed →</span>
        </div>
      </a>`;
    }).join("");
    return `
      ${head("Library", "Subjects", "Five Diploma Computer Engineering subjects for Semester 3.")}
      <div class="subject-grid">${cards}</div>`;
  }

  function viewSubject(sid) {
    const sub = subjects.find((s) => s.id === sid);
    if (!sub) return viewNotFound();
    const st = subjectStats(sid);
    const tab = subjectTab[sid] || "qb";
    let listHtml = "";
    if (tab === "qb") {
      const list = allQuestions.filter((q) => q.subject === sid && q.sourceKey === "QB");
      listHtml = renderGrouped(list);
    } else {
      let html = "";
      sub.papers.forEach((p) => {
        const list = allQuestions.filter((q) => q.subject === sid && q.paper === p);
        const pst = stats(list);
        html += `<div class="qgroup"><h2>${esc(p.season)} ${esc(p.year)} paper</h2>
          <span class="cnt">${pst.done}/${pst.total} done · ${esc(p.meta.date || "")} · 70 marks</span><span class="line"></span></div>`;
        html += `<div class="qlist">${list.map(questionCard).join("")}</div>`;
      });
      listHtml = html;
    }
    return `
      ${head(`Subjects / ${sid}`, sub.name, `${sub.code} · ${st.done} of ${st.total} questions completed (${st.pct}%). Flip a switch to mark a question done — progress saves automatically.`)}
      <div class="seg" role="tablist">
        <button class="${tab === "qb" ? "active" : ""}" data-tab="qb">Question Bank · ${sub.questionBank.length}</button>
        <button class="${tab === "papers" ? "active" : ""}" data-tab="papers">GTU Papers · ${sub.papers.length * sub.papers[0].questions.length}</button>
      </div>
      ${listHtml}`;
  }

  /* ---------------- study ---------------- */
  const studyFilters = { q: "", subject: "all", source: "all", status: "all" };

  function studyList() {
    const q = studyFilters.q.trim().toLowerCase();
    let list = allQuestions.filter((x) => {
      if (studyFilters.subject !== "all" && x.subject !== studyFilters.subject) return false;
      if (studyFilters.source !== "all") {
        if (studyFilters.source === "QB" && x.sourceKey !== "QB") return false;
        if (studyFilters.source !== "QB" && x.sourceKey !== studyFilters.source) return false;
      }
      if (studyFilters.status === "pending" && isDone(x.id)) return false;
      if (studyFilters.status === "completed" && !isDone(x.id)) return false;
      if (studyFilters.status === "revision" && !isRev(x.id)) return false;
      if (q && !(x.text.toLowerCase().includes(q) || x.subjectName.toLowerCase().includes(q) || x.sourceName.toLowerCase().includes(q))) return false;
      return true;
    });
    return renderGrouped(list);
  }

  function paperOptions() {
    const opts = new Set();
    allQuestions.forEach((x) => { if (x.sourceKey !== "QB") opts.add(x.sourceKey + "|" + x.sourceName); });
    return Array.from(opts).sort();
  }

  function viewStudy() {
    const subjectOpts = subjects.map((s) => `<option value="${esc(s.id)}" ${studyFilters.subject === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("");
    const sourceOpts = paperOptions().map((o) => {
      const [k, n] = o.split("|");
      return `<option value="${esc(k)}" ${studyFilters.source === k ? "selected" : ""}>${esc(n)}</option>`;
    }).join("");
    return `
      ${head("Practice", "Study", "Search and filter every question. Mark the ones you want to practise again with the repeat button.")}
      <div class="card filters">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.4-3.4"/></svg>
          <input class="input" id="studySearch" type="search" placeholder="Search all questions…" value="${esc(studyFilters.q)}" />
        </div>
        <div class="row3">
          <select class="select" id="fSubject">
            <option value="all">All subjects</option>${subjectOpts}
          </select>
          <select class="select" id="fSource">
            <option value="all">All sources</option>
            <option value="QB" ${studyFilters.source === "QB" ? "selected" : ""}>Question banks</option>
            ${sourceOpts}
          </select>
          <select class="select" id="fStatus">
            <option value="all">All questions</option>
            <option value="pending" ${studyFilters.status === "pending" ? "selected" : ""}>Pending only</option>
            <option value="completed" ${studyFilters.status === "completed" ? "selected" : ""}>Completed only</option>
            <option value="revision" ${studyFilters.status === "revision" ? "selected" : ""}>Marked for revision</option>
          </select>
        </div>
      </div>
      <div id="studyList">${studyList()}</div>`;
  }

  function bindStudy() {
    const search = $("#studySearch");
    let deb;
    search.addEventListener("input", () => {
      clearTimeout(deb);
      deb = setTimeout(() => {
        studyFilters.q = search.value;
        $("#studyList").innerHTML = studyList();
      }, 160);
    });
    $("#fSubject").addEventListener("change", (e) => {
      studyFilters.subject = e.target.value;
      $("#studyList").innerHTML = studyList();
    });
    $("#fSource").addEventListener("change", (e) => {
      studyFilters.source = e.target.value;
      $("#studyList").innerHTML = studyList();
    });
    $("#fStatus").addEventListener("change", (e) => {
      studyFilters.status = e.target.value;
      $("#studyList").innerHTML = studyList();
    });
  }

  /* ---------------- revision ---------------- */
  function viewRevision() {
    const list = allQuestions.filter((q) => isRev(q.id));
    const body = list.length
      ? `<div class="qlist">${list.map(questionCard).join("")}</div>`
      : `<div class="empty card"><div class="big">No questions marked yet</div>Open any question list and tap the repeat button to practise it again later.</div>`;
    return `
      ${head("Practise again", "Revision", `${list.length} question${list.length === 1 ? "" : "s"} marked to practise again.`)}
      ${body}`;
  }

  /* ---------------- settings ---------------- */
  function viewSettings() {
    const t = totalStats();
    return `
      ${head("Preferences", "Settings", "Your progress is stored on this device in your browser — no account, no backend.")}
      <div class="settings-grid">
        <div class="card setting-row">
          <div class="info"><h3>Appearance</h3><p>Switch between the light and dark themes.</p></div>
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
            <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>
            <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>
            <span class="knob"></span>
          </button>
        </div>
        <div class="card setting-row">
          <div class="info"><h3>Export progress</h3><p>Download a JSON backup of your completed and revision questions.</p></div>
          <button class="btn btn-ghost" id="exportBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11M7.5 10 12 14.5 16.5 10M4.5 20h15"/></svg>
            Export
          </button>
        </div>
        <div class="card setting-row">
          <div class="info"><h3>Import progress</h3><p>Restore progress from a previously exported JSON file.</p></div>
          <button class="btn btn-ghost" id="importBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8M4.5 20h15"/></svg>
            Import
          </button>
          <input type="file" id="importFile" accept="application/json,.json" hidden />
        </div>
        <div class="card setting-row">
          <div class="info"><h3>Reset progress</h3><p>Clear every toggle and revision mark. This cannot be undone.</p></div>
          <button class="btn btn-danger" id="resetBtn">Reset</button>
        </div>
        <div class="card setting-row">
          <div class="info"><h3>Data summary</h3><p>${t.total} questions across 5 subjects · ${t.done} completed · ${t.pending} pending · saved locally in this browser.</p></div>
        </div>
      </div>`;
  }

  function bindSettings() {
    $("#themeToggle").addEventListener("click", toggleTheme);
    $("#exportBtn").addEventListener("click", () => {
      const payload = JSON.stringify({ app: "GTU PREP", version: 1, exportedAt: new Date().toISOString(), completed: state.completed, revision: state.revision }, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "gtu-prep-progress.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Progress exported");
    });
    $("#importBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (typeof data.completed !== "object" || typeof data.revision !== "object") throw new Error("bad");
          showModal("Import progress?", "This will replace your current progress with the imported file.", () => {
            state.completed = data.completed || {};
            state.revision = data.revision || {};
            save();
            refreshCounters();
            toast("Progress imported");
            render();
          });
        } catch {
          toast("That file isn't a valid GTU PREP export");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
    $("#resetBtn").addEventListener("click", () => {
      showModal("Reset all progress?", "Every completed toggle and revision mark will be cleared. This cannot be undone.", () => {
        state.completed = {};
        state.revision = {};
        save();
        refreshCounters();
        toast("Progress reset");
        render();
      });
    });
  }

  function viewNotFound() {
    return `<div class="empty card" style="margin-top:40px"><div class="big">Page not found</div>Use the navigation below to get back on track.</div>`;
  }

  /* ---------------- router ---------------- */
  const subjectTab = {};
  let currentRoute = { name: "dashboard" };

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    if (!parts.length) return { name: "dashboard" };
    if (parts[0] === "subject" && parts[1]) return { name: "subject", id: parts[1] };
    if (["dashboard", "subjects", "study", "revision", "settings"].includes(parts[0])) return { name: parts[0] };
    return { name: "notfound" };
  }

  function render() {
    const view = $("#view");
    const r = currentRoute;
    // restart the enter animation
    view.classList.remove("view");
    void view.offsetWidth;
    view.classList.add("view");

    if (r.name === "dashboard") view.innerHTML = viewDashboard();
    else if (r.name === "subjects") view.innerHTML = viewSubjects();
    else if (r.name === "subject") view.innerHTML = viewSubject(r.id);
    else if (r.name === "study") { view.innerHTML = viewStudy(); bindStudy(); }
    else if (r.name === "revision") view.innerHTML = viewRevision();
    else if (r.name === "settings") { view.innerHTML = viewSettings(); bindSettings(); }
    else view.innerHTML = viewNotFound();

    positionDock();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* ---------------- dock ---------------- */
  function positionDock() {
    const active = $(".dock-item[data-route='" + currentRoute.name + "']");
    const indicator = $("#dockIndicator");
    $$(".dock-item").forEach((el) => el.classList.remove("active"));
    if (!active || !indicator) return;
    active.classList.add("active");
    indicator.style.left = active.offsetLeft + "px";
    indicator.style.width = active.offsetWidth + "px";
  }

  /* ---------------- global events ---------------- */
  document.addEventListener("change", (e) => {
    const input = e.target.closest("[data-toggle]");
    if (!input) return;
    const qid = input.dataset.toggle;
    if (input.checked) state.completed[qid] = Date.now();
    else delete state.completed[qid];
    save();
    const card = input.closest(".qcard");
    if (card) card.classList.toggle("completed", input.checked);
    refreshCounters();
  });

  document.addEventListener("click", (e) => {
    const revBtn = e.target.closest("[data-rev]");
    if (revBtn) {
      const qid = revBtn.dataset.rev;
      if (state.revision[qid]) {
        delete state.revision[qid];
        toast("Removed from revision");
      } else {
        state.revision[qid] = true;
        toast("Marked to practise again");
      }
      save();
      if (currentRoute.name === "revision") render();
      else {
        revBtn.classList.toggle("on", isRev(qid));
        revBtn.setAttribute("aria-pressed", isRev(qid));
      }
      return;
    }
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      const id = currentRoute.id;
      subjectTab[id] = tab.dataset.tab;
      render();
    }
  });

  window.addEventListener("hashchange", () => {
    currentRoute = parseHash();
    render();
  });
  window.addEventListener("resize", positionDock);

  /* ---------------- boot ---------------- */
  applyTheme();
  currentRoute = parseHash();
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionDock);
  window.addEventListener("load", positionDock);
})();
