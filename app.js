(function () {
  const $ = (id) => document.getElementById(id);

  const characterEl = $("character");
  const hitbox = $("character-hitbox");
  const bubble = $("speech-bubble");
  const bubbleText = $("bubble-text");
  const statusLine = $("status-line");
  const chatLog = $("chat-log");
  const chatForm = $("chat-form");
  const userInput = $("user-input");
  const btnMic = $("btn-mic");
  const btnSettings = $("btn-settings");
  const btnCloseSettings = $("btn-close-settings");
  const settingsPanel = $("settings-panel");
  const engineSelect = $("engine-select");
  const elevenInputs = $("elevenlabs-inputs");
  const apiKeyInput = $("api-key");
  const voiceIdInput = $("voice-id");
  const openAiKeyInput = $("openai-key");
  const echoModeInput = $("echo-mode");
  const autoListenInput = $("auto-listen");

  const STORAGE = {
    engine: "divi-engine",
    elevenKey: "divi-eleven-key",
    voice: "divi-eleven-voice",
    openai: "divi-openai-key",
    echo: "divi-echo",
    autoListen: "divi-auto-listen",
  };
  const DEFAULT_VOICE = "pNInz6obpgDQGcFmaJgB";

  const character = new DiviCharacter(characterEl);
  const brain = new DiviBrain();

  let recognition = null;
  let listening = false;
  let busy = false;
  let speakToken = 0;
  let currentAudio = null;
  let activeAudioUrl = null;
  let cachedMaleVoice = null;
  let greetingDone = false;
  let micPermission = "unknown"; // unknown | granted | denied
  let micStream = null;
  let startingMic = false;
  let audioCtx = null;

  function isFemaleVoiceName(name) {
    return /női|noi|female|woman|rachel|sarah|zira|samantha|susan/i.test(name || "");
  }

  function isMaleVoiceName(name) {
    return /férfi|ferfi|male|tamás|tamas|szabolcs|adam|arnold|josh|antoni|david|daniel/i.test(name || "");
  }

  function pickMaleHuVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices() || [];
    const hu = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("hu"));
    return (
      hu.find((v) => isMaleVoiceName(v.name) && !isFemaleVoiceName(v.name)) ||
      hu.find((v) => /tamás|tamas|szabolcs/i.test(v.name)) ||
      hu.find((v) => !isFemaleVoiceName(v.name)) ||
      null
    );
  }

  function loadSettings() {
    try {
      engineSelect.value = localStorage.getItem(STORAGE.engine) || "native";
      apiKeyInput.value = localStorage.getItem(STORAGE.elevenKey) || "";
      voiceIdInput.value = localStorage.getItem(STORAGE.voice) || DEFAULT_VOICE;
      openAiKeyInput.value = localStorage.getItem(STORAGE.openai) || "";
      echoModeInput.checked = localStorage.getItem(STORAGE.echo) === "1";
      const al = localStorage.getItem(STORAGE.autoListen);
      autoListenInput.checked = al === null ? true : al === "1";
    } catch (_) {
      /* ignore */
    }
    toggleEngine();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE.engine, engineSelect.value);
      localStorage.setItem(STORAGE.elevenKey, apiKeyInput.value.trim());
      localStorage.setItem(STORAGE.voice, voiceIdInput.value.trim() || DEFAULT_VOICE);
      localStorage.setItem(STORAGE.openai, openAiKeyInput.value.trim());
      localStorage.setItem(STORAGE.echo, echoModeInput.checked ? "1" : "0");
      localStorage.setItem(STORAGE.autoListen, autoListenInput.checked ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
  }

  function toggleEngine() {
    if (engineSelect.value === "elevenlabs") elevenInputs.classList.remove("hidden");
    else elevenInputs.classList.add("hidden");
    saveSettings();
  }

  function setStatus(msg) {
    statusLine.textContent = msg || "";
  }

  function showBubble(text) {
    bubbleText.textContent = text;
    bubble.classList.remove("hidden");
  }

  function addChat(role, text) {
    const div = document.createElement("div");
    div.className = "chat-msg " + role;
    div.textContent = (role === "bot" ? "Divi: " : "Te: ") + text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function stopSpeech() {
    speakToken += 1;
    character.stopLipSync();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    }
  }

  function splitSentences(text) {
    const clean = String(text || "").trim();
    if (!clean) return [];
    const parts = clean.match(/[^.!?…]+(?:[.!?…]+|$)/g);
    return (parts || [clean]).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function revealBubble(fullText, progress01) {
    const chars = Array.from(fullText);
    const n = Math.max(1, Math.floor(chars.length * Math.max(0, Math.min(1, progress01))));
    showBubble(chars.slice(0, n).join("") + (progress01 < 0.98 ? "…" : ""));
  }

  function speakNativeChunk(text, token) {
    return new Promise(function (resolve) {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      if (token !== speakToken) {
        resolve();
        return;
      }

      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hu-HU";
      u.rate = 0.92;
      u.pitch = 1.08;
      cachedMaleVoice = pickMaleHuVoice() || cachedMaleVoice;
      if (cachedMaleVoice) u.voice = cachedMaleVoice;

      character.startVisemeLipSync(text, { charsPerSecond: 11.2 * u.rate });

      const started = performance.now();
      const estMs = Math.max(500, (Array.from(text).length / (11.2 * u.rate)) * 1000);
      let revealTimer = null;

      const tickReveal = function () {
        if (token !== speakToken) return;
        const p = Math.min(1, (performance.now() - started) / estMs);
        revealBubble(text, p);
        if (p < 1) revealTimer = setTimeout(tickReveal, 40);
      };
      tickReveal();

      u.onboundary = function (event) {
        if (token !== speakToken) return;
        if (typeof event.charIndex === "number" && text) {
          const ch = text.charAt(event.charIndex) || " ";
          character._mouthTarget = character.visemeForChar(ch);
          const shown = Math.min(text.length, event.charIndex + (event.charLength || 1));
          revealBubble(text, shown / Math.max(1, text.length));
        }
      };

      u.onend = function () {
        clearTimeout(revealTimer);
        showBubble(text);
        resolve();
      };
      u.onerror = function () {
        clearTimeout(revealTimer);
        resolve();
      };

      speechSynthesis.speak(u);
    });
  }

  async function speakNative(text, token) {
    const sentences = splitSentences(text);
    if (!sentences.length) return;
    for (let i = 0; i < sentences.length; i += 1) {
      if (token !== speakToken) return;
      await speakNativeChunk(sentences[i], token);
      if (token !== speakToken) return;
      if (i < sentences.length - 1) {
        character._mouthTarget = 0.08;
        await new Promise(function (r) { setTimeout(r, 220); });
      }
    }
  }

  function ensureAudioGraph(audioEl) {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    try {
      const source = audioCtx.createMediaElementSource(audioEl);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      return analyser;
    } catch (err) {
      console.warn("Audio graph:", err);
      return null;
    }
  }

  async function speakEleven(text, token) {
    const apiKey = apiKeyInput.value.trim();
    const voiceId = voiceIdInput.value.trim() || DEFAULT_VOICE;
    if (!apiKey) {
      await speakNative(text, token);
      return;
    }

    const chunks = text.length > 280 ? splitSentences(text) : [text];
    let spokenSoFar = "";

    for (let c = 0; c < chunks.length; c += 1) {
      if (token !== speakToken) return;
      const piece = chunks[c];
      setStatus("Hang készítése…");
      const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: piece,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            style: 0.2,
          },
        }),
      });
      if (!res.ok) throw new Error("ElevenLabs " + res.status);
      const blob = await res.blob();
      if (token !== speakToken) return;
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = URL.createObjectURL(blob);

      // Új Audio elem minden chunkhoz (MediaElementSource egyszer köthető)
      currentAudio = new Audio(activeAudioUrl);
      currentAudio.crossOrigin = "anonymous";

      const analyser = ensureAudioGraph(currentAudio);
      if (analyser) character.startAudioLipSync(analyser);
      else character.startVisemeLipSync(piece, { charsPerSecond: 12 });

      spokenSoFar = (spokenSoFar ? spokenSoFar + " " : "") + piece;
      showBubble(spokenSoFar);
      setStatus("Divi beszél…");

      await new Promise(function (resolve, reject) {
        currentAudio.onended = resolve;
        currentAudio.onerror = reject;
        currentAudio.play().catch(reject);
      });
    }
  }

  async function speak(text) {
    const token = ++speakToken;
    character.setState("speaking");
    showBubble("");
    setStatus("Divi beszél…");
    try {
      if (engineSelect.value === "elevenlabs") {
        await speakEleven(text, token);
      } else {
        await speakNative(text, token);
      }
    } catch (err) {
      console.warn(err);
      await speakNative(text, token);
    }
    if (token === speakToken) {
      character.stopLipSync();
      character.setState("idle");
      showBubble(text);
      setStatus("Nyomd meg a mikrofont, vagy írj Divinek");
    }
  }

  function stopListening() {
    listening = false;
    btnMic.classList.remove("listening");
    btnMic.setAttribute("aria-pressed", "false");
    try {
      if (recognition && recognition._clearSilence) recognition._clearSilence();
    } catch (_) {
      /* ignore */
    }
    try {
      if (recognition) recognition.abort();
    } catch (_) {
      try {
        if (recognition) recognition.stop();
      } catch (_) {
        /* ignore */
      }
    }
  }

  function isSecureEnough() {
    if (window.isSecureContext) return true;
    const host = location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }

  function isEmbeddedPreview() {
    try {
      return window.top !== window.self;
    } catch (_) {
      return true;
    }
  }

  function micUnsupportedReason() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      return "Ez a böngésző nem támogatja a beszédfelismerést. Chrome / Edge ajánlott, vagy írj szöveggel.";
    }
    if (!isSecureEnough()) {
      return "A mikrofonhoz HTTPS kell (GitHub Pages vagy localhost).";
    }
    if (isEmbeddedPreview()) {
      return "Az előnézeti keretben (htmlpreview) a mikrofon gyakran tiltva van. Nyisd meg közvetlenül a GitHub Pages oldalt, vagy töltsd le / nyisd meg az index.html-t.";
    }
    return "";
  }

  async function ensureMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Nincs mikrofon API ebben a böngészőben.");
    }
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: "microphone" });
        if (status.state === "denied") {
          micPermission = "denied";
          throw new Error("denied");
        }
        if (status.state === "granted") micPermission = "granted";
      }
    } catch (err) {
      if (err && err.message === "denied") throw err;
    }

    if (micPermission === "granted" && micStream) return true;

    setStatus("Mikrofon engedély kérése… engedélyezd a böngészőben!");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    micStream = stream;
    micPermission = "granted";
    stream.getTracks().forEach(function (t) {
      t.stop();
    });
    micStream = null;
    return true;
  }

  function recreateRecognition() {
    if (recognition) {
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      } catch (_) {
        /* ignore */
      }
    }
    recognition = setupRecognition();
    return recognition;
  }

  async function handleUserText(raw) {
    const text = (typeof DiviBrain.normalizeSpeech === "function"
      ? DiviBrain.normalizeSpeech(raw)
      : String(raw || "")
    ).trim();
    if (!text || busy) return;
    busy = true;
    stopListening();
    stopSpeech();
    userInput.value = "";
    addChat("user", text);
    character.setState("thinking");
    setStatus("Divi gondolkodik…");

    try {
      const reply = await brain.reply(text, {
        echoMode: echoModeInput.checked,
        openAiKey: openAiKeyInput.value.trim(),
      });
      addChat("bot", reply.text);
      if (reply.emotion === "laugh") character.react("laugh");
      await speak(reply.text);
    } catch (err) {
      console.error(err);
      const fallback = "Hoppá, valami elakadt. Próbáld újra!";
      addChat("bot", fallback);
      await speak(fallback);
    }

    busy = false;
    if (autoListenInput.checked && micPermission !== "denied" && !micUnsupportedReason()) {
      setTimeout(function () {
        startListening();
      }, 350);
    }
  }

  function setupRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = "hu-HU";
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    // continuous: hosszabb mondatokhoz; mi magunk zárjuk le csend után
    rec.continuous = true;

    let finalTranscript = "";
    let silenceTimer = null;
    let handled = false;

    function clearSilence() {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    }

    function pickBestAlternative(result) {
      let best = result[0];
      let bestScore = typeof best.confidence === "number" ? best.confidence : 0.5;
      for (let i = 1; i < result.length; i += 1) {
        const c = typeof result[i].confidence === "number" ? result[i].confidence : 0;
        if (c > bestScore) {
          best = result[i];
          bestScore = c;
        }
      }
      return best.transcript || "";
    }

    function commitSpeech() {
      clearSilence();
      if (handled) return;
      const said = (typeof DiviBrain.normalizeSpeech === "function"
        ? DiviBrain.normalizeSpeech(finalTranscript)
        : finalTranscript
      ).trim();
      if (!said) {
        setStatus("Nem értettem tisztán — próbáld újra, kicsit lassabban");
        return;
      }
      handled = true;
      stopListening();
      setStatus("Értem: „" + said + "”");
      handleUserText(said);
    }

    function scheduleCommit() {
      clearSilence();
      // Várj egy kis csendet — így a hosszabb kérdések is megmaradnak
      silenceTimer = setTimeout(commitSpeech, 1100);
    }

    rec.onstart = function () {
      listening = true;
      startingMic = false;
      handled = false;
      finalTranscript = "";
      clearSilence();
      btnMic.classList.add("listening");
      btnMic.setAttribute("aria-pressed", "true");
      character.setState("listening");
      setStatus("Hallgatlak… beszélj nyugodtan, megvárom amíg végzel");
    };

    rec.onresult = function (event) {
      let interim = "";
      // Csak az új részeket adjuk hozzá a finalhoz
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = pickBestAlternative(result).trim();
        if (!piece) continue;
        if (result.isFinal) {
          finalTranscript = (finalTranscript + " " + piece).replace(/\s+/g, " ").trim();
          setStatus("Hallom: " + finalTranscript);
          scheduleCommit();
        } else {
          interim += (interim ? " " : "") + piece;
          setStatus("Hallom: " + (finalTranscript ? finalTranscript + " " : "") + interim + "…");
          // Ha van interim, toljuk a csend-órát
          if (finalTranscript) scheduleCommit();
        }
      }
    };

    rec.onerror = function (event) {
      clearSilence();
      listening = false;
      startingMic = false;
      btnMic.classList.remove("listening");
      btnMic.setAttribute("aria-pressed", "false");
      character.setState("idle");

      const err = event.error || "";
      if (err === "not-allowed" || err === "service-not-allowed") {
        micPermission = "denied";
        setStatus("Mikrofon tiltva. A címsor 🔒 ikonnál engedd engedélyezni, majd nyomd újra a mikrofont.");
      } else if (err === "no-speech") {
        // Egy automatikus újrapróbálás
        if (!handled && micPermission === "granted") {
          setStatus("Nem hallottam — figyelek még egy kicsit…");
          setTimeout(function () {
            if (!busy && !listening) startListening();
          }, 400);
        } else {
          setStatus("Nem hallottam semmit — nyomd meg újra a mikrofont");
        }
      } else if (err === "audio-capture") {
        setStatus("Nem találok mikrofont. Csatlakoztass egyet, vagy írj szöveggel.");
      } else if (err === "network") {
        setStatus("A beszédfelismeréshez net kell (Chrome felhőszolgáltatás).");
      } else if (err !== "aborted") {
        setStatus("Mikrofon hiba (" + err + "). Próbáld újra, vagy írj.");
      }
    };

    rec.onend = function () {
      clearSilence();
      // Ha van félkész szöveg és még nem kezeltük — mentsük
      if (!handled && finalTranscript.trim() && !busy) {
        commitSpeech();
        return;
      }
      listening = false;
      startingMic = false;
      btnMic.classList.remove("listening");
      btnMic.setAttribute("aria-pressed", "false");
      if (!busy && character.state === "listening") character.setState("idle");
    };

    rec._clearSilence = clearSilence;
    return rec;
  }

  async function startListening() {
    if (listening || startingMic) return;

    const blocked = micUnsupportedReason();
    if (blocked) {
      setStatus(blocked);
      showBubble(blocked);
      return;
    }

    // Ha Divi beszél / gondolkodik: szakítsuk meg, hogy a mic működjön
    if (busy) {
      stopSpeech();
      busy = false;
      character.setState("idle");
    } else {
      stopSpeech();
    }

    startingMic = true;
    btnMic.classList.add("listening");
    setStatus("Mikrofon indítása…");

    try {
      await ensureMicPermission();
    } catch (err) {
      startingMic = false;
      btnMic.classList.remove("listening");
      micPermission = "denied";
      const msg =
        "Nem kaptam mikrofon-engedélyt. A böngésző címsorában (🔒) engedd a mikrofont ehhez az oldalhoz, majd próbáld újra.";
      setStatus(msg);
      showBubble(msg);
      return;
    }

    const rec = recreateRecognition();
    if (!rec) {
      startingMic = false;
      btnMic.classList.remove("listening");
      setStatus(micUnsupportedReason() || "Beszédfelismerés nem elérhető.");
      return;
    }

    try {
      rec.start();
    } catch (err) {
      // Már fut — próbáljuk új példánnyal
      try {
        const again = recreateRecognition();
        if (again) again.start();
      } catch (err2) {
        startingMic = false;
        btnMic.classList.remove("listening");
        setStatus("Nem indult a mikrofon. Nyomd meg még egyszer.");
        console.warn(err2);
      }
    }
  }

  function toggleMic() {
    if (listening || startingMic) {
      stopListening();
      startingMic = false;
      character.setState("idle");
      setStatus("Megállítottam a hallgatást");
      return;
    }
    startListening();
  }

  async function bootGreeting() {
    if (greetingDone) return;
    greetingDone = true;
    const warn = micUnsupportedReason();
    if (warn) setStatus(warn);
    const g = brain.greeting();
    addChat("bot", g.text);
    await speak(g.text);
    // Auto-listen csak ha nem iframe/preview és van esély a micre
    if (autoListenInput.checked && !micUnsupportedReason() && micPermission !== "denied") {
      setTimeout(function () {
        startListening();
      }, 400);
    } else {
      setStatus("Nyomd meg a 🎤 gombot a beszélgetéshez (vagy írj)");
    }
  }

  // Events
  btnMic.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!greetingDone) {
      greetingDone = true;
      armed = true;
      const hi = "Szia! Én Divi vagyok — hallgatlak!";
      addChat("bot", hi);
      showBubble(hi);
    }
    toggleMic();
  });
  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    handleUserText(userInput.value);
  });

  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      if (chip.dataset.action === "reset") {
        stopListening();
        stopSpeech();
        brain.reset();
        chatLog.innerHTML = "";
        greetingDone = false;
        bootGreeting();
        return;
      }
      if (chip.dataset.prompt) handleUserText(chip.dataset.prompt);
    });
  });

  hitbox.addEventListener("click", async function () {
    if (busy) {
      character.react("react");
      return;
    }
    busy = true;
    stopListening();
    const line = brain.tapReaction();
    character.react("laugh");
    addChat("bot", line.text);
    await speak(line.text);
    busy = false;
  });

  hitbox.addEventListener("pointermove", function (e) {
    const rect = hitbox.getBoundingClientRect();
    character.lookAt((e.clientX - rect.left) / rect.width);
  });

  btnSettings.addEventListener("click", function () {
    settingsPanel.classList.toggle("hidden");
  });
  btnCloseSettings.addEventListener("click", function () {
    saveSettings();
    settingsPanel.classList.add("hidden");
  });
  engineSelect.addEventListener("change", toggleEngine);
  [apiKeyInput, voiceIdInput, openAiKeyInput, echoModeInput, autoListenInput].forEach(function (el) {
    el.addEventListener("change", saveSettings);
  });

  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = function () {
      cachedMaleVoice = pickMaleHuVoice();
    };
    cachedMaleVoice = pickMaleHuVoice();
  }

  loadSettings();

  let armed = false;
  function arm(e) {
    if (armed) return;
    // A mikrofon saját magának kezdi a beszélgetést — ne ütközzön a köszönéssel
    if (e.target && e.target.closest && e.target.closest("#btn-mic")) return;
    armed = true;
    bootGreeting();
  }
  document.addEventListener("pointerdown", arm);

  const earlyWarn = micUnsupportedReason();
  if (earlyWarn) {
    setStatus(earlyWarn);
  } else {
    setStatus("Koppints bárhova a kezdéshez, vagy nyomd meg a 🎤 gombot");
  }

  btnMic.setAttribute("aria-pressed", "false");
  btnMic.title = "Mikrofon bekapcsolása";
})();
