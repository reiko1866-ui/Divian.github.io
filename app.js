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

  /* ----- Felolvasás: SpeechSynthesisUtterance (hu-HU, mesélős tempó) ----- */
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
      try {
        speechSynthesis.resume();
      } catch (_) {
        /* ignore */
      }
    }
    setSpeakingUi(false);
  }

  function speakText(text) {
    if (!window.speechSynthesis) {
      micStatus.textContent = "A felolvasás nem támogatott ebben a böngészőben.";
      return;
    }

    stopSpeak();
    const generation = speakGeneration;
    const utterance = new SpeechSynthesisUtterance(String(text || "").trim());
    utterance.lang = "hu-HU";
    utterance.rate = 0.9; // Kicsit lassabb, mesélős tempó
    utterance.pitch = 1.1; // Kicsit barátságosabb tónus

    utterance.onstart = () => {
      if (generation !== speakGeneration) return;
      setSpeakingUi(true);
      // Chrome néha megáll hosszabb szövegnél — időszakos resume segít
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

    utterance.onend = () => {
      if (generation !== speakGeneration) return;
      clearSpeakKeepAlive();
      setSpeakingUi(false);
    };

    utterance.onerror = () => {
      if (generation !== speakGeneration) return;
      clearSpeakKeepAlive();
      setSpeakingUi(false);
    };

    window.speechSynthesis.speak(utterance);
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
