/**
 * Divi karakter — vörös panda, Gemini-szerű folyamatos lip-sync
 */
(function (global) {
  const STATES = ["idle", "listening", "thinking", "speaking", "react", "laugh"];
  const VOWELS = /[aáeéiíoóöőuúüű]/i;
  const WIDE = /[aáoó]/i;
  const MID = /[eéií]/i;
  const ROUND = /[öőuúüű]/i;

  function Character(svgEl) {
    this.el = svgEl;
    this.state = "idle";
    this._reactTimer = null;
    this._lipRaf = null;
    this._lipActive = false;
    this._mouthOpen = 0;
    this._mouthTarget = 0;
    this._closed = svgEl.querySelector(".mouth-closed");
    this._open = svgEl.querySelector(".mouth-open");
    this._tongue = svgEl.querySelector(".mouth-tongue");
    this._openBaseCy = this._open ? parseFloat(this._open.getAttribute("cy") || "166") : 166;
    this._tongueBaseCy = this._tongue ? parseFloat(this._tongue.getAttribute("cy") || "172") : 172;
    this.setMouth(0);
  }

  Character.prototype.setState = function (state) {
    if (!STATES.includes(state)) state = "idle";
    this.state = state;
    STATES.forEach((s) => this.el.classList.remove("state-" + s));
    this.el.classList.add("state-" + state);
    if (state !== "speaking" && state !== "laugh" && !this._lipActive) {
      this.setMouth(state === "laugh" ? 0.7 : 0);
    }
  };

  Character.prototype.setMouth = function (amount) {
    const a = Math.max(0, Math.min(1, amount));
    this._mouthOpen = a;
    if (!this._open || !this._closed) return;

    // Folyamatos morph: csukott vonal ↔ nyitott száj
    this._closed.style.opacity = String(Math.max(0, 1 - a * 3.2));
    this._open.style.opacity = String(Math.min(1, a * 2.2));
    this._open.setAttribute("rx", String(9 + a * 14));
    this._open.setAttribute("ry", String(2.5 + a * 15));
    this._open.setAttribute("cy", String(this._openBaseCy + a * 8));
    if (this._tongue) {
      this._tongue.style.opacity = String(a > 0.4 ? (a - 0.4) * 1.4 : 0);
      this._tongue.setAttribute("cy", String(this._tongueBaseCy + a * 8));
    }
  };

  Character.prototype._tickSmooth = function () {
    if (!this._lipActive) return;
    // Simítás: ne ugráljon frame-ről frame-re (Gemini-szerű)
    const blend = 0.28;
    this._mouthOpen += (this._mouthTarget - this._mouthOpen) * blend;
    if (Math.abs(this._mouthTarget - this._mouthOpen) < 0.01) {
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
    // Lágy zárás
    const self = this;
    let steps = 0;
    const close = function () {
      if (self._lipActive) return;
      steps += 1;
      self._mouthOpen *= 0.65;
      self.setMouth(self._mouthOpen);
      if (self._mouthOpen > 0.04 && steps < 20) {
        requestAnimationFrame(close);
      } else {
        self.setMouth(0);
      }
    };
    close();
  };

  /** Viseme erő egy betűhöz */
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
    if (kind === "laugh") this.setMouth(0.75);
    const self = this;
    this._reactTimer = setTimeout(function () {
      if (self.state === "react" || self.state === "laugh") {
        self.setMouth(0);
        self.setState("idle");
      }
    }, kind === "laugh" ? 1200 : 600);
  };

  Character.prototype.lookAt = function (xRatio) {
    const pupils = this.el.querySelectorAll(".pupil");
    const dx = Math.max(-4, Math.min(4, (xRatio - 0.5) * 10));
    pupils.forEach(function (p) {
      p.style.transform = "translate(" + dx + "px, 0)";
    });
  };

  global.DiviCharacter = Character;
})(window);
