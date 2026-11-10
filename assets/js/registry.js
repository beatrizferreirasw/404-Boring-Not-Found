/* ==========================================================================
   Game registry — the homepage gallery is built from this list.

   To add a new game:
     1. Create a folder next to the others, e.g.  my-game/index.html
        (copy memory/ as a starting point: it shows the shared header,
        theme, translations, sound effects and confetti in use).
     2. Add an entry below. That's it — the homepage picks it up.

   Text fields can be a plain string, or { en: "…", pt: "…" } for both languages.

   Fields:
     id        unique slug
     title     card title
     tagline   one short sentence
     href      relative link to the game's page
     emoji     big icon on the card (or set `art` to an image path)
     accent    card glow colour
     featured  true = the big hero card at the top (use for one game only)
     tags      little chips on the card (array, or { en: [...], pt: [...] })
     comingSoon true = shown as a locked card (no link)
   ========================================================================== */
window.ARCADE_SITE = {
  title: "The Sultan's Arcade",
  subtitle: {
    en: "A little collection of games, made with love — for Dad.",
    pt: "Uma pequena coleção de jogos, feita com amor — para o Pai.",
  },
  footer: { en: "Made with ♥ for Dad", pt: "Feito com ♥ para o Pai" },
};

window.GAMES = [
  {
    id: "karaoke",
    title: { en: "Sing It!", pt: "Canta!" },
    tagline: {
      en: "Dire Straits karaoke night. Sing “Sultans of Swing” all the way through and something special unlocks…",
      pt: "Noite de karaoke dos Dire Straits. Canta “Sultans of Swing” até ao fim e algo especial é desbloqueado…",
    },
    href: "karaoke/",
    emoji: "🎸",
    accent: "#ff3b52",
    featured: true,
    tags: { en: ["Karaoke", "Music", "Secret prize"], pt: ["Karaoke", "Música", "Prémio secreto"] },
  },
  {
    id: "tune",
    title: { en: "Name That Tune", pt: "Adivinha a Música" },
    tagline: {
      en: "Hear a piece of a Dire Straits song and guess the title before the clock runs out.",
      pt: "Ouve um pedaço de uma música dos Dire Straits e adivinha o título antes que o tempo acabe.",
    },
    href: "tune/",
    emoji: "🎧",
    accent: "#4ade80",
    tags: { en: ["Quiz", "Dire Straits", "Timer"], pt: ["Quiz", "Dire Straits", "Cronómetro"] },
  },
  {
    id: "stage",
    title: { en: "Run to the Stage", pt: "Corre até ao Palco" },
    tagline: {
      en: "3D run through the Coliseu Porto: jump chairs, slide under keyboards and dodge drum kits to reach the stage.",
      pt: "Corrida 3D pelo Coliseu Porto: salta cadeiras, desliza por baixo de teclados e foge às baterias até ao palco.",
    },
    href: "stage/",
    emoji: "🏃",
    accent: "#ffb347",
    tags: { en: ["3D", "Runner", "Coliseu"], pt: ["3D", "Corrida", "Coliseu"] },
  },
  {
    id: "memory",
    title: { en: "Record Collector", pt: "Colecionador de Discos" },
    tagline: { en: "Flip the records and find every matching pair.", pt: "Vira os discos e encontra todos os pares." },
    href: "memory/",
    emoji: "💿",
    accent: "#4fd1ff",
    tags: { en: ["Memory", "Relaxing"], pt: ["Memória", "Relaxante"] },
  },
  {
    id: "jam",
    title: "Jam Session",
    tagline: {
      en: "Listen to the riff, then play it back. How long a solo can you remember?",
      pt: "Ouve o riff e repete-o. Que tamanho de solo consegues memorizar?",
    },
    href: "jam/",
    emoji: "🎛️",
    accent: "#e8c36a",
    tags: { en: ["Rhythm", "Memory"], pt: ["Ritmo", "Memória"] },
  },
  {
    id: "next",
    title: { en: "Next Gig", pt: "Próximo Concerto" },
    tagline: { en: "More games are on the way.", pt: "Há mais jogos a caminho." },
    emoji: "🎟️",
    accent: "#9fb3c8",
    comingSoon: true,
    tags: { en: ["Coming soon"], pt: ["Em breve"] },
  },
];
