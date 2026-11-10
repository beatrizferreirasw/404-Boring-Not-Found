/* ==========================================================================
   arcade.js — shared helpers for every page (no build step, no dependencies)
   - Arcade.sfx   : tiny Web Audio sound-effect synth (no audio files needed)
   - Arcade.fx    : confetti / sparkle bursts on a canvas overlay
   - Arcade.toast : small notification
   - Smooth page transitions and a global mute toggle
   ========================================================================== */
(function () {
  "use strict";

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("arcade:" + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("arcade:" + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    },
  };

  /* ---------------------------------------------------------------- sound */
  let ctx = null;
  let master = null;
  let muted = store.get("muted", false);

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, type = "sine", dur = 0.15, vol = 0.3, at = 0, slide = 0, attack = 0.005 }) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise({ dur = 1, vol = 0.2, at = 0, filter = 1200, q = 0.7 }) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random());
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = filter; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  /** A soft plucked-string sound (simple Karplus–Strong). */
  function pluck(freq, { vol = 0.5, dur = 1.4, at = 0 } = {}) {
    const c = ac(); if (!c) return;
    const sr = c.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = c.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const period = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const next = (idx + 1) % period;
      const v = 0.497 * (ring[idx] + ring[next]);
      out[i] = ring[idx];
      ring[idx] = v;
      idx = next;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
    src.connect(lp).connect(g).connect(master);
    src.start(c.currentTime + at);
  }

  const sfx = {
    click() { tone({ freq: 660, type: "triangle", dur: 0.06, vol: 0.15 }); },
    hover() { tone({ freq: 1200, type: "sine", dur: 0.03, vol: 0.04 }); },
    flip() { tone({ freq: 380, type: "triangle", dur: 0.09, vol: 0.12, slide: 260 }); },
    good() { tone({ freq: 660, type: "triangle", dur: 0.12, vol: 0.18 }); tone({ freq: 990, type: "triangle", dur: 0.18, vol: 0.16, at: 0.08 }); },
    bad() { tone({ freq: 200, type: "sawtooth", dur: 0.22, vol: 0.08, slide: -80 }); },
    pluck,
    note(freq, dur = 0.5) { pluck(freq, { dur: Math.max(0.6, dur * 2) }); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.25, vol: 0.18, at: i * 0.11 }));
    },
    fanfare() {
      const seq = [[392, 0], [523, .14], [659, .28], [784, .42], [659, .62], [784, .76], [1046, .95]];
      seq.forEach(([f, at]) => {
        tone({ freq: f, type: "sawtooth", dur: 0.35, vol: 0.07, at });
        tone({ freq: f * 2, type: "triangle", dur: 0.35, vol: 0.06, at });
      });
      tone({ freq: 1046, type: "triangle", dur: 1.4, vol: 0.12, at: 0.95 });
      tone({ freq: 1318, type: "triangle", dur: 1.4, vol: 0.08, at: 0.95 });
    },
    shimmer() {
      for (let i = 0; i < 10; i++) tone({ freq: 1400 + Math.random() * 1600, type: "sine", dur: 0.25, vol: 0.05, at: i * 0.05 });
    },
    whoosh() { noise({ dur: 0.6, vol: 0.12, filter: 900, q: 0.4 }); },
    cheer() {
      noise({ dur: 3.2, vol: 0.18, filter: 1400, q: 0.5 });
      noise({ dur: 2.6, vol: 0.12, filter: 2600, q: 0.8, at: 0.2 });
      for (let i = 0; i < 18; i++) noise({ dur: 0.06, vol: 0.25, filter: 2000 + Math.random() * 1500, q: 2, at: 0.2 + Math.random() * 2.4 }); // claps
    },
    get muted() { return muted; },
    setMuted(m) {
      muted = !!m; store.set("muted", muted);
      if (master) master.gain.value = muted ? 0 : 0.5;
      document.querySelectorAll("[data-mute-toggle]").forEach(updateMuteButton);
    },
    unlock() { ac(); },
  };

  /* --------------------------------------------------------------- confetti */
  let canvas = null, g2d = null, parts = [], raf = 0;
  const COLORS = ["#ff3b52", "#e8c36a", "#4fd1ff", "#f6ead2", "#ffb347", "#ffffff"];

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.className = "fx-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    g2d = canvas.getContext("2d");
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      g2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); addEventListener("resize", resize);
  }

  function loop() {
    g2d.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      g2d.save();
      g2d.globalAlpha = Math.min(1, p.life / 40);
      g2d.translate(p.x, p.y); g2d.rotate(p.rot);
      g2d.fillStyle = p.color;
      if (p.shape === "star") {
        g2d.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? p.size * .45 : p.size;
          const a = (i / 10) * Math.PI * 2;
          g2d.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g2d.fill();
      } else if (p.shape === "note") {
        g2d.font = `${p.size * 2.2}px serif`;
        g2d.fillText(p.glyph, -p.size, p.size);
      } else {
        g2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * (0.6 + Math.abs(Math.sin(p.rot * 2))));
      }
      g2d.restore();
    }
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!parts.length) g2d.clearRect(0, 0, innerWidth, innerHeight);
  }

  const fx = {
    burst({ x = innerWidth / 2, y = innerHeight / 2, count = 120, spread = 1, power = 12, shapes = ["rect", "rect", "star"] } = {}) {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) count = Math.min(count, 24);
      ensureCanvas();
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random()) * power;
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        parts.push({
          x, y, vx: Math.cos(a) * s * spread, vy: Math.sin(a) * s - power * 0.35,
          g: 0.22, drag: 0.985, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          size: 6 + Math.random() * 8, life: 140 + Math.random() * 80,
          color: COLORS[Math.floor(Math.random() * COLORS.length)], shape,
          glyph: ["♪", "♫", "♬"][i % 3],
        });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    },
    rain({ count = 160 } = {}) {
      ensureCanvas();
      for (let i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6,
          vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, g: 0.05, drag: 0.995,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, size: 6 + Math.random() * 8,
          life: 400, color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: Math.random() < 0.2 ? "star" : "rect",
        });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    },
  };

  /* ------------------------------------------------------------------ toast */
  let toastEl = null, toastTimer = 0;
  function toast(msg, ms = 2600) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  /* ------------------------------------------------------------ mute button */
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
  function updateMuteButton(btn) {
    btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    const t = window.I18n ? window.I18n.t : (k) => (k === "sound.on" ? "Turn sound effects on" : "Turn sound effects off");
    btn.setAttribute("aria-label", t(muted ? "sound.on" : "sound.off"));
    btn.setAttribute("aria-pressed", String(muted));
  }

  /* ------------------------------------------------------ page transitions */
  function wireLinks(root = document) {
    root.querySelectorAll("a[data-nav]").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if ("onpagereveal" in window) { sfx.click(); return; } // native cross-document view transitions
        e.preventDefault();
        sfx.click();
        document.body.classList.add("leaving");
        setTimeout(() => { location.href = a.href; }, 260);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-mute-toggle]").forEach((btn) => {
      updateMuteButton(btn);
      btn.addEventListener("click", () => { sfx.setMuted(!muted); if (!muted) sfx.click(); });
    });
    wireLinks();
  });
  document.addEventListener("langchange", () => document.querySelectorAll("[data-mute-toggle]").forEach(updateMuteButton));
  // Restore the page if it comes back from the back/forward cache mid-fade.
  addEventListener("pageshow", () => document.body && document.body.classList.remove("leaving"));
  // Browsers only allow audio after a user gesture: warm up on the first one.
  addEventListener("pointerdown", () => sfx.unlock(), { once: true });

  window.Arcade = { sfx, fx, toast, store, wireLinks };
})();
