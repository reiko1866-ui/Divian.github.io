(function () {
  const $ = (id) => document.getElementById(id);

  const screenWelcome = $("screen-welcome");
  const screenStory = $("screen-story");
  const wishForm = $("wish-form");
  const wishInput = $("wish-input");
  const heroNameInput = $("hero-name");
  const micBtn = $("btn-mic");
  const micStatus = $("mic-status");
  const btnSurprise = $("btn-surprise");
  const btnNewStory = $("btn-new-story");
  const chapterLabel = $("chapter-label");
  const storyTitle = $("story-title");
  const storyText = $("story-text");
  const choicesEl = $("choices");
  const endingActions = $("ending-actions");
  const storyActions = $("story-actions");
  const btnSpeak = $("btn-speak");
  const btnStopSpeak = $("btn-stop-speak");
  const speakLabel = $("speak-label");
  const btnRestart = $("btn-restart");
  const btnDownload = $("btn-download");
  const btnDownloadEnd = $("btn-download-end");
  const btnFinish = $("btn-finish");
  const btnContinueForever = $("btn-continue-forever");
  const brandHome = $("brand-home");

  let story = null;
  let recognition = null;
  let listening = false;
  let speaking = false;
  let hungarianVoice = null;
  let speakQueue = [];
  let speakKeepAlive = null;
  let speakGeneration = 0;

  function selectedMood() {
    const el = document.querySelector('input[name="mood"]:checked');
    return el ? el.value : "vidam";
  }

  function showWelcome() {
    stopSpeak();
    stopMic();
    story = null;
    screenWelcome.hidden = false;
    screenWelcome.classList.add("is-active");
    screenStory.hidden = true;
    screenStory.classList.remove("is-active");
    btnNewStory.hidden = true;
    endingActions.hidden = true;
    if (storyActions) storyActions.hidden = true;
    choicesEl.innerHTML = "";
  }

  function showStory() {
    screenWelcome.hidden = true;
    screenWelcome.classList.remove("is-active");
    screenStory.hidden = false;
    screenStory.classList.add("is-active");
    btnNewStory.hidden = false;
  }

  function renderScene() {
    if (!story) return;
    const scene = MeseEngine.getScene(story);
    chapterLabel.textContent = scene.chapter;
    storyTitle.textContent = story.title + (story.chapterNum > 1 ? ` · ${story.chapterNum}. fejezet` : "");
    storyText.textContent = scene.text;
    storyText.classList.remove("is-refreshing");
    void storyText.offsetWidth;
    storyText.classList.add("is-refreshing");

    choicesEl.innerHTML = "";
    const isEnding = !!scene.ending || !!story.finished;
    endingActions.hidden = !isEnding;
    if (storyActions) storyActions.hidden = isEnding;

    if (!isEnding) {
      scene.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.textContent = choice.label;
        btn.addEventListener("click", () => {
          stopSpeak();
          MeseEngine.choose(story, choice.next);
          renderScene();
        });
        choicesEl.appendChild(btn);
      });
    }

    maybeAutoSpeak();
  }

  function startStoryFromWish(wish) {
    const cleaned = (wish || "").trim();
    if (!cleaned) {
      micStatus.textContent = "Írd be vagy mondd be, milyen mesét szeretnél.";
      wishInput.focus();
      return;
    }
    story = MeseEngine.buildStory({
      wish: cleaned,
      mood: selectedMood(),
      heroName: heroNameInput.value,
    });
    // reset log so ending doesn't duplicate oddly
    story.log = [];
    showStory();
    renderScene();
  }

  wishForm.addEventListener("submit", (e) => {
    e.preventDefault();
    stopMic();
    startStoryFromWish(wishInput.value);
  });

  btnSurprise.addEventListener("click", () => {
    const wish = MeseEngine.randomWish();
    wishInput.value = wish;
    startStoryFromWish(wish);
  });

  function goHome(e) {
    if (e) e.preventDefault();
    showWelcome();
    micStatus.textContent = "";
  }

  btnNewStory.addEventListener("click", goHome);
  btnRestart.addEventListener("click", goHome);
  brandHome.addEventListener("click", goHome);

  function downloadStory() {
    if (!story) return;
    const text = buildDownloadText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  btnDownload.addEventListener("click", downloadStory);
  if (btnDownloadEnd) btnDownloadEnd.addEventListener("click", downloadStory);

  if (btnFinish) {
    btnFinish.addEventListener("click", () => {
      if (!story || story.finished) return;
      stopSpeak();
      MeseEngine.finishStory(story);
      renderScene();
    });
  }

  if (btnContinueForever) {
    btnContinueForever.addEventListener("click", () => {
      if (!story) return;
      stopSpeak();
      // Re-open the endless path from a fresh continuation beat
      story.finished = false;
      MeseEngine.choose(story, pick(["kind", "curious", "brave", "clever", "rest"]));
      renderScene();
    });
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function buildDownloadText() {
    const raw = MeseEngine.fullTranscript(story);
    const blocks = raw.split(/\n\n+/);
    const out = [];
    let prev = "";
    for (const b of blocks) {
      if (b !== prev) out.push(b);
      prev = b;
    }
    return out.join("\n\n") + "\n";
  }

  /* ----- Speech recognition (bemondás) ----- */
  function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      micBtn.disabled = true;
      micBtn.title = "A böngésző nem támogatja a hangbemondást";
      micStatus.textContent = "A hangbemondás ebben a böngészőben nem elérhető — írd be a meséd.";
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = "hu-HU";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      listening = true;
      micBtn.classList.add("is-listening");
      micBtn.setAttribute("aria-pressed", "true");
      micStatus.textContent = "Hallgatlak… mondd el, milyen mesét szeretnél.";
    };

    recognition.onerror = (event) => {
      listening = false;
      micBtn.classList.remove("is-listening");
      micBtn.setAttribute("aria-pressed", "false");
      if (event.error === "not-allowed") {
        micStatus.textContent = "Nincs mikrofon-engedély. Engedélyezd, vagy írd be a mesét.";
      } else if (event.error !== "aborted") {
        micStatus.textContent = "Nem hallottam tisztán. Próbáld újra, vagy írd be.";
      }
    };

    recognition.onend = () => {
      listening = false;
      micBtn.classList.remove("is-listening");
      micBtn.setAttribute("aria-pressed", "false");
      if (!wishInput.value.trim()) {
        micStatus.textContent = "Nem érkezett szöveg. Koppints újra a mikrofonra.";
      } else if (micStatus.textContent.startsWith("Hallgatlak")) {
        micStatus.textContent = "Kész! Nyomd meg: Induljon a mese.";
      }
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      wishInput.value = (finalText || interim).trim();
      if (finalText) {
        micStatus.textContent = "Meghallottam. Indíthatod a mesét!";
      }
    };
  }

  function stopMic() {
    if (recognition && listening) {
      try {
        recognition.stop();
      } catch (_) {
        /* ignore */
      }
    }
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) {
      micStatus.textContent = "A hangbemondás nem elérhető ebben a böngészőben.";
      return;
    }
    if (listening) {
      recognition.stop();
      return;
    }
    stopSpeak();
    try {
      recognition.start();
    } catch (_) {
      micStatus.textContent = "Várj egy pillanatot, és próbáld újra.";
    }
  });

  /* ----- Voice settings + clean narration ----- */
  const openaiFields = $("openai-fields");
  const openaiKeyInput = $("openai-key");
  const openaiVoiceSelect = $("openai-voice");
  const browserVoiceHint = $("browser-voice-hint");
  const activeVoiceLabel = $("active-voice-label");
  const STORAGE_KEY = "mesehang-openai-key";
  const STORAGE_VOICE = "mesehang-openai-voice";
  const STORAGE_ENGINE = "mesehang-voice-engine";

  let activeAudio = null;
  let activeAudioUrl = null;

  function selectedVoiceEngine() {
    const el = document.querySelector('input[name="voice-engine"]:checked');
    return el ? el.value : "browser";
  }

  function syncVoiceSettingsUi() {
    const engine = selectedVoiceEngine();
    openaiFields.hidden = engine !== "openai";
    browserVoiceHint.hidden = engine !== "browser";
    updateActiveVoiceLabel();
  }

  function updateActiveVoiceLabel() {
    if (!activeVoiceLabel) return;
    if (selectedVoiceEngine() === "openai") {
      activeVoiceLabel.textContent =
        "Aktív: OpenAI férfi mesélő (" + (openaiVoiceSelect.value || "onyx") + ")";
      return;
    }
    if (hungarianVoice) {
      activeVoiceLabel.textContent = "Aktív böngészőhang: " + hungarianVoice.name;
    } else {
      activeVoiceLabel.textContent =
        "Aktív böngészőhang: nem találtam magyar férfi hangot — Edge ajánlott, vagy OpenAI.";
    }
  }

  function loadSavedVoiceSettings() {
    try {
      const key = localStorage.getItem(STORAGE_KEY) || "";
      const voice = localStorage.getItem(STORAGE_VOICE) || "onyx";
      const engine = localStorage.getItem(STORAGE_ENGINE) || "browser";
      openaiKeyInput.value = key;
      if ([...openaiVoiceSelect.options].some((o) => o.value === voice)) {
        openaiVoiceSelect.value = voice;
      } else {
        openaiVoiceSelect.value = "onyx";
      }
      const radio = document.querySelector(`input[name="voice-engine"][value="${engine}"]`);
      if (radio) radio.checked = true;
    } catch (_) {
      /* ignore */
    }
    syncVoiceSettingsUi();
  }

  function saveVoiceSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, openaiKeyInput.value.trim());
      localStorage.setItem(STORAGE_VOICE, openaiVoiceSelect.value || "onyx");
      localStorage.setItem(STORAGE_ENGINE, selectedVoiceEngine());
    } catch (_) {
      /* ignore */
    }
  }

  document.querySelectorAll('input[name="voice-engine"]').forEach((el) => {
    el.addEventListener("change", () => {
      syncVoiceSettingsUi();
      saveVoiceSettings();
    });
  });
  openaiKeyInput.addEventListener("change", saveVoiceSettings);
  openaiVoiceSelect.addEventListener("change", () => {
    saveVoiceSettings();
    updateActiveVoiceLabel();
  });

  function isFemaleVoiceName(name) {
    return /női|noi|female|woman|girl|noémi|noemi|szilvia|susan|zira|samantha|karen|moira|fiona|victoria|linda|heather|sara|anna|maria|katy|nora|nora\b/.test(
      name
    );
  }

  function isMaleVoiceName(name) {
    return /férfi|ferfi|male|man|boy|tamás|tamas|szabolcs|bálint|balint|istván|istvan|lászló|laszlo|péter|peter|gabor|gábor|david|daniel|mark|paul|george|james|onyx|echo|ash/.test(
      name
    );
  }

  function scoreVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = (voice.lang || "").toLowerCase();
    let score = 0;
    if (lang.startsWith("hu")) score += 120;
    if (/hungarian|magyar/.test(name)) score += 60;
    if (isMaleVoiceName(name)) score += 90;
    if (isFemaleVoiceName(name)) score -= 120;
    if (/tamás|tamas/.test(name)) score += 80;
    if (/natural|neural|online|premium|enhanced|wavenet|studio/.test(name)) score += 40;
    if (/microsoft/.test(name)) score += 15;
    if (/compact|eloquence|novelty|robot|espeak/.test(name)) score -= 50;
    return score;
  }

  function loadVoices() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) {
      hungarianVoice = null;
      updateActiveVoiceLabel();
      return;
    }
    const hu = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("hu"));
    const maleHu = hu.filter((v) => isMaleVoiceName(v.name.toLowerCase()) && !isFemaleVoiceName(v.name.toLowerCase()));
    const rankedHu = [...hu].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    const rankedAll = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));

    hungarianVoice =
      maleHu.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ||
      rankedHu.find((v) => !isFemaleVoiceName(v.name.toLowerCase())) ||
      rankedAll.find((v) => isMaleVoiceName(v.name.toLowerCase()) && (v.lang || "").toLowerCase().startsWith("hu")) ||
      null;

    // Last resort: any Hungarian (may be female) — but warn via label
    if (!hungarianVoice && rankedHu[0]) {
      hungarianVoice = rankedHu[0];
    }
    updateActiveVoiceLabel();
  }

  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function setSpeakingUi(active) {
    speaking = active;
    btnSpeak.classList.toggle("is-active", active);
    btnSpeak.setAttribute("aria-pressed", active ? "true" : "false");
    speakLabel.textContent = active ? "Felolvasás…" : "Felolvasás";
    btnStopSpeak.hidden = !active;
  }

  function clearSpeakKeepAlive() {
    if (speakKeepAlive) {
      clearInterval(speakKeepAlive);
      speakKeepAlive = null;
    }
  }

  function stopSpeak() {
    speakGeneration += 1;
    speakQueue = [];
    clearSpeakKeepAlive();
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.removeAttribute("src");
        activeAudio.load();
      } catch (_) {
        /* ignore */
      }
      activeAudio = null;
    }
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    }
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      try {
        speechSynthesis.resume();
      } catch (_) {
        /* ignore */
      }
    }
    setSpeakingUi(false);
  }

  function prepareForSpeech(text) {
    return String(text || "")
      .replace(/[„”"«»]/g, "")
      .replace(/[–—]/g, ", ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /** Natural sentence chunks — no artificial pitch/speed mangling. */
  function splitSpeechChunks(text) {
    const prepared = prepareForSpeech(text);
    return prepared
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function speakWithBrowser(text, generation) {
    if (!window.speechSynthesis) {
      micStatus.textContent = "A felolvasás nem elérhető ebben a böngészőben. Próbáld Edge-dzsel vagy OpenAI hanggal.";
      setSpeakingUi(false);
      return;
    }
    loadVoices();
    const chunks = splitSpeechChunks(text);
    if (!chunks.length) {
      setSpeakingUi(false);
      return;
    }
    speakQueue = chunks.slice();

    const speakNext = () => {
      if (generation !== speakGeneration) return;
      if (!speakQueue.length) {
        clearSpeakKeepAlive();
        setSpeakingUi(false);
        return;
      }
      const chunk = speakQueue.shift();
      const utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = (hungarianVoice && hungarianVoice.lang) || "hu-HU";
      // Warm male storyteller: natural pace, never raise pitch into "női" territory
      utter.rate = 0.94;
      utter.pitch = hungarianVoice && isFemaleVoiceName(hungarianVoice.name.toLowerCase()) ? 0.75 : 0.92;
      utter.volume = 1;
      if (hungarianVoice) utter.voice = hungarianVoice;

      utter.onstart = () => {
        if (generation !== speakGeneration) return;
        setSpeakingUi(true);
        clearSpeakKeepAlive();
        speakKeepAlive = setInterval(() => {
          if (generation !== speakGeneration) {
            clearSpeakKeepAlive();
            return;
          }
          if (speechSynthesis.speaking && speechSynthesis.paused) {
            speechSynthesis.resume();
          }
        }, 10000);
      };
      utter.onend = () => {
        if (generation !== speakGeneration) return;
        setTimeout(speakNext, 180);
      };
      utter.onerror = () => {
        if (generation !== speakGeneration) return;
        setTimeout(speakNext, 120);
      };
      speechSynthesis.speak(utter);
    };

    speakNext();
  }

  async function speakWithOpenAI(text, generation) {
    const key = openaiKeyInput.value.trim();
    if (!key) {
      micStatus.textContent = "Add meg az OpenAI API kulcsot a Hang beállításokban.";
      const panel = $("voice-settings");
      if (panel) panel.open = true;
      setSpeakingUi(false);
      return false;
    }

    setSpeakingUi(true);
    const voice = openaiVoiceSelect.value || "onyx";
    const input = prepareForSpeech(text);
    const disneyInstructions =
      "Speak as a warm adult male Disney fairy-tale narrator. Deep, kind, expressive storytelling voice. Hungarian language. Gentle smile in the tone, cinematic and magical, never robotic, never childlike, never female.";

    async function requestSpeech(model, withInstructions) {
      const body = {
        model,
        voice,
        input,
        speed: 0.95,
      };
      if (withInstructions) body.instructions = disneyInstructions;
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return res;
    }

    try {
      // Prefer gpt-4o-mini-tts for Disney-style male narration instructions
      let res = await requestSpeech("gpt-4o-mini-tts", true);
      if (!res.ok) {
        res = await requestSpeech("tts-1-hd", false);
      }

      if (!res.ok) {
        let detail = "";
        try {
          const err = await res.json();
          detail = err.error && err.error.message ? err.error.message : "";
        } catch (_) {
          /* ignore */
        }
        throw new Error(detail || `OpenAI hiba (${res.status})`);
      }

      if (generation !== speakGeneration) return true;

      const blob = await res.blob();
      if (generation !== speakGeneration) return true;

      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = URL.createObjectURL(blob);
      const audio = new Audio(activeAudioUrl);
      activeAudio = audio;

      await new Promise((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio lejátszás sikertelen"));
        const p = audio.play();
        if (p && typeof p.then === "function") p.catch(reject);
      });

      if (generation === speakGeneration) setSpeakingUi(false);
      return true;
    } catch (err) {
      if (generation !== speakGeneration) return true;
      setSpeakingUi(false);
      micStatus.textContent =
        "OpenAI hang nem sikerült: " +
        (err && err.message ? err.message : "ismeretlen hiba") +
        " — visszaállok böngésző hangra.";
      return false;
    }
  }

  async function speakText(text) {
    stopSpeak();
    saveVoiceSettings();
    const generation = speakGeneration;
    const engine = selectedVoiceEngine();

    if (engine === "openai") {
      const ok = await speakWithOpenAI(text, generation);
      if (generation !== speakGeneration) return;
      if (ok) return;
      // Fallback if key/network fails
      speakWithBrowser(text, generation);
      return;
    }

    speakWithBrowser(text, generation);
  }

  function maybeAutoSpeak() {
    if (sessionStorage.getItem("mesehang-auto-speak") === "1" && story) {
      const scene = MeseEngine.getScene(story);
      speakText(scene.text);
    }
  }

  btnSpeak.addEventListener("click", () => {
    if (!story) return;
    if (speaking) {
      stopSpeak();
      return;
    }
    sessionStorage.setItem("mesehang-auto-speak", "1");
    speakText(MeseEngine.getScene(story).text);
  });

  btnStopSpeak.addEventListener("click", stopSpeak);

  loadSavedVoiceSettings();
  initRecognition();
  showWelcome();
})();
