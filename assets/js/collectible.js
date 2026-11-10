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
  // random letters + digits: a serial can never match a real ticket number
  function mintSerial() {
    const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", rnd = new Uint32Array(6);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(rnd); else rnd.forEach((_, i) => (rnd[i] = Math.random() * 1e9));
    return `${cfg.serialPrefix}-1978-${Array.from(rnd, (n) => ABC[n % ABC.length]).join("")}`;
  }
  // a random 13-digit ticket number per seat (made up: it matches no real ticket)
  function mintNumber() {
    const rnd = new Uint32Array(13);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(rnd); else rnd.forEach((_, i) => (rnd[i] = Math.random() * 1e9));
    return Array.from(rnd, (n, i) => (i === 0 ? 1 + (n % 9) : n % 10)).join("");
  }
  function withNumbers(item) {
    if (item && !(item.numbers && cfg.seats.every((st) => item.numbers[st.label]))) {
      item.numbers = Object.fromEntries(cfg.seats.map((st) => [st.label, mintNumber()]));
      store.set("collectible", item);
    }
    return item;
  }
  function get() { return withNumbers(store.get("collectible", null)); }

  /** Unlocks the collectible (once) and returns it. A unique serial is minted on first unlock. */
  function unlock(extra = {}) {
    const existing = get();
    if (existing) {
      if ((extra.score || 0) > (existing.score || 0)) { existing.score = extra.score; save(existing); }
      return existing;
    }
    let serial = cfg.serial;
    if (!serial || serial === "auto") {
      serial = mintSerial();
    }
    const item = { serial, unlockedAt: new Date().toISOString(), score: extra.score || 0 };
    store.set("collectible", item);
    return withNumbers(item);
  }

  function save(item) { store.set("collectible", item); }

  /** A look at the tickets that is NOT saved (used for the localhost-only test preview). */
  function preview() {
    return get() || { serial: `${cfg.serialPrefix}-1978-PREVIEW`, unlockedAt: new Date().toISOString(), score: 0,
      numbers: Object.fromEntries(cfg.seats.map((st) => [st.label, mintNumber()])) };
  }

  /** Random-looking stripes drawn from the (random) ticket number — decoration only. */
  function barcode(text) {
    let x = 0, bars = "";
    let h = 2166136261;
    for (let i = 0; i < 64; i++) {
      h ^= text.charCodeAt(i % text.length) + i; h = Math.imul(h, 16777619) >>> 0;
      const w = 1 + (h % 3);
      if (i % 2 === 0) bars += `<rect x="${x}" width="${w}" height="40"/>`;
      x += w + 1;
    }
    return `<svg class="t-barcode" viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
  }

  /** HTML for one ticket. root = relative path to the site root ("" or "../"). */
  function ticketHTML(item, seat, index, root = "") {
    const { t, pick } = window.I18n;
    const serial = (item.numbers && item.numbers[seat.label]) || `${item.serial}-${String.fromCharCode(65 + index)}`;
    const name = esc(pick(cfg.honoree));
    const label = t("c.ticket", { n: seat.label });
    return `
    <article class="ticket" data-tilt data-seat="${esc(seat.seat)}" aria-label="${esc(t("c.aria", { artist: cfg.artist, label, serial }))}">
      <div class="t-main">
        <header class="t-top">
          <span>★ ${esc(pick(cfg.edition))} ★</span>
          <span class="t-serial">Nº ${esc(serial)}</span>
        </header>
        <div class="t-art">
          <div class="t-sun"></div>
          <div class="t-rays"></div>
          <img class="t-portrait" src="${esc(root + cfg.portrait)}" alt="${esc(t("c.portraitAlt", { name: pick(cfg.honoree) }))}" width="560" height="374">
          <span class="t-rarity">${esc(pick(cfg.rarity))}</span>
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
        <p class="t-venue">${esc(cfg.venue)} · ${esc(pick(cfg.section))}</p>
      </div>
      <div class="t-perf" aria-hidden="true"></div>
      <footer class="t-stub">
        <div>
          <strong class="t-admit">${esc(t("c.admit"))}</strong>
          <span>${esc(label)} · ${esc(t("c.seat"))} ${esc(seat.seat)}</span>
        </div>
        <div class="t-code">${barcode(serial)}<span class="t-barnum">${esc(serial)}</span></div>
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
