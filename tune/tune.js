/* ==========================================================================
   Name That Tune — hear a clip, pick the title before the timer runs out.
   Clips: Apple Music 30-second previews via the public iTunes Search API.
   Song titles are always shown in the original (never translated).
   ========================================================================== */
(function () {
  "use strict";
  const { sfx, fx, store, toast } = window.Arcade;
  const { t } = window.I18n;
  const CFG = window.TUNE_CONFIG;
  const OPTIONS = Math.max(3, CFG.options || 4);
  const SECONDS = CFG.secondsPerRound || 15;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => String(s).toLowerCase().replace(/\s*[([].*?[)\]]/g, "").split(" - ")[0].replace(/[^a-z0-9]+/g, " ").trim();

  /* ------------------------------------------------------------ catalogue */
  let pool = []; // [{ title, url, art, album, link }]

  async function search(country) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(CFG.artist)}&entity=song&attribute=artistTerm&limit=200&country=${country}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).results || [];
  }

  // Prefer studio albums over live versions, singles and compilations.
  const albumScore = (name = "") => (/live|alchemy|bbc|knebworth|single|very best|money for nothing|private investigations/i.test(name) ? 1 : 0);

  async function loadCatalogue() {
    let results = [];
    for (const c of [CFG.country || "US", "US"]) {
      try { results = await search(c); if (results.length) break; } catch (e) { /* try the next store */ }
    }
    const artist = CFG.artist.toLowerCase();
    const best = new Map();
    for (const r of results) {
      if (!r.previewUrl || String(r.artistName).toLowerCase() !== artist) continue;
      const key = norm(r.trackName);
      const prev = best.get(key);
      if (!prev || albumScore(r.collectionName) < albumScore(prev.collectionName)) best.set(key, r);
    }
    pool = CFG.songs
      .map((title) => ({ title, r: best.get(norm(title)) }))
      .filter((x) => x.r)
      .map(({ title, r }) => ({
        title,
        url: r.previewUrl,
        art: (r.artworkUrl100 || "").replace("100x100", "300x300"),
        album: String(r.collectionName || "").replace(/\s*\((Remastered|Remaster).*?\)/i, ""),
        link: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${CFG.artist} ${title}`)}`,
      }));
    if (pool.length < OPTIONS) throw new Error("not enough songs");
  }

  /* ---------------------------------------------------------------- game */
  const audio = new Audio();
  audio.preload = "auto";
  const game = { rounds: [], i: 0, score: 0, correct: 0, answered: false, endsAt: 0, timer: 0 };
  const C = 2 * Math.PI * 44;
  $("bar").style.strokeDasharray = String(C);
  $("best").textContent = store.get("tune-best", 0).toLocaleString();

  function newGame() {
    const picks = shuffle(pool).slice(0, Math.min(CFG.rounds || 10, pool.length));
    game.rounds = picks.map((song) => ({ song, options: shuffle([song, ...shuffle(pool.filter((s) => s !== song)).slice(0, OPTIONS - 1)]) }));
    game.i = 0; game.score = 0; game.correct = 0;
    $("score").textContent = "0";
    $("intro").hidden = true; $("done").hidden = true; $("play").hidden = false;
    startRound();
  }

  function startRound() {
    const round = game.rounds[game.i];
    game.answered = false;
    $("round").textContent = `${game.i + 1}/${game.rounds.length}`;
    $("feedback").className = "feedback"; $("feedback").innerHTML = "";
    $("next").hidden = true;
    $("disc").classList.remove("show");
    $("art").src = round.song.art || "";
    $("options").innerHTML = round.options.map((s, k) =>
      `<li><button class="opt" type="button" style="--i:${k}" data-k="${k}"><kbd>${k + 1}</kbd><span>${esc(s.title)}</span></button></li>`).join("");
    playClip(round.song);
    game.endsAt = performance.now() + SECONDS * 1000;
    clearInterval(game.timer);
    game.timer = setInterval(tick, 100);
    tick();
    // warm up the next clip
    const next = game.rounds[game.i + 1];
    if (next) { const pre = new Audio(); pre.preload = "auto"; pre.src = next.song.url; }
  }

  function playClip(song) {
    audio.src = song.url;
    const go = () => {
      // jump to a random part of the 30-second preview
      const room = Math.max(0, (audio.duration || 30) - SECONDS - 1);
      audio.currentTime = Math.random() * room;
      audio.play().catch(() => toast(t("q.tapPlay"), 3000));
    };
    audio.addEventListener("loadedmetadata", go, { once: true });
    audio.load();
  }

  let lastWhole = -1;
  function tick() {
    if (game.answered) return;
    const left = Math.max(0, (game.endsAt - performance.now()) / 1000);
    const whole = Math.ceil(left);
    $("secs").textContent = String(whole);
    $("bar").style.strokeDashoffset = String(C * (1 - left / SECONDS));
    $("player").classList.toggle("warn", left <= SECONDS / 2 && left > 5);
    $("player").classList.toggle("danger", left <= 5);
    document.body.classList.toggle("playing", !audio.paused);
    if (whole !== lastWhole) {
      lastWhole = whole;
      if (whole <= 3 && whole > 0) sfx.hover();
      if (whole === 10 || whole === 5) $("timer-live").textContent = t("q.timer", { n: whole });
    }
    if (left <= 0) answer(-1);
  }

  function answer(k) {
    if (game.answered) return;
    game.answered = true;
    clearInterval(game.timer);
    const round = game.rounds[game.i];
    const rightK = round.options.indexOf(round.song);
    const left = Math.max(0, (game.endsAt - performance.now()) / 1000);
    const buttons = [...$("options").querySelectorAll(".opt")];
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === rightK) b.classList.add("right");
      else if (i === k) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    $("disc").classList.add("show");
    const fb = $("feedback");
    const info = `<small>${esc(t("q.from", { album: round.song.album }))}${round.song.link ? ` · <a href="${esc(round.song.link)}" target="_blank" rel="noopener">${esc(t("q.youtube"))}</a>` : ""}</small>`;
    if (k === rightK) {
      const pts = 100 + Math.round(left * 20);
      game.score += pts; game.correct++;
      $("score").textContent = game.score.toLocaleString();
      fb.className = "feedback good";
      fb.innerHTML = `<strong>${esc(t("q.right", { pts }))}</strong>${info}`;
      sfx.good();
      const r = buttons[k].getBoundingClientRect();
      fx.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 40, power: 8 });
    } else {
      fb.className = "feedback bad";
      fb.innerHTML = `<strong>${esc(t(k < 0 ? "q.timeup" : "q.wrong", { song: round.song.title }))}</strong>${info}`;
      sfx.bad();
    }
    const last = game.i === game.rounds.length - 1;
    $("next").textContent = t(last ? "q.finish" : "q.next");
    $("next").hidden = false;
    $("next").focus({ preventScroll: true });
  }

  function next() {
    if (game.i < game.rounds.length - 1) { game.i++; startRound(); return; }
    audio.pause();
    document.body.classList.remove("playing");
    $("play").hidden = true;
    const best = store.get("tune-best", 0);
    const record = game.score > best;
    if (record) { store.set("tune-best", game.score); $("best").textContent = game.score.toLocaleString(); }
    $("done-text").textContent = t("q.doneText", { c: game.correct, n: game.rounds.length, score: game.score.toLocaleString() }) + (record ? t("q.record") : "");
    $("done").hidden = false;
    sfx.win();
    fx.burst({ y: innerHeight * 0.4, shapes: ["note", "rect", "star"] });
  }

  /* -------------------------------------------------------------- inputs */
  $("options").addEventListener("click", (e) => { const b = e.target.closest(".opt"); if (b) answer(+b.dataset.k); });
  $("replay").addEventListener("click", () => {
    const round = game.rounds[game.i];
    if (!round) return;
    if (game.answered) { audio.currentTime = 0; audio.play().catch(() => {}); }
    else playClip(round.song);
  });
  $("next").addEventListener("click", next);
  $("again").addEventListener("click", () => { sfx.click(); newGame(); });
  document.addEventListener("keydown", (e) => {
    if ($("play").hidden) return;
    const k = "123456".indexOf(e.key);
    if (k >= 0 && k < OPTIONS && !game.answered) answer(k);
    else if (e.key === "Enter" && game.answered && document.activeElement !== $("next")) next();
  });
  document.addEventListener("langchange", () => {
    if (!$("next").hidden) $("next").textContent = t(game.i === game.rounds.length - 1 ? "q.finish" : "q.next");
  });

  /* ---------------------------------------------------------------- boot */
  let introState = "loading"; // loading | ready | fail
  function renderIntro() {
    $("intro-text").textContent = introState === "ready" ? t("q.ready", { n: pool.length }) : t(introState === "fail" ? "q.loadFail" : "q.loading");
    $("start").hidden = introState === "loading";
    $("start").textContent = t(introState === "fail" ? "q.retry" : "q.start");
  }
  async function boot() {
    introState = "loading"; renderIntro();
    try { await loadCatalogue(); introState = "ready"; } catch (e) { introState = "fail"; }
    renderIntro();
  }
  $("start").addEventListener("click", () => {
    sfx.unlock();
    if (introState === "ready") newGame(); else boot();
  });
  document.addEventListener("langchange", renderIntro);
  boot();
})();
