/**
 * Mesehang — végtelen, procedurális Disney-s mesék
 * Minden választás új fejezetet sző; a történet korlátlanul folytatható.
 */
(function (global) {
  const HEROES = [
    "Lili", "Máté", "Noé", "Zsófi", "Ábel", "Emma", "Bence", "Anna",
    "Kata", "Peti", "Dóra", "Tamás", "Réka", "Marci", "Nóra", "Gergő",
  ];

  const WORLDS = {
    erdo: {
      id: "erdo",
      titleBits: ["A csillagos tisztás", "A beszélő erdő", "A mohaszőnyeg titka", "A tűzlegyek bálja"],
      places: ["egy ősi erdő mélyén", "egy sűrű bükkerdő szélén", "egy mohás, lámpafényes ösvényen", "egy páfrányos patakparton"],
      companions: ["egy beszélő róka", "egy gyors mókus", "egy bölcs bagoly", "egy hűséges kutya"],
      wonders: ["a tűzlegyek körtánca", "egy éneklő patak", "egy holdfényes tisztás", "egy ezüst mohaszőnyeg"],
      threats: ["egy zavarodott viharlélek", "egy mogorva vaddisznó", "egy irigy holló", "egy álmos ködér"],
      keywords: ["erdő", "erdo", "fa", "róka", "roka", "mókus", "mokus", "liget", "bagoly"],
    },
    kastely: {
      id: "kastely",
      titleBits: ["A csillárkert", "A báltermi ígéret", "A tükörterem", "A királyi kert"],
      places: ["egy aranyló kastélykertben", "egy csilláros bálteremben", "egy tükrös folyosón", "egy rózsalugasban"],
      companions: ["egy udvari egér", "egy beszélő gyertyatartó", "egy kedves szakács", "egy táncoló seprű"],
      wonders: ["egy lebegő tánczene", "egy virágzó üvegház", "egy kívánságkút", "egy csillár-eső"],
      threats: ["egy irigy udvaronc", "egy elfeledett átok", "egy kapzsi főminiszter", "egy mogorva kapuőr"],
      keywords: ["kastély", "kastely", "herceg", "hercegnő", "hercegno", "bál", "bal", "király", "kiraly", "palota"],
    },
    tenger: {
      id: "tenger",
      titleBits: ["A hullámok dala", "A szigetlámpa", "A delfinek öble", "A kagylószív"],
      places: ["egy csillogó tengerparton", "egy színes korallöbölben", "egy szeles kikötőben", "egy habos sziklaszirten"],
      companions: ["egy kíváncsi delfin", "egy éneklő sirály", "egy kedves teknős", "egy apró rákocska"],
      wonders: ["egy világító korallkert", "egy éneklő hullám", "egy szivárványos permet", "egy kék üvegöböl"],
      threats: ["egy mohó örvényúr", "egy viharos tengeri király", "egy irigy polip", "egy ködös zátonyőr"],
      keywords: ["tenger", "óceán", "ocean", "hajó", "hajo", "hal", "delfin", "sziget", "hullám", "hullam"],
    },
    varos: {
      id: "varos",
      titleBits: ["A tetőjárók éneke", "A lámpásutcácska", "A zenélő piac", "Az óra torony álma"],
      places: ["egy lámpafényes utcácskán", "egy zsúfolt piacon", "egy toronyóra tövében", "egy háztetők közti kertben"],
      companions: ["egy ügyes macska", "egy utcazenész", "egy kis postagalamb", "egy lámpagyújtogató"],
      wonders: ["egy éjszakai lámpásünnep", "egy lebegő szappanbuborék-felhő", "egy titkos tetőkertecske", "egy zenélő óratorony"],
      threats: ["egy szigorú őrmester", "egy irigy kereskedő", "egy zord kapuőr", "egy zajos vihar"],
      keywords: ["város", "varos", "utca", "ház", "haz", "macska", "piac"],
    },
    ur: {
      id: "ur",
      titleBits: ["A holdbogyó kert", "Csillagközi barátság", "A kis üstökös", "A tejút-hinta"],
      places: ["egy színes űrállomáson", "egy csendes holdkertben", "egy üstökös hátán", "egy csillaghíd közepén"],
      companions: ["egy kedves robot", "egy kis űrmacska", "egy nevető üstökös", "egy csillagszemű bagoly"],
      wonders: ["egy tejút-hinta", "egy csillagszóró zápor", "egy lebegő holdvirág", "egy ezüst űrszivárvány"],
      threats: ["egy zavarodott űrvihar", "egy irigy holdőr", "egy magányos aszteroida", "egy zajos rakétazúgó"],
      keywords: ["űr", "ur", "űrhajó", "urhajo", "bolygó", "bolygo", "robot", "rakéta", "raketa", "csillag"],
    },
    sarkany: {
      id: "sarkany",
      titleBits: ["A szelíd tűz", "A sárkánybál", "A lávahíd", "A pikkelyes barátság"],
      places: ["egy meleg lávabarlang közelében", "egy tűzhegy tövében", "egy kőhídon a szakadék felett", "egy füstös kilátón"],
      companions: ["egy félénk kis sárkány", "egy füstös gyík", "egy bátor kecske", "egy parázsszínű lepkecsapat"],
      wonders: ["egy színes tűzijáték-lehelet", "egy aranyló lávató", "egy meleg kőszív", "egy pikkelyes fényzuhatag"],
      threats: ["egy irigy kőóriás", "egy mogorva lávakirály", "egy kapzsi kincsvadász", "egy dühös füstfelhő"],
      keywords: ["sárkány", "sarkany", "tűz", "tuz", "tojás", "tojas", "barlang", "hegy"],
    },
    teli: {
      id: "teli",
      titleBits: ["A hópehelybál", "A száncsengő-dal", "A jégvirágkert", "A meleg ablak"],
      places: ["egy havas erdei úton", "egy befagyott tó partján", "egy füstölgő házikóban", "egy csengős szánösvényen"],
      companions: ["egy meleg bundás kutya", "egy táncoló hópehelytündér", "egy kedves szarvas", "egy piros sálas hóember"],
      wonders: ["egy jégvirágkert", "egy csengős szánút", "egy meleg kakaógőz", "egy hópehely-keringő"],
      threats: ["egy fázós jégúr", "egy viharos északi szél", "egy mogorva hótorlasz", "egy hangos jégrepedés"],
      keywords: ["tél", "tel", "hó", "ho", "karácsony", "szán", "jég", "jeg", "mikulás", "mikulas"],
    },
    allat: {
      id: "allat",
      titleBits: ["A baromfiudvar bálja", "A nyúl és a teknős", "A méhkirálynő dala", "A három barát"],
      places: ["egy vidám baromfiudvarban", "egy zöld mező közepén", "egy méhkaptár tövében", "egy gyümölcsös szélén"],
      companions: ["egy okos nyúl", "egy lassú teknős", "egy zümmögő méhecske", "egy büszke kakas"],
      wonders: ["egy virágos réti körjáték", "egy mézédes ünnep", "egy napsugár-hinta", "egy illatos almáskert"],
      threats: ["egy éhes róka", "egy lustaság szelleme", "egy irigy varjú", "egy zajos viharfelhő"],
      keywords: ["állat", "allat", "nyúl", "nyul", "teknős", "teknos", "méh", "meh", "kakas", "tyúk", "tyuk"],
    },
  };

  const BEATS = ["discovery", "obstacle", "kindness", "wonder", "chase", "rest", "song", "bridge", "secret", "storm", "festival", "dream"];

  const TOPIC_SEEDS = [
    "egy bátor kislány és egy beszélő róka az erdőben",
    "egy kis robot, aki barátot keres a holdkertben",
    "egy kíváncsi delfin, aki megtanulja a hullámok dalát",
    "egy macska, aki az éjszakai lámpásünnepre siet",
    "egy félénk sárkány, aki először táncol a tűzhegynél",
    "egy tündér, aki a kastélykertben elvesztette a nevetését",
    "egy havas úton járó gyerek és a hópehelybál",
    "egy okos nyúl és egy lassú teknős barátságversenye",
    "egy utcazenész, aki a városnak visszaadja a zenét",
    "egy üstökösön utazó kisfiú",
    "egy hercegnő és egy beszélő gyertyatartó a bálteremben",
    "egy hajósgyerek, aki megmenti a delfinöblöt",
    "egy szarvas, aki hazavezet a hóban",
    "egy méhecske, aki a méhkirálynő ünnepére készül",
    "egy űrmacska és a tejút-hinta",
    "egy bagoly, aki éjszakai bált rendez az erdőben",
  ];

  const ACTIONS = {
    kind: {
      labels: [
        "Kedvességgel lépnek tovább",
        "Megölelik a pillanatot, és segítenek",
        "Barátsággal oldják meg",
      ],
      nextBias: ["kindness", "festival", "song", "rest"],
    },
    brave: {
      labels: [
        "Bátran mennek előre",
        "Szembenéznek a bajjal",
        "Merészen vágnak neki az útnak",
      ],
      nextBias: ["obstacle", "chase", "storm", "bridge"],
    },
    curious: {
      labels: [
        "Kíváncsian követik a fényt",
        "Felfedezik a titkos ösvényt",
        "Meghallgatják a táj suttogását",
      ],
      nextBias: ["discovery", "secret", "wonder", "dream"],
    },
    clever: {
      labels: [
        "Okos tervet eszelnek ki",
        "Ravasz trükkel fordítanak",
        "Új ötletet próbálnak ki",
      ],
      nextBias: ["secret", "bridge", "obstacle", "chase"],
    },
    rest: {
      labels: [
        "Egy kicsit pihennek, aztán folytatják",
        "Dalt dúdolnak az út mellett",
        "Megosztanak egy meleg falatot",
      ],
      nextBias: ["rest", "song", "dream", "festival"],
    },
  };

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
    if (Math.random() < 0.6) return pick(TOPIC_SEEDS);
    const world = pick(Object.values(WORLDS));
    const hero = pick(["egy kislány", "egy kisfiú", "egy testvérpár", "egy kíváncsi gyerek", "egy bátor herceg"]);
    const companion = pick(world.companions).replace(/^egy /, "");
    const place = pick(world.places);
    const wonder = pick(world.wonders);
    return pick([
      `${hero} és ${companion} kalandja ${place}`,
      `${hero}, aki először látja: ${wonder}`,
      `egy mese ${companion} társaságában, ${place}`,
      `${hero} megmenti a napot ${place}, ${companion} segítségével`,
    ]);
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
    return !best || score === 0 ? pick(Object.values(WORLDS)) : best;
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
      [/gyertyatartó|gyertyatarto/, "egy beszélő gyertyatartó"],
      [/nyúl|nyul/, "egy okos nyúl"],
      [/teknős|teknos/, "egy lassú teknős"],
      [/méh|meh/, "egy zümmögő méhecske"],
      [/szarvas/, "egy kedves szarvas"],
    ];
    for (const [re, name] of map) {
      if (re.test(text)) return name;
    }
    return pick(world.companions);
  }

  function moodFlavor(mood) {
    if (mood === "vidam") {
      return {
        light: "nevetéssel, csillogással és játékos zenével",
        verb: "vidáman",
        color: "aranyos",
      };
    }
    if (mood === "kalandos") {
      return {
        light: "bátorsággal, dobogó szívvel és nagy lélegzetekkel",
        verb: "merészen",
        color: "tüzes",
      };
    }
    return {
      light: "csodával, lágy fénnyel és halk dallammal",
      verb: "csodálkozva",
      color: "ezüstös",
    };
  }

  function worldOf(story) {
    return WORLDS[story.worldId] || pick(Object.values(WORLDS));
  }

  function maybeShiftSetting(story) {
    // Every few chapters, gently refresh place/wonder/threat so it never stalls
    if (story.chapterNum > 1 && story.chapterNum % 3 === 0) {
      const world = worldOf(story);
      story.place = pick(world.places.filter((p) => p !== story.place).concat(world.places));
      story.wonder = pick(world.wonders);
      story.threat = pick(world.threats);
    }
    if (story.chapterNum > 1 && story.chapterNum % 7 === 0 && Math.random() < 0.45) {
      // Occasional world hop for infinite variety
      const nextWorld = pick(Object.values(WORLDS).filter((w) => w.id !== story.worldId).concat([worldOf(story)]));
      story.worldId = nextWorld.id;
      story.place = pick(nextWorld.places);
      story.wonder = pick(nextWorld.wonders);
      story.threat = pick(nextWorld.threats);
      if (Math.random() < 0.35) {
        story.companion = pick(nextWorld.companions);
      }
    }
  }

  function pickBeat(story, action) {
    const recent = story.recentBeats || [];
    const bias = (ACTIONS[action] && ACTIONS[action].nextBias) || BEATS;
    const pool = shuffle(bias.concat(BEATS));
    for (const beat of pool) {
      if (!recent.includes(beat)) return beat;
    }
    return pick(BEATS);
  }

  function makeChoices() {
    const keys = shuffle(Object.keys(ACTIONS)).slice(0, 3);
    return keys.map((action) => ({
      label: pick(ACTIONS[action].labels),
      next: action,
    }));
  }

  function chapterText(story, beat) {
    const hero = story.hero;
    const companion = story.companion;
    const comp = companion.replace(/^egy /, "");
    const place = story.place;
    const wonder = story.wonder;
    const threat = story.threat;
    const mood = story.mood;
    const n = story.chapterNum;

    const bridges = [
      `A mese pedig nem ért véget. Sőt: épp csak igazán elkezdődött.`,
      `Ha azt hitted, itt megáll a történet, tévedtél. Új ösvény nyílt.`,
      `A szél tovább fújt, a fény tovább hívott, és ${hero} tudta: még sok fejezet vár rájuk.`,
      `Egy Disney-mese néha akkor a legszebb, amikor azt hiszed, vége — aztán jön a következő csoda.`,
    ];

    const templates = {
      discovery: `${hero} és ${comp} továbbmentek ${place}. A ${n}. napon a levegő tele volt ${mood.light}. Hirtelen a földön különös jeleket láttak: fényköröket, apró lábnyomokat, és egy nyilacskát, ami ${wonder} felé mutatott.

A ${comp} izgatottan suttogott. Nézd csak. Ez nem véletlen. ${hero} ${mood.verb} térdre ereszkedett, megérintette a fényt, és a táj mintha megszólalt volna. Hallatszott egy távoli dallam, aztán egy halk nevetés. Valami új kaland készülődött, nagyobb, mint az előző.

${threat} árnyéka csak messziről hunyorgott, mintha maga is kíváncsi lett volna. ${pick(bridges)}`,

      obstacle: `Az út ${place} egyszerre elszűkült. Előttük ${threat} állt, és a fények egy pillanatra elhalványultak. ${hero} szíve gyorsabban vert, a ${comp} pedig szorosabban simulhatott mellé.

Nem kell félnünk, mondta ${hero}, bár a hangja remegett egy kicsit. A Disney-hősök is félnek néha. A különbség az, hogy mégis lépnek. ${wonder} gyenge csillogása a háttérben erőt adott.

Együtt okosan, ${mood.verb} kerestek rést a bajon. Egy hang, egy mosoly, egy bátor lépés — és az akadály megremegett. ${pick(bridges)}`,

      kindness: `${hero} észrevette, hogy valaki szomorúan ül az út szélén. Nem ${threat} volt ezúttal, hanem egy kicsi, elfáradt lény, aki elvesztette a ritmusát. A ${comp} odasúgott: Ha most továbbmegyünk, talán gyorsabbak leszünk. Ha megállunk, talán jobbak.

${hero} megállt. Odaült mellé, megosztotta a melegét, a türelmét, és egy apró dalt. A lény lassan elmosolyodott. Abban a pillanatban ${wonder} fénye megsokszorozódott körülöttük, mintha a világ megjutalmazta volna a kedvességet.

${place} újra ragyogni kezdett. ${pick(bridges)}`,

      wonder: `Aztán megérkeztek oda, ahol ${wonder} teljes szépségében várt. ${place} olyan volt, mint egy élő képeskönyv: színek úsztak a levegőben, a hangok táncoltak, és még a por is csillogott.

${hero} ${mood.verb} állt a csoda közepén. A ${comp} felnevetett, majd hirtelen elkomolyodott. Ez a fény nemcsak szép, mondta. Üzenetet is hoz. És valóban: a ragyogásban apró képek villantak fel — régi barátok, új ösvények, és egy kapu, ami még nincs nyitva.

${threat} messziről figyelt, de most nem merte elrontani a pillanatot. ${pick(bridges)}`,

      chase: `Hirtelen minden felgyorsult. ${threat} árnyéka megmozdult, a szél megszaladt, és ${hero} meg a ${comp} futni kezdtek ${place} kanyarjai között. Nem félelemből — inkább azért, mert a kaland most sebességet kért.

Ugrottak fényfoltokon, átbújtak hanghidakon, kikerültek táncoló köveket. ${wonder} villanásai mutatták az irányt, mint iránytű. A ${comp} kiáltott: Balra. Most jobbra. Most nevetni is szabad!

Amikor végül megálltak, lihegve és ragyogva, rájöttek: a hajsza közelebb vitte őket egymáshoz. ${pick(bridges)}`,

      rest: `Egy csendes zugban megpihentek. ${place} halkabb lett, a tűz legyintésszerűen melegített, és ${hero} végre mélyet lélegzett. A ${comp} mellé kuporodott.

Mesélj, kérte a ${comp}. ${hero} elmondta, miért indult el, és hogy a kívánsága így hangzott: ${story.wish}. A szavak után a csend is barátságosnak tűnt. ${wonder} távoli fénye úgy hunyorgott, mintha bólogatna.

Pihenés közben új erő gyűlt bennük. A mese nem sietett. A jó mesék tudnak várni is. ${pick(bridges)}`,

      song: `Valahonnan dallam szállt feléjük. Először csak pár hang, aztán egész kórus, mintha ${place} maga énekelne. ${hero} és a ${comp} akaratlanul is beléptek a ritmusba.

Énekeltek a bátorságról, a nevetésről, és arról a ${mood.color} fényről, amit ${wonder} adott nekik. Még ${threat} is megállt messzebb, és egy darabig csak hallgatózott — a zene ugyanis még a mogorvaságot is meglágyítja.

Amikor a dal elhalkult, az ösvény szélesebben ragyogott, mint előtte. ${pick(bridges)}`,

      bridge: `Egy szakadék felett remegő híd feszült. Alatta köd kavargott, felette ${wonder} fénye hívott. ${hero} megfogta a ${comp} mancsát, szárnyát vagy kezét — mindegy is, a lényeg a szorítás volt.

Lépésről lépésre haladtak. A híd néha meglibbent, néha megéneklődött. ${threat} a túloldalon várt, de már nem úgy, mint ellenség: inkább mint valaki, aki maga is át szeretne kelni, csak nem meri egyedül.

${hero} visszanyúlt, és segített. A túlparton mindhárman fellélegeztek. ${pick(bridges)}`,

      secret: `Egy rejtett ajtó vált láthatóvá ${place}. Olyan apró volt, hogy csak az vett észre, aki igazán figyelt. A ${comp} kacsintott. Titok.

${hero} belépett. Belül egy másik világfoszlány várt: kisebb fények, puhább hangok, és egy térkép, amin még üres foltok voltak. A térkép közepén ${wonder} jele csillogott, a szélén pedig ${threat} árnyképe — nem végleges ellenségként, hanem következő próbaként.

${hero} a térképet a szívéhez érintette. Érezte: a történetnek még sok üres oldala van. ${pick(bridges)}`,

      storm: `Vihar kerekedett. Nem csak szél és zápor: érzések vihara is. ${place} megrázkódott, ${threat} hangja hangosabb lett, és egy pillanatra ${hero} is kételkedett.

A ${comp} azonban nem engedte el. Maradunk együtt, mondta. A Disney-mesékben a vihar gyakran azért jön, hogy a fény utána tisztább legyen. ${hero} ${mood.verb} belenézett a szélbe, és kimondta a saját bátorságát.

Lassan a vihar engedett. ${wonder} ismét előbukkant a felhők mögül, mint ígéret. ${pick(bridges)}`,

      festival: `Váratlanul ünnep kerekedett körülöttük. Lámpások gyúltak, illatok szálltak, és idegenek is barátokká váltak. ${place} táncba lendült.

${hero} a ${comp}sel együtt pörgött a körben. ${wonder} volt a középpont, ${threat} pedig — csodák csodája — az ünnep szélén tapsolt, ügyetlenül, de őszintén. A nevetés hangosabb volt minden félelemnél.

Az ünnep után új ajtók nyíltak. Mert az öröm néha a következő kaland kulcsa. ${pick(bridges)}`,

      dream: `Este álom szállt ${hero}ra. Az álomban ${place} másképp ragyogott, ${wonder} beszélni tudott, és a ${comp} egyenesen a csillagokból integetett.

Az álom azt súgta: a mese addig tart, amíg van bátorság továbbmenni. ${threat} az álomban sem volt csupa rossz — csak egy elakadt dal, amit még ki kell békíteni.

Amikor ${hero} felébredt, tudta a következő lépést. És a történet, mint egy végtelen szalag, továbbtekert. ${pick(bridges)}`,
    };

    return templates[beat] || templates.discovery;
  }

  function openingText(story) {
    const openings = [
      `Egyszer volt, hol nem volt, messzi tájakon, ${story.place} élt ${story.hero}. A levegő tele volt ${story.mood.light}, mintha maga a világ készülődne egy nagy, hosszan tartó mesére.`,
      `Halljátok csak. ${story.place} lakott ${story.hero}, akinek a szíve tele volt kíváncsisággal. Este halk zene szállt a távolból, és mindenki érezte: ez a történet nem fog egyhamar véget érni.`,
      `Réges-régen, ahol a csodák még mindennapos vendégek voltak, ${story.place} élt ${story.hero}. Abban a világban a meséknek nem szabtak oldalszámot.`,
    ];
    return `${pick(openings)}

${story.hero} olyan kalandra vágyott, mint amilyet te is kívántál: ${story.wish}. Útközben találkozott ${story.companion} társával. A ${story.companion.replace(/^egy /, "")} megszorította a kezét, és így szólt: Akkor induljunk. Aztán meglátták ${story.wonder} fényét, és messzebb ${story.threat} árnyékát is.

Ez volt az első fejezet. De a mese kapuja nyitva maradt.`;
  }

  function createScene(story, beat, isOpening) {
    const id = "ch-" + story.chapterNum + "-" + beat + "-" + Math.floor(Math.random() * 100000);
    const text = isOpening ? openingText(story) : chapterText(story, beat);
    return {
      id,
      chapter: story.chapterNum + ". fejezet",
      beat,
      text,
      choices: makeChoices(),
      ending: false,
    };
  }

  function buildStory(opts) {
    const wish = (opts.wish || "").trim() || randomWish();
    const world = detectWorld(wish);
    const moodKey = opts.mood || pick(["vidam", "kalandos", "mesés"]);
    const story = {
      title: pick(world.titleBits),
      hero: (opts.heroName || "").trim() || pick(HEROES),
      companion: extractCompanion(wish, world),
      worldId: world.id,
      wish,
      moodKey,
      mood: moodFlavor(moodKey),
      place: pick(world.places),
      wonder: pick(world.wonders),
      threat: pick(world.threats),
      chapterNum: 1,
      recentBeats: ["discovery"],
      scenes: {},
      currentId: null,
      log: [],
      finished: false,
    };

    const scene = createScene(story, "discovery", true);
    story.scenes[scene.id] = scene;
    story.currentId = scene.id;
    return story;
  }

  function getScene(story) {
    return story.scenes[story.currentId];
  }

  function choose(story, action) {
    if (story.finished) return getScene(story);

    const current = getScene(story);
    story.log.push({
      chapter: current.chapter,
      text: current.text,
      choiceTo: action,
    });

    if (action === "__end__") {
      return finishStory(story);
    }

    story.chapterNum += 1;
    maybeShiftSetting(story);
    const beat = pickBeat(story, action);
    story.recentBeats = (story.recentBeats || []).concat([beat]).slice(-4);

    const scene = createScene(story, beat, false);
    story.scenes[scene.id] = scene;
    story.currentId = scene.id;
    return scene;
  }

  function finishStory(story) {
    const current = getScene(story);
    if (!story.log.length || story.log[story.log.length - 1].text !== current.text) {
      story.log.push({
        chapter: current.chapter,
        text: current.text,
        choiceTo: "__end__",
      });
    }

    story.chapterNum += 1;
    const id = "ending-" + Date.now();
    const comp = story.companion.replace(/^egy /, "");
    const text = `Aznap ${story.hero} és ${comp} leültek egy csendes fénykörbe ${story.place}. Nem azért, mert vége a mesének örökre — csak azért, mert minden jó kalandnak jár egy mély lélegzet.

${story.wonder} még mindig ragyogott a távolban, mint nyitott kapu. ${story.threat} árnyéka sem tűnt el teljesen, csak megszeldült. ${story.hero} mosolygott.

Ezt a részt most lezárjuk. De ha újra kívánod, a történet bármikor folytatódhat. Itt a (mai) vége, fuss el véle — a csoda maradjon ébren.`;

    const scene = {
      id,
      chapter: "Pihenő",
      text,
      choices: [],
      ending: true,
    };
    story.scenes[id] = scene;
    story.currentId = id;
    story.finished = true;
    return scene;
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
    finishStory,
    fullTranscript,
    pick,
  };
})(window);
