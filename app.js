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

  /* ----- Soft folk-like underlay (mint a régi mesevideók zenéje) ----- */
  let musicCtx = null;
  let musicNodes = [];
  let musicGain = null;

  function ensureMusicCtx() {
    if (musicCtx) return musicCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    musicCtx = new AC();
    return musicCtx;
  }

  function startStoryMusic() {
    const ctx = ensureMusicCtx();
    if (!ctx) return;
    stopStoryMusic(false);
    if (ctx.state === "suspended") ctx.resume();

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0001;
    musicGain.connect(ctx.destination);
    musicGain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 1.2);

    // Warm drone + soft fifth — old tale / folk feel
    const freqs = [110, 164.81, 220, 329.63];
    musicNodes = freqs.map((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 700;
      g.gain.value = i === 0 ? 0.35 : 0.12;
      osc.connect(filter);
      filter.connect(g);
      g.connect(musicGain);
      osc.start();
      return { osc, g, filter };
    });

    // Occasional soft pluck, like distant citera
    const pluck = () => {
      if (!musicCtx || !musicGain) return;
      const o = musicCtx.createOscillator();
      const g = musicCtx.createGain();
      o.type = "sine";
      o.frequency.value = pickQuiet([330, 392, 440, 494]);
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(musicGain);
      const t = musicCtx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.start(t);
      o.stop(t + 1.5);
    };
    musicNodes.pluckTimer = setInterval(pluck, 3200);
    setTimeout(pluck, 400);
  }

  function pickQuiet(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function stopStoryMusic(fade = true) {
    if (musicNodes && musicNodes.pluckTimer) {
      clearInterval(musicNodes.pluckTimer);
    }
    if (!musicCtx || !musicGain) {
      musicNodes = [];
      musicGain = null;
      return;
    }
    const ctx = musicCtx;
    const gain = musicGain;
    const nodes = musicNodes;
    musicNodes = [];
    musicGain = null;
    try {
      if (fade) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        setTimeout(() => {
          nodes.forEach((n) => {
            try {
              n.osc.stop();
            } catch (_) {
              /* ignore */
            }
          });
          try {
            gain.disconnect();
          } catch (_) {
            /* ignore */
          }
        }, 900);
      } else {
        nodes.forEach((n) => {
          try {
            n.osc.stop();
          } catch (_) {
            /* ignore */
          }
        });
        gain.disconnect();
      }
    } catch (_) {
      /* ignore */
    }
  }

  /* ----- Speech: népmese-mesélő tempó + természetesebb magyar TTS ----- */
  function scoreVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = (voice.lang || "").toLowerCase();
    let score = 0;
    if (lang.startsWith("hu")) score += 100;
    if (/hungarian|magyar/.test(name)) score += 80;
    // Prefer mature male storyteller voices (népmese feel)
    if (/szabolcs|balint|bálint|istvan|istván|tamas|tamás|laszlo|lászló|male|férfi|ferfi/.test(name)) {
      score += 55;
    }
    if (/natural|neural|online|google|premium|enhanced|wavenet|studio|neural2/.test(name)) score += 35;
    // Soften / avoid childish or harsh voices
    if (/female|női|noi|zira|susan|samantha|girl|child|kids/.test(name)) score -= 25;
    if (/compact|eloquence|novelty|whisper|zarvox|bad|robot/.test(name)) score -= 40;
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
      ranked.find((v) => scoreVoice(v) >= 100) ||
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
    speakLabel.textContent = active ? "Mesélés…" : "Mesélő hang";
    btnStopSpeak.hidden = !active;
  }

  function clearSpeakKeepAlive() {
    if (speakKeepAlive) {
      clearInterval(speakKeepAlive);
      speakKeepAlive = null;
    }
  }

  let activeAudio = null;

  function stopSpeak() {
    speakGeneration += 1;
    speakQueue = [];
    clearSpeakKeepAlive();
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.src = "";
      } catch (_) {
        /* ignore */
      }
      activeAudio = null;
    }
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      try {
        speechSynthesis.resume();
      } catch (_) {
        /* ignore */
      }
    }
    stopStoryMusic(true);
    setSpeakingUi(false);
  }

  function prepareForSpeech(text) {
    return String(text || "")
      .replace(/[„”"«»]/g, "")
      .replace(/[–—]/g, ", ")
      .replace(/\s*;\s*/g, ". ")
      .replace(/\s*:\s*/g, ", ")
      .replace(/\s*!\s*/g, ". ")
      .replace(/\s*\?\s*/g, ". ")
      .replace(/\(\s*/g, ", ")
      .replace(/\s*\)/g, ",")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.])/g, "$1")
      .trim();
  }

  function splitSpeechChunks(text) {
    const prepared = prepareForSpeech(text);
    const rough = prepared
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const chunks = [];
    rough.forEach((sentence) => {
      // Keep chunks shorter for smoother oral cadence + Google TTS limits
      if (sentence.length <= 110) {
        chunks.push(sentence);
        return;
      }
      const parts = sentence.split(/(?<=,)\s+/);
      let buf = "";
      parts.forEach((part) => {
        if ((buf + " " + part).trim().length > 95 && buf) {
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
    if (isLast) return 350;
    if (/[.]$/.test(chunk)) return 650;
    if (/,$/.test(chunk)) return 320;
    return 480;
  }

  function googleTtsUrl(text) {
    return (
      "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=hu&q=" +
      encodeURIComponent(text)
    );
  }

  function playGoogleChunk(chunk, generation) {
    return new Promise((resolve, reject) => {
      if (generation !== speakGeneration) {
        resolve(false);
        return;
      }
      const audio = new Audio();
      activeAudio = audio;
      audio.src = googleTtsUrl(chunk);
      audio.preload = "auto";
      // Slightly slower playback ≈ warmer folk narrator
      audio.playbackRate = 0.92;
      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
        resolve(true);
      };
      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null;
        reject(new Error("tts-audio-failed"));
      };
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(reject);
      }
    });
  }

  async function speakWithGoogle(chunks, generation) {
    for (let i = 0; i < chunks.length; i += 1) {
      if (generation !== speakGeneration) return true;
      setSpeakingUi(true);
      try {
        await playGoogleChunk(chunks[i], generation);
      } catch (_) {
        return false;
      }
      if (generation !== speakGeneration) return true;
      const wait = pauseMsForChunk(chunks[i], i === chunks.length - 1);
      if (wait) await new Promise((r) => setTimeout(r, wait));
    }
    return true;
  }

  function speakWithBrowser(chunks, generation) {
    speakQueue = chunks.slice();
    const speakNext = () => {
      if (generation !== speakGeneration) return;
      if (!speakQueue.length) {
        clearSpeakKeepAlive();
        stopStoryMusic(true);
        setSpeakingUi(false);
        return;
      }
      const chunk = speakQueue.shift();
      const isLast = speakQueue.length === 0;
      const utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = (hungarianVoice && hungarianVoice.lang) || "hu-HU";
      // Slow, low, grandfatherly népmese narrator
      utter.rate = 0.78;
      utter.pitch = 0.82;
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
          if (speechSynthesis.speaking) speechSynthesis.resume();
        }, 8000);
      };
      utter.onend = () => {
        if (generation !== speakGeneration) return;
        const wait = pauseMsForChunk(chunk, isLast);
        setTimeout(speakNext, wait);
      };
      utter.onerror = () => {
        if (generation !== speakGeneration) return;
        setTimeout(speakNext, 150);
      };
      speechSynthesis.speak(utter);
    };
    speakNext();
  }

  async function speakText(text) {
    stopSpeak();
    loadVoices();
    const chunks = splitSpeechChunks(text);
    if (!chunks.length) return;
    const generation = speakGeneration;
    startStoryMusic();
    setSpeakingUi(true);

    // Prefer warmer online Hungarian TTS when available; fallback to browser voice
    const ok = await speakWithGoogle(chunks, generation);
    if (generation !== speakGeneration) return;
    if (ok) {
      stopStoryMusic(true);
      setSpeakingUi(false);
      return;
    }
    if (!window.speechSynthesis) {
      stopStoryMusic(true);
      setSpeakingUi(false);
      micStatus.textContent = "A felolvasás most nem elérhető. Próbáld Chrome-ban.";
      return;
    }
    speakWithBrowser(chunks, generation);
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
