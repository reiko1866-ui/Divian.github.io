/**
 * Mesehang — Disney-szerű, hosszabb, változatos interaktív mesék
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
      places: ["egy ősi erdő mélyén", "egy sűrű bükkerdő szélén", "egy mohás, lámpafényes ösvényen"],
      companions: ["egy beszélő róka", "egy gyors mókus", "egy bölcs bagoly", "egy hűséges kutya"],
      wonders: ["tűzlegyek körtánca", "egy éneklő patak", "egy holdfényes tisztás"],
      threats: ["egy zavarodott viharlélek", "egy mogorva vaddisznó", "egy irigy holló"],
      keywords: ["erdő", "erdo", "fa", "róka", "roka", "mókus", "mokus", "liget", "bagoly"],
    },
    kastely: {
      id: "kastely",
      titleBits: ["A csillárkert", "A báltermi ígéret", "A tükörterem", "A királyi kert"],
      places: ["egy aranyló kastélykertben", "egy csilláros bálteremben", "egy tükrös folyosón"],
      companions: ["egy udvari egér", "egy beszélő gyertyatartó", "egy kedves szakács"],
      wonders: ["egy lebegő tánczene", "egy virágzó üvegház", "egy kívánságkút"],
      threats: ["egy irigy udvaronc", "egy elfeledett átok", "egy kapzsi főminiszter"],
      keywords: ["kastély", "kastely", "herceg", "hercegnő", "hercegno", "bál", "bal", "király", "kiraly", "palota"],
    },
    tenger: {
      id: "tenger",
      titleBits: ["A hullámok dala", "A szigetlámpa", "A delfinek öble", "A kagylószív"],
      places: ["egy csillogó tengerparton", "egy színes korallöbölben", "egy szeles kikötőben"],
      companions: ["egy kíváncsi delfin", "egy éneklő sirály", "egy kedves teknős"],
      wonders: ["egy világító korallkert", "egy éneklő hullám", "egy szivárványos permet"],
      threats: ["egy mohó örvényúr", "egy viharos tengeri király", "egy irigy polip"],
      keywords: ["tenger", "óceán", "ocean", "hajó", "hajo", "hal", "delfin", "sziget", "hullám", "hullam"],
    },
    varos: {
      id: "varos",
      titleBits: ["A tetőjárók éneke", "A lámpásutcácska", "A zenélő piac", "Az óra torony álma"],
      places: ["egy lámpafényes utcácskán", "egy zsúfolt piacon", "egy toronyóra tövében"],
      companions: ["egy ügyes macska", "egy utcazenész", "egy kis postagalamb"],
      wonders: ["egy éjszakai lámpásünnep", "egy lebegő szappanbuborék-felhő", "egy titkos kert a háztetők között"],
      threats: ["egy szigorú őrmester", "egy irigy kereskedő", "egy zord kapuőr"],
      keywords: ["város", "varos", "utca", "ház", "haz", "macska", "piac"],
    },
    ur: {
      id: "ur",
      titleBits: ["A holdbogyó kert", "Csillagközi barátság", "A kis üstökös", "A tejút-hinta"],
      places: ["egy színes űrállomáson", "egy csendes holdkertben", "egy üstökös hátán"],
      companions: ["egy kedves robot", "egy kis űrmacska", "egy nevető üstökös"],
      wonders: ["egy tejút-hinta", "egy csillagszóró zápor", "egy lebegő holdvirág"],
      threats: ["egy zavarodott űrvihar", "egy irigy holdőr", "egy magányos aszteroida"],
      keywords: ["űr", "ur", "űrhajó", "urhajo", "bolygó", "bolygo", "robot", "rakéta", "raketa", "csillag"],
    },
    sarkany: {
      id: "sarkany",
      titleBits: ["A szelíd tűz", "A sárkánybál", "A lávahíd", "A pikkelyes barátság"],
      places: ["egy meleg lávabarlang közelében", "egy tűzhegy tövében", "egy kőhídon a szakadék felett"],
      companions: ["egy félénk kis sárkány", "egy füstös gyík", "egy bátor kecske"],
      wonders: ["egy színes tűzijáték-lehelet", "egy aranyló lávató", "egy meleg kőszív"],
      threats: ["egy irigy kőóriás", "egy mogorva lávakirály", "egy kapzsi kincsvadász"],
      keywords: ["sárkány", "sarkany", "tűz", "tuz", "tojás", "tojas", "barlang", "hegy"],
    },
    teli: {
      id: "teli",
      titleBits: ["A hópehelybál", "A száncsengő-dal", "A jégvirágkert", "A meleg ablak"],
      places: ["egy havas erdei úton", "egy befagyott tó partján", "egy füstölgő házikóban"],
      companions: ["egy meleg bundás kutya", "egy táncoló hópehelytündér", "egy kedves szarvas"],
      wonders: ["egy jégvirágkert", "egy csengős szánút", "egy meleg kakaógőz"],
      threats: ["egy fázós jégúr", "egy viharos északi szél", "egy mogorva hótorlasz"],
      keywords: ["tél", "tel", "hó", "ho", "karácsony", "szán", "jég", "jeg", "mikulás", "mikulas"],
    },
    allat: {
      id: "allat",
      titleBits: ["A baromfiudvar bálja", "A nyúl és a teknős", "A méhkirálynő dala", "A három barát"],
      places: ["egy vidám baromfiudvarban", "egy zöld mező közepén", "egy méhkaptár tövében"],
      companions: ["egy okos nyúl", "egy lassú teknős", "egy zümmögő méhecske", "egy büszke kakas"],
      wonders: ["egy virágos réti körjáték", "egy mézédes ünnep", "egy napsugár-hinta"],
      threats: ["egy éhes róka", "egy lustaság szelleme", "egy irigy varjú"],
      keywords: ["állat", "allat", "nyúl", "nyul", "teknős", "teknos", "méh", "meh", "kakas", "tyúk", "tyuk"],
    },
  };

  const PLOT_TYPES = ["friendship", "festival", "journey", "rescue", "wish", "contest"];

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
    "egy szakács, aki a kastélyban elfeledett receptet keres",
    "egy szarvas, aki hazavezet a hóban",
    "egy méhecske, aki a méhkirálynő ünnepére készül",
    "egy postagalamb, aki fontos üzenetet visz a tetőn át",
    "egy teknős, aki először látja a tengert",
    "egy kőóriás, aki megtanul nevetni",
    "egy űrmacska és a tejút-hinta",
    "egy bagoly, aki éjszakai bált rendez az erdőben",
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
    if (Math.random() < 0.6) return pick(TOPIC_SEEDS);
    const world = pick(Object.values(WORLDS));
    const hero = pick(["egy kislány", "egy kisfiú", "egy testvérpár", "egy kíváncsi gyerek", "egy bátor herceg"]);
    const companion = pick(world.companions).replace(/^egy /, "");
    const place = pick(world.places);
    const wonder = pick(world.wonders);
    const patterns = [
      `${hero} és ${companion} kalandja ${place}`,
      `${hero}, aki először látja: ${wonder}`,
      `egy mese ${companion} társaságában, ${place}`,
      `${hero} megmenti a napot ${place}, ${companion} segítségével`,
      `${hero} eljut a nagy ünnepre, ahol várja: ${wonder}`,
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
    if (!best || score === 0) return pick(Object.values(WORLDS));
    return best;
  }

  function detectPlot(wish) {
    const t = (wish || "").toLowerCase();
    if (/ünnep|unnep|bál|bal|karácsony|karacsony|festa/.test(t)) return "festival";
    if (/ment|megment|veszély|veszely|vihar/.test(t)) return "rescue";
    if (/verseny|versen|versenyez|gyorsabb/.test(t)) return "contest";
    if (/kívánság|kivansag|varázs|varazs|átok|atok/.test(t)) return "wish";
    if (/haza|út|ut|utaz|jár|jar/.test(t)) return "journey";
    if (/barát|barat|barátság|baratsag/.test(t)) return "friendship";
    return pick(PLOT_TYPES);
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
        light: "nevetés, csillogás és játékos zene",
        verb: "vidáman",
        ending: "és a nap oly fényesen ért véget, hogy még a csillagok is tapsikolni látszottak",
      };
    }
    if (mood === "kalandos") {
      return {
        light: "bátorság, dobogó szív és nagy lélegzetek",
        verb: "merészen",
        ending: "és ${hero} nevét sokáig emlegették a kalandok között",
      };
    }
    return {
      light: "csoda, lágy fény és halk dallam",
      verb: "csodálkozva",
      ending: "és a csoda még hosszú ideig ott ragyogott a szívekben",
    };
  }

  function buildScenes(ctx) {
    const { hero, companion, place, wonder, threat, wish, mood, plot } = ctx;
    const compShort = companion.replace(/^egy /, "");

    const openings = [
      `Egyszer volt, hol nem volt, messzi tájakon, ${place} élt ${hero}. A levegő tele volt ${mood.light} ígéretével, mintha maga a világ készülődne egy nagy mesére.`,
      `Halljátok csak ezt a mesét. ${place} lakott ${hero}, akinek a szíve tele volt kíváncsisággal. Este, amikor a fények meglágyultak, úgy tűnt, mintha halk zene szállna a távolból.`,
      `Réges-régen, ahol a csodák még mindennapos vendégek voltak, ${place} élt ${hero}. Abban a világban minden kis szellő tudott titkot súgni, ha valaki elég figyelmesen hallgatózott.`,
    ];

    const wishLine = wish
      ? `Éppen olyan kalandra vágyott, mint amilyet te is kívántál: ${wish}.`
      : "Valami igazán csodás napra vágyott, amilyet csak a legszebb mesékben szokás elmesélni.";

    // Shared longer middle beats vary by plot
    const plots = {
      friendship: {
        start: `${pick(openings)} ${wishLine}

Egy nap ${hero} ${mood.verb} elindult, és hamarosan találkozott ${companion} társával. A ${compShort} először félénken bújt elő, aztán lassan elmosolyodott. „Úgy érzem, ma valami fontos fog történni” — mondta halkan. Nem messze felragyogott ${wonder}, de ${threat} árnyéka is megjelent a közelben. ${hero} megfogta a társ kezét, és úgy döntött: ezen a napon nem hagyja magára az új barátját.`,
        midA: `${hero} és a ${compShort} együtt sétáltak tovább. Útközben apró csodák fogadták őket: fények táncoltak a levegőben, a kövek melegen koppantak a lépések alatt, és egy pillanatra úgy tűnt, mintha az egész táj együtt lélegezne velük.

Aztán megálltak egy tisztáson. Ott ült ${threat}, magányosan és zavarodottan. „Senki sem ért engem” — morgott. ${hero} szíve megsajdult. A ${compShort} suttogta: „Talán nem ellenség. Talán csak elfelejtette, milyen a barátság.”`,
        midB: `Egy másik ösvényen ${hero} meghallotta, amint ${wonder} halk dallama hívja őket. A hang meleg volt, mint egy ölelés. Közben azonban ${threat} félelme is nőtt, és a táj egy része elkomorodott.

${hero} megállt. Érezte, hogy most kell választania: sietni a csoda felé egyedül, vagy visszamenni a ${compShort}ért és együtt szembenézni a bajjal. A Disney-mesékben pedig a legszebb varázslat gyakran épp a hűségből születik.`,
        climax: `${hero} a ${compShort} oldalán állt, és nyugodt hangon szólalt meg. „Nem azért jöttünk, hogy elvegyünk tőled bármit. Azért jöttünk, hogy megmutassuk: nem vagy egyedül.”

Egy pillanatig csend volt. Aztán ${threat} válla meglazult, mintha lehullott volna róla egy nehéz köpeny. ${wonder} fénye szelíden körülölelte őket. A ${compShort} felnevetett, ${hero} pedig úgy érezte, a szíve egy kicsit nagyobb lett.`,
      },
      festival: {
        start: `${pick(openings)} ${wishLine}

Aznap este nagy ünnepre készült mindenki. ${wonder} már csillogott a távolban, és a levegő tele volt édes illattal meg halk zenével. ${hero} ${mood.verb} sietett, amikor összefutott ${companion} társával. „Késünk!” — kiáltotta a ${compShort}. „Ha nem érünk oda időben, elmarad a legszebb pillanat.” Ám az úton ${threat} zavaros kedve miatt a fények hunyorogni kezdtek.`,
        midA: `Az ösvényen lámpások sorakoztak, mint apró csillagok. ${hero} és a ${compShort} nevetve ugráltak egyik fényfoltról a másikra. Minden lépésnél hangosabb lett a zene.

De félúton ${threat} elállta az utat. „Ez az ünnep nem nektek való” — mondta mogorván. A ${compShort} megszorította ${hero} kezét. Valahol a háttérben ${wonder} még mindig hívta őket, lágyan és türelmesen, mint egy régi barát.`,
        midB: `${hero} megpillantotta a hátulsó ösvényt, ahol csendesebben lehetett volna továbbmenni. A ${compShort} viszont a zenés főutat szerette volna. „Ha félünk, az ünnep is elhalványul” — súgta.

A szél közben ${wonder} fényéből apró szikrákat sodort feléjük. ${hero} szívében összekeveredett a bátorság és a gyengédség. Tudta: a legszebb ünnepek nem a tökéletes úton születnek, hanem azon, amelyet együtt járnak végig.`,
        climax: `${hero} egy mélyet sóhajtott, aztán ${threat} felé fordult. „Gyere velünk. Az ünnep akkor igazán szép, ha senki sem marad a sötétben.”

Először senki sem mozdult. Aztán a ${compShort} elkezdett egy egyszerű, vidám dallamot dúdolni. ${threat} lassan, ügyetlenül belépett a körbe. ${wonder} fénye fellángolt, a zene megerősödött, és az egész táj úgy ragyogott, mintha maga a boldogság öltött volna testet.`,
      },
      journey: {
        start: `${pick(openings)} ${wishLine}

${hero} elindult hazafelé, mert napnyugta előtt szeretett volna visszaérni. Az út először könnyűnek tűnt, tele volt ${mood.light} jeleivel. Útközben csatlakozott hozzá ${companion}. „Ismerem a rövidebb ösvényt” — mondta a ${compShort}. De ahogy mélyebbre értek, ${threat} árnyéka ráborult a tájra, és a megszokott jelek eltűntek. Valahol előttük mégis várt rájuk ${wonder}.`,
        midA: `Mentek, mendegéltek. A fák között fényjáték táncolt, a porban apró lábnyomok meséltek korábbi vándorokról. ${hero} néha megállt, hogy meghallgassa a csendet.

A ${compShort} egyszerre megmerevedett. „Hallod? ${threat} közelít.” A levegő hűvösebb lett, a színek elhalványultak. Mégis, a távolban ${wonder} gyengéd ragyogása mutatta az irányt, mintha azt súgná: ne add fel, még nincs vége a mesének.`,
        midB: `Egy elágazáshoz értek. Az egyik út gyorsabbnak látszott, de sötét volt. A másik hosszabb, viszont tele volt meleg fénnyel és halk zenével.

${hero} a ${compShort}re nézett. „Ha eltévedünk, legalább együtt tévedünk el.” A válasz egy bátor mosoly volt. Ekkor a szél ${wonder} illatát hozta feléjük, és ${hero} úgy érezte, a helyes út nem mindig a legrövidebb.`,
        climax: `Végül ${hero} hangosan kimondta, amit a szíve már tudott. „Nem az a cél, hogy egyedül érjünk haza. Az a cél, hogy senkit se hagyjunk az út szélén.”

${threat} meglepődött ezen a mondaton. A haragja lassan elolvadt, mint hó a tavaszi napon. ${wonder} fénye utat nyitott előttük, a ${compShort} pedig felujjongott. ${hero} akkor már látta a messzeségben az otthon meleg ablakát is.`,
      },
      rescue: {
        start: `${pick(openings)} ${wishLine}

Hirtelen riadt kiáltás hasított a csendbe. ${hero} ${mood.verb} odafutott, és meglátta ${companion} társát, akit ${threat} félelme fogva tartott. A ${compShort} nem tudott továbbmenni. A távolban ${wonder} még mindig ragyogott, mintha erőt akarna adni. ${hero} tudta: ha most megfordul, a mese szomorú marad. Ha viszont segít, minden megváltozhat.`,
        midA: `${hero} közelebb lépett, de nem kiabált. Figyelt. Látta, hogy ${threat} nem csak haragos, hanem ijedt is. A ${compShort} halkan suttogta: „Talán ha megértjük, mi fáj neki, elenged.”

Körülöttük a táj remegett. Mégis, ahogy ${hero} kitartott, apró fények jelentek meg a földön, és ${wonder} melege lassan visszatért a levegőbe.`,
        midB: `Egy másik irányból kerülőút nyílt. A ${compShort} biztatta ${hero}t, hogy legyen ravasz és gyors. „Ha eltereljük a figyelmét, kiszabadulok.”

${hero} szíve gyorsan vert. A Disney-mesék hősei ilyenkor nem csak bátrak: okosak és jók is. ${wonder} egy villanásnyi ötletet adott, és ${hero} megértette, hogy a mentéshez együttműtködés kell, nem egyedüli hősködés.`,
        climax: `${hero} határozottan megszólalt. „Engedd el. Nem ellenségnek jöttünk. Segíteni jöttünk — neked is.”

A szavak után csend lett, aztán ${threat} lassan hátrébb lépett. A ${compShort} szabadon fellélegzett, és ${hero}hoz rohant. ${wonder} fénye körülölelte mindhármukat, mintha a világ maga is megkönnyebbült volna.`,
      },
      wish: {
        start: `${pick(openings)} ${wishLine}

Azon az estén ${hero} megtalálta ${wonder} csillogását. A csoda megszólalt, lágyan, mint egy régi zenedoboz. „Kívánhatsz valamit” — súgta. ${hero} mellett ott állt már ${companion} is. De mielőtt a kívánság kimondódott volna, megjelent ${threat}, és figyelmeztetett: „A kívánságoknak ára van, ha csak magadnak kéred.”`,
        midA: `${hero} elgondolkodott. Olyan sok mindent kívánhatott volna: ragyogást, sikert, végtelen kalandot. A ${compShort} azonban a kezére tette a mancsát, és csak annyit mondott: „Nézz körül. Mi hiányzik igazán?”

A táj csendben várt. ${wonder} fénye nem sürgetett. ${threat} árnyéka viszont emlékeztetett rá, hogy a kapzsiság elveheti a varázst.`,
        midB: `Egy második kívánság-ösvény is megjelent, csillogóbb és hangosabb az elsőnél. Könnyű lett volna azon elindulni. A ${compShort} mégis a halkabb fény felé bólintott.

„A legszebb kívánságok” — mondta — „azok, amelyek után többen mosolyognak.” ${hero} belenézett ${wonder} tükörképébe, és meglátta nemcsak magát, hanem a barátait is.`,
        climax: `${hero} végül így szólt: „Azt kívánom, hogy a fény, a bátorság és a nevetés jusson mindenkinek, aki ma magányos.”

A kívánság szelíd szellőként futott szét. ${threat} haragja eloszlott, ${wonder} megsokszorozódott, a ${compShort} pedig örömében körbetáncolta ${hero}t. A varázslat nem elvett, hanem adott.`,
      },
      contest: {
        start: `${pick(openings)} ${wishLine}

Kihirdették a nagy versenyt: aki először eléri ${wonder} fényét, aznap hőse lesz a tájnak. ${hero} ${mood.verb} nevezett, és mellé szegődött ${companion}. „Nem kell elsőnek lennünk” — mondta a ${compShort} —, „elég, ha végigmegyünk együtt.” Ám ${threat} is elindult, és mindent megtett, hogy elrontsa a többiek örömét.`,
        midA: `A pálya tele volt játékos akadályokkal: táncoló fénykörökkel, lágy szélhídakkal, nevetős visszhangokkal. ${hero} és a ${compShort} hol futottak, hol nevettek, hol egymást húzták előre.

Egyszer csak ${threat} keresztbe tett egy ösvényt. A többiek megálltak ijedten. ${hero} azonban észrevette, hogy a baj nem csak a versenyről szól: a félelem apasztja el a csodát.`,
        midB: `Egy rövidítés is kínálkozott, ravasz és csillogó. A ${compShort} rázta a fejét. „Ha csalunk, a győzelem üres lesz.”

${hero} ránézett ${wonder} távoli fényére, aztán a társaira. A Disney-mesékben a valódi győzelem gyakran nem a célvonalon születik, hanem abban a pillanatban, amikor valaki felemeli a másikat.`,
        climax: `${hero} megállt a cél előtt, visszafordult, és segített azoknak, akik elestek — még ${threat}nek is. „Gyere. Fejezzük be együtt.”

Amikor végül mindannyian elérték ${wonder} fényét, nem egy győztes neve hangzott el, hanem sok nevetés. A táj ünnepelt, a ${compShort} pedig büszkén nézett ${hero}ra: ez volt a legszebb verseny.`,
      },
    };

    const p = plots[plot] || plots.friendship;

    const endingHome = `Ahogy a nap leáldozott, ${hero} és a ${compShort} hazafelé indultak. Az út már nem tűnt hosszúnak, mert tele volt emlékekkel: fénnyel, bátorsággal, és azzal a különös melegséggel, amit csak a jó mesék hagynak maguk után.

Otthon ${hero} elmesélte, mi történt ${place}. A hallgatók szeme csillogott. ${mood.ending.replace("${hero}", hero)}.

Itt a vége, fuss el véle — de a csoda maradjon veled.`;

    const endingParty = `Aznap este nagy örömünnep kerekedett ${place}. ${wonder} körül tánc indult, a zene lágyan emelkedett, és még ${threat} is ott ült a kör szélén — már nem ijesztő vendégként, hanem valakiként, akit végre meghívtak.

${hero} a ${compShort} mellett állt, és nevetett. Annyi fény volt a levegőben, hogy az árnyékoknak sem maradt helyük. ${mood.ending.replace("${hero}", hero)}.

Itt a vége, fuss el véle — de a dal még sokáig szólt.`;

    return {
      start: {
        id: "start",
        chapter: "1. fejezet",
        text: p.start,
        choices: shuffle([
          { label: "Együtt folytatják, kéz a kézben", next: "midA" },
          { label: "A fényesebb, zenés ösvényt választják", next: "midB" },
          { label: "Előbb megértik, mi bántja a bajt", next: "midA" },
        ]),
      },
      midA: {
        id: "midA",
        chapter: "2. fejezet",
        text: p.midA,
        choices: shuffle([
          { label: "Kedvességgel szólítják meg", next: "climax" },
          { label: "Okos tervvel oldják meg", next: "climax" },
        ]),
      },
      midB: {
        id: "midB",
        chapter: "2. fejezet",
        text: p.midB,
        choices: shuffle([
          { label: "A hosszabb, igazabb úton mennek", next: "climax" },
          { label: "Visszamennek a társért, és együtt mennek tovább", next: "midA" },
        ]),
      },
      climax: {
        id: "climax",
        chapter: "3. fejezet",
        text: p.climax,
        choices: shuffle([
          { label: "Hazaviszik a nap emlékét", next: "ending_home" },
          { label: "Ünnepet rendeznek ott helyben", next: "ending_party" },
        ]),
      },
      ending_home: {
        id: "ending_home",
        chapter: "Befejezés",
        text: endingHome,
        choices: [],
        ending: true,
      },
      ending_party: {
        id: "ending_party",
        chapter: "Befejezés",
        text: endingParty,
        choices: [],
        ending: true,
      },
    };
  }

  function buildStory(opts) {
    const wish = (opts.wish || "").trim() || randomWish();
    const world = detectWorld(wish);
    const plot = detectPlot(wish);
    const hero = (opts.heroName || "").trim() || pick(HEROES);
    const companion = extractCompanion(wish, world);
    const mood = moodFlavor(opts.mood || pick(["vidam", "kalandos", "mesés"]));
    const title = pick(world.titleBits);
    const place = pick(world.places);
    const wonder = pick(world.wonders);
    const threat = pick(world.threats);

    const scenes = buildScenes({
      hero,
      companion,
      place,
      wonder,
      threat,
      wish,
      mood,
      plot,
    });

    return {
      title,
      hero,
      companion,
      world: world.id,
      plot,
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
