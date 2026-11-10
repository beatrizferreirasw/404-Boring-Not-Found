# The Sultan's Arcade 🎸

A small, self-contained games website made as a gift for Dad.
Plain HTML, CSS and JavaScript: no build step, no dependencies, no frameworks.

**Live site:** https://beatrizferreirasw.github.io/404-Boring-Not-Found/

| Game | Folder | What it is |
|---|---|---|
| **Sing It!** (featured) | `karaoke/` | Karaoke to “Sultans of Swing”. Finish the song to unlock the collectible concert tickets. |
| Record Collector | `memory/` | Memory pairs game |
| Jam Session | `jam/` | Repeat-the-riff game with guitar pedals |
| Name That Tune | `tune/` | Hear a Dire Straits clip, pick the title before the 15-second timer ends (10 rounds, 4 options) |
| My Collectibles | `ticket/` | Printable keepsake page for the unlocked tickets |

## Structure

```
404-Boring-Not-Found/
├── index.html                 homepage (gallery is built from registry.js)
├── assets/
│   ├── css/                   theme.css (shared), home, collectible, minigame
│   ├── js/
│   │   ├── i18n.js            ← English / Portuguese text for the whole site
│   │   ├── arcade.js          shared: sound effects, confetti, toasts, transitions
│   │   ├── registry.js        ← list of games shown on the homepage
│   │   ├── collectible.config.js  ← text printed on the tickets
│   │   └── collectible.js     renders the tickets
│   ├── art/portrait.svg       illustrated portrait used on the tickets
│   └── audio/                 sultans-of-swing.mp3 (the karaoke song)
├── karaoke/
│   ├── song.config.js         ← audio path, duration, timing offset
│   ├── lyrics.js              ← lyrics in LRC format (placeholders by default)
│   └── index.html, karaoke.css, karaoke.js
├── tune/songs.config.js       ← song list, rounds, timer, number of options
├── memory/  jam/  ticket/
```

## Running locally
From the repository root:

```bash
python3 tools/serve.py
```

Then open http://localhost:8000. This small server (no installs needed) lets
the browser jump around inside the MP3 and never caches, so edits show up
on a normal refresh. Plain `python3 -m http.server` also works, but there the
progress bar can't seek.
