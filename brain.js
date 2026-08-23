/**
 * Divi beszélgető agy — kérdez–felel, helyi intelligencia + opcionális OpenAI
 */
(function (global) {
  const QUESTIONS = [
    "Mi a neved?",
    "Hány éves vagy?",
    "Mi a kedvenc állatod?",
    "Szeretsz mesét hallgatni?",
    "Mi a kedvenc színed?",
    "Mi volt ma a legjobb dolog, ami történt veled?",
    "Ha tudnál repülni, hová mennél?",
    "Mi a kedvenc ételed?",
    "Van testvéred vagy legjobb barátod?",
    "Milyen játékot szeretsz a legjobban?",
    "Mi szokott megnevettetni?",
    "Ha varázserőd lenne, mi lenne az?",
    "Szeretsz inkább bent vagy kint játszani?",
    "Mesélj egy álmodról!",
    "Ki a kedvenc mesefigurád?",
  ];

  const TOPIC_REPLIES = [
    {
      keys: [/szia|helló|hello|szevasz|hey/i],
      replies: [
        "Sziaaa! Örülök, hogy itt vagy! Hogy vagy ma?",
        "Helló, barátom! Készen állsz egy kis beszélgetésre?",
      ],
      followUp: "Miről szeretnél beszélgetni?",
    },
    {
      keys: [/hogy vagy|mizu|mi újság|mi ujsag/i],
      replies: [
        "Én remekül! Csóválom a farkam… várj, nincs is farkam, de hangulatban igen!",
        "Szuperul! Főleg ha veled csevegek.",
      ],
      followUp: "És te hogy érzed magad?",
    },
    {
      keys: [/nevem|hívnak|hivnak|én\s+\w+/i],
      replies: ["Örülök, hogy megismerhetlek!", "Szép név! Megjegyzem."],
      followUp: "Mi a kedvenc hobbid?",
    },
    {
      keys: [/mese|mesél|meselj|story/i],
      replies: [
        "Egyszer volt, hol nem volt, egy kíváncsi róka, aki minden kérdésre választ keresett… az én voltam!",
        "Hallgass ide: egy kis csillag lepottyant az égből, és azt súgta: „Légy kedves, és merj kérdezni!”",
      ],
      followUp: "Tetszett? Vagy inkább én kérdezzek tőled?",
    },
    {
      keys: [/vicc|nevettes|poén|poen/i],
      replies: [
        "Miért nem játszik a róka bújócskát? Mert mindig kilóg a füle! Hehe!",
        "Mit mond a róka, ha elfárad? „Rókázzunk egy kicsit!”",
      ],
      followUp: "Nevettél? Mondj te is egy viccet!",
    },
    {
      keys: [/szeretlek|barát|barat|jó vagy|jo vagy/i],
      replies: [
        "Ááá, ettől meleg a szívem! Én is örülök neked!",
        "Te vagy a legjobb beszélgetőtársam!",
      ],
      followUp: "Mi teszi boldoggá a napodat?",
    },
    {
      keys: [/unatkoz|unatkozom|játsz|jatsz/i],
      replies: [
        "Akkor játsszunk! Én kérdezek, te válaszolsz — mint egy okos kvíz!",
        "Szuper! Indulhat a kérdezz-felelek!",
      ],
      followUp: null, // will ask a question
      ask: true,
    },
    {
      keys: [/kérdez|kerdez|kérdés|kerdes|kérdezz|kerdezz/i],
      replies: ["Rendben, jön a kérdésem!", "Oké, figyelj ide…"],
      ask: true,
    },
    {
      keys: [/köszön|koszon|viszlát|viszlat|bye|cső|cso/i],
      replies: [
        "Viszlát! Gyere vissza hamar, hiányozni fogsz!",
        "Puszi a levegőbe! Holnap is itt leszek.",
      ],
    },
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function Brain() {
    this.memory = {
      name: "",
      age: "",
      likes: [],
      asked: [],
      turns: 0,
    };
    this.history = [];
  }

  Brain.prototype.reset = function () {
    this.memory = { name: "", age: "", likes: [], asked: [], turns: 0 };
    this.history = [];
  };

  Brain.prototype.rememberFromUser = function (text) {
    const t = text.trim();
    const nameMatch = t.match(/(?:a nevem|hívnak|hivnak|én)\s+([A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű]{2,20})/i);
    if (nameMatch) this.memory.name = nameMatch[1];
    const ageMatch = t.match(/(\d{1,2})\s*(?:éves|eves)/i);
    if (ageMatch) this.memory.age = ageMatch[1];
    if (/szeretem|imádom|imadom|kedvenc/i.test(t)) {
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
    if (this.memory.name && Math.random() > 0.55) {
      return this.memory.name + ", " + q.charAt(0).toLowerCase() + q.slice(1);
    }
    return q;
  };

  Brain.prototype.localReply = function (userText) {
    this.memory.turns += 1;
    const text = userText.trim();

    for (const topic of TOPIC_REPLIES) {
      if (topic.keys.some((re) => re.test(text))) {
        let reply = pick(topic.replies);
        if (this.memory.name && /örülök|megismer/i.test(reply)) {
          reply = reply.replace("!", ", " + this.memory.name + "!");
        }
        if (topic.ask) {
          return { text: reply + " " + this.nextQuestion(), emotion: "speaking", ask: true };
        }
        if (topic.followUp) {
          return { text: reply + " " + topic.followUp, emotion: "speaking" };
        }
        return { text: reply, emotion: "speaking" };
      }
    }

    // Generic acknowledgment + new question (AI asks / user answers loop)
    const acks = [
      "Érdekes!",
      "Hűha, ezt jól mondtad!",
      "Ahh, értem!",
      "Szuper válasz!",
      "Hmm, ezen gondolkodom…",
      "Tetszik, amit mondasz!",
    ];
    if (this.memory.name) {
      acks.push("Köszönöm, " + this.memory.name + "!");
    }
    let reply = pick(acks);

    if (text.length < 2) {
      reply = "Nem hallottam jól. Mondd el még egyszer!";
      return { text: reply, emotion: "listening" };
    }

    // Every turn: respond then ask (kérdez-felel)
    if (this.memory.turns === 1 && !this.memory.name) {
      return {
        text: reply + " Először is: " + this.nextQuestion(),
        emotion: "speaking",
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
      "Mesélj erről még egy kicsit!",
      "És aztán mi történt?",
      "Ez miért fontos neked?",
      "Mi a legviccesebb része ennek?",
    ];
    return { text: reply + " " + pick(probes), emotion: "speaking" };
  };

  Brain.prototype.greeting = function () {
    return {
      text: "Szia! Én Divi vagyok, a beszélő rókád. Koppints rám, vagy nyomd meg a mikrofont, és beszélgessünk! " + this.nextQuestion(),
      emotion: "speaking",
      ask: true,
    };
  };

  Brain.prototype.tapReaction = function () {
    const lines = [
      "Haha, csiklandozz!",
      "Hééé, az a hasam!",
      "Újra! Újra!",
      "Vicces vagy!",
      "A fülem érzékeny!",
    ];
    return { text: pick(lines), emotion: "laugh" };
  };

  Brain.prototype.echo = function (userText) {
    const funny = userText
      .replace(/[aá]/gi, "á")
      .replace(/[eé]/gi, "e")
      .replace(/[oóöő]/gi, "ó");
    return {
      text: funny + "! …hehe, csak utánoztalak, mint a Talking Tom!",
      emotion: "laugh",
    };
  };

  Brain.prototype.buildOpenAIMessages = function (userText) {
    const system =
      "Te Divi vagy: egy vidám, kedves, beszélő animációs róka gyerekeknek (Talking Tom stílus). " +
      "Magyarul beszélj, röviden (1-3 mondat), játékosan. Kérdezz vissza, hogy folyjon a beszélgetés. " +
      "Ne legyél ijesztő vagy felnőttes. Memória: " +
      JSON.stringify(this.memory);

    const msgs = [{ role: "system", content: system }];
    this.history.slice(-8).forEach((h) => msgs.push(h));
    msgs.push({ role: "user", content: userText });
    return msgs;
  };

  Brain.prototype.record = function (role, content) {
    this.history.push({ role, content });
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
        temperature: 0.85,
        max_tokens: 180,
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
    this.rememberFromUser(userText);
    this.record("user", userText);

    if (opts.echoMode) {
      const out = this.echo(userText);
      this.record("assistant", out.text);
      return out;
    }

    if (opts.openAiKey) {
      try {
        const out = await replyWithOpenAI(this, userText, opts.openAiKey);
        this.memory.turns += 1;
        this.record("assistant", out.text);
        return out;
      } catch (err) {
        console.warn("OpenAI fallback:", err);
      }
    }

    const out = this.localReply(userText);
    this.record("assistant", out.text);
    return out;
  };

  global.DiviBrain = Brain;
})(window);
