/**
 * Divi karakter — PNG állapotok (idle / talk / happy) + Talking Tom váltás
 */
(function (global) {
  const STATES = ["idle", "listening", "thinking", "speaking", "react", "laugh"];
  const VOWELS = /[aáeéiíoóöőuúüű]/i;
  const WIDE = /[aáoó]/i;
  const MID = /[eéií]/i;
  const ROUND = /[öőuúüű]/i;

  const POSES = {
    idle: { webp: "assets/panda-idle.webp", jpg: "assets/panda-idle.jpg" },
    talk: { webp: "assets/panda-talk.webp", jpg: "assets/panda-talk.jpg" },
    happy: { webp: "assets/panda-happy.webp", jpg: "assets/panda-happy.jpg" },
  };

  function Character(rootEl) {
    this.el = rootEl;
    this.img = rootEl.querySelector("#character-img") || rootEl.querySelector(".character-art");
    this.source = rootEl.querySelector("#character-source");
    this.state = "idle";
    this.pose = "idle";
    this._reactTimer = null;
    this._lipRaf = null;
    this._lipActive = false;
    this._mouthOpen = 0;
    this._mouthTarget = 0;
    this.setPose("idle");

    // Előtöltés — ne villogjon váltáskor
    Object.keys(POSES).forEach(function (key) {
      const img = new Image();
      img.src = POSES[key].jpg;
      const w = new Image();
      w.src = POSES[key].webp;
    });
  }

  Character.prototype.setPose = function (pose) {
    if (!POSES[pose] || this.pose === pose) return;
    this.pose = pose;
    const asset = POSES[pose];
    if (this.source) this.source.srcset = asset.webp;
    if (this.img) this.img.src = asset.jpg;
    this.el.setAttribute("data-pose", pose);
  };

  Character.prototype.poseForState = function (state) {
    if (state === "speaking") return "talk";
    if (state === "laugh" || state === "react") return "happy";
    return "idle";
  };

  Character.prototype.setState = function (state) {
    if (!STATES.includes(state)) state = "idle";
    this.state = state;
    STATES.forEach((s) => this.el.classList.remove("state-" + s));
    this.el.classList.add("state-" + state);

    if (!this._lipActive) {
      this.setPose(this.poseForState(state));
    }
  };

  Character.prototype.setMouth = function (amount) {
    const a = Math.max(0, Math.min(1, amount));
    this._mouthOpen = a;

    // Beszéd közben: nyitott/csukott PNG váltás a hang / viseme alapján
    if (this.state === "speaking" || this._lipActive) {
      this.setPose(a >= 0.28 ? "talk" : "idle");
      return;
    }
    if (this.state === "laugh" || this.state === "react") {
      this.setPose("happy");
      return;
    }
    this.setPose("idle");
  };

  Character.prototype._tickSmooth = function () {
    if (!this._lipActive) return;
    const blend = 0.32;
    this._mouthOpen += (this._mouthTarget - this._mouthOpen) * blend;
    if (Math.abs(this._mouthTarget - this._mouthOpen) < 0.02) {
      this._mouthOpen = this._mouthTarget;
    }
    this.setMouth(this._mouthOpen);
    const self = this;
    this._lipRaf = requestAnimationFrame(function () {
      self._tickSmooth();
    });
  };

  Character.prototype._ensureLoop = function () {
    if (this._lipRaf) return;
    this._lipActive = true;
    const self = this;
    this._lipRaf = requestAnimationFrame(function () {
      self._tickSmooth();
    });
  };

  Character.prototype.stopLipSync = function () {
    this._lipActive = false;
    this._mouthTarget = 0;
    if (this._lipRaf) {
      cancelAnimationFrame(this._lipRaf);
      this._lipRaf = null;
    }
    if (this._visemeTimer) {
      clearTimeout(this._visemeTimer);
      this._visemeTimer = null;
    }
    if (this._audioTimer) {
      clearTimeout(this._audioTimer);
      this._audioTimer = null;
    }
    this.setPose(this.poseForState(this.state === "speaking" ? "idle" : this.state));
  };

  Character.prototype.visemeForChar = function (ch) {
    if (!ch || /\s/.test(ch)) return 0.05;
    if (/[.,!?;:]/.test(ch)) return 0.08;
    if (WIDE.test(ch)) return 0.92;
    if (MID.test(ch)) return 0.7;
    if (ROUND.test(ch)) return 0.55;
    if (VOWELS.test(ch)) return 0.65;
    if (/[bpm]/i.test(ch)) return 0.12;
    if (/[fv]/i.test(ch)) return 0.28;
    if (/[szcszj]/i.test(ch)) return 0.35;
    return 0.22;
  };

  Character.prototype.startVisemeLipSync = function (text, opts) {
    opts = opts || {};
    if (this._visemeTimer) clearTimeout(this._visemeTimer);
    if (this._audioTimer) clearTimeout(this._audioTimer);
    if (this._lipRaf) {
      cancelAnimationFrame(this._lipRaf);
      this._lipRaf = null;
    }
    this._lipActive = true;
    this.setState("speaking");
    this._ensureLoop();

    const chars = Array.from(text || "");
    const cps = opts.charsPerSecond || 11.5;
    const started = performance.now();
    const duration = Math.max(600, (chars.length / cps) * 1000);
    const self = this;
    let lastIdx = -1;

    const step = function (now) {
      if (!self._lipActive) return;
      const t = now - started;
      if (t >= duration) {
        self._mouthTarget = 0.12;
        return;
      }
      const idx = Math.min(chars.length - 1, Math.floor((t / duration) * chars.length));
      if (idx !== lastIdx) {
        lastIdx = idx;
        const ch = chars[idx];
        let open = self.visemeForChar(ch);
        open *= 0.85 + Math.sin(t / 70) * 0.08 + Math.random() * 0.07;
        if (/\s/.test(ch)) open = 0.06 + Math.random() * 0.06;
        self._mouthTarget = Math.max(0.05, Math.min(1, open));
      }
      self._visemeTimer = setTimeout(function () {
        step(performance.now());
      }, 1000 / 28);
    };
    step(started);

    return { duration: duration };
  };

  Character.prototype.startAudioLipSync = function (analyser) {
    if (this._visemeTimer) clearTimeout(this._visemeTimer);
    if (this._audioTimer) clearTimeout(this._audioTimer);
    if (this._lipRaf) {
      cancelAnimationFrame(this._lipRaf);
      this._lipRaf = null;
    }
    this._lipActive = true;
    this.setState("speaking");
    this._ensureLoop();
    const data = new Uint8Array(analyser.frequencyBinCount);
    const self = this;

    const sample = function () {
      if (!self._lipActive) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, Math.max(0, (rms - 0.02) * 9));
      self._mouthTarget = level < 0.08 ? 0.06 : 0.15 + level * 0.85;
      self._audioTimer = setTimeout(sample, 1000 / 30);
    };
    sample();
  };

  Character.prototype.react = function (kind) {
    clearTimeout(this._reactTimer);
    this.stopLipSync();
    this.setState(kind === "laugh" ? "laugh" : "react");
    this.setPose("happy");
    const self = this;
    this._reactTimer = setTimeout(function () {
      if (self.state === "react" || self.state === "laugh") {
        self.setState("idle");
      }
    }, kind === "laugh" ? 1200 : 600);
  };

  Character.prototype.lookAt = function () {};

  global.DiviCharacter = Character;
})(window);
