/* ==========================================================================
   Collectible concert ticket — edit the text printed on the tickets here.
   Text can be a plain string, or { en: "…", pt: "…" } for both languages.

   These mirror the real concert (Great Straits at the Coliseu Porto Ageas).
   Never put the real tickets' barcode numbers here: this site is public, and
   a copied barcode can be used at the door.
   ========================================================================== */
window.COLLECTIBLE = {
  honoree: { en: "Dad", pt: "Pai" },       // “featuring Dad on lead guitar” / “com o Pai na guitarra solo”
  artist: "Dire Straits",
  song: "Sultans of Swing",                // always the original title
  show: { en: "Great Straits · Live in Porto", pt: "Great Straits · Ao Vivo no Porto" },
  venue: "Coliseu Porto Ageas",
  city: "Porto",
  date: { en: "28 FEB 2027", pt: "28 FEV 2027" },
  weekday: { en: "Sunday", pt: "Domingo" },
  time: "21:00",
  gate: "1 – 5",
  section: { en: "Orchestra", pt: "Orquestra" },
  edition: { en: "Limited Edition", pt: "Edição Limitada" },
  rarity: { en: "Legendary", pt: "Lendário" },
  serialPrefix: "SOS",                     // serial looks like SOS-1978-4821
  serial: "auto",                          // "auto" = generated once when unlocked, or set a fixed one
  portrait: "assets/art/portrait.png",     // path from the site root
  // Shown in the reveal after the tickets appear.
  revealHeadline: { en: "You're going to the concert!", pt: "Vais ao concerto!" },
  revealMessage: {
    en: "Two seats at Great Straits, live at the Coliseu do Porto — Sunday, 28 February 2027 at 21:00. Sultans of Swing, for real this time.",
    pt: "Dois lugares para os Great Straits, ao vivo no Coliseu do Porto — domingo, 28 de fevereiro de 2027, às 21:00. Sultans of Swing, desta vez a sério.",
  },
  seats: [
    { label: "I", seat: "F4-13" },
    { label: "II", seat: "F4-15" },
  ],
};
