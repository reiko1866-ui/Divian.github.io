/**
 * Divi beszélgető agy — gyerekeknek, poénos, tényleg válaszol a kérdésekre
 */
(function (global) {
  const QUESTIONS = [
    "Mi a neved?",
    "Hány éves vagy?",
    "Mi a kedvenc állatod?",
    "Szeretsz mesét hallgatni?",
    "Mi a kedvenc színed?",
    "Mi volt ma a legviccesebb dolog?",
    "Ha tudnál repülni, hová mennél?",
    "Mi a kedvenc ételed? Az enyém a mézes pogácsa… bár lehet, hogy csak álmodom róla!",
    "Van legjobb barátod?",
    "Milyen játékot szeretsz?",
    "Mi szokott megnevettetni?",
    "Ha varázserőd lenne, mi lenne az?",
    "Szeretsz inkább bent vagy kint játszani?",
    "Ki a te kedvenc mesefigurád?",
    "Melyik állat tudna a legjobban kuncogni?",
  ];

  const JOKES = [
    "Miért nem bújik el a róka? Mert kilóg a füle! Hehe!",
    "Mit mond a kenyér a vajnak? Te vagy a kenyerem és a vajam… várj, ez romi!",
    "Miért visz a tyúk nadrágot? Hogy ne látszódjon a tojócsöve! …oké, ez kicsit tojásos.",
    "Kopogtatás! Ki az? Kuka. Kuka ki? Kuka-rék, ha nem nyitsz ajtót! Haha!",
    "Mit csinál a róka a számítógépen? Rókázik az interneten!",
    "Miért ment a zsiráf az orvoshoz? Mert nyakig volt a bajban!",
    "Mit mondott az egyik szem a másiknak? Közöttünk a mag!",
    "Mi a medve kedvenc italá? A málna-tea… mert málnás!",
  ];

  const DIVI_FAVES = {
    character: [
      "Az én kedvenc mesefigurám… Winnie the Pooh! Mert ő is szereti a mézet, én meg a poénokat. Bár a füleim nagyobbak!",
      "Hú, nehéz! De ha választanom kell: Pán Péter! Mert soha nem nő fel — én sem akarok unalmas felnőtt lenni!",
      "A kedvencem Olaf a hóember! Mert állandóan hülyéskedik, mint én. És imádja a meleget… na jó, az már nem én vagyok.",
      "Én Stitchet imádom! Ő is káosz, én is káosz. Ohana azt jelenti: senkit sem hagyunk le a poénról!",
    ],
    color: [
      "A kedvenc színem a narancssárga — nézd csak a bundámat! Mintha egy naplemente lenne, ami beszél!",
      "Szeretem a sárgát is, mert olyan, mint a nevetés. De a narancs a bajnok!",
    ],
    food: [
      "A kedvenc kajám a képzeletbeli mézes pogácsa. Virtuális kalória: nulla. Íz: tízből tizenegy!",
      "Én a gyümölcsolót imádom… főleg ha te mesélsz mellé!",
    ],
    animal: [
      "A kedvenc állatom… a róka! Várj. Az én vagyok. Akkor a második: a pandá, mert buja és vicces.",
      "Imádom a kutyákat! Ők is csóválnak, én meg a füleimmel integetek.",
    ],
    age: [
      "Én örök gyerek vagyok: annyi idős, ahány poénnal rendelkezem. Ma reggel még 42 viccem volt!",
      "A korom: háromszor kettő plusz egy nevetés. Számold ki te!",
    ],
    name: [
      "A nevem Divi! Divi, a dumás róka. Nem Divinyátor, nem Divi-Man — csak Divi.",
      "Engem Divinek hívnak. Ha elfelejted, csiklandozz meg, és elkiáltom újra!",
    ],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function withName(memory, text) {
    if (memory.name && Math.random() > 0.45) {
      return text.replace(/!$/, ", " + memory.name + "!");
    }
    return text;
  }

  /** ASR zajszűrés / gyakori félrehallások */
  function normalizeSpeech(raw) {
    let t = String(raw || "").trim();
    t = t.replace(/\s+/g, " ");
    const fixes = [
      [/divi|divi|didi|didi|tiví|tivi|dévi/gi, "Divi"],
      [/mesé figur|mese figur|mesefigura|mese-figura/gi, "mesefigurád"],
      [/kedvenc(e|ed)? figur/gi, "kedvenc mesefigurád"],
      [/hány éves vagy\??/gi, "hány éves vagy"],
      [/mi a neved\??/gi, "mi a neved"],
      [/mondj egy viccet|viccet kérnék|poént/gi, "mondj egy viccet"],
    ];
    fixes.forEach(function (pair) {
      t = t.replace(pair[0], pair[1]);
    });
    return t;
  }

  function isQuestionToDivi(text) {
    const t = text.toLowerCase();
    // „te/neked/divinek” + kérdés, vagy klasszikus kérdőszavak Divi felé
    if (/^(ki|mi|milyen|hány|hol|hogyan|merre|mikor)\b/.test(t) && /\?|vagy|a te|tied|neked|divi/i.test(text)) {
      return true;
    }
    if (/\b(te|neked|tied|divi)\b/.test(t) && /(kedvenc|szeret|hívnak|neved|vagy|figurd)/i.test(t)) {
      return true;
    }
    if (/ki a kedvenc|mi a kedvenc|kit szeretsz|mit szeretsz|melyik a kedvenc/i.test(t)) {
      return true;
    }
    if (/hány éves vagy|mi a neved|hogy hívnak|ki vagy te/i.test(t)) {
      return true;
    }
    return /\?$/.test(t.trim());
  }

  function answerAboutDivi(text) {
    const t = text.toLowerCase();

    if (/mesefigur|mese figur|figurád|figurad|winnie|pooh|olaf|stitch|pán péter|pan peter/i.test(t) ||
        (/kedvenc/i.test(t) && /mese|figur|hős|hos|szerepl/i.test(t))) {
      return { text: pick(DIVI_FAVES.character) + " És neked ki a kedvenced?", emotion: "laugh" };
    }
    if (/kedvenc szín|mi.*színed|színedet/i.test(t)) {
      return { text: pick(DIVI_FAVES.color) + " Neki mi a tied?", emotion: "speaking" };
    }
    if (/kedvenc étel|kaja|enni|ételed|eteled/i.test(t)) {
      return { text: pick(DIVI_FAVES.food) + " Te mit ennél most?", emotion: "speaking" };
    }
    if (/kedvenc állat|állatod|allatod/i.test(t)) {
      return { text: pick(DIVI_FAVES.animal) + " Neked mi a kedvenced?", emotion: "speaking" };
    }
    if (/hány éves|korod|idős vagy/i.test(t)) {
      return { text: pick(DIVI_FAVES.age), emotion: "laugh" };
    }
    if (/mi a neved|hogy hívnak|ki vagy/i.test(t)) {
      return { text: pick(DIVI_FAVES.name), emotion: "speaking" };
    }
    if (/kedvenc/i.test(t)) {
      return {
        text: "Jó kérdés! A kedvenc dolgom: veled dumálni és poénkodni. " + pick(DIVI_FAVES.character),
        emotion: "laugh",
      };
    }
    // Általános „te mit…” kérdés
    return {
      text: "Én? Én azt szeretem, ha nevetünk! " + pick(JOKES) + " Na, most te jössz: mi a tied?",
      emotion: "laugh",
    };
  }

  const TOPIC_REPLIES = [
    {
      keys: [/szia|helló|hello|szevasz|hey|csá|csa/i],
      replies: [
        "Sziaaa! A füleim már előre kuncognak! Hogy vagy?",
        "Helló, szuperhős! Készen állsz egy adag poénra?",
        "Szevasz! Én Divi vagyok, a dumás róka. Indulhat a nevetés?",
      ],
      followUp: "Mondj valamit magadról — vagy kérj egy viccet!",
    },
    {
      keys: [/hogy vagy|mizu|mi újság|mi ujsag|hogy megy/i],
      replies: [
        "Én remekül! Csóválom a farkam… hopp, nincs is farkam, csak a poénjaim!",
        "Szuperul! Annyira, hogy a füleim is táncolnak!",
      ],
      followUp: "És te hogy vagy, bajnok?",
    },
    {
      keys: [/vicc|nevettes|poén|poen|vicces|humor|röhög|nevet/i],
      replies: null, // special
      joke: true,
    },
    {
      keys: [/mesélj.*mesét|mondj.*mesét|hallgatnék mesét|story time/i],
      replies: [
        "Egyszer volt, hol nem volt, egy róka, akinek akkora füle volt, hogy Wi-Fit fogott vele. Aztán… elkezdett dumálni. Az én voltam!",
        "Hallgass ide: a csillagok összekacsintottak, és azt súgták: „Divi, mondj egy poént!” Én meg engedelmeskedtem!",
      ],
      followUp: "Tetszett? Kérjek egy másikat, vagy inkább viccet?",
    },
    {
      keys: [/szeretlek|barát|barat|jó vagy|jo vagy|kedvellek/i],
      replies: [
        "Ááá, ettől meleg a bundám! Én is örülök neked!",
        "Te vagy a kedvenc beszélgető-emberem! Puszi a levegőbe!",
      ],
      followUp: "Mi szokott téged boldoggá tenni?",
    },
    {
      keys: [/unatkoz|játsz|jatsz|játék|jate/i],
      replies: [
        "Játsszunk! Én kérdezek, te válaszolsz — és közben poénkodunk!",
        "Kvíz-idő! Figyelj, jön a kérdés…",
      ],
      ask: true,
    },
    {
      keys: [/kérdezz|kerdezz|tegyél fel|tegyel fel|kérdés.*nekem/i],
      replies: ["Oké, fülek bekapcsolva… jön a kérdés!", "Figyelj ide, bajnok!"],
      ask: true,
    },
    {
      keys: [/köszön|koszon|viszlát|viszlat|bye|cső|cso|sziasztok/i],
      replies: [
        "Viszlát! Vigyázz a mosolyodra, nehogy elveszítsd útközben!",
        "Puszi! Gyere vissza, hozok friss poénokat!",
      ],
    },
  ];

  function Brain() {
    this.memory = {
      name: "",
      age: "",
      likes: [],
      asked: [],
      turns: 0,
      favoriteCharacter: "",
    };
    this.history = [];
  }

  Brain.prototype.reset = function () {
    this.memory = { name: "", age: "", likes: [], asked: [], turns: 0, favoriteCharacter: "" };
    this.history = [];
  };

  Brain.prototype.rememberFromUser = function (text) {
    const t = text.trim();
    const nameMatch = t.match(/(?:a nevem|hívnak|hivnak|én)\s+([A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű]{2,20})/i);
    if (nameMatch) this.memory.name = nameMatch[1];
    const ageMatch = t.match(/(\d{1,2})\s*(?:éves|eves)/i);
    if (ageMatch) this.memory.age = ageMatch[1];

    const favMatch = t.match(/(?:kedvenc(?:em)?(?:\s+mesefigurám|\s+figurám)?\s*(?:az?\s+)?)\s*([A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű ]{2,40})/i);
    if (favMatch && !/mi a|ki a|kedvenced/i.test(t)) {
      this.memory.favoriteCharacter = favMatch[1].trim();
    }
    // „Az enyém a Micimackó” / „Szeretem Olafot”
    const simpleFav = t.match(/(?:az enyém|szeretem|imádom)\s+(?:a\s+|az\s+)?([A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű][A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű ]{1,30})/i);
    if (simpleFav && /figur|mese|mackó|olaf|elsa|anna|stitch|woody|buzz|shrek|pán|peter/i.test(t + " " + simpleFav[1])) {
      this.memory.favoriteCharacter = simpleFav[1].trim();
    }

    if (/szeretem|imádom|imadom|kedvenc/i.test(t) && !isQuestionToDivi(t)) {
      this.memory.likes.push(t.slice(0, 80));
      if (this.memory.likes.length > 5) this.memory.likes.shift();
    }
  };

  Brain.prototype.nextQuestion = function () {
    const unused = QUESTIONS.filter((q) => !this.memory.asked.includes(q));
    const pool = unused.length ? unused : QUESTIONS;
    let q = pick(pool);
    if (this.memory.name && /Mi a neved/.test(q) && unused.length) {
      q = pick(pool.filter((x) => !/Mi a neved/.test(x))) || q;
    }
    this.memory.asked.push(q);
    if (this.memory.asked.length > 12) this.memory.asked.shift();
    if (this.memory.name && Math.random() > 0.5) {
      return this.memory.name + ", " + q.charAt(0).toLowerCase() + q.slice(1);
    }
    return q;
  };

  Brain.prototype.localReply = function (userText) {
    this.memory.turns += 1;
    const text = normalizeSpeech(userText);

    if (text.length < 2) {
      return {
        text: "Hoppá, a füleim nem kapták a jelet! Mondd még egyszer, kicsit hangosabban!",
        emotion: "listening",
      };
    }

    // 1) Először: ha TŐLEM kérdeznek, VÁLASZOLJAK (ne kerüljem meg!)
    if (isQuestionToDivi(text)) {
      const ans = answerAboutDivi(text);
      ans.text = withName(this.memory, ans.text);
      return ans;
    }

    // 2) Vicc kérés
    if (/vicc|poén|poen|nevettes|röhögtess|humor/i.test(text)) {
      return {
        text: pick(JOKES) + " " + pick(["Kérjek még egyet?", "Te is mondj egyet!", "Ha nem nevettél, a füleim visszajárnak!"]),
        emotion: "laugh",
      };
    }

    // 3) Témaillesztés (vicc / szia / stb.)
    for (let i = 0; i < TOPIC_REPLIES.length; i += 1) {
      const topic = TOPIC_REPLIES[i];
      if (!topic.keys.some((re) => re.test(text))) continue;
      if (topic.joke) {
        return {
          text: pick(JOKES) + " Na, most te jössz egy mosollyal!",
          emotion: "laugh",
        };
      }
      let reply = pick(topic.replies);
      reply = withName(this.memory, reply);
      if (topic.ask) {
        return { text: reply + " " + this.nextQuestion(), emotion: "speaking", ask: true };
      }
      if (topic.followUp) {
        return { text: reply + " " + topic.followUp, emotion: "speaking" };
      }
      return { text: reply, emotion: "speaking" };
    }

    // 4) Ha a gyerek mesefigurát mondott
    if (this.memory.favoriteCharacter && /mackó|olaf|elsa|figur|kedvenc/i.test(text)) {
      return {
        text: "Szuper választás a(z) " + this.memory.favoriteCharacter + "! Én is magasra tartom a füleimet tiszteletből. " + pick(JOKES),
        emotion: "laugh",
      };
    }

    // 5) Név bemutatkozás
    if (/(?:a nevem|hívnak|hivnak)\s+\w+/i.test(text)) {
      return {
        text: "Örülök, hogy megismerhetlek" + (this.memory.name ? ", " + this.memory.name : "") + "! Én Divi vagyok. " + pick(["Mondjak egy viccet?", "Mesélj a kedvenc játékodról!"]),
        emotion: "speaking",
      };
    }

    // 6) Vicces elismerés + kérdés
    const acks = [
      "Haha, ez jó!",
      "A füleim tapsolnak!",
      "Szuper válasz, bajnok!",
      "Ezt felírom a poén-naplómba!",
      "Úúú, érdekes!",
      "Ettől kacsint a narancssárga bundám!",
    ];
    let reply = pick(acks);

    if (this.memory.turns <= 2 && !this.memory.name) {
      return {
        text: reply + " Először is: " + this.nextQuestion(),
        emotion: "speaking",
        ask: true,
      };
    }

    // Gyakran kérdezz vissza, de előbb adj egy mini-poént
    if (this.memory.turns % 3 === 0) {
      return {
        text: reply + " Mini-poén: " + pick(JOKES) + " " + this.nextQuestion(),
        emotion: "laugh",
        ask: true,
      };
    }

    if (this.memory.turns % 2 === 0 || /nem tudom|talán|igen|nem/i.test(text)) {
      return {
        text: reply + " " + this.nextQuestion(),
        emotion: "speaking",
        ask: true,
      };
    }

    const probes = [
      "Mesélj erről még egy picit!",
      "És mi volt a legviccesebb része?",
      "Ha ez egy mese lenne, mi lenne a címe?",
      "Kérjek erre egy poént, vagy folytassuk?",
    ];
    return { text: reply + " " + pick(probes), emotion: "speaking" };
  };

  Brain.prototype.greeting = function () {
    return {
      text:
        "Szia! Én Divi vagyok, a dumás róka. Poénjaim vannak, füleim nagyok, és imádok veled beszélgetni! " +
        pick(JOKES) +
        " " +
        this.nextQuestion(),
      emotion: "laugh",
      ask: true,
    };
  };

  Brain.prototype.tapReaction = function () {
    const lines = [
      "Haha, csiklandozz! A poénjaim kicsordulnak!",
      "Hééé, az a hasam! Ott lakik a kuncogás!",
      "Újra! Újra! Én vagyok a csiklandozó-bajnok!",
      "Vicces vagy! Majdnem leestem a saját lábamról!",
      "A fülem érzékeny — ott van a nevetőgomb!",
    ];
    return { text: pick(lines), emotion: "laugh" };
  };

  Brain.prototype.echo = function (userText) {
    const funny = normalizeSpeech(userText)
      .replace(/[aá]/gi, "á")
      .replace(/[eé]/gi, "e")
      .replace(/[oóöő]/gi, "ó");
    return {
      text: funny + "! …hehe, csak utánoztalak! Most mondok egy igazi választ is: " + pick(JOKES),
      emotion: "laugh",
    };
  };

  Brain.prototype.buildOpenAIMessages = function (userText) {
    const system =
      "Te Divi vagy: vidám, poénos, beszélő animációs róka gyerekeknek (Talking Tom stílus). " +
      "Magyarul beszélj, 1-3 rövid mondatban, sok kedves humorral. " +
      "HA A GYEREK TŐLED KÉRDEZ (pl. ki a kedvenc mesefigurád), ELŐSZÖR VÁLASZOLJ KONKRÉTAN, ne kerülgesd. " +
      "Utána kérdezhetsz vissza. Ne legyél ijesztő. Memória: " +
      JSON.stringify(this.memory);

    const msgs = [{ role: "system", content: system }];
    this.history.slice(-8).forEach((h) => msgs.push(h));
    msgs.push({ role: "user", content: userText });
    return msgs;
  };

  Brain.prototype.record = function (role, content) {
    this.history.push({ role: role, content: content });
    if (this.history.length > 20) this.history = this.history.slice(-20);
  };

  async function replyWithOpenAI(brain, userText, apiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        max_tokens: 200,
        messages: brain.buildOpenAIMessages(userText),
      }),
    });
    if (!res.ok) throw new Error("OpenAI HTTP " + res.status);
    const data = await res.json();
    const text = (((data.choices || [])[0] || {}).message || {}).content || "";
    return { text: text.trim() || "Hmm, elkalandoztam. Kérdezz rám bátran!", emotion: "speaking" };
  }

  Brain.prototype.reply = async function (userText, opts) {
    opts = opts || {};
    const cleaned = normalizeSpeech(userText);
    this.rememberFromUser(cleaned);
    this.record("user", cleaned);

    if (opts.echoMode) {
      const out = this.echo(cleaned);
      this.record("assistant", out.text);
      return out;
    }

    if (opts.openAiKey) {
      try {
        const out = await replyWithOpenAI(this, cleaned, opts.openAiKey);
        this.memory.turns += 1;
        this.record("assistant", out.text);
        return out;
      } catch (err) {
        console.warn("OpenAI fallback:", err);
      }
    }

    const out = this.localReply(cleaned);
    this.record("assistant", out.text);
    return out;
  };

  Brain.normalizeSpeech = normalizeSpeech;
  global.DiviBrain = Brain;
})(window);
