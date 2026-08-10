/**
 * Mesehang — procedural interactive story engine (Hungarian)
 */
(function (global) {
  const WORLDS = {
    erdo: {
      id: "erdo",
      titleBits: ["Az erdei titok", "A mókusösvény", "A holdfényes liget"],
      place: "egy ősi erdő mélyén",
      companionDefault: "egy beszélő róka",
      object: "egy fényes makkot",
      threat: "egy zavarodott viharlélek",
      keywords: ["erdő", "erdo", "fa", "róka", "roka", "mókus", "mokus", "liget", "erdőben", "erdoben"],
    },
    varazs: {
      id: "varazs",
      titleBits: ["A csillagtorony", "A varázskönyv", "A holdkút meséje"],
      place: "egy lebegő varázstoronyban",
      companionDefault: "egy apró csillagtündér",
      object: "egy beszélő varázskönyvet",
      threat: "egy elfeledett átok",
      keywords: ["varázs", "varazs", "tündér", "tunder", "boszi", "mágia", "magia", "varázsló", "varazslo", "csillag"],
    },
    tenger: {
      id: "tenger",
      titleBits: ["A hullámlámpás", "A kagylókirály", "A tengeri ösvény"],
      place: "egy csillogó tengerparton",
      companionDefault: "egy kíváncsi delfin",
      object: "egy éneklő kagylót",
      threat: "egy mohó örvényúr",
      keywords: ["tenger", "óceán", "ocean", "hajó", "hajo", "hal", "delfin", "sziget", "hullám", "hullam", "kalóz", "kaloz"],
    },
    varos: {
      id: "varos",
      titleBits: ["A rejtett utcácska", "A tetőjárók", "A piaci rejtély"],
      place: "egy régi város háztetőin",
      companionDefault: "egy ügyes macska",
      object: "egy arany kulcsot",
      threat: "egy kapzsi toronyőr",
      keywords: ["város", "varos", "utca", "ház", "haz", "macska", "piac", "kastély", "kastely", "palota"],
    },
    ur: {
      id: "ur",
      titleBits: ["A holdbogyó űrhajó", "Csillagközi csempész", "A kis üstökös"],
      place: "egy színes űrállomáson",
      companionDefault: "egy kedves robot",
      object: "egy éneklő meteoritot",
      threat: "egy mohó aszteroida-gyűjtő",
      keywords: ["űr", "ur", "űrhajó", "urhajo", "bolygó", "bolygo", "robot", "csillag", "rakéta", "raketa", "űrben"],
    },
    sarkany: {
      id: "sarkany",
      titleBits: ["A barátságos sárkány", "A tűzhegy titka", "A sárkánytojás"],
      place: "egy meleg lávabarlang közelében",
      companionDefault: "egy félénk kis sárkány",
      object: "egy szelíd tűzkövet",
      threat: "egy irigy kőóriás",
      keywords: ["sárkány", "sarkany", "tűz", "tuz", "tojás", "tojas", "barlang", "hegy"],
    },
  };

  const SURPRISES = [
    "egy bátor kislány és egy beszélő róka kalandja az erdőben",
    "egy kis robot, aki megtalálja az elveszett csillagot az űrben",
    "egy kíváncsi delfin és egy éneklő kagyló meséje a tengeren",
    "egy macska, aki a város tetőin keresi az arany kulcsot",
    "egy félénk sárkány, aki megtanulja, hogy a tűz barát is lehet",
    "egy tündér, aki a holdkútban elveszett nevetét keresi",
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function detectWorld(wish) {
    const text = (wish || "").toLowerCase();
    let best = WORLDS.erdo;
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
    ];
    for (const [re, name] of map) {
      if (re.test(text)) return name;
    }
    return world.companionDefault;
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
    const wish = (opts.wish || "").trim();
    const world = detectWorld(wish);
    const hero = (opts.heroName || "").trim() || pick(["Lili", "Máté", "Noé", "Zsófi", "Ábel", "Emma"]);
    const companion = extractCompanion(wish, world);
    const mood = moodFlavor(opts.mood || "vidam");
    const title = pick(world.titleBits);
    const object = world.object;
    const place = world.place;
    const threat = world.threat;

    const log = [];

    const scenes = {
      start: {
        id: "start",
        chapter: "1. fejezet",
        text: `Egyszer volt, hol nem volt, ${place} élt ${hero}. Egy nap ${mood.verb} útnak indult, mert ${wish ? `pont olyan mesét szeretett volna, mint amit te is kívántál: ${wish}` : "egy igazi kalandra vágyott"}. Nemsokára találkozott ${companion.replace(/^egy /, "egy ")} társával. A társ halkan suttogta: Hallod. Valaki elrejtette ${object}.`,
        choices: [
          { label: `Együtt keresik meg ${object}`, next: "search" },
          { label: "Előbb a biztonságos ösvényt követik", next: "path" },
          { label: "Megkérdezik a szél suttogását", next: "listen" },
        ],
      },
      search: {
        id: "search",
        chapter: "2. fejezet",
        text: `${hero} és társa ${mood.verb} nekiláttak a keresésnek. Nyomok vezettek egy rejtett tisztásra, ahol ${threat} őrködött. A lény nem volt teljesen rossz, csak nagyon félt, hogy elveszíti, ami fényt ad neki. ${hero} szívében most ${mood.tone} keveredett.`,
        choices: [
          { label: "Barátságosan beszélnek vele", next: "talk" },
          { label: "Okos trükkel terelik el", next: "trick" },
          { label: "Ajándékot kínálnak cserébe", next: "gift" },
        ],
      },
      path: {
        id: "path",
        chapter: "2. fejezet",
        text: `Az ösvény nyugodtnak tűnt, de hamarosan elágazott. Az egyik út fényes volt, a másik halk zenét játszott. ${companion} a zenés irányba bólintott. Közben messziről felhangzott ${threat} morgása, mintha ${object} körül forogna a gond.`,
        choices: [
          { label: "A zenés ösvényen mennek tovább", next: "search" },
          { label: "A fényes úton sietnek", next: "listen" },
        ],
      },
      listen: {
        id: "listen",
        chapter: "2. fejezet",
        text: `${hero} megállt, és hallgatózott. A szél azt súgta, hogy ${object} csak annak ragyog, aki megosztja. Ezután megjelent ${threat}, de már nem volt olyan félelmetes, csak magányos. ${hero} megértette, hogy a mese igazi kulcsa a megosztás.`,
        choices: [
          { label: "Megosztják a fényt mindenkivel", next: "talk" },
          { label: "Megígérik, hogy vigyáznak rá együtt", next: "gift" },
        ],
      },
      talk: {
        id: "talk",
        chapter: "3. fejezet",
        text: `${hero} nyugodt hangon szólt. Nem ellopni jöttünk. Csak szeretnénk, ha a fény mindenkinek jutna. ${threat} lassan megnyugodott. Együtt felemelték ${object}, és a helyszín megtelt meleg ragyogással. ${companion} mosolygott, és azt mondta, ez volt a hiányzó rész.`,
        choices: [
          { label: "Hazaviszik a fény egy részét", next: "ending_home" },
          { label: "Ünnepet rendeznek a helyszínen", next: "ending_party" },
        ],
      },
      trick: {
        id: "trick",
        chapter: "3. fejezet",
        text: `${hero} és ${companion} ravasz tervet eszeltek ki. Tükrökkel és visszhanggal úgy tűnt, mintha ${object} egyszerre több helyen ragyogna. ${threat} összezavarodott, majd elnevette magát, és elismerte, hogy ügyesek voltak. A feszültség feloldódott, és közösen eldöntötték, hogy a kincs nem egy emberé.`,
        choices: [
          { label: "Békét kötnek, és együtt őrzik", next: "ending_home" },
          { label: "A trükkből játékot csinálnak", next: "ending_party" },
        ],
      },
      gift: {
        id: "gift",
        chapter: "3. fejezet",
        text: `${hero} elővett egy apró ajándékot, egy saját emlékfoszlányt, nevetést, bátorságot és egy ígéretet. Ezt adom cserébe, mondta halkan. ${threat} elfogadta, és odaadta ${object}. A fény kettévált. Egyik fele a hősé, a másik a helyé lett, hogy senki se maradjon sötétben.`,
        choices: [
          { label: "Új barátsággal térnek haza", next: "ending_home" },
          { label: "Megünneplik az új szövetséget", next: "ending_party" },
        ],
      },
      ending_home: {
        id: "ending_home",
        chapter: "Befejezés",
        text: `Így tért haza ${hero}, ${companion} társaságában, és magával vitte a fény egy kis darabját. Otthon elmesélte a kalandot, ${mood.ending}. Aki hallotta a mesét, egy kicsit bátrabban nézett holnapra. Itt a vége, fuss el véle.`,
        choices: [],
        ending: true,
      },
      ending_party: {
        id: "ending_party",
        chapter: "Befejezés",
        text: `Aznap este nagy ünnep kerekedett ${place}. Zenélt a szél, táncolt a fény, és ${hero} körül barátok gyűltek. ${threat} is ott ült a körben, már nem ijesztő vendégként. ${mood.ending}. Itt a vége, fuss el véle.`,
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
      mood: opts.mood || "vidam",
      scenes,
      currentId: "start",
      log,
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
    SURPRISES,
    buildStory,
    getScene,
    choose,
    fullTranscript,
    pick,
  };
})(window);
