/* ============================================================
   CENTAUR — the instrument for judgment
   Vanilla JS. No framework, no backend. All state in localStorage.
   Loop: Capture -> Classification -> log -> History (drift).
   Copy rules: no dashes, no exclamation points, report not scold.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- storage ---------- */
  var KEY = "centaur.v1";
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { entries: [], showDrift: true };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- the three categories ---------- */
  var CATS = {
    Direct: {
      pos: 0.16,
      meaning: "You hold the thinking. The AI is a sounding board; the judgment stays with you.",
      action: "This keeps the call with you. If you want sharper edges, ask the AI to argue the opposing case so your reasoning gets tested."
    },
    Delegate: {
      pos: 0.50,
      meaning: "You hand over a bounded outcome and inspect the result. The thinking is shared; you still check the work.",
      action: "You could write the one sentence that states the goal yourself before the AI drafts, so the framing stays yours."
    },
    Defer: {
      pos: 0.84,
      meaning: "You outsource the judgment itself. The AI decides; you accept.",
      action: "You could make the decision yourself first, then ask the AI to find the strongest objection to it."
    }
  };

  /* ---------- classifier ---------- */
  // Signal phrases. We surface the exact matched phrase as evidence.
  var DEFER = ["decide for me","you decide","your call","whatever you think","just write","write it for me",
    "do it for me","handle it","handle this","take care of","make the call","make the decision",
    "tell me what to","just do it","sort this out","draft the final","final version","write the whole",
    "do my","write my","choose for me","pick the best","figure it out for me","just give me the answer"];
  var DIRECT = ["help me think","think through","brainstorm","what am i missing","poke holes",
    "pressure test","pressure-test","critique my","challenge my","review my","feedback on my",
    "is my reasoning","sounding board","play devil","steelman","check my thinking","quiz me",
    "second opinion on my","stress test","help me understand","so i understand","walk me through"];
  var DELEGATE = ["draft","outline","summarize","summary","first pass","rough version","a few options",
    "give me options","list of","generate","rewrite","clean up","reformat","starting point","brainstorm a list"];
  var INSPECT = ["i'll edit","i will edit","i'll review","i will review","so i can check","so i can review",
    "then i'll","then i will","i'll check","i'll decide","i'll pick","i'll choose","i will check","and i'll",
    "i'll sign off","review it before","check it before","i will then"];

  var DECIDE = ["decide","choose","pick","select","determine","prioritize","prioritise","rank","recommend","judge"];
  var PRODUCE = ["write","draft","compose","create","build","generate","summarize","summarise","outline",
    "rewrite","design","plan","make","prepare","calculate","solve","find","research","analyze","analyse","format"];

  function findFirst(text, list) {
    for (var i = 0; i < list.length; i++) {
      var idx = text.indexOf(list[i]);
      if (idx !== -1) return { phrase: list[i], idx: idx };
    }
    return null;
  }

  function verdict(category, evidence) {
    var c = CATS[category];
    return { category: category, evidence: evidence, action: c.action, pos: c.pos };
  }

  function classify(raw) {
    var t = (" " + raw + " ").toLowerCase().replace(/[\u2018\u2019]/g, "'");
    var firstWord = ((raw.trim().toLowerCase()
      .replace(/^(please|hey|ok|okay|can you|could you|would you|pls|i need you to|i want you to)\s+/, "")
      .match(/[a-z']+/) || [""])[0]);

    var inspect = findFirst(t, INSPECT);
    var directHit = findFirst(t, DIRECT);
    var collab = !!directHit || /\bhelp me\b|\bwith me\b|\bshould i\b|\bam i\b|\bmy (thinking|reasoning|draft|argument|plan|logic|idea|approach)\b/.test(t);
    var deferPhrase = findFirst(t, DEFER);

    // 1. Explicit hand-off of judgment, with no take-back.
    if (deferPhrase && !inspect && !collab) {
      return verdict("Defer", 'You asked the AI to "' + deferPhrase.phrase + '". That passes the judgment to the model and accepts what it returns. Nothing in the task reserves the decision for you.');
    }
    // 2. Collaboration: the thinking stays with you.
    if (collab && !deferPhrase) {
      var ph = directHit ? directHit.phrase : "help me think";
      return verdict("Direct", 'You framed this as "' + ph + '", which keeps the thinking with you and uses the AI to test it rather than to produce the answer.');
    }
    // 3. Leading imperative: a decision verb hands over the call.
    if (DECIDE.indexOf(firstWord) !== -1) {
      if (inspect) return verdict("Delegate", 'You told the AI to "' + firstWord + '" something but kept a checkpoint ("' + inspect.phrase + '"), so the call still comes back to you.');
      return verdict("Defer", 'You opened with "' + firstWord + '", telling the AI to make the call. The part that needs your judgment goes to the model, and you take what it returns.');
    }
    // 4. Leading imperative: a production verb is a bounded output.
    if (PRODUCE.indexOf(firstWord) !== -1) {
      if (/\b(for me|the whole|whole thing|final version|and send|then send|and submit)\b/.test(t) && !inspect)
        return verdict("Defer", 'You asked the AI to "' + firstWord + '" the finished thing and ship it, with no point where you take it back to check. Read as Defer.');
      if (inspect) return verdict("Delegate", 'You asked the AI to "' + firstWord + '" a draft and said you would review it ("' + inspect.phrase + '"). The thinking is shared and the check stays with you.');
      return verdict("Delegate", 'You asked the AI to "' + firstWord + '" a bounded piece of work. That reads as Delegate: a defined output you would normally inspect before it ships.');
    }
    // 5. Phrase-based delegate.
    var deleg = findFirst(t, DELEGATE);
    if (deleg) {
      if (inspect) return verdict("Delegate", 'You asked for a "' + deleg.phrase + '" and said you would review it ("' + inspect.phrase + '"). The thinking is shared and the check stays with you.');
      return verdict("Delegate", 'You asked the AI to "' + deleg.phrase + '" a bounded piece of work. That reads as Delegate: a defined output you would normally inspect before it ships.');
    }
    // 6. Residual defer phrase.
    if (deferPhrase) return verdict("Defer", 'The task leans on "' + deferPhrase.phrase + '" without a point where you take the decision back. Read as Defer.');
    // 7. Ambiguous: honest default, invite the override.
    return verdict("Delegate", 'The task does not state who keeps the judgment, so this is read as Delegate by default: a bounded ask you would still check. If the call was actually yours, or fully the model\u2019s, mark it.');
  }

  /* ---------- derived ---------- */
  function deferRatio() {
    var n = state.entries.length;
    if (!n) return { pct: 0, n: 0 };
    var d = 0;
    for (var i = 0; i < n; i++) if (state.entries[i].category === "Defer") d++;
    return { pct: Math.round((d / n) * 100), n: n, d: d };
  }
  function relTime(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    var m = Math.floor(s / 60); if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
    var h = Math.floor(m / 60); if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.floor(h / 24); if (d < 7) return d + (d === 1 ? " day ago" : " days ago");
    var dt = new Date(ts);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  /* ---------- view state ---------- */
  var view = { screen: "capture", pending: null, logged: null, overriding: false };

  var root = document.getElementById("app");
  var navCapture = document.getElementById("nav-capture");
  var navHistory = document.getElementById("nav-history");

  function go(screen) {
    view.screen = screen;
    if (screen === "capture") { view.pending = null; view.logged = null; view.overriding = false; }
    render();
    window.scrollTo(0, 0);
  }

  function setNav() {
    var onHistory = view.screen === "history";
    navHistory.classList.toggle("on", onHistory);
    navCapture.classList.toggle("on", !onHistory);
  }

  /* ---------- weight indicator (form, not color) ---------- */
  function scaleHTML(pos, animateFrom) {
    var from = animateFrom == null ? pos : animateFrom;
    return '' +
      '<div class="scale" role="img" aria-label="Position on a scale from you hold the thinking to AI holds the thinking">' +
        '<div class="scale-poles"><span>You hold the thinking</span><span>AI holds the thinking</span></div>' +
        '<div class="scale-track">' +
          '<i class="notch" style="left:16%"></i>' +
          '<i class="notch" style="left:50%"></i>' +
          '<i class="notch" style="left:84%"></i>' +
          '<i class="scale-fill-bar" style="width:' + (from * 100) + '%"></i>' +
          '<i class="weight" style="left:' + (from * 100) + '%"></i>' +
        '</div>' +
        '<div class="scale-ticks">' +
          tick("Direct", 16, pos) + tick("Delegate", 50, pos) + tick("Defer", 84, pos) +
        '</div>' +
      '</div>';
  }
  function tick(label, left, pos) {
    var active = Math.abs(left / 100 - pos) < 0.02;
    return '<span class="ti' + (active ? " on" : "") + '" style="left:' + left + '%">' + label + '</span>';
  }

  /* ---------- screens ---------- */
  function render() {
    setNav();
    if (view.screen === "capture") return renderCapture();
    if (view.screen === "classify") return renderClassify();
    if (view.screen === "history") return state.entries.length ? renderHistory() : renderEmpty();
  }

  function renderCapture() {
    root.className = "screen screen-capture";
    root.innerHTML =
      '<div class="capture-inner">' +
        '<div class="cap-top">' +
          '<p class="instruction">What were you about to hand to AI?</p>' +
          '<p class="instruction-sub">Type the task in your own words. Centaur reads who keeps the thinking.</p>' +
        '</div>' +
        '<form id="cap-form" class="cap-form">' +
          '<textarea id="task" class="task" rows="3" placeholder="e.g. Decide which of these three vendors we should sign." aria-label="The task you were about to hand to AI"></textarea>' +
          '<button type="submit" id="classify-btn" class="btn btn-primary btn-lg" disabled>Classify this handoff</button>' +
        '</form>' +
      '</div>';

    var ta = document.getElementById("task");
    var btn = document.getElementById("classify-btn");
    var form = document.getElementById("cap-form");
    function grow() { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 320) + "px"; btn.disabled = ta.value.trim().length < 4; }
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var task = ta.value.trim();
      if (task.length < 4) return;
      view.pending = { task: task, result: classify(task) };
      go("classify");
    });
    setTimeout(function () { ta.focus(); }, 30);
  }

  function renderClassify() {
    root.className = "screen screen-classify";
    var p = view.pending;
    if (!p) { go("capture"); return; }

    if (view.logged) return renderLogged();

    var r = p.result;
    root.innerHTML =
      '<div class="verdict" aria-live="polite">' +
        '<p class="verdict-kicker">Reading</p>' +
        '<h1 class="verdict-cat">' + r.category + '</h1>' +
        '<p class="verdict-meaning">' + esc(CATS[r.category].meaning) + '</p>' +
        scaleHTML(r.pos, 0.5) +
        '<div class="block">' +
          '<p class="block-label">Evidence</p>' +
          '<p class="block-body">' + r.evidence + '</p>' +
        '</div>' +
        '<div class="block">' +
          '<p class="block-label">A way to keep more of the thinking</p>' +
          '<p class="block-body">' + esc(r.action) + '</p>' +
        '</div>' +
        '<div class="verdict-task">From: <span>' + esc(p.task) + '</span></div>' +
        '<div class="verdict-actions" id="vactions">' +
          '<button class="btn btn-primary" id="accept">Log this reading</button>' +
          '<button class="btn btn-ghost" id="override">Mark this classification as wrong</button>' +
        '</div>' +
        '<div class="override-panel" id="opanel" hidden>' +
          '<p class="block-label">What was it, actually?</p>' +
          '<div class="override-opts">' +
            '<button class="ov-opt" data-cat="Direct">Direct</button>' +
            '<button class="ov-opt" data-cat="Delegate">Delegate</button>' +
            '<button class="ov-opt" data-cat="Defer">Defer</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // animate the weight to position
    requestAnimationFrame(function () {
      var bar = root.querySelector(".scale-fill-bar");
      var w = root.querySelector(".weight");
      if (w) { w.style.left = (r.pos * 100) + "%"; bar.style.width = (r.pos * 100) + "%"; }
    });

    document.getElementById("accept").addEventListener("click", function () { logEntry(r.category, false, null); });
    var opanel = document.getElementById("opanel");
    document.getElementById("override").addEventListener("click", function () {
      view.overriding = true; opanel.hidden = false; opanel.scrollIntoView ? null : null;
      this.disabled = true; this.classList.add("is-done");
    });
    Array.prototype.forEach.call(root.querySelectorAll(".ov-opt"), function (b) {
      b.addEventListener("click", function () { logEntry(b.getAttribute("data-cat"), true, r.category); });
    });
  }

  function logEntry(category, overridden, correctedFrom) {
    var p = view.pending;
    var entry = {
      id: Date.now() + "" + Math.floor(Math.random() * 1000),
      ts: Date.now(),
      task: p.task,
      category: category,
      evidence: p.result.evidence,
      action: CATS[category].action,
      overridden: !!overridden,
      correctedFrom: correctedFrom || null
    };
    state.entries.unshift(entry);
    save();
    view.logged = entry;
    render();
    window.scrollTo(0, 0);
  }

  function renderLogged() {
    var e = view.logged;
    root.className = "screen screen-logged";
    root.innerHTML =
      '<div class="logged">' +
        '<p class="logged-mark">Logged</p>' +
        '<h2 class="logged-cat">' + e.category + (e.overridden ? '<span class="corr"> (you corrected this from ' + e.correctedFrom + ')</span>' : '') + '</h2>' +
        '<p class="logged-note">It is in your local history. Nothing left this device.</p>' +
        '<div class="verdict-actions">' +
          '<button class="btn btn-primary" id="again">New handoff</button>' +
          '<button class="btn btn-ghost" id="tohist">View history</button>' +
        '</div>' +
      '</div>';
    document.getElementById("again").addEventListener("click", function () { go("capture"); });
    document.getElementById("tohist").addEventListener("click", function () { go("history"); });
  }

  function renderEmpty() {
    root.className = "screen screen-empty";
    root.innerHTML =
      '<div class="empty">' +
        '<p class="empty-kicker">Before you start</p>' +
        '<h1 class="empty-title">Three ways to hand work to AI.</h1>' +
        '<p class="empty-lead">Centaur reads each handoff and tells you who kept the thinking. It reports a reading. It does not score you.</p>' +
        '<div class="defs">' +
          def("Direct", CATS.Direct.meaning, 0.16) +
          def("Delegate", CATS.Delegate.meaning, 0.50) +
          def("Defer", CATS.Defer.meaning, 0.84) +
        '</div>' +
        '<button class="btn btn-primary btn-lg" id="start">Classify this handoff</button>' +
      '</div>';
    document.getElementById("start").addEventListener("click", function () { go("capture"); });
  }
  function def(name, meaning, pos) {
    return '<div class="def">' +
      '<div class="def-mini"><i class="mini-track"></i><i class="mini-w" style="left:' + (pos * 100) + '%"></i></div>' +
      '<h3 class="def-name">' + name + '</h3>' +
      '<p class="def-text">' + esc(meaning) + '</p>' +
    '</div>';
  }

  function renderHistory() {
    root.className = "screen screen-history";
    var dr = deferRatio();
    var driftCard = state.showDrift
      ? '<div class="drift">' +
          '<p class="drift-kicker">Drift indicator</p>' +
          '<div class="drift-num" id="driftnum">0%</div>' +
          '<p class="drift-say">' + dr.pct + (dr.pct === 1 ? "%" : "%") + ' of your ' + dr.n + ' logged handoff' + (dr.n === 1 ? "" : "s") + ' ' + (dr.n === 1 ? "was a Defer." : "were Defers.") + '</p>' +
        '</div>'
      : '<div class="drift drift-off">' +
          '<p class="drift-kicker">Drift indicator</p>' +
          '<p class="drift-say">The drift indicator is off. Centaur still classifies and logs; it just stops surfacing the running ratio.</p>' +
        '</div>';

    var rows = state.entries.map(function (e) {
      return '<li class="row">' +
        '<span class="row-mini"><i class="mini-track"></i><i class="mini-w" style="left:' + (CATS[e.category].pos * 100) + '%"></i></span>' +
        '<span class="row-main"><span class="row-cat">' + e.category + (e.overridden ? '<span class="row-corr"> corrected</span>' : '') + '</span>' +
        '<span class="row-task">' + esc(e.task) + '</span></span>' +
        '<span class="row-time">' + relTime(e.ts) + '</span>' +
      '</li>';
    }).join("");

    root.innerHTML =
      '<div class="history">' +
        driftCard +
        '<div class="drift-controls">' +
          '<label class="toggle"><span class="toggle-label">Show drift indicator</span>' +
            '<button class="switch" id="driftToggle" role="switch" aria-checked="' + state.showDrift + '"><i></i></button>' +
          '</label>' +
          '<div class="hist-tools">' +
            '<button class="btn btn-ghost btn-sm" id="export">Export your history</button>' +
            '<button class="btn btn-ghost btn-sm" id="clear">Clear</button>' +
          '</div>' +
        '</div>' +
        '<p class="log-label">Log <span class="hr-num">' + state.entries.length + ' handoff' + (state.entries.length === 1 ? "" : "s") + '</span></p>' +
        '<ul class="log">' + rows + '</ul>' +
      '</div>';

    if (state.showDrift) animateNum(document.getElementById("driftnum"), dr.pct);

    document.getElementById("driftToggle").addEventListener("click", function () {
      state.showDrift = !state.showDrift; save(); render();
    });
    document.getElementById("export").addEventListener("click", exportHistory);
    document.getElementById("clear").addEventListener("click", function () {
      if (confirm("Clear all local history? This cannot be undone.")) { state.entries = []; save(); render(); }
    });
  }

  function animateNum(el, target) {
    if (!el) return;
    var t0 = performance.now(), dur = 700;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e) + "%";
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function exportHistory() {
    var blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), entries: state.entries }, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "centaur-history.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- nav ---------- */
  navCapture.addEventListener("click", function (e) { e.preventDefault(); go("capture"); });
  navHistory.addEventListener("click", function (e) { e.preventDefault(); go("history"); });

  /* ---------- boot ---------- */
  // First-time users (no history) land on the teaching empty state.
  try {
    view.screen = state.entries.length ? "capture" : "history";
    render();
  } catch (err) {
    if (root) root.innerHTML = '<pre style="padding:24px;color:#b00;white-space:pre-wrap;font:13px monospace">BOOT ERROR: ' + (err && err.message) + '\n\n' + (err && err.stack) + '</pre>';
  }
})();
