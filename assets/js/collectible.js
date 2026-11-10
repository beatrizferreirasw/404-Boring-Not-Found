/* ==========================================================================
   collectible.js — renders the personalised pair of concert tickets.
   Used by the karaoke reveal and by the printable keepsake page (ticket/).
   ========================================================================== */
(function () {
  "use strict";
  const cfg = window.COLLECTIBLE;
  const { store } = window.Arcade;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /** Returns the saved collectible, or null if it has not been unlocked yet. */
  function get() { return store.get("collectible", null); }

  /** Unlocks the collectible (once) and returns it. A unique serial is minted on first unlock. */
  function unlock(extra = {}) {
    const existing = get();
    if (existing) {
      if ((extra.score || 0) > (existing.score || 0)) { existing.score = extra.score; save(existing); }
      return existing;
    }
    let serial = cfg.serial;
    if (!serial || serial === "auto") {
      const rnd = new Uint32Array(1);
      (window.crypto || {}).getRandomValues ? crypto.getRandomValues(rnd) : (rnd[0] = Math.random() * 1e9);
      serial = `${cfg.serialPrefix}-1978-${String(rnd[0] % 10000).padStart(4, "0")}`;
    }
    const item = { serial, unlockedAt: new Date().toISOString(), score: extra.score || 0 };
    store.set("collectible", item);
    return item;
  }

  function save(item) { store.set("collectible", item); }

  /** A look at the tickets that is NOT saved (used for the localhost-only test preview). */
  function preview() {
    return get() || { serial: `${cfg.serialPrefix}-1978-0000`, unlockedAt: new Date().toISOString(), score: 0 };
  }

  /** Deterministic barcode bars from a string. */
  function barcode(text) {
    let x = 0, bars = "";
    let h = 2166136261;
    for (let i = 0; i < 46; i++) {
      h ^= text.charCodeAt(i % text.length) + i; h = Math.imul(h, 16777619) >>> 0;
      const w = 1 + (h % 3);
      if (i % 2 === 0) bars += `<rect x="${x}" width="${w}" height="40"/>`;
      x += w + 1;
    }
    return `<svg class="t-barcode" viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
  }

  const GUITAR = `<svg class="t-guitar" viewBox="0 0 120 300" aria-hidden="true">
    <rect x="54" y="20" width="12" height="170" rx="2" fill="#e9d3a6" stroke="#2b1a10" stroke-width="2"/>
    <path d="M50 4h20l4 22H46z" fill="#e9d3a6" stroke="#2b1a10" stroke-width="2"/>
    ${[40, 60, 80, 100, 120, 140, 160].map((y) => `<line x1="54" x2="66" y1="${y}" y2="${y}" stroke="#a88b5b" stroke-width="1.5"/>`).join("")}
    <path d="M60 170c-14 0-22 8-24 18-2 10-14 6-22 16-12 16-10 44 4 62 14 18 50 30 74 14 18-12 22-34 14-50-6-12-2-18 2-26 6-14-4-30-18-28-10 2-14-6-30-6z" fill="#d81f3a" stroke="#2b1a10" stroke-width="3"/>
    <path d="M44 200c10-8 30-8 40 0l-6 40c-10 8-22 8-32 0z" fill="#f6ead2" stroke="#2b1a10" stroke-width="2"/>
    <rect x="48" y="210" width="26" height="5" rx="2" fill="#2b1a10"/><rect x="48" y="226" width="26" height="5" rx="2" fill="#2b1a10"/>
    <rect x="50" y="252" width="22" height="4" fill="#2b1a10"/>
  </svg>`;

  /** HTML for one ticket. root = relative path to the site root ("" or "../"). */
  function ticketHTML(item, seat, index, root = "") {
    const { t, pick } = window.I18n;
    const serial = `${item.serial}-${String.fromCharCode(65 + index)}`;
    const name = esc(pick(cfg.honoree));
    const label = t("c.ticket", { n: seat.label });
    return `
    <article class="ticket" data-tilt aria-label="${esc(t("c.aria", { artist: cfg.artist, label, serial }))}">
      <div class="t-main">
        <header class="t-top">
          <span>★ ${esc(pick(cfg.edition))} ★</span>
          <span class="t-serial">Nº ${esc(serial)}</span>
        </header>
        <div class="t-art">
          <div class="t-sun"></div>
          <div class="t-rays"></div>
          ${GUITAR}
          <img class="t-portrait" src="${esc(root + cfg.portrait)}" alt="${esc(t("c.portraitAlt", { name: pick(cfg.honoree) }))}" width="400" height="500">
          <span class="t-rarity">${esc(pick(cfg.rarity))}</span>
          <span class="t-edition">${esc(pick(cfg.editionNote))}</span>
        </div>
        <div class="t-title">
          <p class="t-present">${esc(pick(cfg.show))}</p>
          <h3 class="t-artist">${esc(cfg.artist)}</h3>
          <p class="t-song" lang="en">“${esc(cfg.song)}”</p>
          <p class="t-feat">${t("c.featuring", { name })}</p>
        </div>
        <dl class="t-grid">
          <div><dt>${esc(pick(cfg.weekday))}</dt><dd>${esc(pick(cfg.date))}</dd></div>
          <div><dt>${esc(t("c.time"))}</dt><dd>${esc(cfg.time)}</dd></div>
          <div><dt>${esc(t("c.gates"))}</dt><dd>${esc(cfg.gate)}</dd></div>
          <div><dt>${esc(t("c.seat"))}</dt><dd>${esc(seat.seat)}</dd></div>
        </dl>
        <p class="t-venue">${esc(cfg.venue)} · ${esc(pick(cfg.hall))} · ${esc(pick(cfg.section))}</p>
      </div>
      <div class="t-perf" aria-hidden="true"></div>
      <footer class="t-stub">
        <div>
          <strong class="t-admit">${esc(t("c.admit"))}</strong>
          <span>${esc(label)} · ${esc(t("c.seat"))} ${esc(seat.seat)}</span>
        </div>
        ${barcode(serial)}
        <span class="t-stub-serial">${esc(serial)}</span>
      </footer>
      <div class="t-holo" aria-hidden="true"></div>
    </article>`;
  }

  /** Renders the pair of tickets into `container`. */
  const rendered = new Map(); // container -> { item, root }, re-rendered when the language changes
  document.addEventListener("langchange", () => rendered.forEach((v, c) => { if (c.isConnected && c.firstChild) render(c, v.item, { root: v.root }); }));

  function render(container, item, { root = "" } = {}) {
    rendered.set(container, { item, root });
    container.innerHTML = `<div class="ticket-pair">${cfg.seats.map((s, i) => `<div class="ticket-slot" style="--i:${i}">${ticketHTML(item, s, i, root)}</div>`).join("")}</div>`;
    attachTilt(container);
  }

  /** Holographic foil + tilt that follows the pointer or the device tilt. */
  function attachTilt(root) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll(".ticket").forEach((el) => {
      const set = (x, y) => {
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
        if (!reduce) {
          el.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
          el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
        }
      };
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  window.Collectible = { get, unlock, save, preview, render, config: cfg };
})();
