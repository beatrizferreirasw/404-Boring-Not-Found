/* ==========================================================================
   Sing It! — karaoke engine
   --------------------------------------------------------------------------
   • Player built on the <audio> element (the song set in song.config.js).
   • LRC lyrics: parse, highlight + fill the current line, export.
   • Optional mic scoring (Web Audio analyser, nothing is recorded or sent).
   • A tap-along timing tool to create LRC timings from plain lyrics.
   • At the end of the song: the collectible-ticket reveal.
   ========================================================================== */
(function () {
  "use strict";
  const { sfx, fx, toast, store, wireLinks } = window.Arcade;
  const { t: tr, pick } = window.I18n; // UI text only — lyrics and song title are never translated
  const SONG = window.KARAOKE_SONG;
  const DEFAULT_LRC = (window.KARAOKE_LYRICS || "").trim();
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const isInst = (text) => !text || /^[♪♫🎸]/.test(text);

  /* ================================================================ LRC */
  function parseLRC(text, duration) {
    const timed = [], untimed = [];
    for (const raw of String(text).split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      if (/^\[[a-z]+:.*\]$/i.test(line)) continue; // [ti:..] metadata
      const stamps = [...line.matchAll(/\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
      const txt = line.replace(/\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]/g, "").trim();
      if (!stamps.length) { untimed.push(txt); continue; }
      for (const s of stamps) timed.push({ t: +s[1] * 60 + parseFloat(s[2].replace(":", ".")) + (SONG.offset || 0), text: txt });
    }
    if (timed.length) return timed.sort((a, b) => a.t - b.t);
    // Plain text with no timings: spread it evenly so it still scrolls (use "Sync timings" for accuracy).
    const start = 12, end = Math.max(start + 10, duration - 60);
    return untimed.map((text, i) => ({ t: start + (i * (end - start)) / Math.max(1, untimed.length), text }));
  }

  function toLRC(lines) {
    const stamp = (t) => {
      t = Math.max(0, t - (SONG.offset || 0));
      return `[${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}]`;
    };
    return [`[ti:${SONG.title}]`, `[ar:${SONG.artist}]`, ...lines.map((l) => `${stamp(l.t)}${l.text}`)].join("\n");
  }

  /* ============================================================ player */
  const audio = new Audio();
  audio.preload = "auto";
  let mode = "none";            // "none" | "audio"
  let audioLabel = "";
  // The lyric-timing tool is for the site owner only: it appears on localhost with ?setup.
  const isLocalDev = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const devTools = isLocalDev && new URLSearchParams(location.search).has("setup");

  const player = {
    get duration() { return mode === "audio" && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : SONG.duration; },
    get time() { return mode === "audio" ? audio.currentTime : 0; },
    get playing() { return mode === "audio" && !audio.paused; },
    play() {
      if (mode === "audio") return audio.play().catch(() => toast(tr("k.tTapPlay")));
    },
    pause() { if (mode === "audio") audio.pause(); },
    seek(t) {
      t = clamp(t, 0, player.duration - 0.05);
      if (mode === "audio") audio.currentTime = t;
    },
  };

  function useAudioUrl(url, label) {
    mode = "audio"; audioLabel = label;
    audio.src = url;
    audio.load();
  }

  audio.addEventListener("loadedmetadata", () => { buildFrets(); $("time-total").textContent = fmt(player.duration); });
  audio.addEventListener("ended", () => finish());
  audio.addEventListener("error", () => {
    if (mode !== "audio" || !audio.getAttribute("src")) return;
    toast(tr("k.loadFail"), 4000);
    mode = "none"; refreshStart(); showStart();
  });

  /* ============================================================ lyrics */
  let lines = [];
  let currentIdx = -2;
  const ol = $("lyrics");

  function loadLyrics() {
    const saved = devTools ? store.get("karaoke-lrc", null) : null;
    lines = parseLRC(saved || DEFAULT_LRC, SONG.duration);
    renderLyrics();
  }

  function renderLyrics() {
    ol.innerHTML = lines.length
      ? lines.map((l) => `<li class="${isInst(l.text) ? "inst" : ""}"><span class="txt">${escapeHtml(l.text || "♪ ♪ ♪")}</span></li>`).join("")
      : `<li class="current inst" lang="${window.I18n.lang}"><span class="txt">${escapeHtml(tr("k.addLyrics"))}</span></li>`;
    currentIdx = -2;
  }
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function indexAt(t) {
    let lo = 0, hi = lines.length - 1, ans = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (lines[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
    return ans;
  }

  function setCurrent(idx) {
    if (idx === currentIdx || !lines.length) return;
    const prev = currentIdx;
    currentIdx = idx;
    const items = ol.children;
    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      li.classList.toggle("current", i === idx);
      li.classList.toggle("past", i < idx);
      li.classList.toggle("near", Math.abs(i - idx) === 1);
      if (i !== idx) li.style.removeProperty("--p");
    }
    const target = items[Math.max(0, idx)];
    if (target) ol.style.transform = `translateY(${-(target.offsetTop + target.offsetHeight / 2)}px)`;
    if (idx >= 0) $("lyric-live").textContent = lines[idx].text;
    onLineChange(prev, idx);
  }

  /* =========================================================== scoring */
  const game = { score: 0, streak: 1, hype: 0, lineSung: 0, lineTime: 0, linesSung: 0, linesTotal: 0, listened: 0, finished: false };
  const mic = { on: false, ctx: null, analyser: null, buf: null, level: 0, stream: null };

  function resetGame() {
    Object.assign(game, { score: 0, streak: 1, hype: 0, lineSung: 0, lineTime: 0, linesSung: 0, linesTotal: 0, listened: 0, finished: false });
    renderHud();
  }

  function onLineChange(prev, idx) {
    if (prev >= 0 && lines[prev] && !isInst(lines[prev].text) && game.lineTime > 0.5) {
      game.linesTotal++;
      const sung = mic.on ? game.lineSung / game.lineTime >= 0.3 : true;
      if (sung) { game.linesSung++; game.streak = Math.min(mic.on ? 8 : 4, game.streak + 1); bump("streak"); }
      else game.streak = 1;
    }
    game.lineSung = 0; game.lineTime = 0;
  }

  function readMic() {
    if (!mic.on) return 0;
    mic.analyser.getFloatTimeDomainData(mic.buf);
    let sum = 0;
    for (let i = 0; i < mic.buf.length; i++) sum += mic.buf[i] * mic.buf[i];
    const rms = Math.sqrt(sum / mic.buf.length);
    mic.level = mic.level * 0.7 + clamp((rms - 0.012) * 14) * 0.3;
    $("mic").style.setProperty("--lvl", mic.level.toFixed(2));
    return mic.level;
  }

  async function toggleMic() {
    if (mic.on) {
      mic.stream.getTracks().forEach((t) => t.stop());
      mic.ctx.close(); mic.on = false;
      $("mic").setAttribute("aria-pressed", "false");
      toast(tr("k.tMicOff"));
      return;
    }
    try {
      mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      mic.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = mic.ctx.createMediaStreamSource(mic.stream);
      mic.analyser = mic.ctx.createAnalyser(); mic.analyser.fftSize = 1024;
      mic.buf = new Float32Array(mic.analyser.fftSize);
      src.connect(mic.analyser);
      mic.on = true;
      $("mic").setAttribute("aria-pressed", "true");
      toast(tr("k.tMicOn"), 3500);
    } catch (e) {
      toast(tr("k.tMicNA"), 3500);
    }
  }

  function scoreTick(dt, t) {
    const line = lines[currentIdx];
    const singing = line && !isInst(line.text) && t - line.t < 12;
    const level = readMic();
    if (singing) {
      game.lineTime += dt;
      if (mic.on) {
        if (level > 0.12) { game.lineSung += dt; game.score += dt * 100 * game.streak * (0.5 + level); }
      } else {
        game.score += dt * 40 * game.streak;
      }
    }
    const target = mic.on ? level * 100 : (singing ? 70 + 22 * Math.sin(t * 2.2) : 30 + 10 * Math.sin(t * 0.9));
    game.hype += (target - game.hype) * Math.min(1, dt * 4);
  }

  let shownScore = -1, shownStreak = -1;
  function renderHud() {
    const s = Math.floor(game.score);
    if (s !== shownScore) { $("score").textContent = s.toLocaleString(); shownScore = s; }
    if (game.streak !== shownStreak) { $("streak").textContent = `×${game.streak}`; shownStreak = game.streak; }
    $("hype").style.width = `${clamp(game.hype, 0, 100).toFixed(1)}%`;
    $("hype-meter").setAttribute("aria-valuenow", String(Math.round(game.hype)));
  }
  function bump(id) { const el = $(id); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }

  /* ============================================================== loop */
  let last = performance.now();
  let seeking = false;
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = player.time;
    const d = player.duration;
    const playing = player.playing;
    document.body.classList.toggle("playing", playing);
    if (!playing && document.body.classList.contains("idle")) document.body.classList.remove("idle");
    $("play").setAttribute("aria-label", tr(playing ? "k.pause" : "k.play"));

    setCurrent(indexAt(t));
    const line = lines[currentIdx];
    if (line && !isInst(line.text)) {
      const next = lines[currentIdx + 1];
      const span = (next ? next.t : d) - line.t;
      const dur = Math.min(span, Math.max(2.5, line.text.length * 0.11));
      const li = ol.children[currentIdx];
      if (li) li.style.setProperty("--p", `${(clamp((t - line.t) / dur) * 100).toFixed(1)}%`);
    }

    if (playing && !syncing) scoreTick(dt, t);
    // Only real-time listening of the actual song counts towards the prize: skipping ahead earns nothing.
    if (playing && !syncing && mode === "audio") game.listened += dt;
    renderHud();

    if (!seeking) {
      $("seek").value = String(Math.round((t / d) * 1000));
      $("neck-fill").style.width = `${clamp(t / d) * 100}%`;
      $("time-now").textContent = fmt(t);
    }
    $("time-total").textContent = fmt(d);

    requestAnimationFrame(tick);
  }

  /* ========================================================== controls */
  function togglePlay() {
    sfx.unlock();
    if (mode === "none") return showStart();
    if (game.finished) { resetGame(); player.seek(0); }
    player.playing ? player.pause() : player.play();
  }
  $("play").addEventListener("click", togglePlay);
  $("restart").addEventListener("click", () => { resetGame(); player.seek(0); currentIdx = -2; if (mode !== "none") player.play(); });
  $("mic").addEventListener("click", toggleMic);
  if (!SONG.micScoring || !navigator.mediaDevices) $("mic").hidden = true;

  const seek = $("seek");
  seek.addEventListener("input", () => {
    seeking = true;
    const t = (seek.value / 1000) * player.duration;
    $("time-now").textContent = fmt(t);
    $("neck-fill").style.width = `${seek.value / 10}%`;
    player.seek(t);
  });
  seek.addEventListener("change", () => { seeking = false; });
  seek.addEventListener("pointerup", () => { seeking = false; });

  const vol = $("volume");
  vol.value = String(store.get("karaoke-volume", 85));
  audio.volume = vol.value / 100;
  vol.addEventListener("input", () => { audio.volume = vol.value / 100; audio.muted = false; store.set("karaoke-volume", +vol.value); updateVolIcon(); });
  $("vol-btn").addEventListener("click", () => { audio.muted = !audio.muted; updateVolIcon(); });
  function updateVolIcon() {
    const off = audio.muted || +vol.value === 0;
    $("vol-btn").setAttribute("aria-label", tr(off ? "k.unmute" : "k.mute"));
    $("vol-btn").innerHTML = off
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.key === "f" || e.key === "F") { toggleFullscreen(); return; }
    if (e.target.closest("button, select, label") && e.code === "Space") return;
    if ($("setup").open || !$("reveal").hidden) return;
    if (e.code === "Space" || e.key === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "ArrowRight") player.seek(player.time + 5);
    else if (e.key === "ArrowLeft") player.seek(player.time - 5);
    else if (e.key === "m" || e.key === "M") { audio.muted = !audio.muted; updateVolIcon(); }
  });

  /* ---------------- TV mode: full screen + controls that hide while singing */
  const fsBtn = $("fs-btn");
  const FS_ENTER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const FS_EXIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  function toggleFullscreen() {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }
  function updateFsButton() {
    const on = !!document.fullscreenElement;
    fsBtn.innerHTML = on ? FS_EXIT : FS_ENTER;
    fsBtn.setAttribute("aria-label", tr(on ? "k.exitFullscreen" : "k.fullscreen"));
    fsBtn.setAttribute("title", tr(on ? "k.exitFullscreen" : "k.fullscreen"));
  }
  if (document.fullscreenEnabled) {
    fsBtn.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFsButton);
  } else {
    fsBtn.hidden = true; // e.g. iPhone Safari
  }

  let idleTimer = 0;
  function wake() {
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      const busy = $("setup").open || !$("reveal").hidden || !$("start").hidden || syncing;
      if (player.playing && !busy) document.body.classList.add("idle");
    }, 3000);
  }
  ["pointermove", "pointerdown", "keydown", "touchstart", "wheel"].forEach((ev) => addEventListener(ev, wake, { passive: true }));

  /* guitar-neck progress bar: real fret spacing, inlay dots */
  function buildFrets() {
    const N = 15, total = 1 - Math.pow(2, -N / 12);
    const pos = (n) => ((1 - Math.pow(2, -n / 12)) / total) * 100;
    let html = "";
    for (let n = 1; n < N; n++) html += `<i style="left:${pos(n).toFixed(2)}%"></i>`;
    for (const n of [3, 5, 7, 9, 12, 15]) {
      const x = (pos(n - 1) + pos(n)) / 2;
      html += n === 12 ? `<b style="left:${x}%;top:30%"></b><b style="left:${x}%;top:70%"></b>` : `<b style="left:${x}%"></b>`;
    }
    $("frets").innerHTML = html;
  }

  /* ====================================================== start screen */
  function showStart() { $("start").classList.remove("hide"); $("start").hidden = false; refreshStart(); }
  function hideStart() { $("start").classList.add("hide"); setTimeout(() => { if ($("start").classList.contains("hide")) $("start").hidden = true; }, 400); }

  function refreshStart() {
    const hasAudio = mode === "audio";
    $("start-play").hidden = !hasAudio;
    $("start-foot").textContent = hasAudio ? "" : tr("k.loadFail");
  }

  $("start-song").textContent = `“${SONG.title}”`;
  $("start-play").addEventListener("click", () => { sfx.click(); hideStart(); resetGame(); player.play(); setTimeout(wake, 450); });

  /* ============================================================= setup */
  const dlg = $("setup");
  let syncing = false, syncLines = [], syncTimes = [], syncOld = [], syncKept = [];
  const STAMP = /\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/;
  const parseClock = (v) => {
    v = String(v).trim();
    const m = v.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);
    if (m) return +m[1] * 60 + parseFloat(m[2]);
    return /^\d+(\.\d+)?$/.test(v) ? parseFloat(v) : NaN;
  };

  if (devTools) {
    $("setup-btn").hidden = false;
    $("setup-btn").addEventListener("click", () => {
      player.pause();
      $("lyrics-input").value = store.get("karaoke-lrc", null) || DEFAULT_LRC;
      $("sync-from").value = fmt(player.time);
      dlg.showModal();
    });
  }
  dlg.querySelector("[data-close]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => { if (syncing) stopSync(false); });


  function applyLyrics(text, quiet) {
    lines = parseLRC(text, player.duration);
    store.set("karaoke-lrc", text);
    renderLyrics();
    if (!quiet) toast(tr("k.tLyricsSaved", { n: lines.length }));
  }
  $("apply-lyrics").addEventListener("click", () => applyLyrics($("lyrics-input").value));
  $("reset-lyrics").addEventListener("click", () => {
    $("lyrics-input").value = DEFAULT_LRC;
    try { localStorage.removeItem("arcade:karaoke-lrc"); } catch (e) { /* ignore */ }
    lines = parseLRC(DEFAULT_LRC, player.duration); renderLyrics();
    toast(tr("k.tReset"));
  });
  $("lrc-file").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    $("lyrics-input").value = await f.text();
    toast(tr("k.tImported"));
  });
  $("export-lrc").addEventListener("click", () => {
    // Downloads a complete, ready-to-use lyrics.js: replace karaoke/lyrics.js with it.
    const parsed = parseLRC($("lyrics-input").value, player.duration);
    const lrc = toLRC(parsed).replace(/`/g, "’").replace(/\$\{/g, "$ {");
    const file = "/* Sing It! — lyrics (LRC). Generated by the timing tool (karaoke/?setup on localhost). */\n" +
      "window.KARAOKE_LYRICS = String.raw`\n" + lrc + "\n`;\n";
    const blob = new Blob([file], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "lyrics.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  /* tap-along timing tool */
  $("sync-start").addEventListener("click", () => {
    if (mode !== "audio") { toast(tr("k.tChooseFirst"), 3500); return; }
    const from = parseClock($("sync-from").value || "0");
    if (!isFinite(from) || from < 0) { toast(tr("k.tBadTime")); return; }
    // Every lyric line with its old time (if it had one). Lines timed before `from`
    // are kept as they are; you tap from the first line at or after `from`.
    const all = $("lyrics-input").value.split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !/^\[[a-z]+:.*\]$/i.test(l))
      .map((l) => {
        const m = l.match(STAMP);
        return { t: m ? +m[1] * 60 + parseFloat(m[2].replace(":", ".")) + (SONG.offset || 0) : null, text: l.replace(new RegExp(STAMP.source, "g"), "").trim() };
      });
    if (!all.length) { toast(tr("k.tPasteFirst")); return; }
    let first = from > 0 ? all.findIndex((l) => l.t === null || l.t >= from) : 0;
    if (first < 0) first = all.length;
    syncKept = all.slice(0, first).filter((l) => l.t !== null);
    syncOld = all.slice(first);
    syncLines = syncOld.map((l) => l.text);
    if (!syncLines.length) { toast(tr("k.tNothingAfter")); return; }
    syncTimes = []; syncing = true;
    $("sync").hidden = false;
    updateSync();
    player.seek(from); player.play();
    $("sync-tap").focus();
  });
  function updateSync() {
    $("sync-line").textContent = syncLines[syncTimes.length] || tr("k.syncAllDone");
    $("sync-progress").textContent = tr("k.syncProgress", { a: syncTimes.length, b: syncLines.length, time: fmt(player.time) });
  }
  function syncTap() { if (syncTimes.length < syncLines.length) { syncTimes.push(player.time); sfx.click(); updateSync(); } }
  function syncUndo() { syncTimes.pop(); updateSync(); }
  function stopSync(apply) {
    syncing = false; player.pause(); $("sync").hidden = true;
    if (!apply) return;
    const tapped = syncTimes.map((t, i) => ({ t: t + (SONG.offset || 0), text: syncLines[i] }));
    const untouched = syncOld.slice(syncTimes.length).filter((l) => l.t !== null && (!tapped.length || l.t > tapped[tapped.length - 1].t));
    const timed = [...syncKept, ...tapped, ...untouched].sort((a, b) => a.t - b.t);
    const text = toLRC(timed);
    $("lyrics-input").value = text;
    applyLyrics(text, true);
    const missing = syncLines.length - syncTimes.length - untouched.length;
    toast(missing > 0 ? tr("k.tSyncMissing", { n: timed.length, m: missing }) : tr("k.tSyncAll", { n: timed.length }), 4000);
  }
  $("sync-tap").addEventListener("click", syncTap);
  $("sync-undo").addEventListener("click", syncUndo);
  $("sync-done").addEventListener("click", () => stopSync(true));
  dlg.addEventListener("keydown", (e) => {
    if (!syncing || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); syncTap(); }
    else if (e.key === "Backspace") { e.preventDefault(); syncUndo(); }
  });
  setInterval(() => { if (syncing) updateSync(); }, 250);

  /* ===================================================== the surprise */
  /* The collectible is earned ONLY by singing the song to the end
     (dragging the progress bar to the end doesn't count). */
  const REQUIRED_LISTEN = 0.85; // share of the song that must actually be played
  function finish({ preview = false } = {}) {
    if (syncing) { stopSync(true); return; }
    if (game.finished) return;
    game.finished = true;
    onLineChange(currentIdx, -1);
    player.pause();

    const earned = mode === "audio" && game.listened >= player.duration * REQUIRED_LISTEN;
    if (!earned && !preview) return showNotEarned();

    const frac = game.linesTotal ? game.linesSung / game.linesTotal : 1;
    const stars = mic.on ? 1 + (frac > 0.35) + (frac > 0.7) : 3;
    const score = Math.floor(game.score);
    const item = preview ? window.Collectible.preview() : window.Collectible.unlock({ score });

    const reveal = $("reveal");
    ["stage-1", "stage-2", "stage-3"].forEach((id, i) => { $(id).hidden = i !== 0; });
    $("stage-miss").hidden = true;
    reveal.hidden = false;
    reveal.scrollTop = 0;
    $("final-score").textContent = score.toLocaleString();
    $("stars").innerHTML = [0, 1, 2].map((i) => `<span>${"★"}</span>`).join("");
    $("stars").setAttribute("aria-label", tr("k.stars", { n: stars }));

    sfx.cheer();
    fx.burst({ y: innerHeight * 0.35, count: 160 });
    [0, 1, 2].forEach((i) => setTimeout(() => {
      const s = $("stars").children[i];
      s.classList.add(i < stars ? "on" : "off");
      if (i < stars) sfx.good();
    }, 700 + i * 380));

    setTimeout(() => {
      $("stage-1").hidden = true;
      $("stage-2").hidden = false;
      sfx.shimmer();
      $("mystery").focus({ preventScroll: true });
    }, 3600);

    $("mystery").onclick = () => openMystery(item);
  }

  function showNotEarned() {
    const reveal = $("reveal");
    ["stage-1", "stage-2", "stage-3"].forEach((id) => { $(id).hidden = true; });
    $("stage-miss").hidden = false;
    reveal.hidden = false;
    reveal.scrollTop = 0;
    sfx.bad();
    $("miss-again").focus({ preventScroll: true });
  }

  function showRevealText() {
    const cfg = window.Collectible.config;
    $("reveal-headline").textContent = pick(cfg.revealHeadline) || "";
    $("reveal-message").textContent = pick(cfg.revealMessage) || "";
  }

  // When the language is switched mid-game, refresh the bits built in JavaScript.
  document.addEventListener("langchange", () => {
    refreshStart(); updateVolIcon(); updateFsButton();
    if (!lines.length) renderLyrics();
    if (!$("stage-3").hidden) showRevealText();
    if (syncing) updateSync();
  });

  function openMystery(item) {
    const card = $("mystery");
    if (card.classList.contains("shake")) return;
    card.onclick = null;
    card.classList.add("shake");
    [523, 587, 659, 784, 880, 988, 1175].forEach((f, i) => setTimeout(() => sfx.pluck(f, { vol: 0.35, dur: 0.6 }), i * 120));
    setTimeout(() => {
      card.classList.remove("shake");
      card.classList.add("open");
      sfx.whoosh();
    }, 950);
    setTimeout(() => {
      const flash = document.createElement("div");
      flash.className = "flash"; document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 1000);
      $("stage-2").hidden = true;
      $("stage-3").hidden = false;
      const cfg = window.Collectible.config;
      showRevealText();
      window.Collectible.render($("reveal-tickets"), item, { root: "../" });
      wireLinks($("stage-3"));
      sfx.fanfare();
      fx.burst({ x: innerWidth * 0.5, y: innerHeight * 0.4, count: 200, power: 16 });
      setTimeout(() => fx.burst({ x: innerWidth * 0.2, y: innerHeight * 0.5, count: 90 }), 400);
      setTimeout(() => fx.burst({ x: innerWidth * 0.8, y: innerHeight * 0.5, count: 90 }), 650);
      setTimeout(() => fx.rain({ count: 180 }), 1100);
    }, 1450);
  }

  $("miss-again").addEventListener("click", () => {
    $("reveal").hidden = true;
    $("stage-miss").hidden = true;
    resetGame(); currentIdx = -2;
    player.seek(0);
    if (mode === "audio") player.play(); else showStart();
  });

  $("again").addEventListener("click", () => {
    $("reveal").hidden = true;
    $("stage-miss").hidden = true;
    $("mystery").className = "mystery";
    resetGame(); currentIdx = -2;
    player.seek(0);
    if (mode === "none") showStart(); else player.play();
  });

  /* ======================================================== rain fx */
  function rain() {
    const c = $("rain"), g = c.getContext("2d");
    let drops = [];
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      c.width = innerWidth * dpr; c.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = Array.from({ length: Math.round(innerWidth / 9) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, l: 8 + Math.random() * 16, v: 6 + Math.random() * 8, o: 0.08 + Math.random() * 0.2 }));
    };
    resize(); addEventListener("resize", resize);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      g.clearRect(0, 0, innerWidth, innerHeight);
      g.lineWidth = 1;
      for (const d of drops) {
        g.strokeStyle = `rgba(180,200,255,${d.o})`;
        g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * 0.15, d.y + d.l); g.stroke();
        if (!still) { d.y += d.v; d.x -= d.v * 0.15; if (d.y > innerHeight) { d.y = -20; d.x = Math.random() * innerWidth * 1.1; } }
      }
      if (!still) requestAnimationFrame(draw);
    };
    draw();
  }

  /* ============================================================ init */
  async function init() {
    $("song-title").textContent = SONG.title;
    $("song-artist").textContent = `${SONG.artist} · ${SONG.album || ""}`;
    loadLyrics();
    buildFrets();
    updateVolIcon();
    rain();
    requestAnimationFrame(tick);

    useAudioUrl(SONG.audio, SONG.audio.split("/").pop()); // the embedded song
    refreshStart();

    // Developer preview of the ending (localhost only, never saves the collectible): karaoke/?finish
    if (isLocalDev && new URLSearchParams(location.search).has("finish")) { hideStart(); finish({ preview: true }); }
  }
  init();
})();
