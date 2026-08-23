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

  function stopListening() {
    listening = false;
    btnMic.classList.remove("listening");
    try {
      if (recognition) recognition.stop();
    } catch (_) {
      /* ignore */
    }
  }

  function speakNative(text, token) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hu-HU";
      u.rate = 1.02;
      u.pitch = 1.15;
      cachedMaleVoice = pickMaleHuVoice() || cachedMaleVoice;
      // Divi: játékos, kissé magasabb pitch (karakterhang), ha van férfi alap
      if (cachedMaleVoice) u.voice = cachedMaleVoice;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      if (token !== speakToken) {
        resolve();
        return;
      }
      speechSynthesis.speak(u);
    });
  }

  async function speakEleven(text, token) {
    const apiKey = apiKeyInput.value.trim();
    const voiceId = voiceIdInput.value.trim() || DEFAULT_VOICE;
    if (!apiKey) {
      await speakNative(text, token);
      return;
    }
    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.35 },
      }),
    });
    if (!res.ok) throw new Error("ElevenLabs " + res.status);
    const blob = await res.blob();
    if (token !== speakToken) return;
    if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = URL.createObjectURL(blob);
    currentAudio = new Audio(activeAudioUrl);
    await new Promise((resolve, reject) => {
      currentAudio.onended = resolve;
      currentAudio.onerror = reject;
      currentAudio.play().catch(reject);
    });
  }

  async function speak(text) {
    const token = ++speakToken;
    character.setState("speaking");
    showBubble(text);
    try {
      if (engineSelect.value === "elevenlabs") {
        setStatus("Divi beszél…");
        await speakEleven(text, token);
      } else {
        setStatus("Divi beszél…");
        await speakNative(text, token);
      }
    } catch (err) {
      console.warn(err);
      await speakNative(text, token);
    }
    if (token === speakToken) {
      character.setState("idle");
      setStatus("Nyomd meg a mikrofont, vagy írj Divinek");
    }
  }

  async function handleUserText(raw) {
    const text = (raw || "").trim();
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
    if (autoListenInput.checked) {
      setTimeout(startListening, 350);
    }
  }

  function setupRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus("A böngésződ nem támogatja a mikrofonos beszédfelismerést — írj helyette");
      return null;
    }
    const rec = new SR();
    rec.lang = "hu-HU";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = function () {
      listening = true;
      btnMic.classList.add("listening");
      character.setState("listening");
      setStatus("Hallgatlak… beszélj bátran!");
    };

    rec.onresult = function (event) {
      const said = event.results[0][0].transcript;
      handleUserText(said);
    };

    rec.onerror = function (event) {
      listening = false;
      btnMic.classList.remove("listening");
      character.setState("idle");
      if (event.error === "not-allowed") {
        setStatus("Mikrofon engedély kell a böngészőben");
      } else if (event.error !== "aborted") {
        setStatus("Nem értettem — próbáld újra vagy írj");
      }
    };

    rec.onend = function () {
      listening = false;
      btnMic.classList.remove("listening");
      if (!busy && character.state === "listening") character.setState("idle");
    };

    return rec;
  }

  function startListening() {
    if (busy) return;
    if (!recognition) recognition = setupRecognition();
    if (!recognition) return;
    stopSpeech();
    try {
      recognition.start();
    } catch (_) {
      // already started
    }
  }

  function toggleMic() {
    if (listening) {
      stopListening();
      character.setState("idle");
      setStatus("Megállítottam a hallgatást");
      return;
    }
    startListening();
  }

  async function bootGreeting() {
    if (greetingDone) return;
    greetingDone = true;
    const g = brain.greeting();
    addChat("bot", g.text);
    await speak(g.text);
    if (autoListenInput.checked) setTimeout(startListening, 400);
  }

  // Events
  btnMic.addEventListener("click", toggleMic);
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
  recognition = setupRecognition();
  // Első gesztus után köszön (böngésző hang policy)
  let armed = false;
  function arm() {
    if (armed) return;
    armed = true;
    bootGreeting();
  }
  document.addEventListener("pointerdown", arm, { once: true });
  setStatus("Koppints bárhova a kezdéshez");
})();
