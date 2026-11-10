/* ==========================================================================
   i18n.js — English / Portuguese (Portugal)
   --------------------------------------------------------------------------
   • Language: the visitor's saved choice, otherwise the browser language
     (Portuguese browsers get "pt"), otherwise English.
   • Static text:  <span data-i18n="key">  (textContent)
                   <p data-i18n-html="key">  (trusted HTML from this file)
                   <button data-i18n-attr="aria-label:key; title:key2">
   • In scripts:   I18n.t("key", { name: "…" })   and   I18n.pick({ en, pt })
   • A button with  data-lang-toggle  switches language; pages listen for the
     "langchange" event to re-render anything they built in JavaScript.
   To add a language: add a dictionary below and list it in LANGS.
   ========================================================================== */
(function () {
  "use strict";

  const DICT = {
    en: {
      "lang.switch": "Mudar para português",
      "nav.arcade": "Arcade",
      "nav.back": "Back to the arcade",
      "sound.on": "Turn sound effects on",
      "sound.off": "Turn sound effects off",

      /* home */
      "home.eyebrow": "Now playing at",
      "home.collection": "🎟️ My collectibles",
      "home.featuredH": "Featured game",
      "home.badge": "★ Featured · Main stage",
      "home.karaokeSub": "Dire Straits Karaoke",
      "home.start": "▶ Start the show",
      "home.more": "More games",
      "home.play": "Play →",
      "home.soon": "🔒 Coming soon",

      /* collectibles page */
      "title.ticket": "My Collectibles · The Sultan's Arcade",
      "tk.heading": "My Collectibles",
      "tk.lockedIntro": "A legendary collectible is hidden somewhere in this arcade. <b>Sing “Sultans of Swing” all the way to the end</b> to unlock it.",
      "tk.locked": "Locked",
      "tk.rarityUnknown": "Rarity: ???",
      "tk.goSing": "🎤 Go to Sing It!",
      "tk.intro": "Two {rarity} tickets for <b>{artist} · “{song}”</b>. Print them or save them as a PDF to keep forever.",
      "tk.meta": "Unlocked {date}",
      "tk.best": " · Best score {score}",
      "tk.print": "🖨️ Print / Save as PDF",
      "tk.again": "🎤 Sing again",

      /* the ticket itself */
      "c.featuring": "featuring <strong>{name}</strong> on lead guitar",
      "c.time": "Time",
      "c.gates": "Gates",
      "c.seat": "Seat",
      "c.admit": "Admit One",
      "c.ticket": "Ticket {n}",
      "c.aria": "{artist} collectible ticket, {label}, serial {serial}",
      "c.portraitAlt": "Illustrated portrait of {name}",

      /* karaoke */
      "title.karaoke": "Sing It! · Dire Straits Karaoke",
      "k.h1": "Sing It! Sultans of Swing karaoke",
      "k.setup": "Song setup",
      "k.score": "Score",
      "k.hype": "Crowd hype",
      "k.streak": "Streak",
      "k.lyricsAria": "Lyrics",
      "k.controlsAria": "Player controls",
      "k.seek": "Song position",
      "k.restart": "Restart song",
      "k.play": "Play",
      "k.pause": "Pause",
      "k.mic": "Score my singing with the microphone",
      "k.mute": "Mute music",
      "k.unmute": "Unmute music",
      "k.volume": "Music volume",
      "k.eyebrow": "Tonight on the main stage",
      "k.title": "Sing It!",
      "k.hint": "Sing all the way to the end… a legendary prize awaits. 🎸",
      "k.startShow": "▶ Start the show",
      "k.loadFail": "The song couldn't be loaded. Check the connection and refresh the page.",
      "k.lyricsH": "📝 Lyrics",
      "k.lyricsHelp": "Paste lyrics you have the rights to use. Plain lines are fine — then press <b>Sync timings</b> and tap along with the music. Timed <code>[mm:ss.xx]</code> LRC lines are used as-is.",
      "k.lyricsInput": "Lyrics (LRC or plain text)",
      "k.saveLyrics": "Save lyrics",
      "k.sync": "⏱ Sync timings",
      "k.import": "Import .lrc",
      "k.export": "⬇ Export lyrics.js",
      "k.reset": "Reset to default",
      "k.syncHelp": "Press <kbd>Space</kbd> or tap the button the moment each line <b>starts</b>. <kbd>Backspace</kbd> undoes the last tap.",
      "k.next": "Next:",
      "k.startAt": "Start at",
      "k.fullscreen": "Full screen (F)",
      "k.exitFullscreen": "Exit full screen (F)",
      "k.tvTip": "📺 Singing on the TV? Press <kbd>F</kbd> for full screen · <kbd>Space</kbd> play/pause · <kbd>M</kbd> mute",
      "k.startAtAria": "Start the timing at this point in the song (minutes:seconds)",
      "k.startAtHelp": "Start at lets you re-time just one part: lines timed before that point keep their times, and you tap from the first line after it. Use 0:00 to time everything.",
      "k.tBadTime": "Type the start time as minutes:seconds, e.g. 1:30",
      "k.tNothingAfter": "There are no lyric lines after that point.",
      "k.tap": "TAP",
      "k.undo": "Undo",
      "k.finish": "Finish",
      "k.localOnly": "Lyrics are saved only in this browser — press Export lyrics.js and replace karaoke/lyrics.js with the downloaded file.",
      "k.close": "Close",
      "k.addLyrics": "Add lyrics in ⚙ Song setup",
      "k.syncAllDone": "All lines timed — press Finish",
      "k.syncProgress": "{a} / {b} lines · {time}",
      "k.encore": "Encore!",
      "k.finalScore": "Final score",
      "k.stars": "{n} out of 3 stars",
      "k.unlocked": "✦ New collectible unlocked ✦",
      "k.legendary": "Legendary",
      "k.revealAria": "Reveal your collectible",
      "k.tapReveal": "Tap to reveal",
      "k.rarityBanner": "★ Legendary · Limited Edition ★",
      "k.keep": "🎟️ Keep & print the tickets",
      "k.singAgain": "🎤 Sing again",
      "k.tTapPlay": "Tap ▶ to start the music",
      "k.tMicOff": "Mic scoring off",
      "k.tMicOn": "🎤 Mic scoring on — sing along to earn points! (Nothing is recorded.)",
      "k.tMicNA": "Microphone not available — you can still play without it.",
      "k.tLyricsSaved": "✅ Saved {n} lyric lines",
      "k.tReset": "Lyrics reset to the version in lyrics.js",
      "k.tImported": "Imported — press “Save lyrics” to use them.",
      "k.tChooseFirst": "The song has to be loaded first — timings are tapped along with the music.",
      "k.tPasteFirst": "Paste some lyrics first.",
      "k.tSyncMissing": "Saved {n} timed lines ({m} not tapped were left out).",
      "k.tSyncAll": "✅ All {n} lines timed and saved!",

      /* memory */
      "title.memory": "Record Collector · The Sultan's Arcade",
      "m.title": "Record Collector",
      "m.sub": "Flip the records and find every matching pair.",
      "m.moves": "Moves",
      "m.pairs": "Pairs",
      "m.time": "Time",
      "m.best": "Best",
      "m.bestVal": "{n} moves",
      "m.board": "Memory cards",
      "m.down": "Face-down record",
      "m.rec": "Record: {icon}",
      "m.winH": "Collection complete!",
      "m.winText": "{moves} moves in {time}.",
      "m.record": " 🏆 New personal best!",
      "m.again": "Shuffle & play again",
      "m.level": "Difficulty",
      "m.easy": "Easy",
      "m.medium": "Medium",
      "m.hard": "Hard",

      /* jam */
      "title.jam": "Jam Session · The Sultan's Arcade",
      "j.title": "Jam Session",
      "j.sub": "Listen to the riff, then stomp the pedals in the same order. Keys <kbd>1</kbd>–<kbd>4</kbd> work too.",
      "j.level": "Riff length",
      "j.best": "Best",
      "j.ready": "Ready when you are.",
      "j.start": "▶ Start jamming",
      "j.listen": "Listen…",
      "j.turn": "Your turn!",
      "j.record": "New record: {n} notes! 🏆",
      "j.bum": "Bum note! You remembered {n}.",
      "j.again": "↻ Jam again",
      "j.rock": "Rock on! 🤘",
      "j.p0": "Red pedal, note A",
      "j.p1": "Blue pedal, note C",
      "j.p2": "Gold pedal, note E",
      "j.p3": "Green pedal, note G",

      /* name that tune */
      "title.tune": "Name That Tune · The Sultan's Arcade",
      "q.title": "Name That Tune",
      "q.sub": "Hear a piece of a Dire Straits song and pick the right title before time runs out.",
      "q.round": "Round",
      "q.score": "Score",
      "q.best": "Best",
      "q.loading": "Tuning up… loading the songs",
      "q.ready": "{n} Dire Straits songs ready. How many can you name?",
      "q.loadFail": "Couldn't load the songs. Check the internet connection and try again.",
      "q.start": "▶ Start",
      "q.retry": "↻ Try again",
      "q.listen": "Which song is this?",
      "q.replay": "↺ Replay",
      "q.timer": "{n} seconds left",
      "q.tapPlay": "Tap ↺ Replay to hear the clip",
      "q.right": "Correct! +{pts}",
      "q.wrong": "Not quite — it was “{song}”",
      "q.timeup": "Time's up! It was “{song}”",
      "q.from": "From the album {album}",
      "q.youtube": "Listen on YouTube",
      "q.next": "Next →",
      "q.finish": "See results",
      "q.doneH": "Game over!",
      "q.doneText": "{c} of {n} right · {score} points.",
      "q.record": " 🏆 New record!",
      "q.again": "Play again",
      "q.credit": "Song previews courtesy of Apple Music.",
      "title.run": "Run to the Stage · The Sultan's Arcade",
      "r.title": "Run to the Stage!",
      "r.sub": "The show at the Coliseu Porto is about to start — help Dad cross the hall and make it onto the stage!",
      "r.hLane": "change lane",
      "r.hJump": "jump over chairs and amps",
      "r.hSlide": "slide under the keyboards",
      "r.hStack": "dodge drum kits and speaker columns",
      "r.touch": "On a phone: swipe left, right, up or down.",
      "r.start": "▶ Start running",
      "r.go": "Go!",
      "r.pause": "Pause",
      "r.paused": "Paused",
      "r.resume": "▶ Keep running",
      "r.again": "↻ Run again",
      "r.home": "Back to the arcade",
      "r.toStage": "m to the stage",
      "r.lives": "Lives",
      "r.livesN": "{n} lives left",
      "r.bestLine": "Best run: {time} s with {picks} picks",
      "r.winH": "You made it to the stage!",
      "r.winText": "The Coliseu is yours 🎸 {time} s · {picks} guitar picks.",
      "r.record": " 🏆 New record!",
      "r.overH": "So close!",
      "r.overText": "Only {m} m from the stage, with {picks} guitar picks. Give it another go!",
    },

    pt: {
      "lang.switch": "Switch to English",
      "nav.arcade": "Início",
      "nav.back": "Voltar ao início",
      "sound.on": "Ligar efeitos sonoros",
      "sound.off": "Desligar efeitos sonoros",

      "home.eyebrow": "Em cartaz no",
      "home.collection": "🎟️ Os meus colecionáveis",
      "home.featuredH": "Jogo em destaque",
      "home.badge": "★ Destaque · Palco principal",
      "home.karaokeSub": "Karaoke dos Dire Straits",
      "home.start": "▶ Começar o espetáculo",
      "home.more": "Mais jogos",
      "home.play": "Jogar →",
      "home.soon": "🔒 Em breve",

      "title.ticket": "Os meus colecionáveis · The Sultan's Arcade",
      "tk.heading": "Colecionáveis",
      "tk.lockedIntro": "Há um colecionável lendário escondido neste salão de jogos. <b>Canta “Sultans of Swing” até ao fim</b> para o desbloquear.",
      "tk.locked": "Bloqueado",
      "tk.rarityUnknown": "Raridade: ???",
      "tk.goSing": "🎤 Ir para o Canta!",
      "tk.intro": "Dois bilhetes {rarity} para <b>{artist} · “{song}”</b>. Imprime-os ou guarda-os em PDF para sempre.",
      "tk.meta": "Desbloqueado a {date}",
      "tk.best": " · Melhor pontuação {score}",
      "tk.print": "🖨️ Imprimir / Guardar em PDF",
      "tk.again": "🎤 Cantar outra vez",

      "c.featuring": "com <strong>{name}</strong> na guitarra solo",
      "c.time": "Hora",
      "c.gates": "Portas",
      "c.seat": "Lugar",
      "c.admit": "Entrada",
      "c.ticket": "Bilhete {n}",
      "c.aria": "Bilhete colecionável {artist}, {label}, série {serial}",
      "c.portraitAlt": "Retrato ilustrado do {name}",

      "title.karaoke": "Canta! · Karaoke dos Dire Straits",
      "k.h1": "Canta! Karaoke de Sultans of Swing",
      "k.setup": "Configurar música",
      "k.score": "Pontos",
      "k.hype": "Euforia do público",
      "k.streak": "Sequência",
      "k.lyricsAria": "Letra",
      "k.controlsAria": "Controlos do leitor",
      "k.seek": "Posição na música",
      "k.restart": "Recomeçar a música",
      "k.play": "Reproduzir",
      "k.pause": "Pausa",
      "k.mic": "Pontuar o meu canto com o microfone",
      "k.mute": "Silenciar a música",
      "k.unmute": "Voltar a ligar o som da música",
      "k.volume": "Volume da música",
      "k.eyebrow": "Esta noite no palco principal",
      "k.title": "Canta!",
      "k.hint": "Canta até ao fim… espera-te um prémio lendário. 🎸",
      "k.startShow": "▶ Começar o espetáculo",
      "k.loadFail": "Não foi possível carregar a música. Verifica a ligação e atualiza a página.",
      "k.lyricsH": "📝 Letra",
      "k.lyricsHelp": "Cola uma letra que tenhas o direito de usar. Linhas simples servem — depois carrega em <b>Sincronizar tempos</b> e toca ao ritmo da música. Linhas LRC com tempo <code>[mm:ss.xx]</code> são usadas tal como estão.",
      "k.lyricsInput": "Letra (LRC ou texto simples)",
      "k.saveLyrics": "Guardar letra",
      "k.sync": "⏱ Sincronizar tempos",
      "k.import": "Importar .lrc",
      "k.export": "⬇ Exportar lyrics.js",
      "k.reset": "Repor original",
      "k.syncHelp": "Carrega em <kbd>Espaço</kbd> ou toca no botão no momento em que cada linha <b>começa</b>. <kbd>Backspace</kbd> desfaz o último toque.",
      "k.next": "Seguinte:",
      "k.startAt": "Começar em",
      "k.fullscreen": "Ecrã inteiro (F)",
      "k.exitFullscreen": "Sair do ecrã inteiro (F)",
      "k.tvTip": "📺 A cantar na televisão? Carrega em <kbd>F</kbd> para ecrã inteiro · <kbd>Espaço</kbd> reproduz/pausa · <kbd>M</kbd> sem som",
      "k.startAtAria": "Começar a sincronização neste ponto da música (minutos:segundos)",
      "k.startAtHelp": "Começar em permite acertar só uma parte: as linhas antes desse ponto mantêm os tempos e tocas a partir da primeira linha depois dele. Usa 0:00 para fazer a música toda.",
      "k.tBadTime": "Escreve o início como minutos:segundos, por exemplo 1:30",
      "k.tNothingAfter": "Não há linhas da letra depois desse ponto.",
      "k.tap": "TOCA",
      "k.undo": "Desfazer",
      "k.finish": "Terminar",
      "k.localOnly": "A letra fica guardada apenas neste navegador — carrega em Exportar lyrics.js e substitui karaoke/lyrics.js pelo ficheiro descarregado.",
      "k.close": "Fechar",
      "k.addLyrics": "Adiciona a letra em ⚙ Configurar música",
      "k.syncAllDone": "Todas as linhas sincronizadas — carrega em Terminar",
      "k.syncProgress": "{a} / {b} linhas · {time}",
      "k.encore": "Bravo!",
      "k.finalScore": "Pontuação final",
      "k.stars": "{n} de 3 estrelas",
      "k.unlocked": "✦ Novo colecionável desbloqueado ✦",
      "k.legendary": "Lendário",
      "k.revealAria": "Revelar o teu colecionável",
      "k.tapReveal": "Toca para revelar",
      "k.rarityBanner": "★ Lendário · Edição Limitada ★",
      "k.keep": "🎟️ Guardar e imprimir os bilhetes",
      "k.singAgain": "🎤 Cantar outra vez",
      "k.tTapPlay": "Toca em ▶ para começar a música",
      "k.tMicOff": "Pontuação por microfone desligada",
      "k.tMicOn": "🎤 Microfone ligado — canta para ganhar pontos! (Nada é gravado.)",
      "k.tMicNA": "Microfone indisponível — podes jogar na mesma sem ele.",
      "k.tLyricsSaved": "✅ {n} linhas da letra guardadas",
      "k.tReset": "Letra reposta para a versão de lyrics.js",
      "k.tImported": "Importado — carrega em “Guardar letra” para a usar.",
      "k.tChooseFirst": "A música tem de estar carregada — os tempos marcam-se ao som da música.",
      "k.tPasteFirst": "Cola primeiro a letra.",
      "k.tSyncMissing": "{n} linhas sincronizadas guardadas ({m} sem toque ficaram de fora).",
      "k.tSyncAll": "✅ Todas as {n} linhas sincronizadas e guardadas!",

      "title.memory": "Colecionador de Discos · The Sultan's Arcade",
      "m.title": "Colecionador de Discos",
      "m.sub": "Vira os discos e encontra todos os pares.",
      "m.moves": "Jogadas",
      "m.pairs": "Pares",
      "m.time": "Tempo",
      "m.best": "Recorde",
      "m.bestVal": "{n} jogadas",
      "m.board": "Cartas de memória",
      "m.down": "Disco virado para baixo",
      "m.rec": "Disco: {icon}",
      "m.winH": "Coleção completa!",
      "m.winText": "{moves} jogadas em {time}.",
      "m.record": " 🏆 Novo recorde pessoal!",
      "m.again": "Baralhar e jogar outra vez",
      "m.level": "Dificuldade",
      "m.easy": "Fácil",
      "m.medium": "Médio",
      "m.hard": "Difícil",

      "title.jam": "Jam Session · The Sultan's Arcade",
      "j.title": "Jam Session",
      "j.sub": "Ouve o riff e depois pisa os pedais pela mesma ordem. As teclas <kbd>1</kbd>–<kbd>4</kbd> também funcionam.",
      "j.level": "Tamanho do riff",
      "j.best": "Recorde",
      "j.ready": "Quando estiveres pronto.",
      "j.start": "▶ Começar a tocar",
      "j.listen": "Ouve…",
      "j.turn": "A tua vez!",
      "j.record": "Novo recorde: {n} notas! 🏆",
      "j.bum": "Nota errada! Lembraste-te de {n}.",
      "j.again": "↻ Tocar outra vez",
      "j.rock": "Rock on! 🤘",
      "j.p0": "Pedal vermelho, nota Lá",
      "j.p1": "Pedal azul, nota Dó",
      "j.p2": "Pedal dourado, nota Mi",
      "j.p3": "Pedal verde, nota Sol",

      "title.tune": "Adivinha a Música · The Sultan's Arcade",
      "q.title": "Adivinha a Música",
      "q.sub": "Ouve um pedaço de uma música dos Dire Straits e escolhe o título certo antes que o tempo acabe.",
      "q.round": "Ronda",
      "q.score": "Pontos",
      "q.best": "Recorde",
      "q.loading": "A afinar… a carregar as músicas",
      "q.ready": "{n} músicas dos Dire Straits prontas. Quantas consegues adivinhar?",
      "q.loadFail": "Não foi possível carregar as músicas. Verifica a ligação à internet e tenta outra vez.",
      "q.start": "▶ Começar",
      "q.retry": "↻ Tentar outra vez",
      "q.listen": "Que música é esta?",
      "q.replay": "↺ Ouvir outra vez",
      "q.timer": "Faltam {n} segundos",
      "q.tapPlay": "Toca em ↺ Ouvir outra vez para ouvir o excerto",
      "q.right": "Certo! +{pts}",
      "q.wrong": "Não — era “{song}”",
      "q.timeup": "Acabou o tempo! Era “{song}”",
      "q.from": "Do álbum {album}",
      "q.youtube": "Ouvir no YouTube",
      "q.next": "Seguinte →",
      "q.finish": "Ver resultados",
      "q.doneH": "Fim do jogo!",
      "q.doneText": "{c} de {n} certas · {score} pontos.",
      "q.record": " 🏆 Novo recorde!",
      "q.again": "Jogar outra vez",
      "q.credit": "Excertos das músicas cedidos pelo Apple Music.",
      "title.run": "Corre até ao Palco · The Sultan's Arcade",
      "r.title": "Corre até ao Palco!",
      "r.sub": "O concerto no Coliseu Porto está quase a começar — ajuda o Pai a atravessar a sala e a subir ao palco!",
      "r.hLane": "mudar de corredor",
      "r.hJump": "saltar cadeiras e amplificadores",
      "r.hSlide": "deslizar por baixo dos teclados",
      "r.hStack": "fugir às baterias e colunas de som",
      "r.touch": "No telemóvel: desliza o dedo para a esquerda, direita, cima ou baixo.",
      "r.start": "▶ Começar a correr",
      "r.go": "Já!",
      "r.pause": "Pausa",
      "r.paused": "Em pausa",
      "r.resume": "▶ Continuar a correr",
      "r.again": "↻ Correr outra vez",
      "r.home": "Voltar à arcada",
      "r.toStage": "m até ao palco",
      "r.lives": "Vidas",
      "r.livesN": "{n} vidas restantes",
      "r.bestLine": "Melhor corrida: {time} s com {picks} palhetas",
      "r.winH": "Chegaste ao palco!",
      "r.winText": "O Coliseu é teu 🎸 {time} s · {picks} palhetas.",
      "r.record": " 🏆 Novo recorde!",
      "r.overH": "Quase!",
      "r.overText": "Ficaste a {m} m do palco, com {picks} palhetas. Tenta outra vez!",
    },
  };

  const LANGS = ["en", "pt"];
  const KEY = "arcade:lang";

  let lang = (() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY)); if (LANGS.includes(saved)) return saved; } catch (e) { /* ignore */ }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    return nav.toLowerCase().startsWith("pt") ? "pt" : "en";
  })();

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) ?? DICT.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }

  /** For config values that may be a plain string or { en: "…", pt: "…" }. */
  function pick(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? (v[lang] ?? v.en ?? "") : v;
  }

  const locale = () => (lang === "pt" ? "pt-PT" : "en-GB");

  function apply(root = document) {
    document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";
    root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((x) => x.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.querySelectorAll("[data-lang-toggle]").forEach((b) => {
      b.textContent = lang === "pt" ? "EN" : "PT";
      b.setAttribute("aria-label", t("lang.switch"));
      b.setAttribute("title", t("lang.switch"));
    });
    const titleKey = document.body && document.body.dataset.titleKey;
    if (titleKey) document.title = t(titleKey);
  }

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    try { localStorage.setItem(KEY, JSON.stringify(lang)); } catch (e) { /* ignore */ }
    apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.querySelectorAll("[data-lang-toggle]").forEach((b) => {
      b.addEventListener("click", () => setLang(lang === "pt" ? "en" : "pt"));
    });
  });

  window.I18n = { t, pick, apply, setLang, locale, get lang() { return lang; } };
})();
