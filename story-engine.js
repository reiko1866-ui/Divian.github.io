/**
 * Mesehang — procedural interactive story engine (Hungarian)
 * Random népmese-style topics + branching scenes
 */
(function (global) {
  const HEROES = [
    "Lili", "Máté", "Noé", "Zsófi", "Ábel", "Emma", "Bence", "Anna",
    "Kata", "Peti", "Dóra", "Tamás", "Réka", "Marci", "Nóra", "Gergő",
  ];

  const WORLDS = {
    erdo: {
      id: "erdo",
      titleBits: ["Az erdei titok", "A mókusösvény", "A holdfényes liget", "A gubacsos tisztás"],
      places: ["egy ősi erdő mélyén", "egy sűrű bükkerdő szélén", "egy mohás ösvény mentén"],
      companions: ["egy beszélő róka", "egy gyors mókus", "egy bölcs bagoly", "egy hűséges kutya"],
      objects: ["egy fényes makkot", "egy ezüst tollat", "egy meleg erdei lámpást"],
      threats: ["egy zavarodott viharlélek", "egy mogorva vaddisznó", "egy irigy holló"],
      keywords: ["erdő", "erdo", "fa", "róka", "roka", "mókus", "mokus", "liget", "bagoly", "gubacs"],
    },
    falu: {
      id: "falu",
      titleBits: ["A két koma", "A falusi csere", "A karácsonyi zsák", "A piaci tréfa"],
      places: ["egy kis falu végén", "egy régi malom mellett", "egy poros országút szélén"],
      companions: ["egy ravasz koma", "egy jószívű szomszéd", "egy kíváncsi kiscsikó"],
      objects: ["egy zsák búzát", "egy arany forintot", "egy tele kosarat"],
      threats: ["egy kapzsi ispán", "egy csalafinta kalmár", "egy mogorva gazda"],
      keywords: ["falu", "koma", "malom", "piac", "gazdasági", "karácsony", "zsák", "csere"],
    },
    varazs: {
      id: "varazs",
      titleBits: ["A csillagtorony", "A varázskönyv", "A holdkút meséje", "A tündérkert"],
      places: ["egy lebegő varázstoronyban", "egy holdkút partján", "egy tündérkert közepén"],
      companions: ["egy apró csillagtündér", "egy beszélő varázskönyv", "egy ezüstszárnyú lepke"],
      objects: ["egy beszélő varázskönyvet", "egy holdcseppet", "egy csillagport"],
      threats: ["egy elfeledett átok", "egy irigy varázsló", "egy álmos ködúr"],
      keywords: ["varázs", "varazs", "tündér", "tunder", "boszi", "mágia", "magia", "varázsló", "varazslo"],
    },
    tenger: {
      id: "tenger",
      titleBits: ["A hullámlámpás", "A kagylókirály", "A tengeri ösvény", "A szigetlámpa"],
      places: ["egy csillogó tengerparton", "egy szeles kikötőben", "egy kis sziget öblében"],
      companions: ["egy kíváncsi delfin", "egy éneklő sirály", "egy kedves teknős"],
      objects: ["egy éneklő kagylót", "egy kék üveggolyót", "egy hajóscsengőt"],
      threats: ["egy mohó örvényúr", "egy viharos tengeri király", "egy irigy polip"],
      keywords: ["tenger", "óceán", "ocean", "hajó", "hajo", "hal", "delfin", "sziget", "hullám", "hullam", "kalóz", "kaloz"],
    },
    varos: {
      id: "varos",
      titleBits: ["A rejtett utcácska", "A tetőjárók", "A piaci rejtély", "Az óra torony"],
      places: ["egy régi város háztetőin", "egy zsúfolt piacon", "egy toronyóra tövében"],
      companions: ["egy ügyes macska", "egy utcazenész", "egy kis postagalamb"],
      objects: ["egy arany kulcsot", "egy régi térképet", "egy csengő cipőt"],
      threats: ["egy kapzsi toronyőr", "egy szigorú őrmester", "egy irigy kereskedő"],
      keywords: ["város", "varos", "utca", "ház", "haz", "macska", "piac", "kastély", "kastely", "palota"],
    },
    ur: {
      id: "ur",
      titleBits: ["A holdbogyó űrhajó", "Csillagközi csempész", "A kis üstökös", "A holdkert"],
      places: ["egy színes űrállomáson", "egy csendes holdkertben", "egy üstökös hátán"],
      companions: ["egy kedves robot", "egy kis űrmacska", "egy nevető üstökös"],
      objects: ["egy éneklő meteoritot", "egy csillagtérképet", "egy holdbogyót"],
      threats: ["egy mohó aszteroida-gyűjtő", "egy zavarodott űrvihar", "egy irigy holdőr"],
      keywords: ["űr", "ur", "űrhajó", "urhajo", "bolygó", "bolygo", "robot", "rakéta", "raketa"],
    },
    sarkany: {
      id: "sarkany",
      titleBits: ["A barátságos sárkány", "A tűzhegy titka", "A sárkánytojás", "A lávahíd"],
      places: ["egy meleg lávabarlang közelében", "egy tűzhegy tövében", "egy kőhídon a szakadék felett"],
      companions: ["egy félénk kis sárkány", "egy füstös gyík", "egy bátor kecske"],
      objects: ["egy szelíd tűzkövet", "egy sárkánytojást", "egy arany pikkelyt"],
      threats: ["egy irigy kőóriás", "egy mogorva lávakirály", "egy kapzsi kincsvadász"],
      keywords: ["sárkány", "sarkany", "tűz", "tuz", "tojás", "tojas", "barlang", "hegy"],
    },
    teli: {
      id: "teli",
      titleBits: ["A hópehelyút", "A száncsengő", "A téli kút", "A jégvirág"],
      places: ["egy havas erdei úton", "egy befagyott tó partján", "egy füstölgő házikóban"],
      companions: ["egy meleg bundás kutya", "egy táncoló hópehelytündér", "egy kedves szarvas"],
      objects: ["egy ezüst száncsengőt", "egy jégvirágot", "egy meleg kenyeret"],
      threats: ["egy fázós jégúr", "egy kapzsi hóember", "egy viharos északi szél"],
      keywords: ["tél", "tel", "hó", "ho", "karácsony", "szán", "jég", "jeg", "mikulás", "mikulas"],
    },
    allat: {
      id: "allat",
      titleBits: ["A három állat barátsága", "A baromfiudvar titka", "A nyúl és a teknős", "A méhkirálynő"],
      places: ["egy vidám baromfiudvarban", "egy zöld mező közepén", "egy méhkaptár tövében"],
      companions: ["egy okos nyúl", "egy lassú teknős", "egy zümmögő méhecske", "egy büszke kakas"],
      objects: ["egy arany magocskát", "egy mézes csuprot", "egy puha tollat"],
      threats: ["egy éhes róka", "egy lustaság szelleme", "egy irigy varjú"],
      keywords: ["állat", "allat", "nyúl", "nyul", "teknős", "teknos", "méh", "meh", "kakas", "tyúk", "tyuk"],
    },
  };

  const TOPIC_SEEDS = [
    "egy szegény ember és a ravasz koma karácsonyi cseréje",
    "egy bátor kislány és egy beszélő róka az erdőben",
    "egy kis robot, aki elveszett csillagot keres",
    "egy kíváncsi delfin és egy éneklő kagyló",
    "egy macska a város háztetőin",
    "egy félénk sárkány, aki megtanul barátkozni",
    "egy tündér, aki a holdkútnál keresi a nevetét",
    "egy havas úton járó gyerek és a száncsengő",
    "egy okos nyúl és egy lassú teknős versenye",
    "egy malom melletti falusi tréfa",
    "egy űrmacska a holdkertben",
    "egy méhecske és az arany magocska",
    "egy kisfiú, aki jégvirágot talál a tavon",
    "egy utcazenész és az arany kulcs",
    "egy bagoly, aki éjszaka mesél az erdőnek",
    "egy hajósgyerek és a viharos tenger",
    "egy kecske a lávahídon",
    "egy postagalamb titkos üzenete",
    "egy hópehelytündér karácsony előtt",
    "egy ispán és két ravasz koma",
    "egy üstökösön utazó kislány",
    "egy szomszéd, aki kenyeret süt a faluban",
    "egy teknős, aki tengert szeretne látni",
    "egy varázskönyv, ami csak igazat mond",
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomWish() {
    // Combinatorial surprises so topics stay fresh
    if (Math.random() < 0.55) return pick(TOPIC_SEEDS);
    const world = pick(Object.values(WORLDS));
    const hero = pick(["egy kislány", "egy kisfiú", "egy testvérpár", "egy öreg koma", "egy kíváncsi gyerek"]);
    const companion = pick(world.companions).replace(/^egy /, "");
    const place = pick(world.places);
    const object = pick(world.objects);
    const objectBare = object.replace(/^egy\s+/, "");
    const patterns = [
      `${hero} és ${companion} kalandja ${place}`,
      `${hero}, aki megkeresi ${object} ${place}`,
      `egy mese ${companion} társaságában, ${place}`,
      `${hero} a ${objectBare} nyomában jár, ${companion} segítségével`,
    ];
    return pick(patterns);
  }

  function detectWorld(wish) {
    const text = (wish || "").toLowerCase();
    let best = null;
    let score = 0;
    for (const world of Object.values(WORLDS)) {
      let s = 0;
      for (const kw of world.keywords) {
        if (text.includes(kw)) s += 1;
      }
      if (s > score) {
        score = s;
        best = world;
      }
    }
    // No clear topic match → fully random world
    if (!best || score === 0) return pick(Object.values(WORLDS));
    return best;
  }

  function extractCompanion(wish, world) {
    const text = (wish || "").toLowerCase();
    const map = [
      [/róka|roka/, "egy beszélő róka"],
      [/macska/, "egy ügyes macska"],
      [/delfin/, "egy kíváncsi delfin"],
      [/robot/, "egy kedves robot"],
      [/sárkány|sarkany/, "egy félénk kis sárkány"],
      [/tündér|tunder/, "egy apró csillagtündér"],
      [/mókus|mokus/, "egy gyors mókus"],
      [/kutya/, "egy hűséges kutya"],
      [/bagoly/, "egy bölcs bagoly"],
      [/koma/, "egy ravasz koma"],
      [/nyúl|nyul/, "egy okos nyúl"],
      [/teknős|teknos/, "egy lassú teknős"],
      [/méh|meh/, "egy zümmögő méhecske"],
    ];
    for (const [re, name] of map) {
      if (re.test(text)) return name;
    }
    return pick(world.companions);
  }

  function moodFlavor(mood) {
    if (mood === "vidam") {
      return {
        tone: "nevetés és játékosság",
        verb: "vidáman",
        ending: "és mindenki nagyot nevetett a végén",
      };
    }
    if (mood === "kalandos") {
      return {
        tone: "bátorság és gyors döntések",
        verb: "merészen",
        ending: "és a kaland hősévé vált",
      };
    }
    return {
      tone: "csillogó csodák",
      verb: "halkan, csodálkozva",
      ending: "és a csoda sokáig velük maradt",
    };
  }

  function buildStory(opts) {
    const wish = (opts.wish || "").trim() || randomWish();
    const world = detectWorld(wish);
    const hero = (opts.heroName || "").trim() || pick(HEROES);
    const companion = extractCompanion(wish, world);
    const mood = moodFlavor(opts.mood || pick(["vidam", "kalandos", "mesés"]));
    const title = pick(world.titleBits);
    const object = pick(world.objects);
    const place = pick(world.places);
    const threat = pick(world.threats);

    // Oral népmese cadence — closer to traditional tale-telling
    const openings = [
      `Egyszer volt, hol nem volt, ${place} élt ${hero}.`,
      `Halljátok csak, mesélik, hogy ${place} lakott ${hero}.`,
      `Réges-régen, ${place}, volt egy gyermek, akit úgy hívtak, ${hero}.`,
    ];

    const scenes = {
      start: {
        id: "start",
        chapter: "1. fejezet",
        text: `${pick(openings)} Egy szép napon ${mood.verb} útnak indult, mert a szívében olyan kívánság élt, mint a tiéd: ${wish}. Útközben találkozott ${companion.replace(/^egy /, "egy ")} társával. Az csak annyit súgott neki: figyelj csak, valaki elrejtette ${object}. Na, innen indult a mese.`,
        choices: shuffle([
          { label: `Együtt keresik meg ${object}`, next: "search" },
          { label: "Előbb a biztonságos ösvényt követik", next: "path" },
          { label: "Megkérdezik a szél suttogását", next: "listen" },
        ]),
      },
      search: {
        id: "search",
        chapter: "2. fejezet",
        text: `${hero} és a társa ${mood.verb} nekiláttak a keresésnek. Mentek, mendegéltek, míg egy tisztásra értek, ahol ${threat} őrködött. De bizony ez a lény nem volt csupa rossz. Csak féltette azt, ami fényt adott neki. ${hero} szívében pedig ${mood.tone} keveredett.`,
        choices: shuffle([
          { label: "Barátságosan beszélnek vele", next: "talk" },
          { label: "Okos trükkel terelik el", next: "trick" },
          { label: "Ajándékot kínálnak cserébe", next: "gift" },
        ]),
      },
      path: {
        id: "path",
        chapter: "2. fejezet",
        text: `Az ösvény eleinte csendes volt, aztán kettéágazott. Az egyik út fényesen ragyogott, a másik halk zenét játszott. ${companion} a zenés felé bólintott. Messziről pedig ${threat} morgása hallatszott, mintha ${object} körül forogna minden gond.`,
        choices: shuffle([
          { label: "A zenés ösvényen mennek tovább", next: "search" },
          { label: "A fényes úton sietnek", next: "listen" },
        ]),
      },
      listen: {
        id: "listen",
        chapter: "2. fejezet",
        text: `${hero} megállt, és fülelt egy darabig. A szél csak ennyit súgott: ${object} annak ragyog igazán, aki megosztja. Aztán előjött ${threat}. Már nem volt olyan ijesztő, inkább magányos. Akkor értette meg ${hero}, hogy a mese igazi kulcsa a megosztás.`,
        choices: shuffle([
          { label: "Megosztják a fényt mindenkivel", next: "talk" },
          { label: "Megígérik, hogy vigyáznak rá együtt", next: "gift" },
        ]),
      },
      talk: {
        id: "talk",
        chapter: "3. fejezet",
        text: `${hero} nyugodtan szólt hozzá. Nem ellopni jöttünk. Csak azt szeretnénk, hogy a fény mindenkinek jusson. ${threat} lassan megnyugodott. Együtt felemelték ${object}, és a hely megtelt meleg ragyogással. ${companion} csak mosolygott, s azt mondta: ez hiányzott ide.`,
        choices: shuffle([
          { label: "Hazaviszik a fény egy részét", next: "ending_home" },
          { label: "Ünnepet rendeznek a helyszínen", next: "ending_party" },
        ]),
      },
      trick: {
        id: "trick",
        chapter: "3. fejezet",
        text: `${hero} és ${companion} ravasz tervet eszeltek ki. Tükrökkel meg visszhanggal úgy tűnt, mintha ${object} egyszerre több helyen ragyogna. ${threat} összezavarodott, aztán elnevette magát. Hát ügyesek vagytok, mondta. A harag elillant, és megegyeztek: a kincs nem egy emberé.`,
        choices: shuffle([
          { label: "Békét kötnek, és együtt őrzik", next: "ending_home" },
          { label: "A trükkből játékot csinálnak", next: "ending_party" },
        ]),
      },
      gift: {
        id: "gift",
        chapter: "3. fejezet",
        text: `${hero} elővett egy apró ajándékot. Nem arany volt az, hanem nevetés, bátorság és egy ígéret. Ezt adom cserébe, mondta halkan. ${threat} elfogadta, s odaadta ${object}. A fény kettévált. Egyik fele a hősé lett, a másik a helyé, hogy senki se maradjon sötétben.`,
        choices: shuffle([
          { label: "Új barátsággal térnek haza", next: "ending_home" },
          { label: "Megünneplik az új szövetséget", next: "ending_party" },
        ]),
      },
      ending_home: {
        id: "ending_home",
        chapter: "Befejezés",
        text: `Így tért haza ${hero}, ${companion} társaságában, s magával vitte a fény egy kis darabját. Otthon elmesélte a kalandot, ${mood.ending}. Aki hallotta, bátrabban nézett a holnapra. Itt a vége, fuss el véle.`,
        choices: [],
        ending: true,
      },
      ending_party: {
        id: "ending_party",
        chapter: "Befejezés",
        text: `Aznap este nagy öröm kerekedett ${place}. Zenélt a szél, táncolt a fény, s ${hero} körül barátok gyűltek. ${threat} is ott ült a körben, már nem ijesztő vendégként. ${mood.ending}. Itt a vége, fuss el véle.`,
        choices: [],
        ending: true,
      },
    };

    return {
      title,
      hero,
      companion,
      world: world.id,
      wish,
      mood: opts.mood || "mesés",
      scenes,
      currentId: "start",
      log: [],
    };
  }

  function getScene(story) {
    return story.scenes[story.currentId];
  }

  function choose(story, nextId) {
    const current = getScene(story);
    story.log.push({
      chapter: current.chapter,
      text: current.text,
      choiceTo: nextId,
    });
    story.currentId = nextId;
    return getScene(story);
  }

  function fullTranscript(story) {
    const parts = story.log.map((entry) => `${entry.chapter}\n${entry.text}`);
    const last = getScene(story);
    const lastBlock = `${last.chapter}\n${last.text}`;
    if (!parts.length || parts[parts.length - 1] !== lastBlock) {
      parts.push(lastBlock);
    }
    return `${story.title}\n\n${parts.join("\n\n")}\n`;
  }

  global.MeseEngine = {
    WORLDS,
    SURPRISES: TOPIC_SEEDS,
    randomWish,
    buildStory,
    getScene,
    choose,
    fullTranscript,
    pick,
  };
})(window);
