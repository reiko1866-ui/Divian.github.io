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
  const btnSpeak = $("btn-speak");
  const btnStopSpeak = $("btn-stop-speak");
  const speakLabel = $("speak-label");
  const btnRestart = $("btn-restart");
  const btnDownload = $("btn-download");
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
    storyTitle.textContent = story.title;
    storyText.textContent = scene.text;
    storyText.classList.remove("is-refreshing");
    void storyText.offsetWidth;
    storyText.classList.add("is-refreshing");

    choicesEl.innerHTML = "";
    endingActions.hidden = !scene.ending;

    if (!scene.ending) {
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
    const wish = MeseEngine.pick(MeseEngine.SURPRISES);
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

  btnDownload.addEventListener("click", () => {
    if (!story) return;
    // Reconstruct clean transcript from visited path
    const text = buildDownloadText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  function buildDownloadText() {
    // Prefer engine transcript, but dedupe consecutive identical blocks
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

  /* ----- Speech synthesis (természetesebb felolvasás) ----- */
  function scoreVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = (voice.lang || "").toLowerCase();
    let score = 0;
    if (lang.startsWith("hu")) score += 100;
    if (/hungarian|magyar/.test(name)) score += 80;
    // Prefer neural / natural / online / premium voices when present
    if (/natural|neural|online|google|premium|enhanced|wavenet|studio/.test(name)) score += 40;
    if (/microsoft|samantha|aria|jenny|zira/.test(name)) score += 10;
    // Deprioritize harsh/robotic local voices
    if (/compact|eloquence|novelty|whisper|zarvox|bad/.test(name)) score -= 30;
    if (voice.localService) score -= 5;
    return score;
  }

  function loadVoices() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) {
      hungarianVoice = null;
      return;
    }
    const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    hungarianVoice =
      ranked.find((v) => scoreVoice(v) >= 80) ||
      ranked.find((v) => (v.lang || "").toLowerCase().startsWith("hu")) ||
      ranked[0] ||
      null;
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
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      // Chrome sometimes stays paused after cancel
      try {
        speechSynthesis.resume();
      } catch (_) {
        /* ignore */
      }
    }
    setSpeakingUi(false);
  }

  /** Soften punctuation so TTS does not sound clipped / blocky. */
  function prepareForSpeech(text) {
    return String(text || "")
      .replace(/[„”"«»]/g, "")
      .replace(/[–—]/g, ", ")
      .replace(/\s*;\s*/g, ". ")
      .replace(/\s*:\s*/g, ", ")
      .replace(/\s*!\s*/g, ". ")
      .replace(/\s*\?\s*/g, "? ")
      .replace(/\(\s*/g, ", ")
      .replace(/\s*\)/g, ",")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();
  }

  /** Split into short breath-groups for smoother storytelling cadence. */
  function splitSpeechChunks(text) {
    const prepared = prepareForSpeech(text);
    const rough = prepared
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const chunks = [];
    rough.forEach((sentence) => {
      if (sentence.length <= 140) {
        chunks.push(sentence);
        return;
      }
      // Break long sentences on commas without cutting words harshly
      const parts = sentence.split(/(?<=,)\s+/);
      let buf = "";
      parts.forEach((part) => {
        if ((buf + " " + part).trim().length > 120 && buf) {
          chunks.push(buf.trim());
          buf = part;
        } else {
          buf = (buf ? buf + " " : "") + part;
        }
      });
      if (buf.trim()) chunks.push(buf.trim());
    });
    return chunks;
  }

  function pauseMsForChunk(chunk, isLast) {
    if (isLast) return 0;
    if (/[.!?]$/.test(chunk)) return 420;
    if (/,$/.test(chunk)) return 220;
    return 280;
  }

  function speakNextChunk(generation) {
    if (generation !== speakGeneration) return;
    if (!speakQueue.length) {
      clearSpeakKeepAlive();
      setSpeakingUi(false);
      return;
    }

    const chunk = speakQueue.shift();
    const isLast = speakQueue.length === 0;
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.lang = (hungarianVoice && hungarianVoice.lang) || "hu-HU";
    // Slower, warmer storytelling pace — less "blocky"
    utter.rate = 0.9;
    utter.pitch = 1.04;
    utter.volume = 1;
    if (hungarianVoice) utter.voice = hungarianVoice;

    utter.onstart = () => {
      if (generation !== speakGeneration) return;
      setSpeakingUi(true);
      // Chrome bug: speech can freeze mid-utterance without periodic resume
      clearSpeakKeepAlive();
      speakKeepAlive = setInterval(() => {
        if (generation !== speakGeneration) {
          clearSpeakKeepAlive();
          return;
        }
        if (speechSynthesis.speaking && speechSynthesis.paused) {
          speechSynthesis.resume();
        } else if (speechSynthesis.speaking) {
          speechSynthesis.resume();
        }
      }, 8000);
    };

    utter.onend = () => {
      if (generation !== speakGeneration) return;
      const wait = pauseMsForChunk(chunk, isLast);
      if (wait > 0) {
        setTimeout(() => speakNextChunk(generation), wait);
      } else {
        speakNextChunk(generation);
      }
    };

    utter.onerror = () => {
      if (generation !== speakGeneration) return;
      // Skip a failed chunk instead of aborting the whole tale harshly
      setTimeout(() => speakNextChunk(generation), 120);
    };

    speechSynthesis.speak(utter);
  }

  function speakText(text) {
    if (!window.speechSynthesis) {
      micStatus.textContent = "A felolvasás nem támogatott ebben a böngészőben.";
      return;
    }
    stopSpeak();
    loadVoices();
    const chunks = splitSpeechChunks(text);
    if (!chunks.length) return;
    speakQueue = chunks;
    const generation = speakGeneration;
    // Tiny delay helps some browsers attach the preferred voice cleanly
    setTimeout(() => {
      if (generation !== speakGeneration) return;
      speakNextChunk(generation);
    }, 60);
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

  initRecognition();
  showWelcome();
})();
