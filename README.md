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

## Setting up the karaoke

### 1. The song
The song is embedded at `assets/audio/sultans-of-swing.mp3` and starts with
**▶ Start the show**: there is nothing to choose or configure. To swap it,
replace that file (or change `audio` in `karaoke/song.config.js`). (It's published with the site, so anyone
with the link can download it.)

### 2. The lyrics
`karaoke/lyrics.js` holds placeholder lines only. The real lyrics are copyrighted,
so add them from a source you're licensed to use. There is no setup screen on
the live site (your dad just presses play); the timing tool runs only on your
own computer:

1. Run the site locally (see *Running locally*) and open
   `http://localhost:8000/karaoke/?setup`. A **Song setup** button appears.
2. Paste the plain lyrics, one line per line.
3. Press **⏱ Sync timings** and tap <kbd>Space</kbd> (or TAP) as each line starts.
   To fix just one part, type a time in **Start at** (e.g. `1:30`) first: lines
   before it keep their times and you only tap from there.
4. Press **Finish**, then **⬇ Export lyrics.js**.
5. Replace `karaoke/lyrics.js` with the downloaded file and commit.
   The live site always uses `lyrics.js`.

Lines that start with `♪` (or are empty) are shown as instrumental breaks.
If every lyric is slightly early or late, adjust `offset` in `song.config.js`.

### 3. How the prize is won
The collectible tickets unlock **only** when the song is sung to the end:
at least 85% of the song has to actually play (dragging the progress bar to
the end shows “So close!” instead). Until then, the *My Collectibles* page stays locked.

For testing on your own computer only:
- `http://localhost:8000/karaoke/?finish` previews the reveal without unlocking anything
  (this does nothing on the live site).
- To lock the collectible again in a browser, run this in its console:
  `localStorage.removeItem("arcade:collectible")`

## Languages
The site speaks **English and Portuguese (Portugal)**. It follows the browser
language the first time, and the **PT / EN** button on every page switches and
remembers the choice. All interface text lives in `assets/js/i18n.js`; text
in the config files can be written as `{ en: "…", pt: "…" }`.
Song titles and karaoke lyrics are always shown in the original and never translated.

## Name That Tune
Clips are Apple Music's official 30-second previews, fetched from the public
iTunes Search API when the game opens (an internet connection is needed; no
audio is stored in the repo). Edit `tune/songs.config.js` to change the song
list, the number of rounds, the seconds per round, or the number of options
(minimum 3).

## Personalising
- **Ticket text** (name, date, venue, seats, reveal message): `assets/js/collectible.config.js`
- **Site title / subtitle / footer:** top of `assets/js/registry.js`
- **Portrait:** `assets/art/portrait.svg` (any image works; update `portrait` in the config)

## Adding a game
1. Copy `memory/` to a new folder, e.g. `quiz/`, and change it.
2. Add an entry to `window.GAMES` in `assets/js/registry.js`.
3. Add its text to both languages in `assets/js/i18n.js`.

The shared helpers are available on every page: `Arcade.sfx.win()`,
`Arcade.fx.burst()`, `Arcade.toast("…")`, `Arcade.store.get/set`.

## Running locally
From the repository root:

```bash
python3 tools/serve.py
```

Then open http://localhost:8000. This small server (no installs needed) lets
the browser jump around inside the MP3 and never caches, so edits show up
on a normal refresh. Plain `python3 -m http.server` also works, but there the
progress bar can't seek.

## Deployment
`.github/workflows/deploy.yml` publishes the site to GitHub Pages on every push
to `main`, and can also be run by hand from the **Actions** tab. It leaves out
repository-only files (`.github/`, `tools/`, this README).

**One-time setup:** on GitHub, open the repository's **Settings → Pages →
Build and deployment → Source** and choose **GitHub Actions**.
