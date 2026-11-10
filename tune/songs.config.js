/* ==========================================================================
   Name That Tune — configuration
   --------------------------------------------------------------------------
   Clips are Apple Music's official 30-second song previews, found through
   the public iTunes Search API when the game starts. No audio files are
   stored in this repository.

   • songs: the titles that can come up (matched against the artist's
     catalogue, case-insensitive). Add or remove freely; titles are shown
     exactly as written here and are never translated.
   • options: answer buttons per round (minimum 3).
   ========================================================================== */
window.TUNE_CONFIG = {
  artist: "Dire Straits",
  country: "PT",          // iTunes store to search (falls back to US)
  rounds: 10,
  secondsPerRound: 15,
  options: 4,             // never fewer than 3
  songs: [
    "Sultans of Swing",
    "Money for Nothing",
    "Walk of Life",
    "Brothers in Arms",
    "So Far Away",
    "Romeo and Juliet",
    "Tunnel of Love",
    "Private Investigations",
    "Lady Writer",
    "Telegraph Road",
    "Your Latest Trick",
    "Why Worry",
    "Down to the Waterline",
    "Water of Love",
    "Skateaway",
    "Industrial Disease",
    "Twisting by the Pool",
    "Calling Elvis",
    "Heavy Fuel",
    "On Every Street",
    "Wild West End",
    "Setting Me Up",
    "Six Blade Knife",
    "Expresso Love",
    "Solid Rock",
    "Hand in Hand",
    "The Man's Too Strong",
    "Ride Across the River",
    "Love over Gold",
    "Iron Hand",
    "Once Upon a Time in the West",
    "Where Do You Think You're Going?",
  ],
};
