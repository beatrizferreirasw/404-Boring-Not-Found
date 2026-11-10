# The Sultan's Arcade 🎸

A small, self-contained games website made as a gift for Dad.
Plain HTML, CSS and JavaScript: no build step, no dependencies, no frameworks.

| Game | Folder | What it is |
|---|---|---|
| **Sing It!** (featured) | `karaoke/` | Karaoke to “Sultans of Swing”. Finish the song to unlock the collectible concert tickets. |
| Run to the Stage | `stage/` | 3D runner through the Coliseu Porto: jump, slide and dodge instruments to reach the stage and smash the guitar |
| Record Collector | `memory/` | Memory pairs game (Easy / Medium / Hard) |
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
│   ├── art/portrait.png       illustrated portrait used on the tickets
│   ├── vendor/three.min.js    three.js r128 (3D for Run to the Stage)
│   └── audio/                 sultans-of-swing.mp3 (karaoke), money-for-nothing.mp3 (runner)
├── karaoke/
│   ├── song.config.js         ← audio path, duration, timing offset
│   ├── lyrics.js              ← lyrics in LRC format (placeholders by default)
│   └── index.html, karaoke.css, karaoke.js
├── tune/songs.config.js       ← song list, rounds, timer, number of options
├── stage/                     Run to the Stage (runner.js, stage.css)
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
