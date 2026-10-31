/* ============================================================
   LPto0 — 24-Zone Set Summon Duel
   game engine
   ============================================================ */
(() => {
  "use strict";

  /* ---------------- tiny helpers ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, "0");
  const other = (s) => (s === "player" ? "opponent" : "player");
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const NAMES = { player: "11ai'ame", opponent: "ONLINE PLAYER" };
  const SHORT = { player: "11ai'ame", opponent: "ONLINE" };

  /* ---------------- online room simulation ---------------- */
  const ONLINE_NAMES = [
    "NEXUS_07", "KAI_11", "YUNA_X", "R3D_RONIN", "MIRA_77", "ZERO_DAY",
    "AKIRA_99", "LUMEN", "VANTA_6", "SORA_21", "KIRIN", "ECHO_404"
  ];
  const online = {
    roomCode: "",
    ownRoomCode: "",
    opponent: "ONLINE PLAYER",
    rooms: [],
    connected: true,
    started: false
  };

  function makeRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function makeOnlineHandle(used = []) {
    const pool = ONLINE_NAMES.filter((n) => !used.includes(n));
    return pool.length ? pick(pool) : `PLAYER_${Math.floor(100 + Math.random() * 900)}`;
  }

  function makeRooms() {
    const used = [];
    return Array.from({ length: 4 }, (_, i) => {
      const host = makeOnlineHandle(used);
      used.push(host);
      return {
        host,
        code: makeRoomCode(),
        state: i === 3 ? "FULL" : "OPEN",
        ping: 8 + Math.floor(Math.random() * 40)
      };
    });
  }
  const COLS = ["A", "B", "C", "D", "E", "F"];
  const ROWS = [
    { side: "opponent", kind: "spell" },
    { side: "opponent", kind: "monster" },
    { side: "player", kind: "monster" },
    { side: "player", kind: "spell" }
  ];
  const EMPTY = new Set();
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- state ---------------- */
  let uidCounter = 0;
  const state = {
    turn: 1,
    active: "player",
    busy: false,
    winner: null,
    endReason: "",
    sel: null,
    mode: "summon",
    pending: null,
    player: null,
    opponent: null,
    log: [],
    stats: { damageDealt: 0, damageTaken: 0 },
    record: { w: 0, l: 0 },
    ui: { lastLp: { player: 4000, opponent: 4000 } }
  };

  const zoneEls = new Map();
  const zoneKey = (side, kind, index) => `${side}:${kind}:${index}`;

  /* ---------------- DOM handles ---------------- */
  const dom = {};
  function cacheDom() {
    dom.app = $("#app");
    dom.board = $("#board");
    dom.hand = $("#hand");
    dom.sideHands = $(".hand-zone");
    dom.log = $("#log");
    dom.logRail = $("#log-rail");
    dom.logCount = $("#log-count");
    dom.inspector = $("#inspector");
    dom.inspectKicker = $("#inspect-kicker");
    dom.inspectCode = $("#inspect-code");
    dom.actionStrip = $("#action-strip");
    dom.actionButtons = $("#action-buttons");
    dom.statusText = $("#status-text");
    dom.statusDot = $("#status-dot");
    dom.endBtn = $("#btn-end");
    dom.handCount = $("#hand-count");
    dom.handHint = $("#hand-hint");
    dom.turnKicker = $("#turn-kicker");
    dom.turnPhase = $("#turn-phase");
    dom.turnChip = $("#turn-chip");
    dom.banner = $("#banner");
    dom.bannerText = $("#banner-text");
    dom.bannerSub = $("#banner-sub");
    dom.mobileDetail = $("#mobile-detail");
    dom.rulesOverlay = $("#rules-overlay");
    dom.lobbyOverlay = $("#lobby-overlay");
    dom.lobbyRoomList = $("#room-list");
    dom.lobbyOwnCode = $("#own-room-code");
    dom.lobbyNet = $("#lobby-net");
    dom.lobbyCode = $("#lobby-code");
    dom.lobbyResume = $("#btn-lobby-resume");
    dom.oppName = $("#opp-name");
    dom.oppAvatarLetter = $("#opp-avatar-letter");
    dom.oppRole = $("#opp-role");
    dom.footerMatchup = $("#footer-matchup");
    dom.gameover = $("#gameover-overlay");
    dom.goTitle = $("#go-title");
    dom.goKicker = $("#go-kicker");
    dom.goSub = $("#go-sub");
    dom.goTurns = $("#go-turns");
    dom.goDamage = $("#go-damage");
    dom.goLp = $("#go-lp");
    dom.goQuote = $("#go-quote");
    dom.canvas = $("#fx");
  }

  /* ============================================================
     SOUND — tiny procedural WebAudio kit
     ============================================================ */
  const Sound = {
    ctx: null,
    master: null,
    muted: false,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    },
    resume() {
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.02);
      try { localStorage.setItem("lpto0_muted", m ? "1" : "0"); } catch (_) {}
    },
    tone(freq, dur = 0.12, type = "sine", vol = 0.055, slide = 0) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur = 0.2, vol = 0.05, cutoff = 1200, q = 0.8) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = cutoff;
      f.Q.value = q;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(this.master);
      src.start(t);
    },
    click() { this.tone(720, 0.05, "square", 0.025, 180); },
    draw() { this.tone(520, 0.08, "triangle", 0.035, 200); },
    summon() {
      [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, "triangle", 0.045, 30), i * 55));
    },
    set() { this.tone(180, 0.14, "sine", 0.06, -60); this.noise(0.14, 0.03, 500); },
    flip() { this.tone(330, 0.06, "square", 0.03, 500); setTimeout(() => this.tone(880, 0.09, "triangle", 0.035, 120), 60); },
    attack() { this.tone(220, 0.16, "sawtooth", 0.04, 700); this.noise(0.14, 0.035, 2200); },
    hit() { this.tone(80, 0.22, "sine", 0.09, -40); this.noise(0.24, 0.08, 520, 0.6); },
    heal() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "sine", 0.04), i * 80)); },
    trap() { this.tone(150, 0.2, "sawtooth", 0.035, 120); this.noise(0.18, 0.04, 900); },
    destroy() { this.noise(0.35, 0.09, 700, 0.5); this.tone(60, 0.3, "sine", 0.08, -20); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, "triangle", 0.055, 20), i * 110)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, "sine", 0.05, -10), i * 140)); }
  };

  /* ============================================================
     FX — canvas particles + impact slashes
     ============================================================ */
  const FX = {
    canvas: null, ctx: null, dpr: 1, parts: [], raf: null, last: 0,
    init() {
      this.canvas = dom.canvas;
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.last = performance.now();
      this.loop(this.last);
    },
    resize() {
      if (!this.canvas) return;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.floor(window.innerWidth * this.dpr);
      this.canvas.height = Math.floor(window.innerHeight * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    burst(x, y, color = "#55f4ff", count = 18, power = 4) {
      if (reduceMotion) count = Math.min(count, 6);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random()) * power;
        this.parts.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 0.4,
          life: 0,
          max: 28 + Math.random() * 34,
          color,
          size: 0.8 + Math.random() * 2.4,
          grav: 0.055 + Math.random() * 0.06
        });
      }
    },
    burstAt(el, color, count, power) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      this.burst(r.left + r.width / 2, r.top + r.height / 2, color, count, power);
    },
    loop(now) {
      this.raf = requestAnimationFrame((t) => this.loop(t));
      const dt = Math.min(2.5, (now - this.last) / 16.67 || 1);
      this.last = now;
      const c = this.ctx;
      c.clearRect(0, 0, window.innerWidth, window.innerHeight);
      c.globalCompositeOperation = "lighter";

      if (!reduceMotion && Math.random() < 0.035) {
        this.parts.push({
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 8,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -0.28 - Math.random() * 0.5,
          life: 0,
          max: 140 + Math.random() * 160,
          color: Math.random() < 0.68 ? "#55f4ff" : "#ff3ea5",
          size: 0.5 + Math.random() * 1.1,
          grav: 0,
          ambient: true
        });
      }

      this.parts = this.parts.filter((p) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.grav * dt;
        p.vx *= 0.994;
        const k = 1 - p.life / p.max;
        if (k <= 0) return false;
        c.globalAlpha = p.ambient ? k * 0.24 : k * 0.85;
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (p.ambient ? 1 : Math.max(0.35, k)), 0, Math.PI * 2);
        c.fill();
        return true;
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    }
  };

  /* ============================================================
     CARD UTILITIES
     ============================================================ */
  function makeCard(id) {
    const t = window.CARDS[id];
    return {
      uid: ++uidCounter,
      id,
      name: t.name,
      jp: t.jp,
      type: t.type,
      atk: t.atk || 0,
      def: t.def || 0,
      level: t.level || 0,
      element: t.element || "",
      glyph: t.glyph,
      colors: t.colors.slice(),
      glow: t.glow,
      effect: t.effect,
      desc: t.desc,
      target: t.target || null,
      owner: null,
      faceDown: false,
      position: "atk",
      hasAttacked: false,
      posChanged: false,
      shieldUsed: false,
      atkBuff: 0,
      defBuff: 0,
      permAtk: 0,
      summonedTurn: 0,
      resolving: false,
      justPlayed: false
    };
  }

  const effAtk = (c) => Math.max(0, (c.atk || 0) + (c.permAtk || 0) + (c.atkBuff || 0));
  const effDef = (c) =>
    Math.max(0, (c.def || 0) + (c.defBuff || 0) + (c.effect === "setDef400" && c.faceDown ? 400 : 0));

  function makeDeck(owner) {
    return shuffle(window.DECKS[owner].map((id) => makeCard(id)));
  }

  function zoneOf(card) {
    if (!card) return null;
    for (const sideKey of ["player", "opponent"]) {
      for (const kind of ["monster", "spell"]) {
        const arr = state[sideKey][kind];
        const index = arr.indexOf(card);
        if (index >= 0) return { side: sideKey, kind, index };
      }
    }
    return null;
  }

  function isOnField(card) {
    if (!card) return false;
    const z = zoneOf(card);
    return !!(z && (z.kind === "monster" || z.kind === "spell"));
  }

  function getCardByUid(uid) {
    if (!state.player) return null;
    for (const sideKey of ["player", "opponent"]) {
      const s = state[sideKey];
      for (const c of s.hand) if (c.uid === uid) return c;
      for (const c of s.monster) if (c && c.uid === uid) return c;
      for (const c of s.spell) if (c && c.uid === uid) return c;
    }
    return null;
  }

  function monstersOf(sideKey) {
    return state[sideKey].monster.filter(Boolean);
  }

  function faceUpMonsters(sideKey) {
    return state[sideKey].monster.filter((c) => c && !c.faceDown);
  }

  function setTrapsOf(sideKey) {
    return state[sideKey].spell.filter((c) => c && c.type === "trap" && c.faceDown);
  }

  function firstEmptyIndex(sideKey, kind) {
    return state[sideKey][kind].findIndex((c) => !c);
  }

  function zoneElOf(card) {
    const z = zoneOf(card);
    if (!z) return null;
    return zoneEls.get(zoneKey(z.side, z.kind, z.index)) || null;
  }

  function zoneCoord(side, kind, index) {
    const row = ROWS.findIndex((r) => r.side === side && r.kind === kind);
    return `${COLS[index]}${row + 1}`;
  }

  function recordOf(sideKey) {
    return state.record ? (sideKey === "player" ? state.record.w : state.record.l) : 0;
  }

  /* ============================================================
     LOG / BANNER / SPEECH
     ============================================================ */
  function addLog(html, kind = "sys", big = false) {
    const entry = { html, kind, big };
    state.log.push(entry);
    if (state.log.length > 90) state.log.shift();
    if (!dom.log) return;
    const el = document.createElement("div");
    el.className = `log-entry ${kind}${big ? " big" : ""}`;
    const num = document.createElement("span");
    num.className = "li-num";
    num.textContent = pad2(state.log.length);
    const text = document.createElement("span");
    text.className = "li-text";
    text.innerHTML = html;
    el.append(num, text);
    dom.log.appendChild(el);
    while (dom.log.children.length > 90) dom.log.removeChild(dom.log.firstChild);
    dom.log.scrollTop = dom.log.scrollHeight;
    if (dom.logCount) dom.logCount.textContent = pad2(state.log.length);
  }

  function resetLog() {
    state.log = [];
    if (dom.log) dom.log.innerHTML = "";
    if (dom.logCount) dom.logCount.textContent = "00";
  }

  let bannerTimer = null;
  function showBanner(text, sub = "", own = false, hold = 1250) {
    if (!dom.banner) return;
    if (bannerTimer) clearTimeout(bannerTimer);
    dom.bannerText.textContent = text;
    dom.bannerSub.textContent = sub;
    dom.banner.classList.toggle("opp", !own);
    dom.banner.classList.add("show");
    bannerTimer = setTimeout(() => dom.banner.classList.remove("show"), hold);
  }

  const speechTimers = { player: null, opponent: null };
  function say(sideKey, text, hold = 2600) {
    const el = sideKey === "player" ? $("#you-speech") : $("#opp-speech");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    if (speechTimers[sideKey]) clearTimeout(speechTimers[sideKey]);
    speechTimers[sideKey] = setTimeout(() => el.classList.remove("show"), hold);
  }

  function clearSpeech() {
    ["player", "opponent"].forEach((s) => {
      const el = s === "player" ? $("#you-speech") : $("#opp-speech");
      if (el) el.classList.remove("show");
    });
  }

  /* ============================================================
     GAME SETUP
     ============================================================ */
  function buildBoard() {
    ROWS.forEach((row, rowIndex) => {
      const container = $(`.row[data-side="${row.side}"][data-kind="${row.kind}"] .zones`);
      if (!container) return;
      for (let i = 0; i < 6; i++) {
        const coord = `${COLS[i]}${rowIndex + 1}`;
        const z = document.createElement("div");
        z.className = "zone";
        z.dataset.side = row.side;
        z.dataset.kind = row.kind;
        z.dataset.index = String(i);
        z.dataset.coord = coord;
        z.setAttribute("role", "gridcell");
        z.setAttribute("aria-label", `${coord} ${row.side} ${row.kind} zone`);
        z.innerHTML = `<span class="zone-coord">${coord}</span><span class="zone-hint"></span>`;
        container.appendChild(z);
        zoneEls.set(zoneKey(row.side, row.kind, i), z);
      }
    });
  }

  function newSide(owner) {
    return {
      owner,
      lp: 4000,
      maxLp: 4000,
      deck: makeDeck(owner),
      hand: [],
      grave: [],
      monster: Array(6).fill(null),
      spell: Array(6).fill(null),
      summonUsed: false
    };
  }

  function loadRecord() {
    try {
      const raw = localStorage.getItem("lpto0_record");
      if (raw) {
        const r = JSON.parse(raw);
        return { w: Number(r.w) || 0, l: Number(r.l) || 0 };
      }
    } catch (_) {}
    return { w: 0, l: 0 };
  }

  function saveRecord() {
    try { localStorage.setItem("lpto0_record", JSON.stringify(state.record)); } catch (_) {}
  }

  /* ============================================================
     ONLINE ROOM LOBBY
     ============================================================ */
  function updateNameBindings() {
    if (dom.oppName) dom.oppName.textContent = NAMES.opponent;
    if (dom.oppAvatarLetter) dom.oppAvatarLetter.textContent = (NAMES.opponent[0] || "O").toUpperCase();
    if (dom.oppRole) dom.oppRole.textContent = "ONLINE // SET-BREAKER";
    if (dom.footerMatchup) {
      dom.footerMatchup.innerHTML = `<b>${esc(NAMES.player)}</b> vs <b>${esc(NAMES.opponent)}</b>`;
    }
    const oppRole = $(".hud.opponent .hud-role");
    if (oppRole) oppRole.textContent = "ONLINE // SET-BREAKER";
  }

  function createOwnRoom(announce = false) {
    online.ownRoomCode = makeRoomCode();
    online.roomCode = online.ownRoomCode;
    online.rooms = makeRooms();
    if (dom.lobbyOwnCode) dom.lobbyOwnCode.textContent = `#${online.ownRoomCode}`;
    if (dom.lobbyCode) dom.lobbyCode.textContent = `ROOM #${online.roomCode}`;
    if (announce) {
      addLog(`<b>ROOM CREATED.</b> ${esc(NAMES.player)} is hosting room #${online.ownRoomCode}.`, "sys", true);
      Sound.click();
    }
  }

  function renderLobby() {
    if (!dom.lobbyRoomList) return;
    dom.lobbyRoomList.innerHTML = online.rooms.map((r) => {
      const open = r.state === "OPEN";
      return `
        <div class="room-card${open ? "" : " full"}">
          <div class="room-icon">${esc((r.host[0] || "?").toUpperCase())}</div>
          <div class="room-main">
            <div class="room-name"><b>${esc(r.host)}</b>'s ROOM <span class="room-code">#${r.code}</span></div>
            <div class="room-meta">SET SUMMON // 4000 LP <span class="room-ping">${r.ping}ms</span></div>
          </div>
          <div class="room-side">
            <span class="room-status ${open ? "open" : "full"}">${r.state}</span>
            <button class="btn room-join" type="button" data-join="${esc(r.host)}" data-code="${r.code}"${open ? "" : " disabled"}>JOIN</button>
          </div>
        </div>`;
    }).join("");
    if (dom.lobbyOwnCode) dom.lobbyOwnCode.textContent = `#${online.ownRoomCode}`;
    if (dom.lobbyCode) dom.lobbyCode.textContent = `ROOM #${online.roomCode || online.ownRoomCode}`;
    if (dom.lobbyNet) dom.lobbyNet.textContent = `PING ${8 + Math.floor(Math.random() * 20)}ms`;
    if (dom.lobbyResume) dom.lobbyResume.hidden = !online.started || !!state.winner;
  }

  function openLobby(opts = {}) {
    if (!online.ownRoomCode) createOwnRoom();
    if (opts.refresh !== false) online.rooms = makeRooms();
    renderLobby();
    updateNameBindings();
    if (dom.lobbyOverlay) dom.lobbyOverlay.hidden = false;
    if (!opts.silent) Sound.click();
  }

  function closeLobby() {
    if (dom.lobbyOverlay) dom.lobbyOverlay.hidden = true;
    Sound.click();
  }

  function startOnlineDuel(opponentName, roomCode) {
    NAMES.opponent = opponentName || makeOnlineHandle();
    online.opponent = NAMES.opponent;
    online.roomCode = roomCode || online.ownRoomCode || makeRoomCode();
    online.started = true;
    updateNameBindings();
    if (dom.lobbyOverlay) dom.lobbyOverlay.hidden = true;
    dom.gameover.hidden = true;
    dom.gameover.classList.remove("lose");
    newGame();
    addLog(`<b>ONLINE MATCH.</b> Room #${online.roomCode} // ${esc(NAMES.player)} vs ${esc(NAMES.opponent)}.`, "sys", true);
    render();
  }

  function startOwnRoomDuel() {
    startOnlineDuel(makeOnlineHandle(), online.ownRoomCode);
  }

  function quickMatch() {
    const open = online.rooms.filter((r) => r.state === "OPEN");
    const room = open.length ? pick(open) : { host: makeOnlineHandle(), code: makeRoomCode() };
    startOnlineDuel(room.host, room.code);
  }

  function newGame() {
    state.turn = 1;
    state.active = "player";
    state.busy = false;
    state.winner = null;
    state.endReason = "";
    state.sel = null;
    state.mode = "summon";
    state.pending = null;
    state.player = newSide("player");
    state.opponent = newSide("opponent");
    state.stats = { damageDealt: 0, damageTaken: 0 };
    state.record = loadRecord();
    state.ui.lastLp = { player: 4000, opponent: 4000 };
    updateNameBindings();
    dom.gameover.hidden = true;
    dom.gameover.classList.remove("lose");
    dom.rulesOverlay.hidden = true;
    dom.logRail.classList.remove("open");
    resetLog();
    clearSpeech();
    addLog(`<b>ROOM #${online.roomCode || online.ownRoomCode || "----"} CONNECTED.</b> 24 zones online. LP set to 4000.`, "sys", true);
    addLog(`${esc(NAMES.player)} vs ${esc(NAMES.opponent)} — set summon protocol engaged.`, "sys");
    for (let i = 0; i < 5; i++) {
      drawCard("player", { silent: true });
      drawCard("opponent", { silent: true });
    }
    addLog("Both duelists draw 5 cards.", "sys");
    beginTurn("player", { first: true });
    showBanner("DUEL START", `${NAMES.player}  vs  ${NAMES.opponent}`, true, 1700);
  }

  function beginTurn(sideKey, opts = {}) {
    if (state.winner) return;
    if (!opts.first) state.turn++;
    state.active = sideKey;
    state.busy = sideKey === "opponent";
    state.sel = null;
    state.pending = null;
    state.mode = "summon";
    const side = state[sideKey];
    side.summonUsed = false;
    side.monster.forEach((c) => {
      if (!c) return;
      c.hasAttacked = false;
      c.posChanged = false;
      c.shieldUsed = false;
    });
    if (!opts.first) {
      const drawn = drawCard(sideKey);
      if (!drawn) return;
    }
    addLog(`--- TURN ${pad2(state.turn)} // ${sideKey === "player" ? "YOUR TURN" : "RIVAL TURN"} ---`, sideKey === "player" ? "you" : "opp", true);
    if (sideKey === "opponent") {
      addLog(`${esc(NAMES.opponent)} takes the matrix.`, "opp");
    } else if (!opts.first) {
      addLog(`Your draw phase resolves.`, "you");
    }
    render();
    if (sideKey === "player") {
      showBanner("YOUR TURN", `TURN ${pad2(state.turn)} // 24-ZONE MATRIX`, true, 1050);
      if (state.turn > 1) say("player", "My turn. Read the board.");
    } else {
      showBanner("RIVAL TURN", `TURN ${pad2(state.turn)} // SET-BREAKER`, false, 1050);
      say("opponent", pick(["My turn. Set your board—I'll break it.", "The matrix is mine now.", "Let's see what you hid."]), 2400);
      setTimeout(() => aiTurn(), 950);
    }
  }

  function drawCard(sideKey, opts = {}) {
    const side = state[sideKey];
    if (state.winner) return null;
    if (side.deck.length === 0) {
      addLog(`${esc(NAMES[sideKey])} must draw with an empty deck.`, "warn", true);
      endGame(other(sideKey), "deckout");
      return null;
    }
    const card = side.deck.pop();
    side.hand.push(card);
    card.owner = sideKey;
    if (!opts.silent) {
      if (sideKey === "player") {
        addLog(`You draw <b>${esc(card.name)}</b>.`, "you");
        Sound.draw();
      } else {
        addLog(`${esc(NAMES.opponent)} draws a card.`, "opp");
      }
    }
    return card;
  }

  /* ============================================================
     TURN FLOW
     ============================================================ */
  function clearTempBuffs(sideKey) {
    const side = state[sideKey];
    side.monster.forEach((c) => {
      if (!c) return;
      c.atkBuff = 0;
      c.defBuff = 0;
    });
  }

  async function concludeTurn(sideKey) {
    if (state.winner) return;
    state.busy = true;
    state.sel = null;
    state.pending = null;
    clearTempBuffs(sideKey);
    render();
    await wait(420);
    if (state.winner) return;
    beginTurn(other(sideKey));
  }

  function playerEndTurn() {
    if (state.winner || state.busy || state.active !== "player") return;
    if (state.pending) cancelPendingSpell();
    state.sel = null;
    state.busy = true;
    render();
    addLog("You end your turn.", "you");
    Sound.click();
    concludeTurn("player");
  }

  function endGame(winnerKey, reason = "lp") {
    if (state.winner) return;
    state.winner = winnerKey;
    state.endReason = reason;
    state.busy = true;
    state.pending = null;
    state.sel = null;
    render();
    if (winnerKey === "player") {
      state.record.w++;
      addLog(`<b>VICTORY.</b> ${esc(NAMES.opponent)} reaches 0 LP.`, "sys", true);
      Sound.win();
      say("player", "The set was the play. You walked right into it.", 5000);
    } else {
      state.record.l++;
      addLog(`<b>DEFEAT.</b> ${esc(NAMES.player)} is out of the duel.`, "warn", true);
      Sound.lose();
    }
    saveRecord();
    setTimeout(() => {
      dom.goKicker.textContent = `DUEL COMPLETE // TURN ${pad2(state.turn)} // ${reason.toUpperCase()}`;
      dom.goTitle.textContent = winnerKey === "player" ? "VICTORY" : "DEFEAT";
      dom.goSub.textContent =
        winnerKey === "player"
          ? `${NAMES.opponent} // LP 0`
          : `${NAMES.player} // ${reason === "deckout" ? "DECK OUT" : "LP 0"}`;
      dom.goTurns.textContent = pad2(state.turn);
      dom.goDamage.textContent = state.stats.damageDealt;
      dom.goLp.textContent = state.player.lp;
      dom.goQuote.textContent =
        winnerKey === "player"
          ? pick([
              "“The set was the play. You walked right into it.”",
              "“You read every zone. That's why you're still standing.”",
              "“LP to zero. Clean as a circuit.”"
            ])
          : pick([
              "“Your set was good. Mine was better.”",
              "“The matrix doesn't forgive a slow read.”",
              "“Next time, flip earlier.”"
            ]);
      dom.gameover.classList.toggle("lose", winnerKey !== "player");
      dom.gameover.hidden = false;
      $("#btn-rematch").focus({ preventScroll: true });
      if (winnerKey === "player") {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => FX.burst(
            window.innerWidth * (0.2 + Math.random() * 0.6),
            window.innerHeight * (0.25 + Math.random() * 0.35),
            pick(["#55f4ff", "#ffd166", "#ff3ea5", "#7cf7c4"]),
            24, 6
          ), i * 130);
        }
      }
    }, 850);
  }

  /* ============================================================
     RENDERING
     ============================================================ */
  function createCardEl(card, variant = "zone") {
    const el = document.createElement("div");
    el.className = `card ${card.type}`;
    el.style.setProperty("--c1", card.colors[0]);
    el.style.setProperty("--c2", card.colors[1]);
    el.style.setProperty("--glow", card.glow);
    el.dataset.uid = String(card.uid);

    if (card.faceDown) {
      el.classList.add("face-down");
      el.innerHTML = `<div class="card-back"><div class="back-mark">LP<span>to</span><b>0</b></div></div>`;
      el.setAttribute("aria-label", "Face-down card");
      return el;
    }

    const isMonster = card.type === "monster";
    const atkBuff = (card.permAtk || 0) + (card.atkBuff || 0);
    const defBuff = card.defBuff || 0;
    const statBlock = isMonster
      ? `<div class="card-stats">
           <span class="atk${atkBuff ? " buffed" : ""}"><i>ATK</i>${effAtk(card)}</span>
           <span class="def${defBuff ? " buffed" : ""}"><i>DEF</i>${effDef(card)}</span>
         </div>`
      : variant === "zone"
        ? `<div class="card-stats"><span class="atk"><i>${card.type.toUpperCase()}</i></span><span class="def"><i>${card.faceDown ? "SET" : "READY"}</i></span></div>`
        : `<div class="card-effect-line">${esc(card.desc)}</div>`;

    el.innerHTML = `
      <div class="card-art">
        <span class="card-glyph">${card.glyph}</span>
        ${isMonster ? `<span class="card-element">${card.element}</span>` : `<span class="card-type-tag">${card.type.toUpperCase()}</span>`}
        ${isMonster ? `<span class="card-level">${"★".repeat(card.level)}</span>` : ""}
      </div>
      <div class="card-body">
        <div class="card-title">${esc(card.name)}</div>
        <div class="card-jp">${esc(card.jp || "")}</div>
        ${statBlock}
      </div>`;
    el.setAttribute("aria-label", `${card.name}, ${card.type}${isMonster ? `, ATK ${effAtk(card)}, DEF ${effDef(card)}` : ""}`);
    return el;
  }

  function render() {
    if (!state.player) return;
    renderHud("player");
    renderHud("opponent");
    renderTurn();
    renderZones();
    renderHand();
    renderAction();
    renderInspector();
    renderMobileDetail();
  }

  function renderHud(sideKey) {
    const side = state[sideKey];
    const prefix = sideKey === "player" ? "you" : "opp";
    const lpEl = $(`#${prefix}-lp`);
    const fillEl = $(`#${prefix}-lpfill`);
    const barEl = $(`#${prefix}-lpbar`);
    if (!lpEl) return;
    const prev = Number(lpEl.dataset.lp || side.maxLp);
    lpEl.textContent = String(side.lp);
    lpEl.dataset.lp = String(side.lp);
    if (side.lp < prev) {
      lpEl.classList.remove("hit");
      void lpEl.offsetWidth;
      lpEl.classList.add("hit");
      setTimeout(() => lpEl.classList.remove("hit"), 420);
    }
    if (fillEl) fillEl.style.width = `${clamp((side.lp / side.maxLp) * 100, 0, 100)}%`;
    if (barEl) barEl.classList.toggle("danger", side.lp <= 1000);
    $(`#${prefix}-deck`).textContent = String(side.deck.length);
    $(`#${prefix}-hand`).textContent = String(side.hand.length);
    $(`#${prefix}-grave`).textContent = String(side.grave.length);

    const hud = $(`#hud-${sideKey}`);
    hud.classList.toggle("active", state.active === sideKey && !state.winner);
  }

  function renderTurn() {
    const activePlayer = state.active === "player";
    if (dom.turnKicker) dom.turnKicker.textContent = `TURN ${pad2(state.turn)}`;
    if (dom.turnChip) dom.turnChip.textContent = `TURN ${pad2(state.turn)}`;
    if (dom.turnPhase) {
      let label = activePlayer ? "YOUR TURN" : "RIVAL TURN";
      if (state.winner) label = "DUEL OVER";
      else if (state.busy && activePlayer) label = "RESOLVING";
      dom.turnPhase.textContent = label;
      dom.turnPhase.classList.toggle("opp", !activePlayer && !state.winner);
      dom.turnPhase.classList.toggle("busy", state.busy && activePlayer && !state.winner);
    }
    const youFlag = $("#you-turn-flag");
    const oppFlag = $("#opp-turn-flag");
    if (youFlag) youFlag.textContent = state.winner ? "DUEL OVER" : activePlayer ? "YOUR TURN" : "STANDBY";
    if (oppFlag) oppFlag.textContent = state.winner ? "DUEL OVER" : !activePlayer ? "ACTIVE" : "STANDBY";
    if (dom.endBtn) dom.endBtn.disabled = !(activePlayer && !state.busy && !state.winner);
  }

  function computeValidPlacements() {
    const out = new Set();
    if (!state.player || state.winner || state.busy || state.active !== "player") return out;
    if (!state.sel || state.sel.kind !== "hand") return out;
    const card = state.player.hand.find((c) => c.uid === state.sel.uid);
    if (!card) return out;
    if (card.type === "monster") {
      if (state.player.summonUsed) return out;
      state.player.monster.forEach((c, i) => { if (!c) out.add(zoneKey("player", "monster", i)); });
    } else if (card.type === "spell") {
      if (card.target && !spellHasTarget(card)) return out;
      state.player.spell.forEach((c, i) => { if (!c) out.add(zoneKey("player", "spell", i)); });
    } else if (card.type === "trap") {
      state.player.spell.forEach((c, i) => { if (!c) out.add(zoneKey("player", "spell", i)); });
    }
    return out;
  }

  function computeTargetZones() {
    const out = new Set();
    if (!state.player || state.winner || state.busy) return out;
    if (state.pending) {
      state.opponent.monster.concat(state.player.monster).forEach((c) => {
        if (!c) return;
        if (pendingTargetValid(c)) {
          const z = zoneOf(c);
          if (z) out.add(zoneKey(z.side, z.kind, z.index));
        }
      });
      return out;
    }
    const attacker = selectedOwnAttacker();
    if (!attacker) return out;
    state.opponent.monster.forEach((c, i) => { if (c) out.add(zoneKey("opponent", "monster", i)); });
    return out;
  }

  function renderZones() {
    const valid = computeValidPlacements();
    const targets = computeTargetZones();
    const selected = selectedCard();
    const selectedZone = selected ? zoneOf(selected) : null;

    for (const [key, zoneEl] of zoneEls) {
      const { side, kind, index } = parseZoneKey(key);
      const card = state[side][kind][index];
      zoneEl.classList.toggle("occupied", !!card);
      zoneEl.classList.toggle("valid", valid.has(key));
      zoneEl.classList.toggle("targetable", targets.has(key));

      let isSelected = false;
      if (selected && selectedZone) {
        isSelected = selectedZone.side === side && selectedZone.kind === kind && selectedZone.index === index;
      }
      if (state.sel && state.sel.kind === "zone" && state.sel.side === side && state.sel.kind2 === kind && state.sel.index === index) isSelected = true;
      zoneEl.classList.toggle("selected", isSelected);

      if (!card) {
        if (zoneEl.dataset.uid) {
          zoneEl.querySelectorAll(".card, .pos-badge").forEach((n) => n.remove());
          delete zoneEl.dataset.uid;
          delete zoneEl.dataset.sig;
        }
        const hint = zoneEl.querySelector(".zone-hint");
        if (hint) {
          if (valid.has(key)) {
            const handCard = state.sel && state.sel.kind === "hand" ? state.player.hand.find((c) => c.uid === state.sel.uid) : null;
            hint.textContent = kind === "monster" ? (state.mode === "set" ? "SET" : "SUMMON") : handCard && handCard.type === "trap" ? "SET TRAP" : "CAST";
          } else hint.textContent = "";
        }
        continue;
      }

      const sig = `${card.uid}:${card.faceDown ? 1 : 0}:${card.position}:${effAtk(card)}:${effDef(card)}:${card.resolving ? 1 : 0}`;
      if (zoneEl.dataset.sig !== sig) {
        zoneEl.querySelectorAll(".card, .pos-badge").forEach((n) => n.remove());
        const cardEl = createCardEl(card, "zone");
        zoneEl.appendChild(cardEl);
        zoneEl.dataset.uid = String(card.uid);
        zoneEl.dataset.sig = sig;

        if (kind === "monster" || card.type === "trap") {
          const badge = document.createElement("span");
          if (kind === "monster") {
            badge.className = `pos-badge ${card.faceDown ? "set" : card.position === "def" ? "def" : ""}`;
            badge.textContent = card.faceDown ? "SET" : card.position.toUpperCase();
          } else {
            badge.className = "pos-badge set";
            badge.textContent = card.resolving ? "CAST" : card.faceDown ? "SET" : "TRAP";
          }
          zoneEl.appendChild(badge);
        }
      }

      if (card.justPlayed) {
        card.justPlayed = false;
        zoneEl.classList.remove("summon-flash");
        void zoneEl.offsetWidth;
        zoneEl.classList.add("summon-flash");
        setTimeout(() => zoneEl.classList.remove("summon-flash"), 650);
      }

      const hint = zoneEl.querySelector(".zone-hint");
      if (hint) hint.textContent = "";
    }
  }

  function renderHand() {
    if (!dom.hand) return;
    const scrollLeft = dom.hand.scrollLeft;
    const hand = state.player.hand;
    dom.hand.innerHTML = "";
    if (!hand.length) {
      dom.hand.innerHTML = `<div class="hand-empty">NO CARDS IN HAND — DRAW NEXT TURN</div>`;
    }
    const n = hand.length;
    const mid = (n - 1) / 2;
    hand.forEach((card, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hand-card";
      if (state.sel && state.sel.kind === "hand" && state.sel.uid === card.uid) btn.classList.add("selected");
      if (state.active !== "player" || state.winner) btn.classList.add("dim");
      btn.dataset.uid = String(card.uid);
      btn.style.setProperty("--i", String(i));
      btn.style.setProperty("--rot", `${(i - mid) * (n > 6 ? 1.5 : 2.7)}deg`);
      btn.style.setProperty("--lift", `${Math.abs(i - mid) * 1.4}px`);
      btn.setAttribute("aria-label", `${card.name}, ${card.type}${card.type === "monster" ? `, ATK ${effAtk(card)}, DEF ${effDef(card)}` : ""}. Inspect card.`);
      btn.appendChild(createCardEl(card, "hand"));
      dom.hand.appendChild(btn);
    });
    if (dom.handCount) dom.handCount.textContent = pad2(hand.length);
    if (dom.handHint) {
      dom.handHint.textContent =
        state.active === "player" && !state.busy && !state.winner
          ? state.player.summonUsed
            ? "NORMAL SUMMON / SET USED"
            : "CLICK A CARD TO INSPECT"
          : "WAITING FOR RIVAL";
    }
    dom.hand.scrollLeft = scrollLeft;
  }

  function renderInspector() {
    if (!dom.inspector) return;
    const card = selectedCard();
    const pending = state.pending;
    const showCard = card || (pending ? pendingCard() : null);

    if (!showCard) {
      dom.inspectKicker.textContent = "CARD ANALYSER";
      dom.inspectCode.textContent = "IDLE";
      const winRate = state.record.w + state.record.l ? Math.round((state.record.w / (state.record.w + state.record.l)) * 100) : 0;
      dom.inspector.innerHTML = `
        <div class="inspect-empty">
          <div class="inspect-glyph" aria-hidden="true"></div>
          <h3>SET SUMMON PROTOCOL</h3>
          <p>Select a card to inspect its effect. Summon or set one monster per turn, cast spells into open zones, and hide traps for your rival's attack.</p>
          <div class="inspect-list">
            <div><span>MATRIX</span><b>24 ZONES</b></div>
            <div><span>MONSTER ROW</span><b>6 / SIDE</b></div>
            <div><span>SPELL TRAP ROW</span><b>6 / SIDE</b></div>
            <div><span>SET BONUS</span><b>+200 LP</b></div>
            <div><span>YOUR RECORD</span><b>${state.record.w}W / ${state.record.l}L · ${winRate}%</b></div>
            <div><span>RIVAL</span><b class="pink">${esc(NAMES.opponent)}</b></div>
          </div>
        </div>`;
      return;
    }

    const concealed = showCard.owner === "opponent" && showCard.faceDown;
    const displayCard = concealed ? showCard : showCard.owner === "player" && showCard.faceDown ? { ...showCard, faceDown: false } : showCard;
    const z = zoneOf(showCard);
    const coord = z ? zoneCoord(z.side, z.kind, z.index) : "HAND";
    const isMonster = showCard.type === "monster";

    dom.inspectKicker.textContent = state.pending ? "TARGETING" : "CARD ANALYSER";
    dom.inspectCode.textContent = coord;

    const title = concealed ? "CONCEALED UNIT" : displayCard.name;
    const jp = concealed ? "SET CARD // UNKNOWN" : displayCard.jp;
    const typeLabel = concealed ? "FACE-DOWN" : showCard.type.toUpperCase();
    const effectHtml = concealed
      ? "A face-down card. Its identity, stats and effect remain hidden until it is flipped or triggers."
      : esc(showCard.desc);

    let status = "INSPECT";
    if (showCard.owner === "player") {
      if (showCard.faceDown) status = "SET / DEF";
      else if (isMonster) status = showCard.hasAttacked ? "ATTACKED" : "READY";
      else status = "IN HAND";
    } else status = "RIVAL";

    let note = "";
    if (state.pending) {
      note = `Choose a valid target for <b>${esc(pendingCard().name)}</b>. Use CANCEL to return it to your hand.`;
    } else if (showCard.owner === "player" && showCard.faceDown && isMonster) {
      note = "Click <b>FLIP SUMMON</b> to reveal this monster and trigger its flip effect. It can attack this turn.";
    } else if (showCard.owner === "player" && isMonster && !showCard.faceDown) {
      note = showCard.position === "atk"
        ? "Select this monster, then pick an enemy target. If the rival has no monsters, <b>DIRECT ATTACK</b> opens."
        : "Defense Position. You may switch to Attack once per turn if it has not attacked.";
    } else if (showCard.owner === "player" && showCard.type === "spell") {
      note = "Cast from your hand into any empty Spell Zone. Targeted spells will ask for a target after placement.";
    } else if (showCard.owner === "player" && showCard.type === "trap") {
      note = "Set this trap face-down. It triggers automatically when the rival declares an attack.";
    } else if (concealed) {
      note = "This card stays concealed. Attack it to force a reveal, or wait for it to trigger.";
    }

    dom.inspector.innerHTML = `
      <div class="inspect-card-wrap"></div>
      <h2 class="inspect-title">${esc(title)}</h2>
      <div class="inspect-jp">${esc(jp)}</div>
      <span class="inspect-type ${showCard.type === "trap" ? "trap" : ""}">${typeLabel}${isMonster && !concealed ? ` · LV ${showCard.level} · ${showCard.element}` : ""}</span>
      <div class="inspect-effect ${showCard.type === "trap" ? "trap" : ""}">${effectHtml}</div>
      <div class="inspect-meta">
        ${isMonster && !concealed ? `<div><span>ATK</span><b>${effAtk(showCard)}</b></div><div><span>DEF</span><b>${effDef(showCard)}</b></div>` : `<div><span>TYPE</span><b>${concealed ? "UNKNOWN" : showCard.type.toUpperCase()}</b></div><div><span>ZONE</span><b>${coord}</b></div>`}
        <div><span>POSITION</span><b>${concealed ? "???" : isMonster ? (showCard.faceDown ? "SET / DEF" : showCard.position.toUpperCase()) : "SPELL ZONE"}</b></div>
        <div><span>STATUS</span><b>${status}</b></div>
      </div>
      ${note ? `<div class="inspect-note">${note}</div>` : ""}`;
    const wrap = dom.inspector.querySelector(".inspect-card-wrap");
    if (wrap) wrap.appendChild(createCardEl(displayCard, "inspect"));
  }

  function renderMobileDetail() {
    if (!dom.mobileDetail) return;
    const card = selectedCard() || (state.pending ? pendingCard() : null);
    if (!card) {
      dom.mobileDetail.hidden = true;
      dom.mobileDetail.innerHTML = "";
      return;
    }
    const concealed = card.owner === "opponent" && card.faceDown;
    dom.mobileDetail.hidden = false;
    if (concealed) {
      dom.mobileDetail.innerHTML = `<span class="md-type">FACE-DOWN</span><b>CONCEALED CARD</b><span>${esc(card.owner === "opponent" ? "Rival set card" : "")}</span>`;
      return;
    }
    const stats = card.type === "monster" ? `ATK ${effAtk(card)} / DEF ${effDef(card)}` : card.type.toUpperCase();
    dom.mobileDetail.innerHTML = `<span class="md-type">${card.type.toUpperCase()}</span><b>${esc(card.name)}</b><span class="md-stats">${stats}</span><span>${esc(card.desc)}</span>`;
  }

  function renderAction() {
    if (!state.player) return;
    const status = dom.statusText;
    const buttons = dom.actionButtons;
    if (!status || !buttons) return;
    let dot = "";
    let text = "Select a card from your hand.";
    let b = "";

    if (state.winner) {
      text = state.winner === "player" ? "Victory. The matrix is yours." : "Defeat. The matrix went dark.";
      dot = "warn";
    } else if (state.busy) {
      text = state.active === "opponent" ? `${NAMES.opponent} is resolving a play…` : "Resolving…";
      dot = "busy";
    } else if (state.pending) {
      const card = pendingCard();
      text = `Choose a target for ${card.name}.`;
      dot = "warn";
      b = `<button class="act-btn danger" data-act="cancel">CANCEL</button>`;
    } else if (state.sel && state.sel.kind === "hand") {
      const card = state.player.hand.find((c) => c.uid === state.sel.uid);
      if (card) {
        if (card.type === "monster") {
          if (state.player.summonUsed) {
            text = "Normal Summon / Set already used. End turn to reset.";
            dot = "warn";
          } else {
            text = state.mode === "set" ? "Set face-down in Defense. +200 LP." : "Summon face-up in Attack Position.";
            dot = "";
          }
          const disabled = state.player.summonUsed ? "disabled" : "";
          b = `<button class="act-btn ${state.mode === "summon" ? "active" : ""}" data-act="mode-summon" ${disabled}>SUMMON</button>
               <button class="act-btn ${state.mode === "set" ? "active" : ""}" data-act="mode-set" ${disabled}>SET</button>
               <button class="act-btn" data-act="cancel">CANCEL</button>`;
        } else if (card.type === "spell") {
          const hasTarget = !card.target || spellHasTarget(card);
          if (!hasTarget) {
            text = "No valid target for this spell right now.";
            dot = "warn";
          } else {
            text = card.target ? "Choose an empty Spell Zone to activate, then pick a target." : "Choose an empty Spell Zone to cast.";
          }
          b = `<button class="act-btn" data-act="cancel">CANCEL</button>`;
        } else {
          text = "Choose an empty Spell Zone to set this trap face-down.";
          b = `<button class="act-btn" data-act="cancel">CANCEL</button>`;
        }
      }
    } else if (state.sel && state.sel.kind === "zone") {
      const card = state[state.sel.side][state.sel.kind2][state.sel.index];
      if (card && state.sel.side === "player" && card.type === "monster" && state.sel.kind2 === "monster") {
        if (card.faceDown) {
          text = "Face-down monster. Flip Summon to reveal and trigger its effect.";
          dot = "warn";
          b = `<button class="act-btn warn" data-act="flip">FLIP SUMMON</button><button class="act-btn" data-act="cancel">CANCEL</button>`;
        } else if (card.position === "atk") {
          if (card.hasAttacked) {
            text = "This monster already attacked this turn.";
            dot = "warn";
            b = `<button class="act-btn" data-act="cancel">CANCEL</button>`;
          } else {
            const direct = monstersOf("opponent").length === 0;
            text = direct ? "No enemy monsters. Direct attack is open." : "Choose an enemy monster to attack.";
            dot = "";
            b = `${direct ? `<button class="act-btn warn" data-act="direct">DIRECT ATTACK</button>` : ""}
                 <button class="act-btn" data-act="switch" ${card.posChanged ? "disabled" : ""}>SWITCH DEF</button>
                 <button class="act-btn" data-act="cancel">CANCEL</button>`;
          }
        } else {
          text = "Defense Position. Switch to Attack if it has not attacked.";
          b = `<button class="act-btn" data-act="switch" ${card.posChanged || card.hasAttacked ? "disabled" : ""}>SWITCH ATK</button><button class="act-btn" data-act="cancel">CANCEL</button>`;
        }
      } else {
        text = "Inspecting card. Select a hand card to take action.";
        b = `<button class="act-btn" data-act="cancel">CLOSE</button>`;
      }
    } else {
      dot = state.active === "player" ? "" : "opp";
      text = state.active === "player" ? "Select a card from your hand." : `${NAMES.opponent} controls the turn.`;
      b = `<button class="act-btn" data-act="rules">RULES</button>`;
    }

    status.textContent = text;
    dom.statusDot.className = `status-dot ${dot}`;
    if (buttons.dataset.html !== b) {
      buttons.dataset.html = b;
      buttons.innerHTML = b;
    }
  }

  function parseZoneKey(key) {
    const [side, kind, index] = key.split(":");
    return { side, kind, index: Number(index) };
  }

  function selectedCard() {
    if (!state.player || !state.sel) return null;
    if (state.sel.kind === "hand") return state.player.hand.find((c) => c.uid === state.sel.uid) || null;
    if (state.sel.kind === "zone") {
      const side = state[state.sel.side];
      if (!side) return null;
      return side[state.sel.kind2] ? side[state.sel.kind2][state.sel.index] : null;
    }
    return null;
  }

  function pendingCard() {
    if (!state.pending) return null;
    return state.player.spell[state.pending.zoneIndex] || null;
  }

  function selectedOwnAttacker() {
    const card = selectedCard();
    if (!card || !state.sel || state.sel.kind !== "zone") return null;
    if (state.sel.side !== "player" || state.sel.kind2 !== "monster") return null;
    if (card.faceDown || card.position !== "atk" || card.hasAttacked) return null;
    if (state.active !== "player" || state.busy || state.winner) return null;
    return card;
  }

  /* ============================================================
     INTERACTION
     ============================================================ */
  function selectHandCard(uid) {
    if (state.busy || state.winner || state.active !== "player") return;
    if (state.sel && state.sel.kind === "hand" && state.sel.uid === uid) {
      state.sel = null;
    } else {
      state.sel = { kind: "hand", uid };
      const card = state.player.hand.find((c) => c.uid === uid);
      if (card && card.type === "monster") state.mode = "summon";
    }
    Sound.click();
    render();
  }

  function selectZoneCard(side, kind, index) {
    if (kind === "monster" && side === "player" && state.player.summonUsed) {
      // still inspectable, just no summon actions
    }
    if (state.sel && state.sel.kind === "zone" && state.sel.side === side && state.sel.kind2 === kind && state.sel.index === index) {
      state.sel = null;
    } else {
      state.sel = { kind: "zone", side, kind2: kind, index };
    }
    Sound.click();
    render();
  }

  function handleHandClick(uid) {
    if (state.busy || state.winner) return;
    if (state.active !== "player") {
      say("player", "Not my turn yet.", 1400);
      return;
    }
    if (state.pending) return;
    selectHandCard(uid);
  }

  function handleZoneClick(side, kind, index) {
    if (state.busy || state.winner) return;
    const card = state[side][kind][index];
    const key = zoneKey(side, kind, index);

    if (state.pending) {
      if (card && computeTargetZones().has(key)) {
        resolvePendingSpell(card);
      } else {
        Sound.click();
      }
      return;
    }

    if (state.active !== "player") return;

    if (state.sel && state.sel.kind === "hand") {
      if (computeValidPlacements().has(key)) {
        const handCard = state.player.hand.find((c) => c.uid === state.sel.uid);
        if (handCard) playHandCard(handCard, index);
        return;
      }
      if (card) selectZoneCard(side, kind, index);
      return;
    }

    if (state.sel && state.sel.kind === "zone") {
      const attacker = selectedOwnAttacker();
      if (attacker && side === "opponent" && kind === "monster" && card) {
        playerAttack(attacker, card);
        return;
      }
      if (side === "player" && kind === "monster") {
        selectZoneCard(side, kind, index);
        return;
      }
      if (card) selectZoneCard(side, kind, index);
      else {
        state.sel = null;
        render();
      }
      return;
    }

    if (card) selectZoneCard(side, kind, index);
  }

  function handleAction(act) {
    if (!act) return;
    if (act === "rules") { openRules(); return; }
    if (act === "cancel") {
      if (state.pending) cancelPendingSpell();
      else { state.sel = null; render(); }
      Sound.click();
      return;
    }
    if (act === "mode-summon") {
      state.mode = "summon";
      render();
      return;
    }
    if (act === "mode-set") {
      state.mode = "set";
      render();
      return;
    }
    if (act === "flip") {
      const card = selectedCard();
      if (card && state.sel && state.sel.kind === "zone" && state.sel.side === "player") playerFlip(card);
      return;
    }
    if (act === "switch") {
      const card = selectedCard();
      if (card && state.sel && state.sel.kind === "zone" && state.sel.side === "player") playerSwitch(card);
      return;
    }
    if (act === "direct") {
      const attacker = selectedOwnAttacker();
      if (attacker && monstersOf("opponent").length === 0) playerAttack(attacker, null, true);
    }
  }

  /* ============================================================
     PLACEMENT
     ============================================================ */
  async function playHandCard(card, zoneIndex) {
    if (state.busy || state.winner) return;
    const sourceEl = dom.hand.querySelector(`[data-uid="${card.uid}"]`);
    const sourceRect = sourceEl ? sourceEl.getBoundingClientRect() : null;
    state.busy = true;
    state.sel = null;

    if (card.type === "monster") {
      await summonMonster("player", card, zoneIndex, state.mode, sourceRect);
      state.busy = false;
      state.sel = null;
      render();
      return;
    }

    if (card.type === "trap") {
      await setTrap("player", card, zoneIndex, sourceRect);
      state.busy = false;
      render();
      return;
    }

    if (card.type === "spell") {
      if (card.target) {
        placePendingSpell("player", card, zoneIndex, sourceRect);
        state.busy = false;
        render();
      } else {
        await castSpellImmediate("player", card, zoneIndex, sourceRect);
        state.busy = false;
        render();
      }
    }
  }

  async function summonMonster(sideKey, card, zoneIndex, mode, sourceRect = null) {
    const side = state[sideKey];
    const handIndex = side.hand.indexOf(card);
    if (handIndex < 0) return false;
    if (side.monster[zoneIndex]) return false;
    if (side.summonUsed) return false;

    side.hand.splice(handIndex, 1);
    side.monster[zoneIndex] = card;
    side.summonUsed = true;
    card.owner = sideKey;
    card.faceDown = mode === "set";
    card.position = mode === "set" ? "def" : "atk";
    card.hasAttacked = false;
    card.summonedTurn = state.turn;
    card.justPlayed = true;

    if (sideKey === "player") {
      addLog(
        mode === "set"
          ? `You set a monster face-down in <b>${zoneCoord(sideKey, "monster", zoneIndex)}</b>.`
          : `You summon <b>${esc(card.name)}</b> in Attack Position.`,
        "you"
      );
    } else {
      addLog(
        mode === "set"
          ? `${esc(NAMES.opponent)} sets a monster face-down.`
          : `${esc(NAMES.opponent)} summons <b>${esc(card.name)}</b> in Attack Position.`,
        "opp"
      );
      if (mode === "summon") say("opponent", pick(["Rise.", "Burn the field.", "Let's open the matrix."]), 1800);
    }

    if (mode === "set") Sound.set();
    else Sound.summon();

    render();
    if (sourceRect) animateFly(sourceRect, zoneElOf(card), card);

    if (mode === "set") {
      await wait(380);
      heal(sideKey, 200, { setBonus: true });
      render();
      await wait(220);
    } else {
      await wait(330);
      await triggerSummonEffect(card, sideKey);
      render();
    }
    return true;
  }

  async function setTrap(sideKey, card, zoneIndex, sourceRect = null) {
    const side = state[sideKey];
    const handIndex = side.hand.indexOf(card);
    if (handIndex < 0) return false;
    if (side.spell[zoneIndex]) return false;

    side.hand.splice(handIndex, 1);
    side.spell[zoneIndex] = card;
    card.owner = sideKey;
    card.faceDown = true;
    card.position = "set";
    card.justPlayed = true;
    card.resolving = false;

    if (sideKey === "player") addLog(`You set <b>${esc(card.name)}</b> in <b>${zoneCoord(sideKey, "spell", zoneIndex)}</b>.`, "you");
    else addLog(`${esc(NAMES.opponent)} sets a card face-down.`, "opp");
    Sound.set();
    render();
    if (sourceRect) animateFly(sourceRect, zoneElOf(card), card);
    await wait(360);
    return true;
  }

  function placePendingSpell(sideKey, card, zoneIndex, sourceRect = null) {
    if (sideKey === "player") {
      const handIndex = state.player.hand.indexOf(card);
      if (handIndex < 0) return;
      state.player.hand.splice(handIndex, 1);
    }
    state[sideKey].spell[zoneIndex] = card;
    card.owner = sideKey;
    card.faceDown = false;
    card.position = "spell";
    card.resolving = true;
    card.justPlayed = true;
    const targetText = card.target === "ownMonster" ? "one of your face-up monsters" : "an enemy monster";
    addLog(`You activate <b>${esc(card.name)}</b> — choose ${targetText}.`, "you");
    Sound.flip();
    render();
    if (sourceRect) animateFly(sourceRect, zoneElOf(card), card);
    state.pending = { cardUid: card.uid, zoneIndex, target: card.target };
  }

  async function castSpellImmediate(sideKey, card, zoneIndex, sourceRect = null) {
    const side = state[sideKey];
    const hi = side.hand.indexOf(card);
    if (hi >= 0) side.hand.splice(hi, 1);
    side.spell[zoneIndex] = card;
    card.owner = sideKey;
    card.faceDown = false;
    card.position = "spell";
    card.resolving = true;
    card.justPlayed = true;
    if (sideKey === "player") addLog(`You cast <b>${esc(card.name)}</b>!`, "you");
    else addLog(`${esc(NAMES.opponent)} casts <b>${esc(card.name)}</b>!`, "opp");
    Sound.flip();
    render();
    if (sourceRect) animateFly(sourceRect, zoneElOf(card), card);
    await wait(400);
    applySpellEffect(card, sideKey, null);
    render();
    await wait(420);
    sendSpellToGrave(card);
    render();
    await wait(180);
  }

  async function resolvePendingSpell(targetCard) {
    if (!state.pending || !pendingTargetValid(targetCard)) return;
    const card = pendingCard();
    if (!card) { state.pending = null; return; }
    state.pending = null;
    state.busy = true;
    state.sel = null;
    addLog(`<b>${esc(card.name)}</b> locks onto <b>${esc(targetCard.name)}</b>.`, "you");
    Sound.flip();
    applySpellEffect(card, "player", targetCard);
    render();
    await wait(470);
    sendSpellToGrave(card);
    render();
    await wait(220);
    if (!state.winner) state.busy = false;
    render();
  }

  function cancelPendingSpell() {
    if (!state.pending) return;
    const card = pendingCard();
    if (card) {
      const z = zoneOf(card);
      if (z && z.side === "player" && z.kind === "spell") {
        state.player.spell[z.index] = null;
        state.player.hand.push(card);
        card.resolving = false;
        card.position = "atk";
        addLog(`Activation cancelled. <b>${esc(card.name)}</b> returns to your hand.`, "you");
      }
    }
    state.pending = null;
    state.sel = null;
    render();
  }

  function spellHasTarget(card) {
    if (!card || !card.target) return true;
    if (card.target === "ownMonster") return state.player.monster.some((c) => c && !c.faceDown);
    if (card.target === "enemyMonster") return state.opponent.monster.some(Boolean);
    return true;
  }

  function pendingTargetValid(card) {
    if (!state.pending || !card) return false;
    if (state.pending.target === "ownMonster") return card.owner === "player" && card.type === "monster" && !card.faceDown;
    if (state.pending.target === "enemyMonster") return card.owner === "opponent" && card.type === "monster";
    return false;
  }

  function sendSpellToGrave(card) {
    const z = zoneOf(card);
    if (z) state[z.side][z.kind][z.index] = null;
    card.resolving = false;
    card.faceDown = false;
    card.position = "atk";
    const owner = card.owner || "player";
    state[owner].grave.push(card);
  }

  function applySpellEffect(card, sideKey, target) {
    const foe = other(sideKey);
    switch (card.effect) {
      case "nova": {
        addLog(`NOVA LANCE pierces the field — <b>1200 damage</b>.`, sideKey === "player" ? "you" : "opp", true);
        floatAt($(`#hud-${foe}`), "-1200", "damage");
        FX.burstAt($(`#hud-${foe}`), "#ffd166", 30, 6);
        Sound.hit();
        applyDamage(foe, 1200, { source: card });
        break;
      }
      case "patch": {
        addLog(`PATCH KIT restores <b>1000 LP</b>.`, sideKey === "player" ? "you" : "opp");
        heal(sideKey, 1000);
        break;
      }
      case "overclock": {
        if (!target) break;
        target.atkBuff = (target.atkBuff || 0) + 800;
        addLog(`OVERCLOCK surges through <b>${esc(target.name)}</b> — <b>+800 ATK</b> this turn.`, sideKey === "player" ? "you" : "opp", true);
        floatAt(zoneElOf(target), "+800 ATK", "gold");
        FX.burstAt(zoneElOf(target), "#facc15", 24, 5);
        Sound.flip();
        break;
      }
      case "shatter": {
        if (!target) break;
        addLog(`SHATTER CODE deletes <b>${esc(target.name)}</b>.`, sideKey === "player" ? "you" : "opp", true);
        Sound.destroy();
        destroyMonster(target, "spell");
        break;
      }
      case "draw2": {
        addLog(`DATA DRAW — two cards pulled from the deck.`, sideKey === "player" ? "you" : "opp");
        drawCard(sideKey);
        drawCard(sideKey);
        Sound.draw();
        break;
      }
      case "emp": {
        const list = state[foe].monster.filter(Boolean);
        list.forEach((m) => { m.atkBuff = (m.atkBuff || 0) - 500; });
        addLog(`EMP FIELD collapses the rival's attack grid — <b>all monsters -500 ATK</b>.`, sideKey === "player" ? "you" : "opp", true);
        list.forEach((m) => { const el = zoneElOf(m); if (el) FX.burstAt(el, "#a78bfa", 12, 4); });
        Sound.trap();
        break;
      }
      default:
        break;
    }
  }

  /* ============================================================
     SUMMON / FLIP EFFECTS
     ============================================================ */
  async function triggerSummonEffect(card, sideKey) {
    const foe = other(sideKey);
    switch (card.effect) {
      case "burn300": {
        addLog(`<b>${esc(card.name)}</b> ignites on summon — <b>300 damage</b>.`, sideKey === "player" ? "you" : "opp");
        floatAt($(`#hud-${foe}`), "-300", "damage");
        FX.burstAt($(`#hud-${foe}`), "#ff7a45", 22, 5);
        Sound.hit();
        applyDamage(foe, 300, { source: card });
        await wait(440);
        break;
      }
      case "burn400ifMonster": {
        if (monstersOf(foe).length > 0) {
          addLog(`<b>${esc(card.name)}</b> finds a target — <b>400 damage</b>.`, sideKey === "player" ? "you" : "opp");
          floatAt($(`#hud-${foe}`), "-400", "damage");
          FX.burstAt($(`#hud-${foe}`), "#ff5e3a", 22, 5);
          Sound.hit();
          applyDamage(foe, 400, { source: card });
          await wait(420);
        } else {
          addLog(`<b>${esc(card.name)}</b> snarls, but there is no monster to burn.`, sideKey === "player" ? "you" : "opp");
          await wait(220);
        }
        break;
      }
      case "heal600": {
        addLog(`<b>${esc(card.name)}</b> patches the grid — <b>+600 LP</b>.`, sideKey === "player" ? "you" : "opp");
        heal(sideKey, 600);
        await wait(380);
        break;
      }
      case "selfBurn500": {
        addLog(`<b>${esc(card.name)}</b> overdraws the core — <b>500 damage to its controller</b>.`, sideKey === "player" ? "you" : "opp");
        floatAt($(`#hud-${sideKey}`), "-500", "damage");
        FX.burstAt($(`#hud-${sideKey}`), "#ffb703", 20, 5);
        Sound.hit();
        applyDamage(sideKey, 500, { source: card });
        await wait(420);
        break;
      }
      default:
        await wait(200);
    }
  }

  async function doFlipSummon(card) {
    if (!card || !card.faceDown) return;
    card.faceDown = false;
    card.position = "atk";
    card.posChanged = true;
    addLog(`<b>${esc(card.name)}</b> flips face-up!`, card.owner === "player" ? "you" : "opp", true);
    Sound.flip();
    FX.burstAt(zoneElOf(card), card.glow, 20, 4);
    render();
    await wait(240);

    if (card.effect === "flipDraw") {
      addLog(`FLIP: <b>${esc(card.name)}</b> draws 1 card.`, card.owner === "player" ? "you" : "opp");
      drawCard(card.owner);
      Sound.draw();
      render();
      await wait(360);
    } else if (card.effect === "flipBuff500") {
      card.permAtk += 500;
      addLog(`FLIP: <b>${esc(card.name)}</b> gains <b>500 ATK permanently</b>.`, card.owner === "player" ? "you" : "opp");
      floatAt(zoneElOf(card), "+500 ATK", "gold");
      FX.burstAt(zoneElOf(card), "#d18aff", 20, 4);
      render();
      await wait(360);
    }
  }

  async function playerFlip(card) {
    if (state.busy || state.winner || state.active !== "player") return;
    if (!card || !card.faceDown || card.owner !== "player") return;
    state.busy = true;
    state.sel = null;
    render();
    await doFlipSummon(card);
    state.busy = false;
    render();
  }

  async function playerSwitch(card) {
    if (state.busy || state.winner || state.active !== "player") return;
    if (!card || card.faceDown || card.owner !== "player" || card.hasAttacked || card.posChanged) return;
    card.position = card.position === "atk" ? "def" : "atk";
    card.posChanged = true;
    addLog(`<b>${esc(card.name)}</b> shifts to ${card.position.toUpperCase()} position.`, "you");
    Sound.flip();
    render();
  }

  async function playerAttack(attacker, target, direct = false) {
    if (state.busy || state.winner) return;
    state.busy = true;
    state.sel = null;
    render();
    await performAttack(attacker, target, direct);
    if (!state.winner) state.busy = false;
    render();
  }

  /* ============================================================
     ANIMATION HELPERS
     ============================================================ */
  function animateFly(fromRect, toEl, card) {
    if (!fromRect || !toEl || reduceMotion) return;
    const toRect = toEl.getBoundingClientRect();
    if (!toRect.width) return;
    const clone = createCardEl(card, "zone");
    clone.classList.add("fly-card");
    clone.style.left = `${fromRect.left}px`;
    clone.style.top = `${fromRect.top}px`;
    clone.style.width = `${fromRect.width}px`;
    clone.style.height = `${fromRect.height}px`;
    clone.style.margin = "0";
    document.body.appendChild(clone);
    const destCard = toEl.querySelector(".card");
    if (destCard) destCard.style.opacity = "0";
    const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
    const sx = toRect.width / fromRect.width;
    const sy = toRect.height / fromRect.height;
    const anim = clone.animate(
      [
        { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 24}px) scale(${1 + (sx - 1) * 0.55}) rotate(${card.faceDown ? -8 : 3}deg)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotate(0deg)`, opacity: 0.9 }
      ],
      { duration: 440, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
    );
    anim.finished.catch(() => {}).finally(() => {
      clone.remove();
      if (destCard) destCard.style.opacity = "";
    });
    if (destCard) setTimeout(() => { destCard.style.opacity = ""; }, 430);
  }

  async function animateAttack(card, fromEl, toEl) {
    if (!fromEl || !toEl || reduceMotion) {
      await wait(180);
      return;
    }
    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    if (!from.width || !to.width) {
      await wait(180);
      return;
    }
    const clone = createCardEl(card, "zone");
    clone.classList.add("fly-card", "attack-card");
    clone.style.left = `${from.left}px`;
    clone.style.top = `${from.top}px`;
    clone.style.width = `${from.width}px`;
    clone.style.height = `${from.height}px`;
    clone.style.margin = "0";
    document.body.appendChild(clone);

    const original = fromEl.querySelector(".card");
    if (original) original.style.opacity = "0";

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const direction = dx >= 0 ? 1 : -1;
    const arc = card.owner === "player" ? -26 : 26;

    const outbound = clone.animate(
      [
        { transform: "translate(0, 0) scale(1) rotate(0deg)", offset: 0 },
        { transform: `translate(${dx * 0.48}px, ${dy * 0.48 + arc}px) scale(1.16) rotate(${direction * 5}deg)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(1.22) rotate(${direction * 11}deg)`, offset: 1 }
      ],
      { duration: 360, easing: "cubic-bezier(0.18, 0.82, 0.22, 1)", fill: "forwards" }
    );
    const impact = outbound.finished.catch(() => {});

    impact.then(() => {
      const cx = to.left + to.width / 2;
      const cy = to.top + to.height / 2;
      FX.burst(cx, cy, card.glow || "#55f4ff", 20, 5);
      setTimeout(() => {
        const back = clone.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(1.22) rotate(${direction * 11}deg)`, opacity: 1 },
            { transform: `translate(${dx * 0.46}px, ${dy * 0.46 + arc * 0.4}px) scale(1.1) rotate(${-direction * 4}deg)`, opacity: 1, offset: 0.55 },
            { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 }
          ],
          { duration: 330, easing: "cubic-bezier(0.3, 0.9, 0.3, 1)", fill: "forwards" }
        );
        back.finished.catch(() => {}).finally(() => {
          clone.remove();
          const live = zoneElOf(card);
          const liveCard = live && live.querySelector(".card");
          if (liveCard) liveCard.style.opacity = "";
          if (original && original.isConnected) original.style.opacity = "";
        });
      }, 210);
    });

    await impact;
  }


  function floatAt(el, text, kind = "") {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const div = document.createElement("div");
    div.className = `float-text ${kind}`;
    div.textContent = text;
    div.style.left = `${r.left + r.width / 2}px`;
    div.style.top = `${r.top + r.height * 0.4}px`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1200);
  }

  function slashBetween(fromEl, toEl, pink = false) {
    if (!fromEl || !toEl || reduceMotion) return;
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width / 2;
    const y1 = a.top + a.height / 2;
    const x2 = b.left + b.width / 2;
    const y2 = b.top + b.height / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const el = document.createElement("div");
    el.className = `slash${pink ? " pink" : ""}`;
    el.style.left = `${x1}px`;
    el.style.top = `${y1}px`;
    el.style.width = `${len}px`;
    el.style.transform = `rotate(${angle}rad)`;
    document.body.appendChild(el);
    el.animate(
      [
        { opacity: 0, transform: `rotate(${angle}rad) scaleX(0.15)` },
        { opacity: 1, offset: 0.18 },
        { opacity: 0, transform: `rotate(${angle}rad) scaleX(1)` }
      ],
      { duration: 430, easing: "ease-out", fill: "forwards" }
    ).finished.catch(() => {}).finally(() => el.remove());
  }

  function shakeApp() {
    if (reduceMotion) return;
    dom.app.classList.remove("shake");
    void dom.app.offsetWidth;
    dom.app.classList.add("shake");
    setTimeout(() => dom.app.classList.remove("shake"), 340);
  }

  /* ============================================================
     DAMAGE / DESTRUCTION
     ============================================================ */
  function applyDamage(sideKey, amount, opts = {}) {
    if (!state[sideKey] || amount <= 0) return 0;
    const side = state[sideKey];
    let dmg = Math.round(amount);
    if (opts.battle) {
      const cut = side.monster.some((c) => c && !c.faceDown && c.effect === "damageCut300") ? 300 : 0;
      if (cut) {
        dmg = Math.max(0, dmg - cut);
        addLog(`AEGIS field reduces the hit by <b>300</b>.`, sideKey === "player" ? "you" : "opp");
      }
    }
    const before = side.lp;
    side.lp = Math.max(0, side.lp - dmg);
    const actual = before - side.lp;
    if (sideKey === "player") state.stats.damageTaken += actual;
    else state.stats.damageDealt += actual;

    if (!opts.silent && actual > 0) {
      addLog(`${esc(NAMES[sideKey])} takes <b>${actual} damage</b>. (LP ${side.lp})`, sideKey === "player" ? "warn" : "you");
    }
    const hud = $(`#hud-${sideKey}`);
    if (actual > 0) {
      floatAt(hud, `-${actual}`, "damage");
      FX.burstAt(hud, sideKey === "player" ? "#ff5d73" : "#ff3ea5", 28, 6);
      Sound.hit();
      shakeApp();
    }
    render();
    if (side.lp <= 0) endGame(other(sideKey), "lp");
    return actual;
  }

  function heal(sideKey, amount, opts = {}) {
    if (!state[sideKey] || amount <= 0) return 0;
    const side = state[sideKey];
    const before = side.lp;
    side.lp = Math.min(side.maxLp, side.lp + Math.round(amount));
    const actual = side.lp - before;
    if (actual > 0) {
      floatAt($(`#hud-${sideKey}`), `+${actual}`, "heal");
      FX.burstAt($(`#hud-${sideKey}`), "#7cf7c4", 22, 4);
      Sound.heal();
      if (opts.setBonus) addLog(`SET BONUS: <b>+${actual} LP</b>.`, sideKey === "player" ? "you" : "opp");
    }
    render();
    return actual;
  }

  function flashZone(card) {
    const el = zoneElOf(card);
    if (!el) return;
    el.classList.remove("battle-flash");
    void el.offsetWidth;
    el.classList.add("battle-flash");
    setTimeout(() => el.classList.remove("battle-flash"), 460);
  }

  function destroyMonster(card, reason = "battle", opts = {}) {
    if (!card || !card.owner) return false;
    const z = zoneOf(card);
    if (!z || z.kind !== "monster") return false;
    const el = zoneEls.get(zoneKey(z.side, z.kind, z.index));
    if (el) {
      flashZone(card);
      FX.burstAt(el, card.glow, reason === "battle" ? 26 : 38, 6);
    }
    flashZone(card);
    state[z.side].monster[z.index] = null;
    card.faceDown = false;
    card.hasAttacked = false;
    state[z.side].grave.push(card);
    if (!opts.silent) addLog(`<b>${esc(card.name)}</b> is destroyed.`, z.side === "player" ? "warn" : "you");
    Sound.destroy();

    if (card.effect === "onDestroyDraw") {
      addLog(`<b>${esc(card.name)}</b> leaves a data trail — draw 1.`, z.side === "player" ? "you" : "opp");
      drawCard(z.side);
    }
    render();
    return true;
  }

  function battleDestroy(card) {
    if (!card) return false;
    if (card.effect === "battleShield" && !card.shieldUsed) {
      card.shieldUsed = true;
      addLog(`<b>${esc(card.name)}</b> holds the line — destruction negated.`, card.owner === "player" ? "you" : "opp");
      FX.burstAt(zoneElOf(card), "#aab4cc", 20, 5);
      render();
      return false;
    }
    return destroyMonster(card, "battle");
  }

  function sendTrapToGrave(card) {
    const z = zoneOf(card);
    if (z) state[z.side][z.kind][z.index] = null;
    card.faceDown = false;
    card.resolving = false;
    if (card.owner) state[card.owner].grave.push(card);
    render();
  }

  /* ============================================================
     BATTLE
     ============================================================ */
  async function performAttack(attacker, target, direct = false) {
    if (!attacker || state.winner) return;
    if (!isOnField(attacker) || attacker.faceDown || attacker.position !== "atk") return;
    attacker.hasAttacked = true;
    const attackerSide = attacker.owner;
    const defSide = other(attackerSide);

    const atkEl = zoneElOf(attacker);
    const targetEl = direct ? $(`#hud-${defSide}`) : zoneElOf(target);
    addLog(
      direct
        ? `<b>${esc(attacker.name)}</b> attacks directly!`
        : `<b>${esc(attacker.name)}</b> attacks <b>${esc(target.name)}</b>!`,
      attackerSide === "player" ? "you" : "opp",
      true
    );
    if (attackerSide === "opponent") say("opponent", pick(["Break.", "Read this.", "No more hiding."]), 1600);
    Sound.attack();
    render();

    await animateAttack(attacker, atkEl, targetEl);
    slashBetween(atkEl, targetEl, attackerSide === "opponent");
    if (targetEl) {
      FX.burstAt(targetEl, attackerSide === "player" ? "#55f4ff" : "#ff3ea5", 28, 6);
      floatAt(targetEl, "STRIKE", "gold");
    }
    Sound.hit();
    shakeApp();
    await wait(220);

    let negated = false;
    if (!direct || target) {
      negated = await triggerAttackTraps(defSide, attacker, target);
    } else {
      negated = await triggerAttackTraps(defSide, attacker, null);
    }
    if (state.winner) { render(); return; }
    if (negated || !isOnField(attacker)) { render(); await wait(320); return; }

    let damageSide = null;
    let damageAmount = 0;

    if (direct) {
      if (monstersOf(defSide).length > 0) {
        addLog(`Direct attack blocked by a defender.`, "sys");
        render();
        await wait(300);
        return;
      }
      damageSide = defSide;
      damageAmount = effAtk(attacker);
      addLog(`<b>${esc(attacker.name)}</b> connects for <b>${damageAmount}</b>.`, attackerSide === "player" ? "you" : "opp");
    } else if (!target || !isOnField(target)) {
      render();
      return;
    } else if (target.faceDown || target.position === "def") {
      const def = effDef(target);
      const atk = effAtk(attacker);
      if (atk > def) {
        const destroyed = battleDestroy(target);
        addLog(
          destroyed
            ? `<b>${esc(target.name)}</b>'s defense breaks (${atk} > ${def}).`
            : `<b>${esc(target.name)}</b> survives with ${def} DEF.`,
          attackerSide === "player" ? "you" : "opp"
        );
        if (destroyed && attacker.effect === "pierce") {
          damageSide = defSide;
          damageAmount = atk - def;
          addLog(`PIERCING: <b>${damageAmount}</b> battle damage cuts through.`, attackerSide === "player" ? "you" : "opp");
        }
      } else if (atk < def) {
        addLog(`The attack is repelled by <b>${def} DEF</b>. No damage.`, "sys");
      } else {
        addLog(`ATK and DEF collide — neither side gives.`, "sys");
      }
    } else {
      const atk = effAtk(attacker);
      const tAtk = effAtk(target);
      if (atk > tAtk) {
        const destroyed = battleDestroy(target);
        addLog(`<b>${esc(attacker.name)}</b> overwhelms <b>${esc(target.name)}</b> (${atk} > ${tAtk}).`, attackerSide === "player" ? "you" : "opp");
        if (destroyed) {
          damageSide = defSide;
          damageAmount = atk - tAtk;
        }
      } else if (atk < tAtk) {
        const destroyed = battleDestroy(attacker);
        addLog(`<b>${esc(target.name)}</b> counters (${tAtk} > ${atk}).`, attackerSide === "player" ? "opp" : "you");
        if (destroyed) {
          damageSide = attackerSide;
          damageAmount = tAtk - atk;
        }
      } else {
        addLog(`Mutual destruction — both fighters hit <b>${atk}</b>.`, "sys");
        battleDestroy(target);
        battleDestroy(attacker);
      }
    }

    if (damageSide && damageAmount > 0 && !state.winner) {
      const actual = applyDamage(damageSide, damageAmount, { battle: true, source: attacker });
      if (actual > 0 && !state.winner && state[damageSide].lp > 0) {
        await triggerWardTraps(damageSide);
      }
    }
    render();
    await wait(480);
  }

  async function triggerAttackTraps(defSide, attacker, target) {
    const traps = setTrapsOf(defSide).slice();
    let negated = false;
    for (const trap of traps) {
      if (state.winner) break;
      if (!isOnField(trap)) continue;
      if (trap.effect === "ward") continue;
      if (trap.effect === "ambush" && !(target && target.owner === defSide && target.faceDown)) continue;

      trap.faceDown = false;
      addLog(`${esc(NAMES[defSide])} reveals <b>${esc(trap.name)}</b>!`, defSide === "player" ? "you" : "opp", true);
      Sound.trap();
      FX.burstAt(zoneElOf(trap), trap.glow, 24, 5);
      render();
      await wait(420);

      if (trap.effect === "mirror") {
        addLog(`MIRROR VEIL negates the attack and shatters <b>${esc(attacker.name)}</b>.`, defSide === "player" ? "you" : "opp");
        sendTrapToGrave(trap);
        negated = true;
        destroyMonster(attacker, "trap");
        render();
        await wait(420);
        break;
      } else if (trap.effect === "spike") {
        addLog(`SPIKE GRID bites back — <b>700 damage</b> to the attacker.`, defSide === "player" ? "you" : "opp");
        sendTrapToGrave(trap);
        applyDamage(attacker.owner, 700, { source: trap });
        render();
        await wait(380);
      } else if (trap.effect === "snare") {
        attacker.atkBuff = (attacker.atkBuff || 0) - 1000;
        addLog(`SIGNAL SNARE drags <b>${esc(attacker.name)}</b> down by <b>1000 ATK</b>.`, defSide === "player" ? "you" : "opp");
        floatAt(zoneElOf(attacker), "-1000 ATK", "damage");
        sendTrapToGrave(trap);
        render();
        await wait(380);
      } else if (trap.effect === "ambush") {
        target.faceDown = false;
        target.position = "atk";
        target.atkBuff = (target.atkBuff || 0) + 1000;
        target.defBuff = (target.defBuff || 0) + 1000;
        addLog(`AMBUSH PROTOCOL flips <b>${esc(target.name)}</b> — <b>+1000 ATK/DEF</b> for this battle.`, defSide === "player" ? "you" : "opp", true);
        floatAt(zoneElOf(target), "+1000 ATK", "gold");
        FX.burstAt(zoneElOf(target), "#34d399", 26, 5);
        sendTrapToGrave(trap);
        render();
        await wait(420);
      } else {
        sendTrapToGrave(trap);
      }
    }
    return negated;
  }

  async function triggerWardTraps(sideKey) {
    const traps = setTrapsOf(sideKey).filter((t) => t.effect === "ward");
    for (const trap of traps) {
      if (state.winner || !isOnField(trap)) continue;
      trap.faceDown = false;
      addLog(`${esc(NAMES[sideKey])} reveals <b>${esc(trap.name)}</b> — <b>+700 LP</b>.`, sideKey === "player" ? "you" : "opp");
      Sound.trap();
      FX.burstAt(zoneElOf(trap), "#86efac", 22, 4);
      render();
      await wait(380);
      sendTrapToGrave(trap);
      heal(sideKey, 700);
      await wait(300);
    }
  }

  /* ============================================================
     AI — H大好き分岐オレ // set-breaker
     ============================================================ */
  function aiThreat(card) {
    if (!card) return 0;
    if (card.faceDown) return effDef(card);
    return card.position === "atk" ? effAtk(card) : effDef(card);
  }

  async function aiTurn() {
    if (!state.player || state.winner || state.active !== "opponent") return;
    state.busy = true;
    state.sel = null;
    state.pending = null;
    render();
    say("opponent", pick([
      "My turn. Set your board—I'll break it.",
      "Let's see how deep your set goes.",
      "The matrix is mine now.",
      "そのセット、読めたぞ。"
    ]), 2300);
    await wait(520);
    if (state.winner) return;

    await aiFlipSetMonsters();
    if (state.winner) return;
    await aiSetTraps();
    if (state.winner) return;
    await aiSummon();
    if (state.winner) return;
    await aiCastSpells();
    if (state.winner) return;
    await aiBattle();
    if (state.winner) return;

    await wait(400);
    await concludeTurn("opponent");
  }

  async function aiFlipSetMonsters() {
    const setMonsters = monstersOf("opponent").filter((c) => c.faceDown);
    for (const card of setMonsters) {
      if (state.winner) return;
      const useful = card.effect === "flipDraw" || card.effect === "flipBuff500";
      const noBlockers = monstersOf("player").length === 0;
      if (useful && (noBlockers || Math.random() < 0.62)) {
        await doFlipSummon(card);
        await wait(300);
      }
    }
  }

  async function aiSetTraps() {
    const traps = state.opponent.hand.filter((c) => c.type === "trap");
    let placed = 0;
    for (const trap of traps) {
      if (state.winner || placed >= 2) return;
      const zone = firstEmptyIndex("opponent", "spell");
      if (zone < 0) return;
      const hi = state.opponent.hand.indexOf(trap);
      if (hi < 0) continue;
      state.opponent.hand.splice(hi, 1);
      state.opponent.spell[zone] = trap;
      trap.owner = "opponent";
      trap.faceDown = true;
      trap.position = "set";
      trap.justPlayed = true;
      addLog(`${esc(NAMES.opponent)} sets a card face-down.`, "opp");
      Sound.set();
      render();
      await wait(380);
      placed++;
    }
  }

  async function aiSummon() {
    if (state.opponent.summonUsed || state.winner) return;
    if (firstEmptyIndex("opponent", "monster") < 0) return;
    const candidates = state.opponent.hand.filter((c) => c.type === "monster");
    if (!candidates.length) return;

    const playerMons = monstersOf("player");
    const bestThreat = playerMons.reduce((m, c) => Math.max(m, aiThreat(c)), 0);
    const safeCandidates = candidates.filter((c) => !(c.effect === "selfBurn500" && state.opponent.lp <= 900));
    const pool = safeCandidates.length ? safeCandidates : candidates;

    let chosen = null;
    let mode = "summon";

    const beaters = pool.filter((c) => effAtk(c) > bestThreat);
    if (beaters.length && playerMons.length) {
      chosen = beaters.sort((a, b) => effAtk(b) - effAtk(a))[0];
      mode = "summon";
    } else if (!playerMons.length) {
      chosen = pool.sort((a, b) => effAtk(b) - effAtk(a))[0];
      mode = "summon";
    } else {
      const flip = pool.filter((c) => c.effect === "flipDraw" || c.effect === "flipBuff500");
      const defenders = pool.filter((c) => effDef(c) >= bestThreat);
      if (flip.length && bestThreat >= 1500) {
        chosen = flip.sort((a, b) => effDef(b) - effDef(a))[0];
        mode = "set";
      } else if (defenders.length) {
        chosen = defenders.sort((a, b) => effDef(b) - effDef(a))[0];
        mode = state.opponent.lp < 1900 || effAtk(chosen) < bestThreat ? "set" : "summon";
      } else {
        chosen = pool.sort((a, b) => effAtk(b) - effAtk(a))[0];
        mode = effAtk(chosen) >= bestThreat ? "summon" : "set";
      }
    }

    if (!chosen) return;
    if (chosen.effect === "selfBurn500" && state.opponent.lp <= 1400) mode = "set";
    if (mode === "set" && effAtk(chosen) >= bestThreat && state.opponent.lp > 2200) mode = "summon";

    const empty = [];
    state.opponent.monster.forEach((c, i) => { if (!c) empty.push(i); });
    const zone = empty.includes(2) ? 2 : empty.includes(3) ? 3 : empty[0];
    await summonMonster("opponent", chosen, zone, mode);
    await wait(320);
  }

  async function aiCastSpells() {
    const spells = state.opponent.hand.filter((c) => c.type === "spell").slice();
    let cast = 0;
    for (const card of spells) {
      if (state.winner || cast >= 2) return;
      let target = null;
      let use = false;

      if (card.effect === "nova") {
        use = state.player.lp <= 1200 || state.player.lp <= 2200 && Math.random() < 0.65;
      } else if (card.effect === "patch") {
        use = state.opponent.lp <= 2700;
      } else if (card.effect === "overclock") {
        const own = faceUpMonsters("opponent").filter((c) => c.position === "atk" && !c.hasAttacked);
        target = own.sort((a, b) => effAtk(b) - effAtk(a))[0] || null;
        use = !!target && monstersOf("player").length > 0;
      } else if (card.effect === "shatter") {
        const targets = monstersOf("player");
        target = targets.sort((a, b) => effAtk(b) - effAtk(a))[0] || null;
        use = !!target && (effAtk(target) >= 1500 || targets.length >= 2);
      } else if (card.effect === "emp") {
        const targets = monstersOf("player");
        use = targets.length >= 2 || targets.some((c) => effAtk(c) >= 1800);
      } else if (card.effect === "draw2") {
        use = state.opponent.hand.length <= 2;
      }

      if (use) {
        await aiCastSpell(card, target);
        cast++;
        await wait(260);
      }
    }
  }

  async function aiCastSpell(card, target) {
    const zone = firstEmptyIndex("opponent", "spell");
    if (zone < 0 || state.winner) return;
    const hi = state.opponent.hand.indexOf(card);
    if (hi < 0) return;
    state.opponent.hand.splice(hi, 1);
    state.opponent.spell[zone] = card;
    card.owner = "opponent";
    card.faceDown = false;
    card.position = "spell";
    card.resolving = true;
    card.justPlayed = true;
    addLog(`${esc(NAMES.opponent)} activates <b>${esc(card.name)}</b>!`, "opp", true);
    Sound.flip();
    render();
    await wait(450);
    applySpellEffect(card, "opponent", target);
    render();
    await wait(450);
    if (state.winner) return;
    sendSpellToGrave(card);
    render();
    await wait(220);
  }

  function aiChooseTarget(attacker, playerMons) {
    if (!playerMons.length) return { direct: true, target: null };
    const atk = effAtk(attacker);
    const scored = [];
    for (const card of playerMons) {
      const threat = aiThreat(card);
      const wins = atk > threat;
      if (!wins) continue;
      let score = threat;
      if (!card.faceDown && card.position === "atk") score += 240;
      if (card.faceDown) score += 80;
      scored.push({ card, score });
    }
    if (!scored.length) return { direct: false, target: null };
    scored.sort((a, b) => b.score - a.score);
    return { direct: false, target: scored[0].card };
  }

  async function aiBattle() {
    const attackers = faceUpMonsters("opponent")
      .filter((c) => c.position === "atk" && !c.hasAttacked)
      .sort((a, b) => effAtk(b) - effAtk(a));

    for (const attacker of attackers) {
      if (state.winner) return;
      if (!isOnField(attacker) || attacker.faceDown || attacker.hasAttacked) continue;
      const playerMons = monstersOf("player");
      const plan = aiChooseTarget(attacker, playerMons);
      if (plan.direct) {
        await performAttack(attacker, null, true);
      } else if (plan.target) {
        await performAttack(attacker, plan.target, false);
      } else {
        addLog(`${esc(attacker.name)} holds position — no clean attack.`, "opp");
      }
      await wait(260);
    }
  }

  /* ============================================================
     MODALS / UI WIRING
     ============================================================ */
  function openRules() {
    dom.rulesOverlay.hidden = false;
    Sound.click();
    setTimeout(() => $("#rules-close").focus({ preventScroll: true }), 50);
  }

  function closeRules() {
    dom.rulesOverlay.hidden = true;
    Sound.click();
  }

  function updateSoundButton() {
    const btn = $("#btn-sound");
    const ico = $("#sound-ico");
    const txt = $("#sound-txt");
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(!Sound.muted));
    if (ico) ico.textContent = Sound.muted ? "×" : "♪";
    if (txt) txt.textContent = Sound.muted ? "SOUND OFF" : "SOUND ON";
  }

  function wireEvents() {
    dom.hand.addEventListener("click", (e) => {
      const btn = e.target.closest(".hand-card");
      if (!btn) return;
      handleHandClick(Number(btn.dataset.uid));
    });

    dom.board.addEventListener("click", (e) => {
      const zone = e.target.closest(".zone");
      if (!zone) return;
      handleZoneClick(zone.dataset.side, zone.dataset.kind, Number(zone.dataset.index));
    });

    dom.actionButtons.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      handleAction(btn.dataset.act);
    });

    dom.endBtn.addEventListener("click", playerEndTurn);

    $("#hud-opponent").addEventListener("click", () => {
      const attacker = selectedOwnAttacker();
      if (!attacker) return;
      if (monstersOf("opponent").length > 0) return;
      playerAttack(attacker, null, true);
    });

    $("#btn-rules").addEventListener("click", openRules);
    $("#btn-rules-2")?.addEventListener("click", openRules);
    $("#rules-close").addEventListener("click", closeRules);
    $("#rules-play").addEventListener("click", closeRules);
    dom.rulesOverlay.addEventListener("click", (e) => { if (e.target === dom.rulesOverlay) closeRules(); });

    $("#btn-sound").addEventListener("click", () => {
      Sound.init();
      Sound.resume();
      Sound.setMuted(!Sound.muted);
      updateSoundButton();
      Sound.click();
    });

    $("#btn-log").addEventListener("click", () => {
      dom.logRail.classList.toggle("open");
      Sound.click();
    });

    $("#btn-rematch").addEventListener("click", () => {
      dom.gameover.hidden = true;
      newGame();
    });

    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "Escape") {
        if (!dom.rulesOverlay.hidden) { closeRules(); return; }
        if (!dom.gameover.hidden) return;
        if (state.pending) { cancelPendingSpell(); return; }
        if (state.sel) { state.sel = null; render(); }
      } else if (e.key === "e" || e.key === "E") {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        playerEndTurn();
      } else if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        if (dom.rulesOverlay.hidden) openRules();
        else closeRules();
      }
    });

    document.addEventListener("pointerdown", () => {
      Sound.init();
      Sound.resume();
    }, { once: false });

    window.addEventListener("resize", () => {
      /* keep layout fluid; particles resize themselves */
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function init() {
    cacheDom();
    buildBoard();
    try {
      Sound.muted = localStorage.getItem("lpto0_muted") === "1";
    } catch (_) {}
    updateSoundButton();
    wireEvents();
    FX.init();
    newGame();
    render();
    setTimeout(() => {
      if (!state.winner && state.active === "player") {
        addLog("Select a card, then choose a glowing zone. Press E to end your turn.", "sys");
      }
    }, 1900);
  }

  window.__LPTO0__ = {
    state,
    newGame,
    render,
    playerEndTurn,
    playerFlip,
    playerSwitch,
    playerAttack,
    summonMonster,
    setTrap,
    playHandCard,
    performAttack,
    applyDamage,
    heal,
    destroyMonster,
    doFlipSummon,
    aiTurn
  };

  init();
})();
