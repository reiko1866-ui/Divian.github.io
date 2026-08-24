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
  const elevenKeyInput = $("eleven-key");
  const elevenVoiceSelect = $("eleven-voice");
  const elevenVoiceCustom = $("eleven-voice-custom");
  const echoModeInput = $("echo-mode");
  const autoListenInput = $("auto-listen");

  const STORAGE = {
    gemini: "divi-gemini-key",
    eleven: "divi-eleven-key",
    elevenVoice: "divi-eleven-voice",
    elevenVoiceCustom: "divi-eleven-voice-custom",
    echo: "divi-echo",
    autoListen: "divi-auto-listen",
  };
  const DEFAULT_ELEVEN_VOICE = "7B7mSWflzRSaO1yGeJH6"; // Gábor — magyar

  const character = new DiviCharacter(characterEl);
  const brain = new DiviBrain();

  let recognition = null;
  let listening = false;
  let busy = false;
  let speakToken = 0;
  let currentAudio = null;
  let currentSource = null;
  let activeAudioUrl = null;
  let greetingDone = false;
  let micPermission = "unknown";
  let micStream = null;
  let startingMic = false;
  let audioCtx = null;
  let armed = false;
  let sharedAnalyser = null;

  function loadSettings() {
    try {
      geminiKeyInput.value = localStorage.getItem(STORAGE.gemini) || "";
      elevenKeyInput.value = localStorage.getItem(STORAGE.eleven) || "";
      let storedVoice = localStorage.getItem(STORAGE.elevenVoice) || DEFAULT_ELEVEN_VOICE;
      let storedCustom = localStorage.getItem(STORAGE.elevenVoiceCustom) || "";
      storedCustom = normalizeElevenVoiceId(storedCustom);
      storedVoice = normalizeElevenVoiceId(storedVoice) || DEFAULT_ELEVEN_VOICE;

      // Régi, hibás custom ID ne írja felül a Gábort
      if (storedCustom && !isValidVoiceId(storedCustom)) {
        console.warn("[Divi] Régi/hibás Voice ID a localStorage-ban, törlöm:", storedCustom);
        storedCustom = "";
        localStorage.removeItem(STORAGE.elevenVoiceCustom);
      }

      elevenVoiceCustom.value = storedCustom;
      // Ha van érvényes custom, a select lehet üres; különben Gábor
      if (storedCustom) {
        elevenVoiceSelect.value = "";
      } else {
        const opt = Array.from(elevenVoiceSelect.options).some(function (o) {
          return o.value === storedVoice;
        });
        elevenVoiceSelect.value = opt ? storedVoice : DEFAULT_ELEVEN_VOICE;
      }

      echoModeInput.checked = localStorage.getItem(STORAGE.echo) === "1";
      const al = localStorage.getItem(STORAGE.autoListen);
      autoListenInput.checked = al === null ? true : al === "1";
    } catch (_) {
      /* ignore */
    }
  }

  function saveSettings() {
    try {
      const custom = normalizeElevenVoiceId(elevenVoiceCustom.value || "");
      if (custom && elevenVoiceCustom) elevenVoiceCustom.value = custom;
      localStorage.setItem(STORAGE.gemini, geminiKeyInput.value.trim());
      localStorage.setItem(STORAGE.eleven, elevenKeyInput.value.trim());
      localStorage.setItem(
        STORAGE.elevenVoice,
        elevenVoiceSelect.value || DEFAULT_ELEVEN_VOICE
      );
      localStorage.setItem(STORAGE.elevenVoiceCustom, custom);
      localStorage.setItem(STORAGE.echo, echoModeInput.checked ? "1" : "0");
      localStorage.setItem(STORAGE.autoListen, autoListenInput.checked ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
  }

  function getGeminiKey() {
    return ((geminiKeyInput && geminiKeyInput.value) || "").trim();
  }

  function getElevenKey() {
    return ((elevenKeyInput && elevenKeyInput.value) || "").trim();
  }

  function normalizeElevenVoiceId(raw) {
    let id = String(raw || "").trim();
    // Ha a teljes hang-URL-t illesztik be
    const fromUrl = id.match(/elevenlabs\.io\/(?:voices|app\/voice-library)[^\s]*?[/=]([a-zA-Z0-9_-]{16,64})/i);
    if (fromUrl) id = fromUrl[1];
    // Idézőjelek / felesleges szöveg
    id = id.replace(/^["'`]+|["'`]+$/g, "").trim();
    if (/^voice[_ ]?id\s*[:=]\s*/i.test(id)) {
      id = id.replace(/^voice[_ ]?id\s*[:=]\s*/i, "").trim();
    }
    return id;
  }

  function getElevenVoiceId() {
    const custom = normalizeElevenVoiceId(
      (elevenVoiceCustom && elevenVoiceCustom.value) || ""
    );
    if (custom) return custom;
    const selected = normalizeElevenVoiceId(
      (elevenVoiceSelect && elevenVoiceSelect.value) || ""
    );
    if (selected) return selected;
    return DEFAULT_ELEVEN_VOICE;
  }

  function isValidVoiceId(id) {
    const normalized = normalizeElevenVoiceId(id);
    if (typeof DiviBrain.isValidElevenVoiceId === "function") {
      return DiviBrain.isValidElevenVoiceId(normalized);
    }
    return /^[a-zA-Z0-9_-]{16,64}$/.test(normalized);
  }

  function explainElevenFallback(reason) {
    console.warn("[Divi] ElevenLabs helyett böngésző hang:", reason);
    setStatus(reason);
  }

  function pickHuBrowserVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices() || [];
    const hu = voices.filter(function (v) {
      return (v.lang || "").toLowerCase().startsWith("hu");
    });
    return (
      hu.find(function (v) {
        return /male|férfi|ferfi|tamás|tamas|szabolcs/i.test(v.name || "");
      }) ||
      hu[0] ||
      voices.find(function (v) {
        return /hu/i.test(v.lang || "");
      }) ||
      null
    );
  }

  function speakBrowserFallback(text, token) {
    return new Promise(function (resolve) {
      if (!("speechSynthesis" in window)) {
        console.warn("[Divi] Nincs speechSynthesis — csak szöveg jelenik meg.");
        resolve();
        return;
      }
      try {
        speechSynthesis.cancel();
      } catch (_) {
        /* ignore */
      }

      const utter = new SpeechSynthesisUtterance(String(text || ""));
      utter.lang = "hu-HU";
      utter.rate = 0.95;
      utter.pitch = 1.05;
      const voice = pickHuBrowserVoice();
      if (voice) utter.voice = voice;

      character.setState("speaking");
      characterEl.classList.add("is-speaking-audio");
      character.startVisemeLipSync(text, { charsPerSecond: 11 });
      setStatus("Böngésző hang (tartalék)…");

      const finish = function () {
        if (token === speakToken) {
          character.stopLipSync();
        }
        resolve();
      };
      utter.onend = finish;
      utter.onerror = finish;
      speechSynthesis.speak(utter);
    });
  }

  function requireGeminiKey() {
    const key = getGeminiKey();
    if (key) return key;

    const msg =
      "Hiányzik a Gemini API kulcs (szöveg). Nyisd a ⚙️ Beállításokat, illeszd be, majd Kész.";
    console.error("[Divi]", msg);
    setStatus(msg);
    showBubble("Állítsd be a Gemini kulcsot a ⚙️ Beállításokban!");
    settingsPanel.classList.remove("hidden");
    geminiKeyInput.focus();
    return "";
  }

  function requireElevenKey() {
    const key = getElevenKey();
    if (key) return key;

    const msg =
      "Hiányzik az ElevenLabs API kulcs (hang). Nyisd a ⚙️ Beállításokat, illeszd be, majd Kész.";
    console.error("[Divi]", msg);
    console.error(
      "[Divi] A kulcs localStorage-ba kerül (divi-eleven-key) — ne commitold a forráskódba."
    );
    setStatus(msg);
    showBubble("Állítsd be az ElevenLabs kulcsot a ⚙️ Beállításokban, hogy megszólaljak!");
    settingsPanel.classList.remove("hidden");
    elevenKeyInput.focus();
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
    if ("speechSynthesis" in window) {
      try {
        speechSynthesis.cancel();
      } catch (_) {
        /* ignore */
      }
    }
    if (currentSource) {
      try {
        currentSource.onended = null;
        currentSource.stop();
      } catch (_) {
        /* ignore */
      }
      currentSource = null;
    }
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

  function getAnalyser() {
    const ctx = ensureAudioContext();
    if (!ctx) return null;
    if (!sharedAnalyser) {
      sharedAnalyser = ctx.createAnalyser();
      sharedAnalyser.fftSize = 256;
      sharedAnalyser.smoothingTimeConstant = 0.65;
      sharedAnalyser.connect(ctx.destination);
    }
    return sharedAnalyser;
  }

  function pcmBase64ToAudioBuffer(ctx, base64, sampleRate) {
    const binary = atob(base64);
    const bytes = binary.length;
    const samples = bytes >> 1;
    const buffer = ctx.createBuffer(1, samples, sampleRate || 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0, s = 0; s < samples; s += 1, i += 2) {
      let sample = binary.charCodeAt(i) | (binary.charCodeAt(i + 1) << 8);
      if (sample >= 0x8000) sample -= 0x10000;
      channel[s] = sample / 0x8000;
    }
    return buffer;
  }

  function playResult(result, lipText, token) {
    return new Promise(function (resolve, reject) {
      if (token !== speakToken) {
        resolve();
        return;
      }

      const ctx = ensureAudioContext();
      const analyser = getAnalyser();

      // Gyors út: nyers PCM → AudioBuffer (nincs Blob / <audio> decode)
      if (ctx && result && result.pcmBase64) {
        try {
          if (currentSource) {
            try {
              currentSource.onended = null;
              currentSource.stop();
            } catch (_) {
              /* ignore */
            }
            currentSource = null;
          }
          const audioBuffer = pcmBase64ToAudioBuffer(
            ctx,
            result.pcmBase64,
            result.sampleRate || 24000
          );
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          if (analyser) {
            source.connect(analyser);
            character.startAudioLipSync(analyser);
          } else {
            source.connect(ctx.destination);
            character.startVisemeLipSync(lipText, { charsPerSecond: 13 });
          }
          currentSource = source;
          source.onended = function () {
            if (currentSource === source) currentSource = null;
            resolve();
          };
          source.start(0);
          return;
        } catch (err) {
          console.warn("[Divi] PCM lejátszás fallback Blob-ra:", err);
        }
      }

      const blob = result && result.blob;
      if (!blob) {
        reject(new Error("Üres Gemini hangválasz"));
        return;
      }

      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = URL.createObjectURL(blob);
      const audio = new Audio(activeAudioUrl);
      audio.crossOrigin = "anonymous";
      currentAudio = audio;

      if (analyser && ctx) {
        try {
          const src = ctx.createMediaElementSource(audio);
          src.connect(analyser);
          character.startAudioLipSync(analyser);
        } catch (_) {
          character.startVisemeLipSync(lipText, { charsPerSecond: 13 });
        }
      } else {
        character.startVisemeLipSync(lipText, { charsPerSecond: 13 });
      }

      audio.onended = function () {
        resolve();
      };
      audio.onerror = function () {
        reject(new Error("Hang lejátszási hiba"));
      };
      audio.play().catch(reject);
    });
  }

  /**
   * ElevenLabs hang — érvénytelen Voice ID / 400 esetén böngésző TTS
   */
  async function speak(text) {
    const token = ++speakToken;
    const clean = String(text || "").trim();
    if (!clean) return;

    ensureAudioContext();
    character.setState("speaking");
    characterEl.classList.add("is-speaking-audio");
    showBubble(clean);
    character.startVisemeLipSync(clean, { charsPerSecond: 13 });

    const apiKey = getElevenKey();
    const voiceId = getElevenVoiceId();
    const voiceOk = isValidVoiceId(voiceId);

    console.info(
      "[Divi] Hangpróba → ElevenLabs kulcs:",
      apiKey ? "van (" + apiKey.slice(0, 4) + "…)" : "NINCS",
      "| Voice ID:",
      voiceId || "(üres)",
      "| érvényes:",
      voiceOk
    );

    if (!apiKey || !voiceOk) {
      if (!apiKey) {
        explainElevenFallback(
          "Nincs ElevenLabs API kulcs a ⚙️ Beállításokban — ezért böngésző hang szól."
        );
        settingsPanel.classList.remove("hidden");
        elevenKeyInput.focus();
      } else {
        explainElevenFallback(
          "Hibás/üres Voice ID („" +
            voiceId +
            "”) — Gábor ID: 7B7mSWflzRSaO1yGeJH6. Most böngésző hang."
        );
        settingsPanel.classList.remove("hidden");
        if (elevenVoiceCustom) elevenVoiceCustom.focus();
      }
      await speakBrowserFallback(clean, token);
      if (token === speakToken) {
        characterEl.classList.remove("is-speaking-audio");
        character.stopLipSync();
        character.setState("idle");
        showBubble(clean);
        setStatus("Nyomd meg a mikrofont, vagy írj Divinek");
      }
      return;
    }

    setStatus("Hang készül (ElevenLabs · " + voiceId + ")…");
    const chunks =
      clean.length > 280 && typeof DiviBrain.splitSpeechChunks === "function"
        ? DiviBrain.splitSpeechChunks(clean)
        : [clean];

    try {
      let nextFetch = DiviBrain.synthesizeElevenSpeech(chunks[0], apiKey, voiceId);

      for (let i = 0; i < chunks.length; i += 1) {
        if (token !== speakToken) return;

        const pending = nextFetch;
        if (i + 1 < chunks.length) {
          nextFetch = DiviBrain.synthesizeElevenSpeech(chunks[i + 1], apiKey, voiceId);
        }

        const result = await pending;
        if (token !== speakToken) return;

        setStatus("Divi beszél (ElevenLabs)…");
        characterEl.classList.add("is-speaking-audio");
        await playResult(result, chunks[i], token);
        if (i + 1 < chunks.length && token === speakToken) {
          await new Promise(function (r) {
            setTimeout(r, 120);
          });
        }
      }
    } catch (err) {
      console.error("[Divi] ElevenLabs hanghiba:", err);
      const msg = String((err && err.message) || "");
      const invalidVoice =
        err &&
        (err.code === "INVALID_VOICE_ID" ||
          err.status === 400 ||
          /invalid.?voice|voice_id|does not exist/i.test(msg));

      if (token !== speakToken) return;

      if (invalidVoice) {
        explainElevenFallback(
          "ElevenLabs 400 / Voice ID nem elérhető (ID: " +
            voiceId +
            "). Add hozzá a hangot a fiókodhoz (Use voice), vagy ellenőrizd az ID-t. Böngésző hang."
        );
        settingsPanel.classList.remove("hidden");
        if (elevenVoiceCustom) elevenVoiceCustom.focus();
        await speakBrowserFallback(clean, token);
      } else if (err && (err.status === 401 || err.status === 403)) {
        explainElevenFallback(
          "ElevenLabs kulcs elutasítva (" +
            err.status +
            ") — ellenőrizd a kulcsot. Böngésző hang."
        );
        settingsPanel.classList.remove("hidden");
        elevenKeyInput.focus();
        await speakBrowserFallback(clean, token);
      } else if (err && (err.status === 429 || err.code === "QUOTA_EXCEEDED")) {
        explainElevenFallback("ElevenLabs kvóta tele (429) — böngésző hang.");
        await speakBrowserFallback(clean, token);
      } else {
        explainElevenFallback(
          "ElevenLabs hiba — böngésző hang. Részlet: " + msg.slice(0, 140)
        );
        await speakBrowserFallback(clean, token);
      }
      showBubble(clean);
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

    if (!getGeminiKey()) {
      requireGeminiKey();
      setStatus("Állítsd be a Gemini kulcsot a ⚙️ Beállításokban (szöveg). A hang ElevenLabs vagy böngésző.");
      return;
    }

    const warn = micUnsupportedReason();
    if (warn) setStatus(warn);

    const line =
      "Szia! Divi vagyok, a kíváncsi vörös panda! Miről meséljek ma?";
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
    // Hang: ElevenLabs, vagy böngésző tartalék (speak intézi)
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
    const hasGemini = !!getGeminiKey();
    const hasEleven = !!getElevenKey();
    const voiceId = getElevenVoiceId();
    if (hasGemini) {
      console.info(
        "[Divi] Mentve. Szöveg: Gemini · Hang: " +
          (hasEleven && isValidVoiceId(voiceId)
            ? "ElevenLabs (" + voiceId + ")"
            : "böngésző tartalék / hiányzó Voice ID")
      );
      if (!greetingDone) bootGreeting();
    } else {
      console.error("[Divi] Gemini API kulcs hiányzik (szöveg).");
      setStatus("Hiányzik a Gemini kulcs a Beállításokban.");
    }
    if (hasEleven && !isValidVoiceId(voiceId)) {
      console.warn(
        "[Divi] ElevenLabs Voice ID hiányzik vagy hibás. Voices → Copy Voice ID → illeszd be."
      );
    }
  });

  [
    geminiKeyInput,
    elevenKeyInput,
    elevenVoiceSelect,
    elevenVoiceCustom,
    echoModeInput,
    autoListenInput,
  ].forEach(function (el) {
    el.addEventListener("change", saveSettings);
  });

  loadSettings();

  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = function () {
      pickHuBrowserVoice();
    };
    pickHuBrowserVoice();
  }

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
      "[Divi] Állítsd be a Gemini kulcsot (divi-gemini-key) a ⚙️ Beállításokban. ElevenLabs Voice ID: Voices → Copy Voice ID."
    );
    settingsPanel.classList.remove("hidden");
    setStatus("Illeszd be a Gemini kulcsot (és ElevenLabs Voice ID-t) a Beállításokban.");
    showBubble(
      "Szia! Állítsd be a Gemini kulcsot, és másold be az ElevenLabs Voice ID-t a ⚙️ Beállításokban."
    );
  } else {
    const earlyWarn = micUnsupportedReason();
    if (earlyWarn) setStatus(earlyWarn);
    else setStatus("Koppints bárhova a kezdéshez, vagy nyomd meg a 🎤 gombot");
  }

  btnMic.setAttribute("aria-pressed", "false");
  btnMic.title = "Mikrofon bekapcsolása";
})();
