(function () {
  const $ = (id) => document.getElementById(id);

  const engineSelect = $("engine-select");
  const elevenInputs = $("elevenlabs-inputs");
  const apiKeyInput = $("api-key");
  const voiceIdInput = $("voice-id");
  const autoSpeakInput = $("auto-speak");
  const setupPanel = $("setup-panel");
  const storyPanel = $("story-panel");
  const wishInput = $("wish-input");
  const disneySelect = $("disney-select");
  const moodSelect = $("mood-select");
  const heroNameInput = $("hero-name");
  const filmBadge = $("film-badge");
  const chapterLabel = $("chapter-label");
  const storyTitle = $("story-title");
  const storyText = $("story-text");
  const speakStatus = $("speak-status");
  const choicesContainer = $("choices-container");
  const btnStart = $("btn-start");
  const btnSurprise = $("btn-surprise");
  const btnSpeak = $("btn-speak");
  const btnStop = $("btn-stop");
  const btnNew = $("btn-new");
  const btnDownload = $("btn-download");
  const btnFinish = $("btn-finish");

  const STORAGE_ENGINE = "mesemondo-engine";
  const STORAGE_KEY = "mesemondo-eleven-key";
  const STORAGE_VOICE = "mesemondo-eleven-voice";
  const STORAGE_AUTO = "mesemondo-auto-speak";
  const DEFAULT_VOICE = "pNInz6obpgDQGcFmaJgB"; // Adam — férfi mesélő
  const CHUNK_LIMIT = 900;

  let story = null;
  let currentAudioObject = null;
  let activeAudioUrl = null;
  let cachedMaleVoice = null;
  let speakToken = 0;
  let isSpeaking = false;

  function isFemaleVoiceName(name) {
    const n = (name || "").toLowerCase();
    return /női|noi|female|woman|girl|noémi|noemi|szilvia|susan|zira|samantha|rachel|sarah|domi|bella|elli|emily|aria/.test(n);
  }

  function isMaleVoiceName(name) {
    const n = (name || "").toLowerCase();
    return /férfi|ferfi|male|man|tamás|tamas|szabolcs|bálint|balint|istván|istvan|lászló|laszlo|adam|arnold|josh|antoni|daniel|david/.test(n);
  }

  function pickMaleHuVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const hu = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("hu"));
    const maleHu = hu.filter((v) => isMaleVoiceName(v.name) && !isFemaleVoiceName(v.name));
    if (maleHu.length) return maleHu[0];
    const named = hu.find((v) => /tamás|tamas|szabolcs/i.test(v.name));
    if (named) return named;
    const nonFemale = hu.find((v) => !isFemaleVoiceName(v.name));
    return nonFemale || null;
  }

  function setSpeakStatus(msg) {
    if (!speakStatus) return;
    if (!msg) {
      speakStatus.classList.add("hidden");
      speakStatus.textContent = "";
      return;
    }
    speakStatus.classList.remove("hidden");
    speakStatus.textContent = msg;
  }

  function setSpeakingUi(active) {
    isSpeaking = active;
    if (btnSpeak) btnSpeak.disabled = active && engineSelect.value === "elevenlabs";
  }

  function loadSettings() {
    try {
      engineSelect.value = localStorage.getItem(STORAGE_ENGINE) || "native";
      apiKeyInput.value = localStorage.getItem(STORAGE_KEY) || "";
      const savedVoice = localStorage.getItem(STORAGE_VOICE) || DEFAULT_VOICE;
      const femaleIds = ["21m00Tcm4TlvDq8ikWAM", "EXAVITQu4vr4xnSDxMaL", "MF3mGyEYCl7XYWbV9V6O"];
      voiceIdInput.value = femaleIds.includes(savedVoice) ? DEFAULT_VOICE : savedVoice;
      const auto = localStorage.getItem(STORAGE_AUTO);
      autoSpeakInput.checked = auto === null ? true : auto === "1";
    } catch (_) {
      voiceIdInput.value = DEFAULT_VOICE;
      autoSpeakInput.checked = true;
    }
    toggleEngineSettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_ENGINE, engineSelect.value);
      localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
      localStorage.setItem(STORAGE_VOICE, voiceIdInput.value.trim() || DEFAULT_VOICE);
      localStorage.setItem(STORAGE_AUTO, autoSpeakInput.checked ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
  }

  function toggleEngineSettings() {
    if (engineSelect.value === "elevenlabs") {
      elevenInputs.classList.remove("hidden");
    } else {
      elevenInputs.classList.add("hidden");
    }
    saveSettings();
  }

  function decadeLabel(year) {
    if (!year) return "Egyéb";
    const start = Math.floor(year / 10) * 10;
    return start + "-as évek";
  }

  function populateDisneySelect() {
    if (!disneySelect || !MeseEngine.listDisneyFilms) return;
    const films = MeseEngine.listDisneyFilms().slice().sort((a, b) => (a.year || 0) - (b.year || 0));
    const groups = {};
    films.forEach((film) => {
      const key = decadeLabel(film.year);
      if (!groups[key]) groups[key] = [];
      groups[key].push(film);
    });
    Object.keys(groups).forEach((decade) => {
      const og = document.createElement("optgroup");
      og.label = decade;
      groups[decade].forEach((film) => {
        const opt = document.createElement("option");
        opt.value = film.id;
        opt.textContent = film.label;
        og.appendChild(opt);
      });
      disneySelect.appendChild(og);
    });
  }

  function showSetup() {
    stopAudio();
    story = null;
    setupPanel.classList.remove("hidden");
    storyPanel.classList.add("hidden");
    setSpeakStatus("");
  }

  function showStory() {
    setupPanel.classList.add("hidden");
    storyPanel.classList.remove("hidden");
  }

  function renderScene(opts) {
    if (!story) return;
    const autoSpeak = !opts || opts.autoSpeak !== false;
    const scene = MeseEngine.getScene(story);
    if (filmBadge) {
      filmBadge.textContent = story.disneyTitle
        ? "Disney: " + story.disneyTitle
        : "";
    }
    chapterLabel.textContent = scene.chapter;
    storyTitle.textContent = story.title;
    storyText.innerText = scene.text;

    choicesContainer.innerHTML = "";

    if (scene.ending || story.finished) {
      const restart = document.createElement("button");
      restart.className = "choice-btn";
      restart.innerText = "🔄 Új mese";
      restart.onclick = showSetup;
      choicesContainer.appendChild(restart);

      const cont = document.createElement("button");
      cont.className = "choice-btn";
      cont.innerText = "➡️ Mégis folytatom";
      cont.onclick = () => {
        story.finished = false;
        MeseEngine.choose(story, "curious");
        renderScene();
      };
      choicesContainer.appendChild(cont);
    } else {
      scene.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = choice.label;
        btn.onclick = () => {
          stopAudio();
          MeseEngine.choose(story, choice.next);
          renderScene();
        };
        choicesContainer.appendChild(btn);
      });
    }

    if (autoSpeak && autoSpeakInput.checked) {
      speakCurrentStory();
    } else {
      setSpeakStatus("");
    }
  }

  function startStory(wish, disneyId) {
    const selectedId = disneyId || (disneySelect && disneySelect.value) || "";
    let cleaned = (wish || "").trim();
    if (!cleaned && selectedId && MeseEngine.WORLDS[selectedId]) {
      cleaned = MeseEngine.WORLDS[selectedId].disneyTitle + " stílusú kaland";
    }
    cleaned = cleaned || MeseEngine.randomWish();
    wishInput.value = cleaned;
    story = MeseEngine.buildStory({
      wish: cleaned,
      mood: moodSelect.value,
      heroName: heroNameInput.value,
      disneyId: selectedId || undefined,
    });
    showStory();
    renderScene();
  }

  function chunkText(text, limit) {
    const clean = String(text || "").trim();
    if (clean.length <= limit) return [clean];
    const parts = [];
    let rest = clean;
    while (rest.length > limit) {
      let cut = rest.lastIndexOf(". ", limit);
      if (cut < limit * 0.45) cut = rest.lastIndexOf(" ", limit);
      if (cut < limit * 0.3) cut = limit;
      parts.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) parts.push(rest);
    return parts.filter(Boolean);
  }

  function speakCurrentStory() {
    if (!story) return;
    stopAudio();
    const text = MeseEngine.getScene(story).text;
    const engine = engineSelect.value;
    const token = ++speakToken;

    if (engine === "elevenlabs") {
      const apiKey = apiKeyInput.value.trim();
      const voiceId = voiceIdInput.value.trim() || DEFAULT_VOICE;
      if (!apiKey || !voiceId) {
        alert("Kérlek add meg az ElevenLabs API kulcsot és a Voice ID-t!");
        return;
      }
      saveSettings();
      speakElevenLabs(text, apiKey, voiceId, token);
    } else {
      speakNative(text, token);
    }
  }

  function speakNative(text, token) {
    if (!("speechSynthesis" in window)) return;
    setSpeakingUi(true);
    setSpeakStatus("Mesélő beszél…");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hu-HU";
    utterance.rate = 0.88;
    utterance.pitch = 0.9;

    cachedMaleVoice = pickMaleHuVoice() || cachedMaleVoice;
    if (cachedMaleVoice) {
      utterance.voice = cachedMaleVoice;
    } else {
      utterance.pitch = 0.75;
    }

    utterance.onend = () => {
      if (token !== speakToken) return;
      setSpeakingUi(false);
      setSpeakStatus("");
    };
    utterance.onerror = () => {
      if (token !== speakToken) return;
      setSpeakingUi(false);
      setSpeakStatus("");
    };

    window.speechSynthesis.speak(utterance);
  }

  function playBlob(blob, token) {
    return new Promise((resolve, reject) => {
      if (token !== speakToken) {
        resolve(false);
        return;
      }
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      const audioUrl = URL.createObjectURL(blob);
      activeAudioUrl = audioUrl;
      currentAudioObject = new Audio(audioUrl);
      currentAudioObject.onended = () => resolve(true);
      currentAudioObject.onerror = () => reject(new Error("Audio lejátszási hiba"));
      currentAudioObject.play().catch(reject);
    });
  }

  async function fetchElevenChunk(text, apiKey, voiceId) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.8,
          style: 0.15,
        },
      }),
    });
    if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
    return response.blob();
  }

  async function speakElevenLabs(text, apiKey, voiceId, token) {
    const chunks = chunkText(text, CHUNK_LIMIT);
    setSpeakingUi(true);
    try {
      for (let i = 0; i < chunks.length; i += 1) {
        if (token !== speakToken) return;
        setSpeakStatus(
          chunks.length > 1
            ? `Hang készítése… (${i + 1}/${chunks.length})`
            : "Hang készítése…"
        );
        const blob = await fetchElevenChunk(chunks[i], apiKey, voiceId);
        if (token !== speakToken) return;
        setSpeakStatus(
          chunks.length > 1
            ? `Mesélő beszél… (${i + 1}/${chunks.length})`
            : "Mesélő beszél…"
        );
        await playBlob(blob, token);
      }
      if (token === speakToken) setSpeakStatus("");
    } catch (err) {
      console.error("ElevenLabs hiba, visszatérés a beépített hangra:", err);
      if (token === speakToken) {
        setSpeakStatus("ElevenLabs hiba — böngésző hangra váltok");
        speakNative(text, token);
        return;
      }
    } finally {
      if (token === speakToken) setSpeakingUi(false);
    }
  }

  function stopAudio() {
    speakToken += 1;
    setSpeakingUi(false);
    setSpeakStatus("");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioObject) {
      currentAudioObject.pause();
      currentAudioObject = null;
    }
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    }
  }

  function downloadStory() {
    if (!story) return;
    const text = MeseEngine.fullTranscript(story);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  engineSelect.addEventListener("change", toggleEngineSettings);
  apiKeyInput.addEventListener("change", saveSettings);
  voiceIdInput.addEventListener("change", saveSettings);
  autoSpeakInput.addEventListener("change", saveSettings);

  btnStart.addEventListener("click", () => startStory(wishInput.value));
  btnSurprise.addEventListener("click", () => {
    const films = MeseEngine.listDisneyFilms();
    const film = films[Math.floor(Math.random() * films.length)];
    if (disneySelect) disneySelect.value = film.id;
    startStory(film.title + " stílusú kaland", film.id);
  });
  if (disneySelect) {
    disneySelect.addEventListener("change", () => {
      if (!disneySelect.value) return;
      const world = MeseEngine.WORLDS[disneySelect.value];
      if (world) wishInput.value = world.disneyTitle + " stílusú kaland";
    });
  }
  btnSpeak.addEventListener("click", speakCurrentStory);
  btnStop.addEventListener("click", stopAudio);
  btnNew.addEventListener("click", showSetup);
  btnDownload.addEventListener("click", downloadStory);
  btnFinish.addEventListener("click", () => {
    if (!story || story.finished) return;
    stopAudio();
    MeseEngine.finishStory(story);
    renderScene({ autoSpeak: autoSpeakInput.checked });
  });

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedMaleVoice = pickMaleHuVoice();
    };
    cachedMaleVoice = pickMaleHuVoice();
  }
  loadSettings();
  populateDisneySelect();
  showSetup();
})();
