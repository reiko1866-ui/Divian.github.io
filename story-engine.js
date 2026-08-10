/**
 * Interaktív Mesemondó — klasszikus / Disney-stílusú mesevilágok
 * Nyilvános népmesék és tündérmesék hangulatából épít eredeti, végtelen kalandokat.
 */
(function (global) {
  const HEROES = [
    "Ella", "Ádám", "Nóra", "Bence", "Léna", "Dániel", "Sára", "Máté",
    "Zsófia", "Kristóf", "Anna", "Gábor",
  ];

  /**
   * Disney-stílusú világok = klasszikus tündérmese-motívumok
   * (nem másolunk védett neveket / párbeszédet, hanem a mesevilág hangulatát)
   */
  const WORLDS = {
    hamupipoke: {
      id: "hamupipoke",
      titleBits: ["A kristálycipellő bálja", "Az éjféli fogadalom", "A tükörtermi ígéret"],
      places: [
        "a királyi bálterem aranyló lépcsőjén",
        "a padlás poros csendjében",
        "a kastélykert holdfényes sétányán",
        "a konyha meleg kályhája mellett",
      ],
      companions: ["egy ezüstszárnyú tündérkeresztanya", "egy ügyes egérke", "egy hűséges lovászfiú", "egy beszélő kutyus"],
      wonders: ["egy pár csillogó cipellő", "egy tökből lett hintó", "egy varázspálca-szikra", "egy éjféli óraütés"],
      threats: ["egy irigy mostoha", "egy gőgös udvaronc", "egy kapzsi intéző", "egy álnok báltermi pletyka"],
      keywords: ["hamupipőke", "hamupipoke", "cipellő", "cipello", "bál", "bal", "tündér", "tunder", "mostoha", "kastély", "kastely", "herceg"],
      openingHook: "ahol egyetlen bál megváltoztathatja a sorsot",
    },
    hofeherke: {
      id: "hofeherke",
      titleBits: ["A tükör titka", "A hét barlang dala", "Az erdei menedék"],
      places: [
        "a sötét tükrös toronyban",
        "a hét törpe meleg kunyhójában",
        "az almafákkal szegélyezett erdei úton",
        "egy kristálytiszta forrás partján",
      ],
      companions: ["egy kedves törpe", "egy erdei őzike", "egy bölcs madárkirály", "egy hűséges bányász"],
      wonders: ["egy beszélő tükör", "egy piros alma fénye", "egy üvegkoporsó-csillogás", "egy erdei kórus"],
      threats: ["egy hiú királynő", "egy mérgezett ajándék", "egy vadász, aki habozik", "egy sötét erdei átok"],
      keywords: ["hófehérke", "hofeherke", "tükör", "tukor", "alma", "törpe", "torpe", "királynő", "kiralyno", "erdő", "erdo"],
      openingHook: "ahol a tükör mindig az igazságot súgja",
    },
    hableany: {
      id: "hableany",
      titleBits: ["A koralltrón dala", "A hang nélküli ígéret", "A hullámok kapuja"],
      places: [
        "a korallpalota fényében",
        "egy hajóroncs ezüstös mélyén",
        "a habos tengerpart holdfényénél",
        "egy világító medúzaösvényen",
      ],
      companions: ["egy hűséges tropikushal", "egy kedves teknősbébi", "egy éneklő delfin", "egy hajósfiú a parton"],
      wonders: ["egy elveszett hang", "egy tengeri gyöngy", "egy vihar utáni szivárvány", "egy varázskagyló"],
      threats: ["egy sötét tengeri boszorkány", "egy kapzsi hajóskapitány", "egy örvénylő mélység", "egy tiltott felszíni törvény"],
      keywords: ["hableány", "hableany", "sellő", "sello", "tenger", "hang", "kagyló", "kagylo", "korall", "herceg", "óceán", "ocean"],
      openingHook: "ahol a tenger és a szárazföld egymásba szerelmes",
    },
    lampas: {
      id: "lampas",
      titleBits: ["A lámpás három kívánsága", "A bazár titka", "A repülő szőnyeg"],
      places: [
        "a zsúfolt bazár színes utcáin",
        "egy elásott barlang aranyhomokjában",
        "a palota márványtornyában",
        "egy repülő szőnyeg hátán az éjszakai ég alatt",
      ],
      companions: ["egy tréfás džinn a lámpásból", "egy okos utcai majom", "egy bátor hercegnő álruhában", "egy hűséges szőnyeg"],
      wonders: ["egy régi olajlámpás", "egy aranyló kívánság", "egy csillagösvény az égen", "egy varázsszőnyeg"],
      threats: ["egy hataloméhes varázsló", "egy irigy vezír", "egy bezárt barlangcsapda", "egy hamis kívánság"],
      keywords: ["aladdin", "aláddin", "lámpás", "lampas", "džinn", "dzsinn", "kívánság", "kivansag", "bazár", "bazar", "szőnyeg", "szonyeg", "barlang"],
      openingHook: "ahol egyetlen kívánság felforgathat egy egész királyságot",
    },
    szornyeteg: {
      id: "szornyeteg",
      titleBits: ["A rózsa átka", "A varázskastély", "A tükörterem szíve"],
      places: [
        "egy elátkozott kastély havas kertjében",
        "a könyvtár végtelen polcai közt",
        "egy nyugati szárny lezárt ajtaja előtt",
        "egy táncteremben, ahol a bútorok élnek",
      ],
      companions: ["egy beszélő gyertyatartó", "egy kedves teáskanna", "egy bátor lány a faluból", "egy hűséges karóra"],
      wonders: ["egy varázsrózsa", "egy élő kastély", "egy tükör, ami messzire lát", "egy bálzene a semmiből"],
      threats: ["egy régi átok", "egy dühös szörnyű úr", "egy irigy falusi vadász", "egy hervadó rózsaszirmok ideje"],
      keywords: ["szörny", "szorny", "rózsa", "rozsa", "átok", "atok", "szépség", "szepseg", "kastély", "kastely", "bál", "bal", "könyvtár", "konyvtar"],
      openingHook: "ahol a szeretet oldhatja fel a legsötétebb átkot is",
    },
    rapunzel: {
      id: "rapunzel",
      titleBits: ["A torony lámpásai", "A fonott aranyhaj", "Az égi út"],
      places: [
        "egy magányos torony csúcsán",
        "a lámpásokkal teli völgy felett",
        "egy titkos erdei ösvényen",
        "egy királyság ünnepi utcáin",
      ],
      companions: ["egy furfangos vándor", "egy hűséges kaméleon", "egy ló, aki mindig visszatér", "egy öreg asszony, aki nem az, aminek látszik"],
      wonders: ["egy fonott aranyhaj", "ezer lebegő lámpás", "egy elveszett koronajel", "egy dal a torony ablakából"],
      threats: ["egy birtokló őrző", "egy sötét árulás", "egy szakadék a szabadság előtt", "egy hamis ígéret"],
      keywords: ["rapunzel", "rapunzel", "torony", "haj", "lámpás", "lampas", "fonott", "vándor", "vandor"],
      openingHook: "ahol a szabadság fényei az égen úsznak",
    },
    jegkiraly: {
      id: "jegkiraly",
      titleBits: ["A jégpalota", "A szív olvadása", "Az északi fény kapuja"],
      places: [
        "egy kristályos jégpalotában",
        "egy havas fjord partján",
        "egy meleg falusi piactéren a hidegben",
        "egy északi fényes hegygerincen",
      ],
      companions: ["egy hűséges testvér", "egy vidám hóember", "egy szánon járó kereskedő", "egy rénszarvas"],
      wonders: ["egy jégből nőtt palota", "egy olvadó szívfény", "egy északi fény-híd", "egy varázskezű hóvihar"],
      threats: ["egy elszabadult jégvarázs", "egy sötét herceg álcája", "egy örök tél", "egy félelem, ami fagyaszt"],
      keywords: ["jég", "jeg", "hó", "ho", "tél", "tel", "jégkirálynő", "jegkiralyno", "frozen", "palota", "fjord", "hóember", "hoember"],
      openingHook: "ahol a szeretet melege erősebb minden fagynál",
    },
    oroszlan: {
      id: "oroszlan",
      titleBits: ["A szavanna koronája", "A körforgás dala", "A sziklák visszhangja"],
      places: [
        "a napfelkeltés szikláján",
        "a szavanna aranyló füvében",
        "egy sötét szurdok árnyékában",
        "egy oázis pálmái alatt",
      ],
      companions: ["egy bölcs mandrill", "egy tréfás meerkat", "egy kövér, kedves varacskosdisznó", "egy hűséges oroszlánbarát"],
      wonders: ["egy ősök csillagképe", "egy koronázó napfelkelte", "egy életkör dal", "egy eső utáni zöldülés"],
      threats: ["egy irigy nagybácsi", "egy hiéna csapat", "egy aszály", "egy elveszett büszkeség"],
      keywords: ["oroszlán", "oroszlan", "szavanna", "korona", "büszkeség", "buszkeseg", "afrika", "hiéna", "hiena", "szikla"],
      openingHook: "ahol az élet nagy körforgása soha nem ér véget",
    },
    sohaorszag: {
      id: "sohaorszag",
      titleBits: ["A sohaország csillaga", "A kalózhajó", "A tündérpor ösvény"],
      places: [
        "egy lebegő sziget felett",
        "egy kalózhajó árbockosarában",
        "egy indián tábor tábortüzénél",
        "egy sellőöböl holdfényénél",
      ],
      companions: ["egy apró tündér", "egy elveszett fiúcsapat", "egy kedves sellőlány", "egy okos papagáj"],
      wonders: ["egy marék tündérpor", "egy második csillag jobbra", "egy örök gyerekkor-sziget", "egy árnyék, ami él"],
      threats: ["egy kapzsi kalózkapitány", "egy krokodil a mélyből", "egy felnőtté válás félelme", "egy vihar a csillagok közt"],
      keywords: ["peter", "pan", "sohaország", "sohaorszag", "tündérpor", "tunderpor", "kalóz", "kaloz", "sziget", "árnyék", "arnyek"],
      openingHook: "ahol soha nem kell felnőni — hacsak a szív mást nem kíván",
    },
  };

  const BEATS = [
    "ball", "quest", "betrayal", "magic", "mentor", "escape", "song",
    "trial", "reveal", "storm", "ally", "climax_build",
  ];

  const TOPIC_SEEDS = [
    "Hamupipőke stílusú bál a királyi kastélyban",
    "Hófehérke és a beszélő tükör titka",
    "Egy hableány, aki a felszínre vágyik",
    "Egy lámpás három kívánsága a bazárban",
    "Egy elátkozott kastély és egy varázsrózsa",
    "Egy toronyba zárt lány és az ezer lámpás",
    "Egy jégpalota, ahol a szív megfagyott",
    "Egy oroszlánkölyök útja a napfelkeltés sziklájához",
    "Sohaország és a második csillag jobbra",
    "Egy hercegnő álruhában a bál előtt",
    "Egy džinn, aki csak igaz kívánságot teljesít",
    "Egy törpebánya és egy mérgezett alma",
    "Egy tengeri boszorkány fogadása",
    "Egy repülő szőnyeg az éjszakai város felett",
    "Egy hóember, aki megmutatja az utat a jégpalotához",
  ];

  const ACTIONS = {
    kind: {
      labels: [
        "Kedvességgel és bátorsággal lép tovább",
        "Megbocsát, és új esélyt ad",
        "A szívét követi, nem a félelmet",
      ],
      nextBias: ["ally", "song", "mentor", "reveal"],
    },
    brave: {
      labels: [
        "Szembenéz a sötét erővel",
        "Bátran a veszélyes útra lép",
        "Megvédi, akit szeret",
      ],
      nextBias: ["trial", "escape", "storm", "climax_build"],
    },
    curious: {
      labels: [
        "Követi a varázslat hívását",
        "Felfedezi a tiltott szárnyat",
        "Megkérdezi a tükörtől / lámpástól az igazságot",
      ],
      nextBias: ["magic", "quest", "reveal", "ball"],
    },
    clever: {
      labels: [
        "Ravasz tervet sző a királyság megmentésére",
        "Trükkel fordítja meg a játszmát",
        "Új szövetséget köt az ellenség ellen",
      ],
      nextBias: ["betrayal", "escape", "trial", "quest"],
    },
    rest: {
      labels: [
        "Megpihen, és erőt merít a dalból",
        "A mentor tanácsát kéri",
        "Egy bálon / ünnepen újra reményt talál",
      ],
      nextBias: ["song", "mentor", "ball", "ally"],
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
    return pick(TOPIC_SEEDS);
  }

  function detectWorld(wish) {
    const text = (wish || "").toLowerCase();
    let best = null;
    let score = 0;
    for (const world of Object.values(WORLDS)) {
      let s = 0;
      for (const kw of world.keywords) {
        if (kw && text.includes(kw)) s += 1;
      }
      if (s > score) {
        score = s;
        best = world;
      }
    }
    // Disney-stílusú meglepetés: ha nincs egyértelmű találat, véletlen klasszikus világ
    return !best || score === 0 ? pick(Object.values(WORLDS)) : best;
  }

  function extractCompanion(wish, world) {
    const text = (wish || "").toLowerCase();
    const map = [
      [/tündér|tunder|keresztanya/, "egy ezüstszárnyú tündérkeresztanya"],
      [/törpe|torpe/, "egy kedves törpe"],
      [/džinn|dzsinn|szellem/, "egy tréfás džinn a lámpásból"],
      [/gyertyatartó|gyertyatarto/, "egy beszélő gyertyatartó"],
      [/hóember|hoember/, "egy vidám hóember"],
      [/delfin|hal/, "egy éneklő delfin"],
      [/tündérpor|tunder/, "egy apró tündér"],
      [/oroszlán|oroszlan/, "egy hűséges oroszlánbarát"],
    ];
    for (const [re, name] of map) {
      if (re.test(text)) return name;
    }
    return pick(world.companions);
  }

  function moodFlavor(mood) {
    if (mood === "vidam") {
      return { light: "nevetéssel és csillogással", verb: "vidáman", tone: "játékos" };
    }
    if (mood === "kalandos") {
      return { light: "dobogó szívvel és bátorsággal", verb: "merészen", tone: "epikus" };
    }
    return { light: "lágy fénnyel és csodával", verb: "áhítattal", tone: "mesés" };
  }

  function worldOf(story) {
    return WORLDS[story.worldId] || pick(Object.values(WORLDS));
  }

  function maybeShiftSetting(story) {
    if (story.chapterNum > 1 && story.chapterNum % 4 === 0) {
      const world = worldOf(story);
      story.place = pick(world.places);
      story.wonder = pick(world.wonders);
      story.threat = pick(world.threats);
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

  function makeChoices(world) {
    const keys = shuffle(Object.keys(ACTIONS)).slice(0, 3);
    return keys.map((action) => ({
      label: pick(ACTIONS[action].labels),
      next: action,
    }));
  }

  function chapterText(story, beat) {
    const hero = story.hero;
    const comp = story.companion.replace(/^egy /, "");
    const { place, wonder, threat, mood, chapterNum: n } = story;
    const world = worldOf(story);

    const continueLine = pick([
      `De a mese még nem ért véget — ${world.openingHook}.`,
      `A függöny egy pillanatra összeért, aztán újra szétnyílt: a történet folytatódott.`,
      `Ahogy a nagy Disney-mesékben is, egy csoda után mindig jön a következő próba.`,
      `A királyság lélegzetet vett. ${hero} tudta: ez csak egy fejezet volt a nagy meséből.`,
    ]);

    const templates = {
      ball: `A ${n}. fejezet egy ünneppel kezdődött ${place}. Zene szállt, selymek suhogtak, és ${wonder} úgy ragyogott, mintha az egész királyság szívdobbanása lett volna.

${hero} ${mood.verb} lépett a fénybe, ${comp} pedig az oldalán maradt. Nem csupán mulatság volt ez: a bálokon dőlnek el a sorsok. Tekintetek találkoztak, titkok cseréltek gazdát, és ${threat} árnyéka is megjelent a terem szélén — mosolyogva, túlságosan udvariasan.

${hero} érezte a ${mood.light} teli levegőt, és megértette: ma este választania kell a biztonság és a szíve között. ${continueLine}`,

      quest: `${hero} útnak indult, mert ${wonder} hívása erősebb volt minden félelemnél. ${place} ösvényei ismeretlenek voltak, mégis mintha a táj maga emlékezett volna a régi mesékre.

${comp} végig ott volt. „A nagy kalandok nem a térképen kezdődnek”, súgta, „hanem abban a pillanatban, amikor valaki elindul.” Útközben jeleket láttak: elveszett koronát, régi lábnyomot, egy félbehagyott dalt.

De ${threat} is mozgott a háttérben. A küldetés igazsága lassan kirajzolódott: nem kincs kellett, hanem bátorság. ${continueLine}`,

      betrayal: `Valaki, akiben ${hero} bízott, váratlanul elfordult. ${place} hirtelen hidegebb lett, ${wonder} fénye megremeglett, és ${threat} hangja túl közelről szólt.

${comp} megszorította ${hero} kezét. „Az árulás fáj”, mondta halkan, „de megmutatja, ki áll melletted igazán.” A Disney-mesék legszebb hősei ilyenkor nem törnek össze: felemelkednek.

${hero} letörölte a könnyét, és új fogadalmat tett. A történet sötétebb lett — ezért ragyoghat majd fényesebben. ${continueLine}`,

      magic: `A varázslat kitört ${place}. ${wonder} életre kelt: fény, dallam, lebegő por és lehetetlen remény. ${hero} ${mood.verb} nyúlt felé, és a világ egy pillanatra meghajlott.

${comp} felkiáltott a csodától. Még ${threat} is megállt, mert a valódi mágia előtt még a sötétség is elbizonytalanodik. Ám minden varázslatnak ára van, és a mese most ezt súgta a fülébe.

${hero} választott: nem a könnyű hatalmat kérte, hanem azt az erőt, ami megvédheti, akiket szeret. ${continueLine}`,

      mentor: `Megjelent egy mentor ${place} — nem feltétlenül öreg és bölcsnek látszó, de a szavaiban ott volt az egész királyság emlékezete. ${comp} bólintott: ideje volt hallgatni.

„${wonder} nem elég önmagában”, mondta a mentor. „A hős azzá válik, amit megment, nem azzá, amit megszerez.” ${threat} neve is elhangzott, és ${hero} végre megértette a tétet.

A tanács után a táj tisztábbnak tűnt. ${hero} már nem csak menekült: célja volt. ${continueLine}`,

      escape: `Futniuk kellett. ${threat} árnyéka rájuk zúdult ${place}, ajtók csapódtak, hidak ingadoztak, és ${wonder} csak villanásokban mutatta az utat.

${hero} és ${comp} egymást húzták előre. Egy Disney-kalandban a menekülés nem gyávaság: időt nyer a szívnek, hogy felkészüljön a döntő pillanatra. Egy titkos folyosó, egy váratlan szövetséges, egy utolsó ugrás —

és kiszabadultak, lihegve, élve, készen a folytatásra. ${continueLine}`,

      song: `Aztán dal támadt ${place}. Nem kötelező kórus volt ez, hanem olyan zene, ami a szereplők legmélyebb kívánságát mondta ki. ${hero} hangja összekeveredett ${comp} bátorításával.

${wonder} a dallamra ragyogott fel. Még a távoli ${threat} is hallotta — és egy pillanatra megremegett. A nagy mesékben a dal gyakran erősebb fegyver, mint a kard.

Amikor a zene elült, ${hero} már másképp állt a világban: emeltebb fejjel, tisztább szándékkal. ${continueLine}`,

      trial: `Eljött a próba. ${place} közepén ${hero} egyedül maradt egy döntéssel, miközben ${comp} csak távolabbról súghatott. ${wonder} az egyik oldalon ragyogott, ${threat} a másikon árnyékot vetett.

„Ha hibázol, nem a mese ér véget”, rebesgette a szél, „hanem valaki szíve.” ${hero} ${mood.verb} lépett, és a választása ${mood.tone} hősiességről mesélt.

A próba után sebhely és bölcsesség maradt. Pontosan annyi, amennyi a következő fejezethez kell. ${continueLine}`,

      reveal: `Egy titok lelepleződött ${place}. ${wonder} fényében kiderült, ki ${threat} valójában — és miért fájt neki annyira a világ. ${hero} döbbenten hallgatott, ${comp} pedig a vállára tette a kezét.

A legszebb mesékben a gonosz nem mindig született sötétnek. Néha csak elveszett. Ez nem mentség, de esély. ${hero} eldönthette: bosszút áll, vagy nagyobb lesz a gyűlöletnél.

A leleplezés után minden másképp hangzott. A történet mélyebb lett. ${continueLine}`,

      storm: `Vihar szakadt ${place} fölé — külső is, belső is. ${threat} ereje felszabadult, ${wonder} hunyorgott, és ${hero} majdnem elvesztette a reményt.

${comp} kiabálta a nevét a szélben. A nagy mesék viharjelenetei azért kellenek, hogy a fény utána igazibb legyen. ${hero} a földbe kapaszkodott, aztán felállt.

Amikor a vihar elvonult, a táj sebes volt, de járható. És ${hero} már tudta a következő lépést. ${continueLine}`,

      ally: `Új szövetséges érkezett ${place}. Eleinte gyanús volt, aztán nélkülözhetetlen. ${comp} óvatos maradt, ${hero} viszont megérezte: ez a találkozás nem véletlen.

Együtt erősebbek lettek, mint külön-külön. ${wonder} mintha áldását adta volna a szövetségre, miközben ${threat} máris új tervet szőtt a háttérben.

A csapat összeállt. A mese pedig felgyorsult, mint ahogy a nagy finálék előtt szokott. ${continueLine}`,

      climax_build: `Minden szál összefutott ${place}. ${wonder} és ${threat} már nem volt távoli jelkép: arasznyira álltak egymástól. ${hero} szíve úgy dobogott, mint egy egész királyság dobja.

${comp} odasúgott: „Most jön az a rész, amire emlékezni fognak.” ${hero} ${mood.verb} lépett a fénybe, készen arra, hogy a következő döntés új irányt adjon az egész mesének.

A levegő megtelt ${mood.light}. A csúcspont közelgett — de a történetnek még mindig volt hova nőnie. ${continueLine}`,
    };

    return templates[beat] || templates.quest;
  }

  function openingText(story) {
    const world = worldOf(story);
    const comp = story.companion.replace(/^egy /, "");
    return `Réges-régen, egy olyan királyságban, ${world.openingHook}, kezdődött ${story.hero} története.

${story.place} már akkor is tele volt ${story.mood.light}, amikor ${story.hero} először meghallotta a kívánságát — pont olyat, mint a tiéd: ${story.wish}. Mellé szegődött ${story.companion}, és együtt meglátták ${story.wonder} ragyogását. De messzebb, az árnyékban, ${story.threat} is mozdult.

${comp} megszorította ${story.hero} kezét. „Ez lesz a mi mesénk”, súgta. „Olyan, mint a nagyok: tele próbával, dallal, árulással és csodával.”

Az első fejezet kapuja kitárult. A történetnek pedig — mint a legszebb Disney-stílusú meséknek — nem szabtak rövid határt.`;
  }

  function createScene(story, beat, isOpening) {
    const id = "ch-" + story.chapterNum + "-" + beat + "-" + Math.floor(Math.random() * 100000);
    return {
      id,
      chapter: story.chapterNum + ". fejezet",
      beat,
      text: isOpening ? openingText(story) : chapterText(story, beat),
      choices: makeChoices(worldOf(story)),
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
      recentBeats: ["quest"],
      scenes: {},
      currentId: null,
      log: [],
      finished: false,
    };

    const scene = createScene(story, "quest", true);
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
    story.log.push({ chapter: current.chapter, text: current.text, choiceTo: action });

    if (action === "__end__") return finishStory(story);

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
      story.log.push({ chapter: current.chapter, text: current.text, choiceTo: "__end__" });
    }
    story.chapterNum += 1;
    const id = "ending-" + Date.now();
    const comp = story.companion.replace(/^egy /, "");
    const scene = {
      id,
      chapter: "Pihenő a függöny előtt",
      text: `${story.hero} és ${comp} megálltak ${story.place}. ${story.wonder} még ragyogott, ${story.threat} árnyéka pedig nem tűnt el örökre — csak várta a következő felvonást.

Mert a legszebb mesékben a „vége” gyakran csak annyi: ma este idáig tartott a kaland. Ha újra kívánod, a királyság kapuja ismét kinyílik.

Itt a (mai) vége, fuss el véle — a csoda maradjon ébren.`,
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
    if (!parts.length || parts[parts.length - 1] !== lastBlock) parts.push(lastBlock);
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
