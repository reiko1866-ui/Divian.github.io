/**
 * Divi mesebeli térképe — helyek, útvonal, irányok, hangparancsok.
 * A gyerek csak a szomszédos ösvényeken léphet; távolabbi helyre a legrövidebb úton sétálunk.
 * Haladás Waze-szerűen: útra tapasztás, jobb sáv, lerp, előretekintő kamera.
 * A térkép 100×100 egysége 100×100 méter. 1 egység = 1 méter.
 */
(function (global) {
  "use strict";

  const PLACES = [
    {
      id: "hill",
      name: "Csillagdomb",
      icon: "⭐",
      x: 50,
      y: 18,
      blurb: "A domb tetejéről a csillagok olyan közel vannak, hogy szinte meg lehet számolni őket.",
      here: "A Csillagdombon állunk. Innen a csillagok szinte a fülemhez suttognak.",
      arrive: "Fent vagyunk a Csillagdombon! Fújjunk egyet, és kívánj valamit a legfényesebb csillagra.",
      aliases: ["csillagdomb", "domb"],
    },
    {
      id: "river",
      name: "Kuncogó-patak",
      icon: "💧",
      x: 22,
      y: 36,
      blurb: "A víz kuncog a köveken, mintha mindig egy titkos viccet hallana.",
      here: "A Kuncogó-pataknál vagyunk. Hallod? A víz is nevet!",
      arrive: "Megérkeztünk a Kuncogó-patakhoz! A víz csiklandozza a köveket. Belelógatod a kezed?",
      aliases: ["kuncogo patak", "kuncogo-patak", "patak", "kuncogo"],
    },
    {
      id: "bakery",
      name: "Mézes pékség",
      icon: "🥐",
      x: 78,
      y: 34,
      blurb: "Itt sült a képzeletbeli áfonyás palacsinta, és mézillat ül a levegőben.",
      here: "A Mézes pékségben vagyunk. Érzed? Még a levegő is édes!",
      arrive: "Itt a Mézes pékség! Friss pogácsaillat… a farkam már csóvál. Kérsz egy képzeletbeli szeletet?",
      aliases: ["mezes pekseg", "pekseg", "mezes"],
    },
    {
      id: "grove",
      name: "Fénybogár-liget",
      icon: "✨",
      x: 24,
      y: 64,
      blurb: "Esténként apró lámpások villognak a levelek között.",
      here: "A Fénybogár-ligetben vagyunk. A bogarak lámpásként pislognak.",
      arrive: "Beléptünk a Fénybogár-ligetbe! Pszt… ha csendben maradunk, körbetáncolnak minket.",
      aliases: ["fenybogar liget", "fenybogar-liget", "liget", "fenybogar"],
    },
    {
      id: "home",
      name: "Bambuszodú",
      icon: "🏠",
      x: 76,
      y: 62,
      blurb: "Puha fészek, csíkos takaró, és egy ablak, amin bekukucskál a hold.",
      here: "Itt vagyunk a Bambuszodúban. Ez az otthonom — a legjobb hely a poénokra!",
      arrive: "Hazaértünk a Bambuszodúba! Leülsz a fészek szélére?",
      aliases: ["bambuszodu", "odu", "otthon", "feszek", "haza"],
    },
    {
      id: "bridge",
      name: "Szivárványhíd",
      icon: "🌈",
      x: 50,
      y: 84,
      blurb: "Egy híd, ami eső után minden színben ragyog, szárazon is egy kicsit.",
      here: "A Szivárványhídon állunk. Melyik szín a tied?",
      arrive: "Átsétáltunk a Szivárványhídra! Kapaszkodj, a színek csiklandoznak.",
      aliases: ["szivarvanyhid", "szivarvany hid", "hid", "szivarvany"],
    },
  ];

  const LINKS = [
    ["hill", "river"],
    ["hill", "bakery"],
    ["river", "bakery"],
    ["river", "grove"],
    ["bakery", "home"],
    ["grove", "bridge"],
    ["home", "bridge"],
  ];

  const DIRS = {
    n: { x: 0, y: -1, label: "Észak", arrow: "▲" },
    s: { x: 0, y: 1, label: "Dél", arrow: "▼" },
    e: { x: 1, y: 0, label: "Kelet", arrow: "▶" },
    w: { x: -1, y: 0, label: "Nyugat", arrow: "◀" },
  };

  const STORAGE_KEY = "divi-map";
  const DIR_MIN = 0.42;
  /** Jobb oldali sáv közepe a középvonaltól, méterben (jobbra tarts). */
  const LANE_OFFSET_M = 1.8;
  /** Ennyivel a figura előtt néz a kamera, hogy a kanyar időben látszódjon. */
  const LOOKAHEAD_M = 14;
  const DRIVE_SPEED_MPS = 30;
  const FOLLOW_ZOOM = 1.72;

  const PLACE_BY_ID = {};
  PLACES.forEach(function (place) {
    PLACE_BY_ID[place.id] = place;
  });

  const ADJACENT = {};
  PLACES.forEach(function (place) {
    ADJACENT[place.id] = [];
  });
  LINKS.forEach(function (pair) {
    ADJACENT[pair[0]].push(pair[1]);
    ADJACENT[pair[1]].push(pair[0]);
  });

  function fold(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/[áàâä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôöő]/g, "o")
      .replace(/[úùûüű]/g, "u")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function place(id) {
    return PLACE_BY_ID[id] || null;
  }

  function neighbors(id) {
    return (ADJACENT[id] || []).map(place).filter(Boolean);
  }

  function route(fromId, toId) {
    if (!place(fromId) || !place(toId)) return [];
    if (fromId === toId) return [fromId];
    const queue = [fromId];
    const prev = {};
    prev[fromId] = null;
    while (queue.length) {
      const current = queue.shift();
      const nextIds = ADJACENT[current] || [];
      for (let i = 0; i < nextIds.length; i += 1) {
        const next = nextIds[i];
        if (Object.prototype.hasOwnProperty.call(prev, next)) continue;
        prev[next] = current;
        if (next === toId) {
          const path = [toId];
          let cursor = toId;
          while (prev[cursor]) {
            cursor = prev[cursor];
            path.push(cursor);
          }
          path.reverse();
          return path;
        }
        queue.push(next);
      }
    }
    return [];
  }

  function neighborInDirection(fromId, dir) {
    const vector = DIRS[dir];
    const origin = place(fromId);
    if (!vector || !origin) return null;
    let best = null;
    let bestScore = DIR_MIN;
    neighbors(fromId).forEach(function (next) {
      const vx = next.x - origin.x;
      const vy = next.y - origin.y;
      const len = Math.hypot(vx, vy) || 1;
      const score = (vx / len) * vector.x + (vy / len) * vector.y;
      if (score > bestScore) {
        bestScore = score;
        best = next;
      }
    });
    return best;
  }

  function joinNames(names) {
    const list = (names || []).filter(Boolean);
    if (list.length === 0) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + " és " + list[1];
    return list.slice(0, -1).join(", ") + " és " + list[list.length - 1];
  }

  function aliasPattern(alias) {
    return alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  }

  function containsAlias(folded, alias) {
    const re = new RegExp("(?:^|\\s)" + aliasPattern(fold(alias)) + "[a-z]{0,4}(?=\\s|$)");
    return re.test(folded);
  }

  function isMostlyPlace(folded, alias) {
    const re = new RegExp("^" + aliasPattern(fold(alias)) + "[a-z]{0,4}$");
    return re.test(folded);
  }

  function matchPlace(folded, allowShort) {
    const ranked = [];
    PLACES.forEach(function (item) {
      item.aliases.forEach(function (alias) {
        ranked.push({ place: item, alias: alias });
      });
    });
    ranked.sort(function (a, b) {
      return b.alias.length - a.alias.length;
    });
    for (let i = 0; i < ranked.length; i += 1) {
      const entry = ranked[i];
      if (!allowShort && entry.alias.length < 4 && !isMostlyPlace(folded, entry.alias)) continue;
      if (containsAlias(folded, entry.alias)) return entry.place;
    }
    return null;
  }

  const TRAVEL_START =
    /^(menjunk|menjunk el|vigyel|vigyel el|vigyel minket|irany|gyerunk|gyerunk el|megyunk|setaljunk|setaljunk el|latogassuk meg|latogassuk)\b/;

  function interpret(raw) {
    const folded = fold(raw);
    if (!folded || folded.length > 80) return null;

    if (/^(hol vagyunk|hol vagy|merre vagyunk|melyik helyen vagyunk|mi ez a hely)$/.test(folded)) {
      return { type: "where" };
    }
    if (
      /^(terkep|terkepet|mutasd a terkepet|nyisd ki a terkepet|nyisd meg a terkepet|nezuk a terkepet|nezuk meg a terkepet|hol a terkep|merre menjunk|hova menjunk)$/.test(
        folded
      )
    ) {
      return { type: "open" };
    }
    if (/^(merre mehetunk|hova mehetunk|hova lehet menni|mik a szomszed helyek|mi van a kozelben)$/.test(folded)) {
      return { type: "neighbors" };
    }
    if (/^(vissza|menjunk vissza|gyerunk vissza|forduljunk vissza)$/.test(folded)) {
      return { type: "back" };
    }

    const wantsTravel = TRAVEL_START.test(folded);
    if (wantsTravel) {
      const found = matchPlace(folded, true);
      return { type: "go", placeId: found ? found.id : null };
    }

    const exact = matchPlace(folded, true);
    if (exact && exact.aliases.some(function (alias) { return isMostlyPlace(folded, alias); })) {
      return { type: "go", placeId: exact.id };
    }
    return null;
  }

  function knownPlaceList() {
    return joinNames(PLACES.map(function (item) { return item.name; }));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function damp(current, target, lambda, dt) {
    const t = 1 - Math.exp(-lambda * Math.max(0, dt));
    return lerp(current, target, t);
  }

  function lerpAngle(a, b, t) {
    let diff = b - a;
    const turn = Math.PI * 2;
    while (diff > Math.PI) diff -= turn;
    while (diff < -Math.PI) diff += turn;
    return a + diff * t;
  }

  function dampAngle(current, target, lambda, dt) {
    return lerpAngle(current, target, 1 - Math.exp(-lambda * Math.max(0, dt)));
  }

  /**
   * Jobb oldal a haladási irányhoz képest.
   * A térkép y tengelye lefelé nő, ezért a jobb normál: (-ty, tx).
   */
  function offsetRight(point, tangent, meters) {
    return {
      x: point.x + -tangent.y * meters,
      y: point.y + tangent.x * meters,
    };
  }

  function projectToSegment(point, seg) {
    const dx = seg.b.x - seg.a.x;
    const dy = seg.b.y - seg.a.y;
    const len2 = dx * dx + dy * dy || 1e-8;
    let t = ((point.x - seg.a.x) * dx + (point.y - seg.a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const x = seg.a.x + dx * t;
    const y = seg.a.y + dy * t;
    return {
      point: { x: x, y: y },
      t: t,
      distance: Math.hypot(point.x - x, point.y - y),
    };
  }

  function buildPolyline(points) {
    const segments = [];
    const vertexDistances = [0];
    let length = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 0.0001;
      const tangent = { x: dx / len, y: dy / len };
      segments.push({
        a: a,
        b: b,
        length: len,
        tangent: tangent,
        heading: Math.atan2(tangent.y, tangent.x),
        start: length,
      });
      length += len;
      vertexDistances.push(length);
    }
    return { points: points, segments: segments, length: length, vertexDistances: vertexDistances };
  }

  function pointAtDistance(poly, distance) {
    const segs = poly.segments;
    const d = Math.max(0, Math.min(poly.length, distance));
    let seg = segs[segs.length - 1];
    let index = segs.length - 1;
    for (let i = 0; i < segs.length; i += 1) {
      if (d <= segs[i].start + segs[i].length || i === segs.length - 1) {
        seg = segs[i];
        index = i;
        break;
      }
    }
    const t = Math.max(0, Math.min(1, (d - seg.start) / seg.length));
    return {
      point: {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t,
      },
      tangent: seg.tangent,
      heading: seg.heading,
      index: index,
      distance: d,
    };
  }

  function snapToRoad(point, poly, preferredIndex) {
    let best = null;
    const hits = poly.segments.map(function (seg, i) {
      const proj = projectToSegment(point, seg);
      return {
        point: proj.point,
        distance: proj.distance,
        index: i,
        tangent: seg.tangent,
        heading: seg.heading,
      };
    });
    hits.forEach(function (hit) {
      if (!best || hit.distance < best.distance) best = hit;
    });
    if (!best) return null;
    if (preferredIndex != null && hits[preferredIndex] && hits[preferredIndex].distance <= best.distance + 0.35) {
      return hits[preferredIndex];
    }
    return best;
  }

  /**
   * A figura mindig a legközelebbi útszegmensen áll, attól jobbra 1.8 méterrel.
   */
  function poseOnRoute(poly, distanceMeters) {
    const along = pointAtDistance(poly, distanceMeters);
    const snapped = snapToRoad(along.point, poly, along.index);
    const lane = offsetRight(snapped.point, snapped.tangent, LANE_OFFSET_M);
    return {
      x: lane.x,
      y: lane.y,
      center: snapped.point,
      heading: snapped.heading,
      tangent: snapped.tangent,
      index: snapped.index,
    };
  }

  function lookAheadPoint(poly, distanceMeters, aheadMeters) {
    return pointAtDistance(poly, distanceMeters + aheadMeters);
  }

  function motionOk() {
    if (!global.matchMedia) return true;
    return !global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function MapApp(opts) {
    this.opts = opts || {};
    this.currentId = "home";
    this.selectedId = "home";
    this.visited = { home: true };
    this.trail = ["home"];
    this._busy = false;
    this._open = false;
    this._bound = false;
  }

  MapApp.prototype.place = function (id) {
    return place(id || this.currentId);
  };

  MapApp.prototype.currentPlace = function () {
    return place(this.currentId);
  };

  MapApp.prototype.neighbors = function (id) {
    return neighbors(id || this.currentId);
  };

  MapApp.prototype.route = function (fromId, toId) {
    return route(fromId || this.currentId, toId);
  };

  MapApp.prototype.isBusy = function () {
    return this._busy;
  };

  MapApp.prototype.isOpen = function () {
    return this._open;
  };

  MapApp.prototype.summary = function () {
    const current = this.currentPlace();
    return {
      id: current.id,
      name: current.name,
      blurb: current.blurb,
      neighbors: this.neighbors().map(function (item) { return item.name; }),
    };
  };

  MapApp.prototype.whereLine = function () {
    const current = this.currentPlace();
    const next = joinNames(this.neighbors().map(function (item) { return item.name; }));
    if (!next) return current.here;
    return current.here + " Innen el tudunk sétálni ide: " + next + ".";
  };

  MapApp.prototype.load = function () {
    try {
      const raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !place(data.placeId)) return;
      this.currentId = data.placeId;
      this.selectedId = data.placeId;
      this.visited = { home: true };
      (data.visited || []).forEach(function (id) {
        if (place(id)) this.visited[id] = true;
      }, this);
      this.visited[this.currentId] = true;
      const trail = (data.trail || []).filter(place);
      this.trail = trail.length ? trail : [this.currentId];
      if (this.trail[this.trail.length - 1] !== this.currentId) this.trail.push(this.currentId);
    } catch (_) {
      /* marad az otthon */
    }
  };

  MapApp.prototype.save = function () {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          placeId: this.currentId,
          visited: Object.keys(this.visited),
          trail: this.trail,
        })
      );
    } catch (_) {
      /* ignore */
    }
  };

  MapApp.prototype._emit = function () {
    if (typeof this.opts.onChange === "function") {
      this.opts.onChange(this.currentPlace(), this.summary());
    }
  };

  MapApp.prototype._speak = function (line) {
    if (line && typeof this.opts.onSpeak === "function") this.opts.onSpeak(line);
  };

  MapApp.prototype._status = function (line) {
    if (line && typeof this.opts.onStatus === "function") this.opts.onStatus(line);
  };

  MapApp.prototype.open = function () {
    const overlay = document.getElementById("map-overlay");
    const button = document.getElementById("btn-map");
    if (!overlay) return;
    this._open = true;
    overlay.classList.remove("hidden");
    if (button) button.setAttribute("aria-expanded", "true");
    this.render();
    if (typeof this.opts.onOpen === "function") this.opts.onOpen();
    const selected = overlay.querySelector('.map-pin[data-place="' + this.selectedId + '"]');
    if (selected) selected.focus();
  };

  MapApp.prototype.close = function () {
    const overlay = document.getElementById("map-overlay");
    const button = document.getElementById("btn-map");
    this._open = false;
    if (overlay) overlay.classList.add("hidden");
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
    if (typeof this.opts.onClose === "function") this.opts.onClose();
  };

  MapApp.prototype.select = function (id) {
    if (this._busy || !place(id)) return;
    this.selectedId = id;
    this.render();
    const path = this.route(this.currentId, id);
    if (id === this.currentId) {
      this._status(place(id).here);
      return;
    }
    const steps = Math.max(0, path.length - 1);
    this._status(steps ? steps + " lépés: " + path.map(function (pid) { return place(pid).name; }).join(" → ") : "");
  };

  MapApp.prototype._applyFollower = function (vehicle, cam) {
    const world = document.getElementById("map-world");
    const canvas = document.getElementById("map-canvas");
    const walker = document.getElementById("map-walker");
    if (!world || !canvas || !walker || !vehicle || !cam) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    const lookX = (cam.x / 100) * width;
    const lookY = (cam.y / 100) * height;
    const rot = -90 - (cam.heading * 180) / Math.PI;
    const anchorX = width * 0.5;
    const anchorY = height * (cam.anchor == null ? 0.62 : cam.anchor);
    world.style.transformOrigin = "0 0";
    world.style.transform =
      "translate(" + anchorX + "px," + anchorY + "px) " +
      "scale(" + cam.zoom + ") " +
      "rotate(" + rot + "deg) " +
      "translate(" + -lookX + "px," + -lookY + "px)";
    walker.style.transition = "none";
    walker.style.left = vehicle.x + "%";
    walker.style.top = vehicle.y + "%";
    walker.style.transform = "translate(-50%, -50%) rotate(" + -rot + "deg)";
    document.querySelectorAll(".map-pin").forEach(function (pin) {
      pin.style.transform = "translate(-50%, -72%) rotate(" + -rot + "deg)";
    });
  };

  MapApp.prototype._clearFollower = function () {
    const world = document.getElementById("map-world");
    const walker = document.getElementById("map-walker");
    if (world) world.style.transform = "";
    if (walker) walker.style.transform = "";
    document.querySelectorAll(".map-pin").forEach(function (pin) {
      pin.style.transform = "";
    });
  };

  /**
   * Végigmegy az útvonalon: a pozíció a sávra van tapasztva,
   * a távolság és a kamera lerp-pel simul, a kamera előre néz.
   */
  MapApp.prototype._driveRoute = function (path) {
    const self = this;
    const poly = buildPolyline(path.map(function (id) { return place(id); }));
    const reduce = !motionOk() || !this._open || poly.length < 0.5;
    if (reduce) return Promise.resolve();

    return new Promise(function (resolve) {
      const start = poseOnRoute(poly, 0);
      let targetDist = 0;
      let displayDist = 0;
      let passed = 0;
      const cam = {
        x: start.center.x,
        y: start.center.y,
        heading: start.heading,
        zoom: 1.08,
        anchor: 0.62,
      };
      let last = (global.performance && performance.now()) || Date.now();

      function finishOverview() {
        const started = (global.performance && performance.now()) || Date.now();
        const from = { x: cam.x, y: cam.y, heading: cam.heading, zoom: cam.zoom, anchor: cam.anchor };
        function back(now) {
          const t = Math.min(1, ((now || Date.now()) - started) / 480);
          const eased = lerp(0, 1, t);
          cam.x = lerp(from.x, 50, eased);
          cam.y = lerp(from.y, 50, eased);
          cam.heading = lerpAngle(from.heading, -Math.PI / 2, eased);
          cam.zoom = lerp(from.zoom, 1, eased);
          cam.anchor = lerp(from.anchor, 0.5, eased);
          const parked = poseOnRoute(poly, poly.length);
          self._applyFollower(parked, cam);
          if (t < 1) {
            self._driveFrame = requestAnimationFrame(back);
            return;
          }
          self._clearFollower();
          resolve();
        }
        self._driveFrame = requestAnimationFrame(back);
      }

      function frame(now) {
        const dt = Math.min(0.05, ((now || Date.now()) - last) / 1000);
        last = now || Date.now();
        targetDist = Math.min(poly.length, targetDist + DRIVE_SPEED_MPS * dt);
        displayDist = damp(displayDist, targetDist, 8, dt);

        const vehicle = poseOnRoute(poly, displayDist);
        const ahead = lookAheadPoint(poly, displayDist, LOOKAHEAD_M);
        cam.x = damp(cam.x, ahead.point.x, 4.5, dt);
        cam.y = damp(cam.y, ahead.point.y, 4.5, dt);
        cam.heading = dampAngle(cam.heading, ahead.heading, 5, dt);
        cam.zoom = damp(cam.zoom, FOLLOW_ZOOM, 3.2, dt);
        self._applyFollower(vehicle, cam);

        while (passed < path.length - 1 && displayDist >= poly.vertexDistances[passed + 1] - 0.35) {
          passed += 1;
          self.currentId = path[passed];
          self.visited[path[passed]] = true;
          self.selectedId = path[passed];
          self.render();
          self._emit();
          self._applyFollower(vehicle, cam);
        }

        const arrived = targetDist >= poly.length - 0.05 && Math.abs(displayDist - poly.length) < 0.2;
        if (!arrived) {
          self._driveFrame = requestAnimationFrame(frame);
          return;
        }
        finishOverview();
      }

      self._driveFrame = requestAnimationFrame(frame);
    });
  };

  MapApp.prototype.travel = async function (targetId, opts) {
    opts = opts || {};
    if (this._busy) return { ok: false, reason: "busy" };
    const target = place(targetId);
    if (!target) return { ok: false, reason: "missing" };
    if (target.id === this.currentId) {
      this.selectedId = target.id;
      this.render();
      return { ok: true, already: true, place: target, line: target.here, route: [target.id] };
    }
    const path = route(this.currentId, target.id);
    if (path.length < 2) return { ok: false, reason: "unreachable" };

    this._busy = true;
    this.selectedId = target.id;
    this.render();
    if (path.length > 2) {
      this._status("Sétálunk: " + path.map(function (pid) { return place(pid).name; }).join(" → "));
    }

    const animate = opts.animate !== false && motionOk() && this._open;
    if (animate) {
      await this._driveRoute(path);
    }
    for (let i = 1; i < path.length; i += 1) {
      this.currentId = path[i];
      this.visited[path[i]] = true;
      this.selectedId = path[i];
    }
    this._emit();

    if (opts.recordTrail !== false) {
      this.trail.push(target.id);
      if (this.trail.length > 16) this.trail = this.trail.slice(-16);
    }
    this.save();
    this._busy = false;
    this.render();
    if (opts.speak !== false) this._speak(target.arrive);
    return { ok: true, place: target, line: target.arrive, route: path };
  };

  MapApp.prototype.step = async function (dir) {
    if (this._busy) return { ok: false, reason: "busy" };
    const next = neighborInDirection(this.currentId, dir);
    if (!next) {
      this._status("Arra nincs ösvény.");
      return { ok: false, reason: "blocked", dir: dir };
    }
    return this.travel(next.id);
  };

  MapApp.prototype.back = async function () {
    if (this._busy) return { ok: false, reason: "busy" };
    if (this.trail.length < 2) return { ok: false, reason: "start", place: this.currentPlace() };
    const dest = this.trail[this.trail.length - 2];
    const result = await this.travel(dest, { recordTrail: false });
    if (result.ok && !result.already) {
      this.trail.pop();
      if (this.trail[this.trail.length - 1] !== this.currentId) this.trail.push(this.currentId);
      this.save();
      this.render();
    }
    return result;
  };

  MapApp.prototype.render = function () {
    const pins = document.getElementById("map-pins");
    const svg = document.getElementById("map-svg");
    const walker = document.getElementById("map-walker");
    const title = document.getElementById("map-detail-title");
    const blurb = document.getElementById("map-detail-blurb");
    const routeEl = document.getElementById("map-route");
    const go = document.getElementById("btn-travel");
    const backBtn = document.getElementById("btn-map-back");
    const whereIcon = document.getElementById("where-icon");
    const whereName = document.getElementById("where-name");
    const selected = place(this.selectedId) || this.currentPlace();
    const path = route(this.currentId, selected.id);
    const onRoute = {};
    for (let i = 1; i < path.length; i += 1) {
      const a = path[i - 1];
      const b = path[i];
      onRoute[a < b ? a + "|" + b : b + "|" + a] = true;
    }

    if (svg) {
      svg.innerHTML = LINKS.map(function (pair) {
        const a = place(pair[0]);
        const b = place(pair[1]);
        const key = pair[0] < pair[1] ? pair[0] + "|" + pair[1] : pair[1] + "|" + pair[0];
        return (
          '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"' +
          (onRoute[key] ? ' class="is-route"' : "") +
          " />"
        );
      }).join("");
    }

    if (pins) {
      pins.innerHTML = PLACES.map(function (item) {
        const classes = ["map-pin"];
        if (item.id === this.currentId) classes.push("is-here");
        if (item.id === selected.id) classes.push("is-selected");
        if (this.visited[item.id]) classes.push("is-visited");
        return (
          '<button type="button" class="' + classes.join(" ") + '" data-place="' + item.id + '" ' +
          'style="left:' + item.x + "%;top:" + item.y + '%" ' +
          'aria-label="' + item.name + (item.id === this.currentId ? ", itt vagyunk" : "") + '" ' +
          (item.id === this.currentId ? 'aria-current="true"' : "") +
          ">" +
          '<span class="map-pin-icon" aria-hidden="true">' + item.icon + "</span>" +
          '<span class="map-pin-label">' + item.name + "</span>" +
          "</button>"
        );
      }, this).join("");
    }

    if (walker) {
      const current = this.currentPlace();
      if (!this._busy) {
        walker.style.transition = "none";
        walker.style.left = current.x + "%";
        walker.style.top = current.y + "%";
        walker.style.transform = "";
        const world = document.getElementById("map-world");
        if (world) world.style.transform = "";
      }
    }

    if (title) title.textContent = selected.icon + " " + selected.name;
    if (blurb) blurb.textContent = selected.blurb;
    if (routeEl) {
      if (selected.id === this.currentId) {
        routeEl.textContent = "Itt állunk.";
      } else if (path.length > 1) {
        const steps = path.length - 1;
        routeEl.textContent =
          steps + (steps === 1 ? " lépés: " : " lépés: ") +
          path.map(function (pid) { return place(pid).name; }).join(" → ");
      } else {
        routeEl.textContent = "";
      }
    }

    if (go) {
      go.disabled = this._busy || selected.id === this.currentId;
      if (this._busy) go.textContent = "Sétálunk…";
      else if (selected.id === this.currentId) go.textContent = "Itt vagyunk";
      else if (path.length === 2) go.textContent = "Egy lépés ide";
      else go.textContent = "Indulás · " + (path.length - 1) + " lépés";
    }

    if (backBtn) backBtn.disabled = this._busy || this.trail.length < 2;

    const steps = document.getElementById("map-steps");
    if (steps) {
      steps.innerHTML = ["n", "e", "w", "s"].map(function (dir) {
        const next = neighborInDirection(this.currentId, dir);
        const text = DIRS[dir].arrow + " " + DIRS[dir].label + (next ? " · " + next.name : " · nincs ösvény");
        return (
          '<button type="button" class="map-step" data-dir="' + dir + '" aria-label="' + text + '"' +
          (this._busy || !next ? " disabled" : "") +
          ">" + text + "</button>"
        );
      }, this).join("");
    }

    ["n", "s", "e", "w"].forEach(function (dir) {
      const button = document.querySelector('.map-step[data-dir="' + dir + '"]');
      if (!button) return;
      const next = neighborInDirection(this.currentId, dir);
      button.disabled = this._busy || !next;
    }, this);

    if (whereIcon) whereIcon.textContent = this.currentPlace().icon;
    if (whereName) whereName.textContent = this.currentPlace().name;

    const app = document.querySelector(".app");
    if (app) app.dataset.place = this.currentId;
    if (document.body) document.body.dataset.place = this.currentId;
    const room = document.querySelector(".room");
    if (room) room.dataset.place = this.currentId;
  };

  MapApp.prototype.bind = function () {
    if (this._bound) return;
    this._bound = true;
    const self = this;

    const openBtn = document.getElementById("btn-map");
    const whereChip = document.getElementById("where-chip");
    const closeBtn = document.getElementById("btn-close-map");
    const go = document.getElementById("btn-travel");
    const backBtn = document.getElementById("btn-map-back");
    const pins = document.getElementById("map-pins");
    const canvas = document.getElementById("map-canvas");
    const overlay = document.getElementById("map-overlay");

    function openMap(event) {
      if (event) event.preventDefault();
      self.open();
    }
    if (openBtn) openBtn.addEventListener("click", openMap);
    if (whereChip) whereChip.addEventListener("click", openMap);
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        self.close();
      });
    }
    if (go) {
      go.addEventListener("click", function () {
        self.travel(self.selectedId);
      });
    }
    if (backBtn) {
      backBtn.addEventListener("click", async function () {
        const result = await self.back();
        if (!result.ok && result.reason === "start") {
          self._speak(self.currentPlace().here + " Innen indultunk.");
        }
      });
    }
    if (pins) {
      pins.addEventListener("click", function (event) {
        const button = event.target.closest(".map-pin");
        if (!button) return;
        self.select(button.getAttribute("data-place"));
      });
    }
    const steps = document.getElementById("map-steps");
    if (steps) {
      steps.addEventListener("click", function (event) {
        const button = event.target.closest(".map-step");
        if (!button || button.disabled) return;
        self.step(button.getAttribute("data-dir"));
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!self._open) return;
      const dirKeys = { ArrowUp: "n", ArrowDown: "s", ArrowLeft: "w", ArrowRight: "e" };
      if (event.key === "Escape") {
        event.preventDefault();
        self.close();
        return;
      }
      if (dirKeys[event.key]) {
        event.preventDefault();
        self.step(dirKeys[event.key]);
      }
    });

    if (canvas) {
      let touch = null;
      canvas.addEventListener(
        "touchstart",
        function (event) {
          const point = event.changedTouches && event.changedTouches[0];
          if (!point) return;
          touch = { x: point.clientX, y: point.clientY };
        },
        { passive: true }
      );
      canvas.addEventListener(
        "touchend",
        function (event) {
          if (!touch) return;
          const point = event.changedTouches && event.changedTouches[0];
          if (!point) return;
          const dx = point.clientX - touch.x;
          const dy = point.clientY - touch.y;
          touch = null;
          if (Math.hypot(dx, dy) < 48) return;
          if (Math.abs(dx) > Math.abs(dy)) self.step(dx > 0 ? "e" : "w");
          else self.step(dy > 0 ? "s" : "n");
        },
        { passive: true }
      );
    }

    if (overlay) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) self.close();
      });
    }
  };

  function mount(opts) {
    const app = new MapApp(opts);
    app.load();
    app.bind();
    app.render();
    app._emit();
    return app;
  }

  global.DiviMap = {
    PLACES: PLACES,
    LINKS: LINKS,
    fold: fold,
    place: place,
    neighbors: neighbors,
    route: route,
    neighborInDirection: neighborInDirection,
    interpret: interpret,
    knownPlaceList: knownPlaceList,
    joinNames: joinNames,
    mount: mount,
    lerp: lerp,
    damp: damp,
    lerpAngle: lerpAngle,
    offsetRight: offsetRight,
    buildPolyline: buildPolyline,
    pointAtDistance: pointAtDistance,
    snapToRoad: snapToRoad,
    poseOnRoute: poseOnRoute,
    lookAheadPoint: lookAheadPoint,
    projectToSegment: projectToSegment,
    LANE_OFFSET_M: LANE_OFFSET_M,
    LOOKAHEAD_M: LOOKAHEAD_M,
  };
})(typeof window !== "undefined" ? window : globalThis);
