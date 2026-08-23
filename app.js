(function () {
  "use strict";

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
  const geminiKeyInput = $("gemini-key");
  const geminiVoiceSelect = $("gemini-voice");
  const echoModeInput = $("echo-mode");
  const autoListenInput = $("auto-listen");

  const STORAGE = {
    gemini: "divi-gemini-key",
    voice: "divi-gemini-voice",
    echo: "divi-echo",
    autoListen: "divi-auto-listen",
  };

  const character = new DiviCharacter(characterEl);
  const brain = new DiviBrain();

  let recognition = null;
  let listening = false;
  let busy = false;
  let speakToken = 0;
  let currentAudio = null;
  let activeAudioUrl = null;
  let greetingDone = false;
  let micPermission = "unknown";
  let micStream = null;
  let startingMic = false;
  let audioCtx = null;
  let armed = false;

  function loadSettings() {
    try {
      geminiKeyInput.value = localStorage.getItem(STORAGE.gemini) || "";
      geminiVoiceSelect.value = localStorage.getItem(STORAGE.voice) || "Aoede";
      echoModeInput.checked = localStorage.getItem(STORAGE.echo) === "1";
      const al = localStorage.getItem(STORAGE.autoListen);
      autoListenInput.checked = al === null ? true : al === "1";
    } catch (_) {
      /* ignore */
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE.gemini, geminiKeyInput.value.trim());
      localStorage.setItem(STORAGE.voice, geminiVoiceSelect.value || "Aoede");
      localStorage.setItem(STORAGE.echo, echoModeInput.checked ? "1" : "0");
      localStorage.setItem(STORAGE.autoListen, autoListenInput.checked ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
  }

  function getGeminiKey() {
    return (geminiKeyInput && geminiKeyInput.value || "").trim();
  }

  function requireGeminiKey() {
    const key = getGeminiKey();
    if (key) return key;

    const msg =
      "Hiányzik a Gemini API kulcs. Nyisd a ⚙️ Beállításokat, illeszd be a kulcsot a „Gemini API kulcs” mezőbe, majd kattints Kész-re.";
    console.error("[Divi]", msg);
    console.error(
      "[Divi] A kulcs a böngésző localStorage-ába kerül (divi-gemini-key) — ne commitold a forráskódba."
    );
    setStatus(msg);
    showBubble("Állítsd be a Gemini kulcsot a ⚙️ Beállításokban, hogy beszélhessek!");
    settingsPanel.classList.remove("hidden");
    geminiKeyInput.focus();
    return "";
  }

  function setStatus(msg) {
    statusLine.textContent = msg || "";
  }

  function showBubble(text) {
    bubbleText.textContent = text || "";
    bubble.classList.toggle("hidden", !text);
  }

  function addChat(role, text) {
    const div = document.createElement("div");
    div.className = "chat-row " + role;
    div.innerHTML =
      "<strong>" +
      (role === "user" ? "Te" : "Divi") +
      ":</strong> " +
      escapeHtml(text);
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stopSpeech() {
    speakToken += 1;
    characterEl.classList.remove("is-speaking-audio");
    character.stopLipSync();
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.removeAttribute("src");
        currentAudio.load();
      } catch (_) {
        /* ignore */
      }
      currentAudio = null;
    }
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    }
  }

  function ensureAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function ensureAudioGraph(audioEl) {
    const ctx = ensureAudioContext();
    if (!ctx) return null;
    try {
      const source = ctx.createMediaElementSource(audioEl);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      return analyser;
    } catch (err) {
      console.warn("[Divi] Audio graph:", err);
      return null;
    }
  }

  /**
   * Gemini TTS hang lejátszása — NEM window.speechSynthesis
   */
  async function speak(text) {
    const token = ++speakToken;
    const clean = String(text || "").trim();
    if (!clean) return;

    const apiKey = requireGeminiKey();
    if (!apiKey) return;

    character.setState("speaking");
    characterEl.classList.add("is-speaking-audio");
    showBubble(clean);
    setStatus("Hang készül (Gemini)…");

    try {
      const voice = geminiVoiceSelect.value || "Aoede";
      const result = await DiviBrain.synthesizeGeminiSpeech(clean, apiKey, voice);
      if (token !== speakToken) return;

      const blob = result && result.blob;
      if (!blob) throw new Error("Üres Gemini hangválasz");

      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = URL.createObjectURL(blob);

      currentAudio = new Audio(activeAudioUrl);
      currentAudio.crossOrigin = "anonymous";

      const analyser = ensureAudioGraph(currentAudio);
      if (analyser) character.startAudioLipSync(analyser);
      else character.startVisemeLipSync(clean, { charsPerSecond: 12 });

      setStatus("Divi beszél…");
      characterEl.classList.add("is-speaking-audio");

      await new Promise(function (resolve, reject) {
        currentAudio.onended = resolve;
        currentAudio.onerror = function () {
          reject(new Error("Hang lejátszási hiba"));
        };
        currentAudio.play().catch(reject);
      });
    } catch (err) {
      console.error("[Divi] Gemini hanghiba:", err);
      if (token === speakToken) {
        let hint = "A hang most nem ment, de a szöveg megvan.";
        if (err && err.message === "MISSING_GEMINI_KEY") {
          hint = "Hiányzik a Gemini API kulcs a Beállításokban.";
        } else if (
          err &&
          (err.status === 429 ||
            err.code === "QUOTA_EXCEEDED" ||
            /429|RESOURCE_EXHAUSTED|quota/i.test(String(err.message || "")))
        ) {
          hint =
            "Hang-kvóta tele (429). Várj egy percet — a szöveg megvan, a hang majd újra megy.";
        } else if (err && err.message) {
          hint = "A hang most nem ment (" + err.message.slice(0, 120) + "), de a szöveg megvan.";
        }
        setStatus(hint);
        showBubble(clean);
        // Viseme „néma beszéd”, hogy ne álljon meg teljesen a karakter
        character.startVisemeLipSync(clean, { charsPerSecond: 12 });
        await new Promise(function (r) {
          setTimeout(r, Math.min(2800, 700 + clean.length * 45));
        });
        character.stopLipSync();
      }
    }

    if (token === speakToken) {
      characterEl.classList.remove("is-speaking-audio");
      character.stopLipSync();
      character.setState("idle");
      showBubble(clean);
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
      return "Az előnézeti keretben a mikrofon gyakran tiltva van. Nyisd meg közvetlenül a GitHub Pages oldalt.";
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
    const text = (
      typeof DiviBrain.normalizeSpeech === "function"
        ? DiviBrain.normalizeSpeech(raw)
        : String(raw || "")
    ).trim();
    if (!text || busy) return;

    if (!requireGeminiKey()) return;

    busy = true;
    stopListening();
    stopSpeech();
    userInput.value = "";
    addChat("user", text);
    character.setState("thinking");
    setStatus("Divi gondolkodik (Gemini)…");

    try {
      const reply = await brain.reply(text, {
        echoMode: echoModeInput.checked,
        geminiKey: getGeminiKey(),
      });
      addChat("bot", reply.text);
      if (reply.quotaFallback) {
        setStatus("Gemini kvóta tele (429) — ideiglenes válasz. Várj 1–2 percet, majd próbáld újra.");
        console.warn("[Divi] QUOTA_EXCEEDED — helyi fallback válasz.");
      }
      if (reply.emotion === "laugh") character.react("laugh");
      await speak(reply.text);
    } catch (err) {
      console.error("[Divi]", err);
      let msg = "Hoppá, valami elakadt a Gemini API-nál. Próbáld újra!";
      if (err && err.message === "MISSING_GEMINI_KEY") {
        msg = "Hiányzik a Gemini API kulcs. Illeszd be a ⚙️ Beállításokban.";
        settingsPanel.classList.remove("hidden");
        geminiKeyInput.focus();
      } else if (err && (err.status === 429 || err.code === "QUOTA_EXCEEDED" || /429|RESOURCE_EXHAUSTED|quota/i.test(String(err.message || "")))) {
        msg =
          "A Gemini kvóta ideiglenesen betelt (HTTP 429). Várj 1–2 percet, majd kérdezz újra — Divi addig is itt van!";
      } else if (err && err.message) {
        msg = err.message.slice(0, 220);
      }
      addChat("bot", msg);
      showBubble(msg);
      setStatus(msg);
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
      const said = (
        typeof DiviBrain.normalizeSpeech === "function"
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
          setStatus(
            "Hallom: " + (finalTranscript ? finalTranscript + " " : "") + interim + "…"
          );
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
        setStatus(
          "Mikrofon tiltva. A címsor 🔒 ikonnál engedd engedélyezni, majd nyomd újra a mikrofont."
        );
      } else if (err === "no-speech") {
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

    if (!requireGeminiKey()) return;

    const blocked = micUnsupportedReason();
    if (blocked) {
      setStatus(blocked);
      showBubble(blocked);
      return;
    }

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
    ensureAudioContext();

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

    if (!requireGeminiKey()) {
      setStatus(
        "Illeszd be a Gemini API kulcsot a ⚙️ Beállításokban (szöveg + élethű hang)."
      );
      return;
    }

    const warn = micUnsupportedReason();
    if (warn) setStatus(warn);

    const line =
      "Szia! Divi vagyok, a kíváncsi vörös panda a bambuszerdőből! Miről meséljek neked ma?";
    addChat("bot", line);
    await speak(line);

    if (autoListenInput.checked && !micUnsupportedReason() && micPermission !== "denied") {
      setTimeout(function () {
        startListening();
      }, 400);
    } else {
      setStatus("Nyomd meg a 🎤 gombot a beszélgetéshez (vagy írj)");
    }
  }

  btnMic.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    ensureAudioContext();
    if (!greetingDone) {
      greetingDone = true;
      armed = true;
      if (!requireGeminiKey()) return;
      const hi = "Szia! Én Divi vagyok, a vörös pandád — hallgatlak!";
      addChat("bot", hi);
      showBubble(hi);
    }
    toggleMic();
  });

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    ensureAudioContext();
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
    if (!requireGeminiKey()) return;
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
    if (getGeminiKey()) {
      console.info(
        "[Divi] Gemini kulcs mentve. Szöveg + hang: Gemini API. Hangszín:",
        geminiVoiceSelect.value || "Aoede"
      );
      if (!greetingDone) bootGreeting();
    } else {
      console.error(
        "[Divi] Gemini API kulcs még mindig hiányzik. Illeszd be a „Gemini API kulcs” mezőbe."
      );
      setStatus("Hiányzik a Gemini API kulcs — illeszd be a Beállításokban.");
    }
  });

  [geminiKeyInput, geminiVoiceSelect, echoModeInput, autoListenInput].forEach(function (el) {
    el.addEventListener("change", saveSettings);
  });

  loadSettings();

  function arm(e) {
    if (armed) return;
    if (e.target && e.target.closest && e.target.closest("#btn-mic")) return;
    armed = true;
    ensureAudioContext();
    bootGreeting();
  }
  document.addEventListener("pointerdown", arm);

  if (!getGeminiKey()) {
    console.error(
      "[Divi] Gemini API kulcs hiányzik. Nyisd a ⚙️ Beállításokat, és illeszd be a kulcsot a „Gemini API kulcs” mezőbe (localStorage: divi-gemini-key)."
    );
    settingsPanel.classList.remove("hidden");
    setStatus("Illeszd be a Gemini API kulcsot a Beállításokban (szöveg + hang).");
    showBubble("Szia! Állítsd be a Gemini kulcsot a ⚙️ Beállításokban, és máris beszélgethetünk.");
  } else {
    const earlyWarn = micUnsupportedReason();
    if (earlyWarn) setStatus(earlyWarn);
    else setStatus("Koppints bárhova a kezdéshez, vagy nyomd meg a 🎤 gombot");
  }

  btnMic.setAttribute("aria-pressed", "false");
  btnMic.title = "Mikrofon bekapcsolása";
})();
