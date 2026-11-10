/* Homepage: builds the gallery from window.GAMES (see registry.js). */
(function () {
  "use strict";
  const { sfx, store, wireLinks } = window.Arcade;
  const { t, pick } = window.I18n;
  const site = window.ARCADE_SITE || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  if (store.get("collectible", null)) document.getElementById("collection-link").hidden = false;

  function render() {
    document.getElementById("site-title").textContent = pick(site.title) || "Arcade";
    document.getElementById("site-subtitle").textContent = pick(site.subtitle) || "";
    document.getElementById("site-footer").textContent = pick(site.footer) || "";
    document.title = pick(site.title) || document.title;

    const games = window.GAMES || [];
    const featured = games.find((g) => g.featured);
    const rest = games.filter((g) => g !== featured);

    if (featured) {
      document.getElementById("featured").innerHTML = `
        <h2 id="featured-h" class="sr-only">${esc(t("home.featuredH"))}</h2>
        <a class="feature" href="${esc(featured.href)}" data-nav data-tilt>
          <div>
            <span class="badge">${esc(t("home.badge"))}</span>
            <h2>${esc(pick(featured.title))}<small>${esc(t("home.karaokeSub"))}</small></h2>
            <p>${esc(pick(featured.tagline))}</p>
            <ul class="chips" role="list">${(pick(featured.tags) || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
            <span class="btn primary">${esc(t("home.start"))}</span>
          </div>
          <div class="stage" aria-hidden="true">
            <div class="vinyl"><span class="hole"></span></div>
            <div class="eq"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="guitar">${esc(featured.emoji)}</div>
          </div>
        </a>`;
    }

    document.getElementById("grid").innerHTML = rest.map((g, i) => {
      const inner = `
        <span class="icon" aria-hidden="true">${g.art ? `<img src="${esc(g.art)}" alt="" width="54" height="54">` : esc(g.emoji)}</span>
        <h3>${esc(pick(g.title))}</h3>
        <p>${esc(pick(g.tagline))}</p>
        <span class="play">${esc(t(g.comingSoon ? "home.soon" : "home.play"))}</span>`;
      const style = `--accent:${esc(g.accent || "#4fd1ff")};--i:${i}`;
      return g.comingSoon || !g.href
        ? `<li><div class="card locked" style="${style}" aria-disabled="true">${inner}</div></li>`
        : `<li><a class="card" href="${esc(g.href)}" style="${style}" data-nav data-tilt>${inner}</a></li>`;
    }).join("");

    wireLinks(document.querySelector("main"));
    attachTilt();
  }

  // Gentle 3D tilt that follows the pointer (desktop only).
  function attachTilt() {
    if (!matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    document.querySelectorAll("main [data-tilt]").forEach((el) => {
      el.addEventListener("pointerenter", () => sfx.hover());
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const max = el.classList.contains("feature") ? 4 : 8;
        el.style.setProperty("--ry", `${x * max}deg`);
        el.style.setProperty("--rx", `${-y * max}deg`);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  render();
  document.addEventListener("langchange", render);
})();
