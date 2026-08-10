(function () {
  const $ = (id) => document.getElementById(id);

  const engineSelect = $("engine-select");
  const elevenInputs = $("elevenlabs-inputs");
  const apiKeyInput = $("api-key");
  const voiceIdInput = $("voice-id");
  const setupPanel = $("setup-panel");
  const storyPanel = $("story-panel");
  const wishInput = $("wish-input");
  const disneySelect = $("disney-select");
  const moodSelect = $("mood-select");
  const heroNameInput = $("hero-name");
  const chapterLabel = $("chapter-label");
  const storyTitle = $("story-title");
  const storyText = $("story-text");
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
  const DEFAULT_VOICE = "pNInz6obpgDQGcFmaJgB"; // Adam — férfi mesélő (NE Rachel/női!)

  let story = null;
  let currentAudioObject = null;
  let activeAudioUrl = null;
  let cachedMaleVoice = null;

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
    // Ha van Tamás / Szabolcs a névben
    const named = hu.find((v) => /tamás|tamas|szabolcs/i.test(v.name));
    if (named) return named;
    // Kerüljük a női hangokat
    const nonFemale = hu.find((v) => !isFemaleVoiceName(v.name));
    return nonFemale || null;
  }

  function loadSettings() {
    try {
      engineSelect.value = localStorage.getItem(STORAGE_ENGINE) || "native";
      apiKeyInput.value = localStorage.getItem(STORAGE_KEY) || "";
      const savedVoice = localStorage.getItem(STORAGE_VOICE) || DEFAULT_VOICE;
      // Ha valaki korábban női Rachel ID-t mentett, cseréljük férfira
      const femaleIds = ["21m00Tcm4TlvDq8ikWAM", "EXAVITQu4vr4xnSDxMaL", "MF3mGyEYCl7XYWbV9V6O"];
      voiceIdInput.value = femaleIds.includes(savedVoice) ? DEFAULT_VOICE : savedVoice;
    } catch (_) {
      voiceIdInput.value = DEFAULT_VOICE;
    }
    toggleEngineSettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_ENGINE, engineSelect.value);
      localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
      localStorage.setItem(STORAGE_VOICE, voiceIdInput.value.trim() || DEFAULT_VOICE);
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

  function showSetup() {
    stopAudio();
    story = null;
    setupPanel.classList.remove("hidden");
    storyPanel.classList.add("hidden");
  }

  function showStory() {
    setupPanel.classList.add("hidden");
    storyPanel.classList.remove("hidden");
  }

  function renderScene() {
    if (!story) return;
    const scene = MeseEngine.getScene(story);
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

    speakCurrentStory();
  }

  function populateDisneySelect() {
    if (!disneySelect || !MeseEngine.listDisneyFilms) return;
    const films = MeseEngine.listDisneyFilms();
    films.forEach((film) => {
      const opt = document.createElement("option");
      opt.value = film.id;
      opt.textContent = film.label;
      disneySelect.appendChild(opt);
    });
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

  // Felolvasó logika (routing) — a megadott minta szerint
  function speakCurrentStory() {
    if (!story) return;
    stopAudio();
    const text = MeseEngine.getScene(story).text;
    const engine = engineSelect.value;

    if (engine === "elevenlabs") {
      const apiKey = apiKeyInput.value.trim();
      const voiceId = voiceIdInput.value.trim() || DEFAULT_VOICE;

      if (!apiKey || !voiceId) {
        alert("Kérlek add meg az ElevenLabs API kulcsot és a Voice ID-t!");
        return;
      }
      saveSettings();
      speakElevenLabs(text, apiKey, voiceId);
    } else {
      speakNative(text);
    }
  }

  function speakNative(text) {
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hu-HU";
    utterance.rate = 0.88; // Nyugodt mesélős tempó
    // Férfi mesélő: kissé mélyebb hangszín, ne nőies pitch
    utterance.pitch = 0.9;

    cachedMaleVoice = pickMaleHuVoice() || cachedMaleVoice;
    if (cachedMaleVoice) {
      utterance.voice = cachedMaleVoice;
    } else {
      // Ha csak női magyar hang van, ne emeljük a pitch-et — inkább mélyítsük
      utterance.pitch = 0.75;
    }

    window.speechSynthesis.speak(utterance);
  }

  async function speakElevenLabs(text, apiKey, voiceId) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.8,
            style: 0.15,
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);

      const audioBlob = await response.blob();
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      const audioUrl = URL.createObjectURL(audioBlob);
      activeAudioUrl = audioUrl;

      currentAudioObject = new Audio(audioUrl);
      currentAudioObject.play();
    } catch (err) {
      console.error("ElevenLabs hiba, visszatérés a beépített hangra:", err);
      speakNative(text);
    }
  }

  function stopAudio() {
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
    renderScene();
  });

  // Indítás
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
