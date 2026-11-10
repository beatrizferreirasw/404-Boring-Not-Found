/* ==========================================================================
   Sing It! — song configuration
   --------------------------------------------------------------------------
   AUDIO
     The song lives in assets/audio/ and plays automatically.
     `audio` is its path relative to this karaoke page. If it ever fails to
     load, the game offers to pick a file from the device instead.

   LYRICS
     Lyrics live in lyrics.js in the standard LRC format. You can also paste,
     time and export them from the "Song setup" panel inside the game.
   ========================================================================== */
window.KARAOKE_SONG = {
  title: "Sultans of Swing",
  artist: "Dire Straits",
  album: "1978",
  audio: "../assets/audio/sultans-of-swing.mp3",
  duration: 348,       // seconds; used until the audio file has loaded
  offset: 0,           // seconds added to every lyric time (fix a constant lag here)
  micScoring: true,    // offer the optional "score my singing" microphone mode
};
