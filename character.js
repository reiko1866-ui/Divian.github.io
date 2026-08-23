/**
 * Divi karakter állapotgép — Talking Tom stílusú reakciók
 */
(function (global) {
  const STATES = ["idle", "listening", "thinking", "speaking", "react", "laugh"];

  function Character(svgEl) {
    this.el = svgEl;
    this.state = "idle";
    this._reactTimer = null;
  }

  Character.prototype.setState = function (state) {
    if (!STATES.includes(state)) state = "idle";
    this.state = state;
    STATES.forEach((s) => this.el.classList.remove("state-" + s));
    this.el.classList.add("state-" + state);
  };

  Character.prototype.react = function (kind) {
    clearTimeout(this._reactTimer);
    this.setState(kind === "laugh" ? "laugh" : "react");
    const self = this;
    this._reactTimer = setTimeout(function () {
      if (self.state === "react" || self.state === "laugh") self.setState("idle");
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
