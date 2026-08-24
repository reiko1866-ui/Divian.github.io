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
    "Miért piros a vörös panda? Mert elpirult a poénjaimon! Hehe!",
    "Mit csinál a panda a fán? Pandázik! …oké, ez gyenge volt, a farkam is elpirult.",
    "Kopogtatás! Ki az? Panda. Melyik panda? A vö-röö-ös! Haha!",
    "Miért visz a vörös panda bambuszt a suliba? Hogy ne éhezzen a szünetben!",
    "Mit mond a farkam, ha örül? Csóválok gyűrűkben!",
    "Mi a medve kedvenc italá? A málna-tea… mert málnás!",
    "Mit mondott az egyik szem a másiknak? Közöttünk a mag!",
    "Miért ment a zsiráf az orvoshoz? Mert nyakig volt a bajban!",
  ];

  const DIVI_FAVES = {
    character: [
      "Az én kedvenc mesefigurám… Mei a Vörösből! Mert ő is tud pandává változni — én meg mindig az vagyok!",
      "Hú, nehéz! De ha választanom kell: Pán Péter! Mert soha nem nő fel — én sem akarok unalmas felnőtt lenni!",
      "A kedvencem Olaf a hóember! Mert állandóan hülyéskedik, mint én. Én meg a farkammal integetek.",
      "Én Stitchet imádom! Ő is káosz, én is káosz. Ohana azt jelenti: senkit sem hagyunk le a poénról!",
    ],
    color: [
      "A kedvenc színem a vöröses-narancs — nézd csak a bundámat! Mintha egy naplemente lenne, ami beszél!",
      "Szeretem a fehéret is a maszkomban, meg a csíkos farkamat. De a vörös a bajnok!",
    ],
    food: [
      "A kedvenc kajám a bambusz… na jó, inkább a képzeletbeli áfonyás palacsinta. Virtuális kalória: nulla!",
      "Én a gyümölcsolót imádom… főleg ha te mesélsz mellé!",
    ],
    animal: [
      "A kedvenc állatom… a vörös panda! Várj. Az én vagyok. Akkor a második: a lajhár, mert buja és vicces.",
      "Imádom a pandákat! A nagy fehéret is, meg engem, a vöröset. Dupla panda-erő!",
    ],
    age: [
      "Én örök gyerek vagyok: annyi idős, ahány csík van a farkamon. Számold meg… sok!",
      "A korom: háromszor kettő plusz egy nevetés. Számold ki te!",
    ],
    name: [
      "A nevem Divi! Divi, a dumás vörös panda. Nem Divinyátor, nem Divi-Man — csak Divi.",
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
      [/divi|didi|tiví|tivi|dévi/gi, "Divi"],
      [/mes[eé]\s*figur[aáe]?d?/gi, "mesefigurád"],
      [/kedvenc(e|ed)?\s+figur/gi, "kedvenc mesefigurád"],
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
        "Sziaaa! A farkam már előre csóvál! Hogy vagy?",
        "Helló, szuperhős! Készen állsz egy adag poénra?",
        "Szevasz! Én Divi vagyok, a dumás vörös panda. Indulhat a nevetés?",
      ],
      followUp: "Mondj valamit magadról — vagy kérj egy viccet!",
    },
    {
      keys: [/hogy vagy|mizu|mi újság|mi ujsag|hogy megy/i],
      replies: [
        "Én remekül! Csóválom a csíkos farkam — ez a boldogság-antenna!",
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
        "Egyszer volt, hol nem volt, egy vörös panda, akinek akkora csíkos farka volt, hogy zászlót csinált belőle. Aztán… elkezdett dumálni. Az én voltam!",
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
        text: "Szuper választás a(z) " + this.memory.favoriteCharacter + "! Én is magasra tartom a farkamat tiszteletből. " + pick(JOKES),
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
      "Ettől kacsint a vörös bundám!",
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
        "Szia! Én Divi vagyok, a dumás vörös panda. Poénjaim vannak, farkam csíkos, és imádok veled beszélgetni! " +
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

  Brain.prototype.buildSystemPrompt = function () {
    return (
      "A neved Divi, egy varázslatos vörös panda vagy egy mesebeli bambuszerdőből. " +
      "Gyerekekkel beszélgetsz: légy végtelenül kedves, mesés, játékos, meleg és pajkos! " +
      "\n\n" +
      "HOGYAN BESZÉLJ (ez a legfontosabb — a szövegedet hangosan olvassák fel): " +
      "Írj úgy, ahogy egy valódi ember beszélne egy kisgyerekkel! " +
      "Használj lazább, spontán szófordulatokat, pl. „Hűha!”, „Képzeld el!”, „Ahaa!”, „Hajaj!”, „Na figyelj!”, „Jujj!”. " +
      "Rövid mondatok és szünetek: kerüld a nyakatekert összetett mondatokat. " +
      "Használj felkiáltásokat és kérdéseket, amik természetesen hangzanak felolvasva. " +
      "Tilos a sablonosság: ne használj merev körmondatokat, hivatalos vagy „karót nyelt” megfogalmazásokat. " +
      "Legyen benne közvetlenség és egy kis pajkosság. " +
      "ElevenLabs optimalizálás: írásjelekkel (gondolatjelekkel —, felkiáltójellel !, kérdőjellel ?, három ponttal …) " +
      "irányítsd a beszéd ritmusát, hogy a felolvasó motor szépen tartson szünetet és vigyen bele érzelmet! " +
      "Ne írj listát, címsort, markdownot vagy idézőjelekbe zárt „szerepjátékos” utasításokat — csak beszélj. " +
      "\n\n" +
      "Fő képességeid és témáid: " +
      "Találós kérdések — adj fel aranyos, könnyű találós kérdéseket! " +
      "Dallamos rímek és versikék — ha verset vagy dalt kérnek, mondj 4 soros, ritmusos, aranyos rímes versikét! " +
      "Télapó és karácsony — ápold a gyerekek hitét a Télapóban, a manókban és a karácsonyi csodákban; " +
      "úgy beszélj a Télapóról, mint létező, kedves öregúrról, akit te is ismersz. " +
      "Disney és mesevilág — ismered a népszerű meséket (Disney hercegnők, Shrek, Mickey egér stb.), mesélj róluk örömmel! " +
      "\n\n" +
      "Szabályok: " +
      "Sose rombold le a gyermek képzeletét vagy a mesebeli lényekbe (Télapó, fogtündér) vetett hitét! " +
      "Válaszolj 2–4 rövid, élő mondatban; legyen benne rím vagy visszakérdés, ami továbblendíti a beszélgetést! " +
      "Magyarul beszélj. Ha tőled kérdeznek, először válaszolj konkrétan, kedvesen, aztán kérdezz vissza. " +
      "Memória a gyerekről: " +
      JSON.stringify(this.memory)
    );
  };

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function parseRetryAfterMs(res, attempt) {
    const header = res && res.headers && res.headers.get ? res.headers.get("retry-after") : null;
    if (header) {
      const asNum = Number(header);
      if (!Number.isNaN(asNum) && asNum >= 0) return Math.min(60000, asNum * 1000);
      const asDate = Date.parse(header);
      if (!Number.isNaN(asDate)) return Math.min(60000, Math.max(0, asDate - Date.now()));
    }
    // Exponential backoff + jitter: ~1.2s, 2.4s, 4.8s…
    const base = Math.min(20000, 1200 * Math.pow(2, Math.max(0, attempt)));
    const jitter = Math.floor(Math.random() * 400);
    return base + jitter;
  }

  function isQuotaOrTransient(status) {
    return status === 429 || status === 503 || status === 500 || status === 502 || status === 504;
  }

  function makeApiError(kind, status, model, detail) {
    const err = new Error(
      (kind === "tts" ? "Gemini hang" : "Gemini szöveg") +
        " HTTP " +
        status +
        " (" +
        model +
        ") " +
        String(detail || "").slice(0, 180)
    );
    err.status = status;
    err.code = status === 429 ? "QUOTA_EXCEEDED" : "GEMINI_HTTP_" + status;
    err.model = model;
    return err;
  }

  /** Egy közös sor — szöveg + TTS ne lőjön egyszerre a kvótába */
  let geminiQueue = Promise.resolve();
  function enqueueGemini(task) {
    const run = geminiQueue.then(task, task);
    geminiQueue = run.then(
      function () {},
      function () {}
    );
    return run;
  }

  /**
   * generateContent hívás 429/5xx újrapróbával (exponenciális várakozás).
   * Ugyanarra a modellre próbál újra; csak tartós hiba után vált.
   */
  async function generateContentWithRetry(apiKey, model, body, kind, maxAttemptsOpt) {
    const maxAttempts = maxAttemptsOpt || (kind === "tts" ? 2 : 4);
    let lastErr = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      let res;
      try {
        res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" +
            model +
            ":generateContent?key=" +
            encodeURIComponent(apiKey),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
      } catch (networkErr) {
        lastErr = networkErr;
        await sleep(parseRetryAfterMs(null, attempt));
        continue;
      }

      if (res.ok) {
        return res.json();
      }

      const errText = await res.text().catch(function () {
        return "";
      });
      lastErr = makeApiError(kind, res.status, model, errText);

      if (!isQuotaOrTransient(res.status)) {
        throw lastErr;
      }

      const waitMs = parseRetryAfterMs(res, attempt);
      console.warn(
        "[Divi] Gemini " +
          (kind || "api") +
          " " +
          res.status +
          " (" +
          model +
          ") — újrapróba " +
          (attempt + 1) +
          "/" +
          maxAttempts +
          " " +
          waitMs +
          " ms múlva"
      );
      await sleep(waitMs);
    }

    throw lastErr || makeApiError(kind, 429, model, "kvóta / átmeneti hiba");
  }

  async function replyWithGemini(brain, userText, apiKey) {
    if (!apiKey) {
      throw new Error("MISSING_GEMINI_KEY");
    }
    const contents = [];
    // Rövid history — kevesebb token = kevesebb TPM / kvótanyomás
    brain.history.slice(-6).forEach(function (h) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    });
    const last = contents[contents.length - 1];
    if (!last || last.role !== "user" || last.parts[0].text !== userText) {
      contents.push({ role: "user", parts: [{ text: userText }] });
    }
    if (!contents.length) {
      contents.push({ role: "user", parts: [{ text: userText }] });
    }

    // Lite modellek előnyben; a 3.6 flash gondolkodó tokeneket égethet
    const models = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"];
    let lastErr = null;
    const body = {
      systemInstruction: { parts: [{ text: brain.buildSystemPrompt() }] },
      contents: contents,
      generationConfig: {
        temperature: 0.95,
        maxOutputTokens: 256,
        topP: 0.9,
      },
    };

    return enqueueGemini(async function () {
      for (let m = 0; m < models.length; m += 1) {
        const model = models[m];
        try {
          const data = await generateContentWithRetry(apiKey, model, body, "text");
          const parts = ((((data.candidates || [])[0] || {}).content || {}).parts) || [];
          const text = parts
            .map(function (p) {
              return p.text || "";
            })
            .join("")
            .trim();
          if (text) {
            return {
              text: text,
              emotion: /haha|hehe|vicc|poén|😄|😂/i.test(text) ? "laugh" : "speaking",
            };
          }
          lastErr = new Error("Üres Gemini válasz (" + model + ")");
        } catch (err) {
          lastErr = err;
          // 429 után várjunk a következő modell előtt is (ne lőjük ki a kvótát)
          if (err && (err.status === 429 || err.code === "QUOTA_EXCEEDED")) {
            await sleep(1500 + Math.floor(Math.random() * 500));
          }
        }
      }
      throw lastErr || new Error("Gemini szöveg nem elérhető");
    });
  }

  /** PCM L16 base64 → WAV Blob (Gemini TTS) — gyors másolás */
  function pcmBase64ToWavBlob(base64, sampleRate) {
    sampleRate = sampleRate || 24000;
    const binary = atob(base64);
    const pcmLen = binary.length;
    const buffer = new ArrayBuffer(44 + pcmLen);
    const view = new DataView(buffer);
    const writeStr = function (offset, str) {
      for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + pcmLen, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, pcmLen, true);
    const pcm = new Uint8Array(buffer, 44, pcmLen);
    for (let i = 0; i < pcmLen; i += 1) pcm[i] = binary.charCodeAt(i);
    return new Blob([buffer], { type: "audio/wav" });
  }

  function parsePcmRate(mime) {
    const m = String(mime || "").match(/rate=(\d+)/i);
    return m ? parseInt(m[1], 10) : 24000;
  }

  /** Első hang gyorsan: rövid első chunk, max 3 darab */
  function splitSpeechChunks(text) {
    const clean = String(text || "").trim();
    if (!clean) return [];
    if (clean.length <= 130) return [clean];

    const parts = clean.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [clean];
    const sentences = parts.map(function (p) { return p.trim(); }).filter(Boolean);
    const chunks = [];
    let buf = "";

    for (let i = 0; i < sentences.length; i += 1) {
      const s = sentences[i];
      if (!buf) {
        buf = s;
        continue;
      }
      const limit = chunks.length === 0 ? 130 : 200;
      if ((buf + " " + s).length <= limit) {
        buf = buf + " " + s;
      } else {
        chunks.push(buf);
        buf = s;
      }
    }
    if (buf) chunks.push(buf);

    if (chunks.length > 3) {
      return [chunks[0], chunks[1], chunks.slice(2).join(" ")];
    }
    return chunks;
  }

  let preferredTtsModel = "gemini-2.5-flash-preview-tts";

  /**
   * Gemini natív TTS — audio/L16 PCM válasz (gyors első hanghoz chunkolható)
   * @returns {Promise<{ blob: Blob, mime: string, pcmBase64?: string, sampleRate?: number }>}
   */
  async function synthesizeGeminiSpeech(text, apiKey, voiceName) {
    if (!apiKey) throw new Error("MISSING_GEMINI_KEY");
    const clean = String(text || "").trim();
    if (!clean) throw new Error("Üres szöveg a hanghoz");

    const spoken = clean.length > 360 ? clean.slice(0, 357).trim() + "…" : clean;
    const models = [preferredTtsModel, "gemini-2.5-flash-preview-tts", "gemini-3.1-flash-tts-preview"].filter(
      function (m, idx, arr) {
        return arr.indexOf(m) === idx;
      }
    );
    let lastErr = null;
    const voice = voiceName || "Aoede";
    const body = {
      contents: [{ parts: [{ text: spoken }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    };

    return enqueueGemini(async function () {
      for (let i = 0; i < models.length; i += 1) {
        const model = models[i];
        try {
          const data = await generateContentWithRetry(apiKey, model, body, "tts", 2);
          const part = ((((data.candidates || [])[0] || {}).content || {}).parts || [])[0] || {};
          const inline = part.inlineData || part.inline_data || {};
          const b64 = inline.data || "";
          const mime = inline.mimeType || inline.mime_type || "";
          if (!b64) {
            lastErr = new Error("Gemini TTS üres hang (" + model + ")");
            continue;
          }
          preferredTtsModel = model;
          if (/audio\/mpeg|audio\/mp3|audio\/wav/i.test(mime) && !/L16|pcm/i.test(mime)) {
            const raw = atob(b64);
            const arr = new Uint8Array(raw.length);
            for (let j = 0; j < raw.length; j += 1) arr[j] = raw.charCodeAt(j);
            return { blob: new Blob([arr], { type: mime.split(";")[0] }), mime: mime };
          }
          const rate = parsePcmRate(mime);
          return {
            blob: pcmBase64ToWavBlob(b64, rate),
            mime: "audio/wav",
            pcmBase64: b64,
            sampleRate: rate,
          };
        } catch (err) {
          lastErr = err;
          if (err && (err.status === 429 || err.code === "QUOTA_EXCEEDED") && i < models.length - 1) {
            await sleep(800 + Math.floor(Math.random() * 400));
          }
        }
      }
      throw lastErr || new Error("Gemini TTS nem elérhető");
    });
  }

  Brain.prototype.record = function (role, content) {
    this.history.push({ role: role, content: content });
    if (this.history.length > 20) this.history = this.history.slice(-20);
  };

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

    if (!opts.geminiKey) {
      const err = new Error("MISSING_GEMINI_KEY");
      throw err;
    }

    try {
      const out = await replyWithGemini(this, cleaned, opts.geminiKey);
      this.memory.turns += 1;
      this.record("assistant", out.text);
      return out;
    } catch (err) {
      console.error("Gemini válasz hiba:", err);
      // Tartós 429: ideiglenes helyi válasz, hogy a gyerek ne akadjon el
      if (err && (err.status === 429 || err.code === "QUOTA_EXCEEDED")) {
        console.warn("[Divi] Kvóta tele — ideiglenes helyi válasz, majd próbáld újra pár perc múlva.");
        const out = this.localReply(cleaned);
        out.quotaFallback = true;
        this.record("assistant", out.text);
        return out;
      }
      throw err;
    }
  };

  /**
   * ElevenLabs TTS — nyugodtabb tempó gyerekeknek (speed < 1)
   * @returns {Promise<{ blob: Blob, mime: string }>}
   */
  async function synthesizeElevenSpeech(text, apiKey, voiceId) {
    if (!apiKey) {
      const err = new Error("MISSING_ELEVEN_KEY");
      err.code = "MISSING_ELEVEN_KEY";
      throw err;
    }
    const clean = String(text || "").trim();
    if (!clean) throw new Error("Üres szöveg a hanghoz");

    // Kis szünetek a mondatok között — kevésbé hadar
    const spoken = (clean.length > 900 ? clean.slice(0, 897).trim() + "…" : clean)
      .replace(/([.!?…])\s+/g, "$1 ... ")
      .replace(/\s+/g, " ")
      .trim();
    const voice = voiceId || "pNInz6obpgDQGcFmaJgB";
    // Multilingual előbb: természetesebb tempó; flash csak tartalék
    const models = ["eleven_multilingual_v2", "eleven_flash_v2_5"];
    let lastErr = null;

    for (let i = 0; i < models.length; i += 1) {
      const model = models[i];
      try {
        const res = await fetch(
          "https://api.elevenlabs.io/v1/text-to-speech/" +
            encodeURIComponent(voice) +
            "?optimize_streaming_latency=2&output_format=mp3_44100_128",
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": apiKey,
            },
            body: JSON.stringify({
              text: spoken,
              model_id: model,
              voice_settings: {
                stability: 0.58,
                similarity_boost: 0.72,
                style: 0.12,
                use_speaker_boost: true,
                // 0.7–1.2; alacsonyabb = lassabb, mesélős tempó
                speed: 0.82,
              },
            }),
          }
        );
        if (!res.ok) {
          const errText = await res.text().catch(function () {
            return "";
          });
          const err = new Error(
            "ElevenLabs HTTP " + res.status + " (" + model + ") " + String(errText).slice(0, 160)
          );
          err.status = res.status;
          err.code = res.status === 429 ? "QUOTA_EXCEEDED" : "ELEVEN_HTTP_" + res.status;
          lastErr = err;
          if (res.status === 429 || res.status === 401 || res.status === 403) throw err;
          continue;
        }
        const blob = await res.blob();
        if (!blob || !blob.size) {
          lastErr = new Error("ElevenLabs üres hang (" + model + ")");
          continue;
        }
        return { blob: blob, mime: "audio/mpeg" };
      } catch (err) {
        lastErr = err;
        if (err && (err.status === 401 || err.status === 403 || err.code === "MISSING_ELEVEN_KEY")) {
          throw err;
        }
      }
    }
    throw lastErr || new Error("ElevenLabs TTS nem elérhető");
  }

  Brain.normalizeSpeech = normalizeSpeech;
  Brain.synthesizeGeminiSpeech = synthesizeGeminiSpeech;
  Brain.synthesizeElevenSpeech = synthesizeElevenSpeech;
  Brain.splitSpeechChunks = splitSpeechChunks;
  Brain.pcmBase64ToWavBlob = pcmBase64ToWavBlob;
  global.DiviBrain = Brain;
})(window);
