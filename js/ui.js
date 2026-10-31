/*
 * ZERO POINT — UI controller
 */
(function () {
  'use strict';
  const ZP = window.ZP;
  const E = ZP.engine;
  const PUZZLES = ZP.PUZZLES;
  const $ = id => document.getElementById(id);
  const CL = {
    body: document.body,
    board: $('board'),
    hand: $('hand'),
    tray: $('tray'),
    trayHint: $('trayHint'),
    trayButtons: $('trayButtons'),
    log: $('log'),
    side: $('side'),
    scrim: $('drawerScrim'),
    modal: $('modalRoot'),
    fx: $('fx'),
    toast: $('toastStack')
  };
  const STORE_KEY = 'zeropoint.store.v1';
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const app = {
    stageIndex: 0,
    puzzle: null,
    state: null,
    legal: [],
    selected: null,
    mode: null,
    busy: false,
    finished: false,
    autoplay: false,
    runId: 0,
    seen: new Set(),
    nextSeen: new Set(),
    modalOpen: false,
    modalDismissible: true,
    gameStarted: false,
    timer: { running: false, startedAt: 0, elapsed: 0, interval: 0 },
    store: { records: {}, lastStage: 0, sound: true },
    soundReady: false,
    fxParticles: [],
    fxRunning: false
  };

  /* ============================================================
     Utilities
     ============================================================ */
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const pad2 = n => String(n).padStart(2, '0');
  const sleep = ms => new Promise(resolve => setTimeout(resolve, REDUCED ? 0 : ms));
  const fmt = n => Number(n || 0).toLocaleString('ja-JP');
  const formatTime = seconds => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
  };
  const kindLabel = card => card.kind === 'monster' ? 'M' : (card.kind === 'spell' ? 'SP' : 'TR');
  const kindName = card => card.kind === 'monster' ? 'モンスター' : (card.kind === 'spell' ? '魔法' : '罠');

  function toast(text, tone) {
    // Avoid stacking identical messages when the player advances quickly.
    Array.from(CL.toast.children).forEach(el => {
      if (el.textContent === text) el.remove();
    });
    const el = document.createElement('div');
    el.className = 'toast' + (tone ? ' toast--' + tone : '');
    el.textContent = text;
    CL.toast.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /* ============================================================
     Persistence
     ============================================================ */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          app.store.records = parsed.records && typeof parsed.records === 'object' ? parsed.records : {};
          app.store.lastStage = Number.isFinite(parsed.lastStage) ? parsed.lastStage : 0;
          app.store.sound = parsed.sound !== false;
        }
      }
    } catch (err) { /* private mode */ }
  }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(app.store)); } catch (err) { /* ignore */ }
  }
  function recordFor(puzzle) {
    return app.store.records[puzzle.id] || null;
  }

  /* ============================================================
     Sound
     ============================================================ */
  let audioCtx = null;
  function ensureAudio() {
    if (!app.store.sound) return null;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (err) { return null; }
  }
  function tone(freq, dur, type, vol, slideTo, delay) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.055, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    gain.gain.value = vol || 0.04;
    src.buffer = buffer;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }
  function sfx(name) {
    if (!app.store.sound) return;
    switch (name) {
      case 'select': tone(620, 0.05, 'sine', 0.035, 760); break;
      case 'cancel': tone(360, 0.05, 'sine', 0.028, 250); break;
      case 'summon': tone(220, 0.18, 'triangle', 0.06, 360); tone(440, 0.16, 'sine', 0.03, 520, 0.05); break;
      case 'set': tone(170, 0.12, 'triangle', 0.05, 130); noise(0.09, 0.025); break;
      case 'spell': tone(520, 0.22, 'sine', 0.045, 980); tone(780, 0.2, 'triangle', 0.025, 1200, 0.04); break;
      case 'attack': tone(170, 0.2, 'sawtooth', 0.06, 65); noise(0.15, 0.035); break;
      case 'damage': tone(90, 0.16, 'square', 0.05, 55); noise(0.12, 0.03); break;
      case 'heal': tone(440, 0.2, 'sine', 0.04, 880); break;
      case 'trap': tone(300, 0.16, 'square', 0.04, 900); break;
      case 'flip': noise(0.13, 0.04); tone(300, 0.12, 'triangle', 0.035, 520); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.055, f, i * 0.11)); break;
      case 'lose': [330, 262, 196, 131].forEach((f, i) => tone(f, 0.32, 'sawtooth', 0.04, f * 0.9, i * 0.12)); break;
      case 'turn': tone(330, 0.1, 'sine', 0.035, 440); break;
      default: break;
    }
  }

  /* ============================================================
     Timer
     ============================================================ */
  function updateTimerDisplay() {
    const elapsed = currentElapsed();
    const text = formatTime(elapsed);
    $('timer').textContent = text;
    const clock = $('clock');
    if (clock) clock.textContent = text;
  }
  function currentElapsed() {
    if (app.timer.running) return app.timer.elapsed + (performance.now() - app.timer.startedAt) / 1000;
    return app.timer.elapsed;
  }
  function startTimer() {
    if (app.timer.running || !app.gameStarted) return;
    app.timer.running = true;
    app.timer.startedAt = performance.now();
    if (!app.timer.interval) {
      app.timer.interval = window.setInterval(updateTimerDisplay, 250);
    }
  }
  function pauseTimer() {
    if (!app.timer.running) return;
    app.timer.elapsed += (performance.now() - app.timer.startedAt) / 1000;
    app.timer.running = false;
    updateTimerDisplay();
  }
  function stopTimer() {
    pauseTimer();
    if (app.timer.interval) { clearInterval(app.timer.interval); app.timer.interval = 0; }
  }
  function resetTimer() {
    stopTimer();
    app.timer.elapsed = 0;
    app.timer.running = false;
    $('timer').textContent = '00:00';
    const clock = $('clock');
    if (clock) clock.textContent = '00:00';
  }

  /* ============================================================
     Particles / FX
     ============================================================ */
  const fx = {
    canvas: CL.fx,
    ctx: CL.fx.getContext('2d'),
    w: 0,
    h: 0,
    dpr: 1
  };
  function resizeFx() {
    fx.dpr = Math.min(2, window.devicePixelRatio || 1);
    fx.w = window.innerWidth;
    fx.h = window.innerHeight;
    fx.canvas.width = Math.floor(fx.w * fx.dpr);
    fx.canvas.height = Math.floor(fx.h * fx.dpr);
    fx.ctx.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0);
  }
  window.addEventListener('resize', resizeFx, { passive: true });
  resizeFx();

  function burst(x, y, color, count, power) {
    if (REDUCED) return;
    const n = count || 14;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (power || 3.4) * (0.35 + Math.random());
      app.fxParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.1,
        life: 1,
        decay: 0.018 + Math.random() * 0.025,
        size: 1.4 + Math.random() * 2.8,
        color: color || '#f5d24a'
      });
    }
    if (!app.fxRunning) { app.fxRunning = true; requestAnimationFrame(tickFx); }
  }
  function confetti() {
    if (REDUCED) return;
    const colors = ['#f5d24a', '#43f0d0', '#8d6bff', '#ff5577', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      app.fxParticles.push({
        x: fx.w * (0.2 + Math.random() * 0.6),
        y: fx.h * (0.15 + Math.random() * 0.25),
        vx: (Math.random() - 0.5) * 6,
        vy: -2 - Math.random() * 5,
        life: 1,
        decay: 0.006 + Math.random() * 0.008,
        size: 2 + Math.random() * 4,
        color: colors[i % colors.length],
        gravity: 0.07
      });
    }
    if (!app.fxRunning) { app.fxRunning = true; requestAnimationFrame(tickFx); }
  }
  function tickFx() {
    const ctx = fx.ctx;
    ctx.clearRect(0, 0, fx.w, fx.h);
    const list = app.fxParticles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= p.decay;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.08;
      p.vx *= 0.995;
      if (p.life <= 0) { list.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (list.length) requestAnimationFrame(tickFx);
    else app.fxRunning = false;
  }

  function floatText(x, y, text, kind) {
    const el = document.createElement('div');
    el.className = 'float-text' + (kind ? ' float-text--' + kind : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function centerOf(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function shake() {
    if (REDUCED) return;
    const arena = $('arena');
    arena.classList.remove('shake');
    void arena.offsetWidth;
    arena.classList.add('shake');
    setTimeout(() => arena.classList.remove('shake'), 450);
  }

  /* ============================================================
     State / stage
     ============================================================ */
  function loadStage(index, opts) {
    opts = opts || {};
    app.runId += 1;
    app.stageIndex = Math.max(0, Math.min(PUZZLES.length - 1, index));
    app.puzzle = PUZZLES[app.stageIndex];
    app.state = E.createState(app.puzzle);
    app.legal = E.legalActions(app.state);
    app.selected = null;
    app.mode = null;
    app.busy = false;
    app.finished = false;
    app.autoplay = !!opts.autoplay;
    app.seen = new Set();
    app.nextSeen = new Set();
    app.gameStarted = false;
    app.store.lastStage = app.stageIndex;
    saveStore();
    resetTimer();
    closeDrawer();
    render();
    if (opts.showIntro === false) {
      app.gameStarted = true;
      if (!opts.noTimer) startTimer();
    } else {
      showIntro();
    }
  }

  function showIntro() {
    const p = app.puzzle;
    const rec = recordFor(p);
    const stars = rec ? '★'.repeat(rec.stars || 0) + '☆'.repeat(3 - (rec.stars || 0)) : '☆☆☆';
    openModal(`
      <div class="intro">
        <div class="modal__kicker">STAGE ${pad2(p.no)} / ${pad2(PUZZLES.length)} &nbsp;·&nbsp; ${stars}</div>
        <div class="intro__stage">
          <span class="intro__no">${pad2(p.no)}</span>
          <div class="intro__names">
            <b>${esc(p.name)}</b>
            <span>${esc(p.en)}</span>
          </div>
        </div>
        <div class="intro__objective">${esc(p.objective)}<br><span style="color:var(--dim);font-size:10px">${esc(p.brief)}</span></div>
        <div class="intro__meta">
          <span>最短 <b>${p.par}</b> 手</span>
          <span>制限 <b>${p.turnLimit}</b> ターン</span>
          <span>難易度 <b>${'★'.repeat(p.difficulty)}</b></span>
          <span>相手 <b>${esc(p.enemyName)}</b></span>
        </div>
        <div class="quick-rules">
          <div><b>召喚 / セット</b><br>1ターンに1回。裏側守備は直接攻撃を防ぐ。</div>
          <div><b>リバース</b><br>裏側のモンスターは攻撃か反転召喚でめくれる。</div>
          <div><b>罠</b><br>セットした罠は相手ターンから自動発動する。</div>
          <div><b>評価</b><br>最短手数（PAR）以下なら三ツ星。手数とタイムを競え。</div>
        </div>
        <div class="modal__actions">
          <button class="btn btn--ghost" id="introHelp">詳しいルール</button>
          <button class="btn btn--gold" id="introStart">開戦</button>
        </div>
      </div>
    `, {
      dismissible: false,
      onMount(modal) {
        $('introStart').addEventListener('click', () => {
          closeModal({ resume: false });
          app.gameStarted = true;
          startTimer();
          sfx('turn');
          toast('手札を選択して開始');
        });
        $('introHelp').addEventListener('click', () => {
          openHelp();
        });
      }
    });
  }

  function restartStage() {
    if (app.busy && !app.autoplay) return;
    closeModal({ resume: false });
    loadStage(app.stageIndex, { showIntro: true });
  }

  /* ============================================================
     Render
     ============================================================ */
  function render() {
    if (!app.state) return;
    app.legal = E.legalActions(app.state);
    app.nextSeen = new Set();
    renderHud();
    renderTop();
    renderBoard();
    renderHand();
    renderSide();
    renderTray();
    app.seen = app.nextSeen;
  }

  function renderTop() {
    const p = app.puzzle;
    const s = app.state;
    $('stageNo').textContent = pad2(p.no);
    $('turnNo').textContent = s.round;
    $('turnMax').textContent = '/ ' + s.turnLimit;
    $('actionNo').textContent = s.actions;
    $('parNo').textContent = '/ 最短 ' + p.par;
    $('roundNo').textContent = pad2(s.round);
    const actionChip = document.querySelector('.chip--action');
    if (actionChip) actionChip.classList.toggle('is-danger', s.actions > p.par);
    let phase = 'YOUR TURN';
    let hint = '手札を選べ';
    if (s.winner === 'player') { phase = 'ZERO POINT'; hint = 'LP 0 達成'; }
    else if (s.winner === 'enemy') { phase = 'DUEL LOST'; hint = 'LP 0 / 時間切れ'; }
    else if (s.phase === 'enemy') { phase = 'ENEMY TURN'; hint = '相手の行動を解決中'; }
    else if (app.selected) {
      phase = app.mode === 'attack' ? 'SELECT TARGET' : 'CARD SELECTED';
      hint = app.mode === 'attack' ? '攻撃対象を選択' : '行動を選択';
    }
    $('phaseLabel').textContent = phase;
    $('centerHint').textContent = hint;
    updateTimerDisplay();
  }

  function renderHud() {
    const p = app.puzzle;
    const s = app.state;
    $('enemyName').textContent = p.enemyName;
    $('enemyTitle').textContent = p.enemyTitle;
    $('enemyLp').textContent = fmt(s.enemy.lp);
    $('playerLp').textContent = fmt(s.player.lp);
    const ePct = s.enemy.maxLp ? Math.max(0, s.enemy.lp / s.enemy.maxLp * 100) : 0;
    const pPct = s.player.maxLp ? Math.max(0, s.player.lp / s.player.maxLp * 100) : 0;
    $('enemyLpBar').style.width = ePct + '%';
    $('playerLpBar').style.width = pPct + '%';
    $('enemyMeta').textContent = `手札 ${s.enemy.hand.length} · 山 ${s.enemy.deck.length} · 墓 ${s.enemy.grave.length}`;
    $('playerMeta').textContent = `手札 ${s.player.hand.length} · 山 ${s.player.deck.length} · 墓 ${s.player.grave.length}`;
    $('enemyHud').classList.toggle('is-low', s.enemy.lp <= 1500);
    $('playerHud').classList.toggle('is-low', s.player.lp <= 1000);
    $('handCount').textContent = s.player.hand.length;
  }

  const BOARD_CELLS = (() => {
    const cells = [];
    cells.push({ side: 'enemy', kind: 'grave', label: 'GY' });
    for (let i = 4; i >= 0; i--) cells.push({ side: 'enemy', kind: 'spell', index: i, label: `S${i + 1}` });
    cells.push({ side: 'enemy', kind: 'deck', label: 'DECK' });
    for (let i = 4; i >= 0; i--) cells.push({ side: 'enemy', kind: 'monster', index: i, label: `M${i + 1}` });
    cells.push({ side: 'player', kind: 'deck', label: 'DECK' });
    for (let i = 0; i < 5; i++) cells.push({ side: 'player', kind: 'monster', index: i, label: `M${i + 1}` });
    cells.push({ side: 'player', kind: 'grave', label: 'GY' });
    for (let i = 0; i < 5; i++) cells.push({ side: 'player', kind: 'spell', index: i, label: `S${i + 1}` });
    return cells;
  })();

  function cellCard(cell) {
    if (!app.state) return null;
    const side = app.state[cell.side];
    if (cell.kind === 'monster') return side.monsters[cell.index];
    if (cell.kind === 'spell') return side.spells[cell.index];
    return null;
  }

  function isCellValid(cell) {
    const s = app.state;
    if (!s || s.winner || s.phase !== 'player' || app.busy) return false;
    const sel = app.selected;
    if (!sel) return false;
    if (app.mode === 'summon' || app.mode === 'setMonster') {
      if (sel.from !== 'hand' || cell.side !== 'player' || cell.kind !== 'monster' || cellCard(cell)) return false;
      const type = app.mode === 'summon' ? 'summon' : 'setMonster';
      return app.legal.some(a => a.type === type && a.hand === sel.index && a.zone === cell.index);
    }
    if (app.mode === 'setSpell') {
      if (sel.from !== 'hand' || cell.side !== 'player' || cell.kind !== 'spell' || cellCard(cell)) return false;
      return app.legal.some(a => a.type === 'setSpell' && a.hand === sel.index && a.zone === cell.index);
    }
    return false;
  }

  function isAttackTarget(cell) {
    const s = app.state;
    if (!s || s.winner || s.phase !== 'player' || app.busy) return false;
    if (app.mode !== 'attack' || !app.selected || app.selected.from !== 'monster') return false;
    if (cell.side !== 'enemy' || cell.kind !== 'monster' || !cellCard(cell)) return false;
    return app.legal.some(a => a.type === 'attack' && a.zone === app.selected.index && a.target === cell.index);
  }

  function cardHTML(card, opts) {
    opts = opts || {};
    const isSet = !!card.faceDown;
    const isDefense = !isSet && card.kind === 'monster' && card.pos === 'defense';
    const classes = ['card', `card--${card.kind}`, `card--${card.rarity || 'N'}`];
    if (isSet) classes.push('is-set');
    if (isDefense) classes.push('is-defense');
    if (opts.selected) classes.push('is-selected');
    if (opts.attacker) classes.push('is-attacker');
    if (!app.seen.has(card.uid) && opts.animateEnter !== false) classes.push('is-entering');
    const hue = Number.isFinite(card.hue) ? card.hue : 205;
    app.nextSeen.add(card.uid);
    const atk = E.atkOf(card);
    const label = opts.conceal
      ? '裏側守備表示のカード'
      : `${card.name} ${kindName(card)}${card.kind === 'monster' ? ` ATK${atk} DEF${card.def}` : ''}`;
    const face = opts.conceal ? '' : `
      <div class="card__face">
        <span class="card__kind">${kindLabel(card)}</span>
        ${card.kind === 'monster' ? `<span class="card__level">Lv.${card.level}</span>` : ''}
        <span class="card__art" aria-hidden="true">${card.icon || '◆'}</span>
        <span class="card__name">${esc(card.name)}</span>
        ${card.tag ? `<span class="card__tag">${esc(card.tag)}</span>` : ''}
        ${card.kind === 'monster' ? `<span class="card__stats"><span class="atk"><em>ATK</em>${atk}</span><span class="def"><em>DEF</em>${card.def}</span></span>` : ''}
        ${card.atkBonus ? `<span class="card__buff">+${card.atkBonus}</span>` : ''}
        ${card.grantedDirect ? `<span class="card__buff card__buff--direct">DIRECT</span>` : ''}
      </div>`;
    return `<button class="${classes.join(' ')}" data-uid="${card.uid}" style="--hue:${hue}" aria-label="${esc(label)}">
      <div class="card__inner">
        ${face}
        <div class="card__back" aria-hidden="true"></div>
      </div>
    </button>`;
  }

  function renderBoard() {
    const s = app.state;
    let html = '';
    for (const cell of BOARD_CELLS) {
      const card = cellCard(cell);
      const valid = isCellValid(cell);
      const target = isAttackTarget(cell);
      const classes = ['zone', `zone--${cell.side}`, `zone--${cell.kind === 'monster' ? 'monster' : cell.kind === 'spell' ? 'spell' : 'util'}`];
      if (valid) classes.push('is-valid');
      if (target) classes.push('is-target');
      if (app.selected && card && app.selected.uid === card.uid) classes.push('is-selected');
      if (cell.kind === 'deck' || cell.kind === 'grave') classes.push('is-clickable');
      const data = `data-side="${cell.side}" data-kind="${cell.kind}" ${cell.index != null ? `data-index="${cell.index}"` : ''}`;
      const selectedMonster = app.selected && app.selected.from === 'monster' && cell.side === 'player' && cell.kind === 'monster' && app.selected.index === cell.index;
      const attacker = selectedMonster && app.mode === 'attack';
      let inner = '';
      if (cell.kind === 'deck') {
        inner = `<div class="util">
          <span class="util__label">DECK</span>
          <span class="util__stack"></span>
          <span class="util__count">${s[cell.side].deck.length}</span>
        </div>`;
      } else if (cell.kind === 'grave') {
        inner = `<div class="util">
          <span class="util__label">GRAVE</span>
          <span class="util__stack util__stack--grave"></span>
          <span class="util__count">${s[cell.side].grave.length}</span>
        </div>`;
      } else if (card) {
        const conceal = cell.side === 'enemy' && card.faceDown;
        inner = cardHTML(card, {
          conceal,
          selected: !!(app.selected && app.selected.uid === card.uid),
          attacker
        });
      } else {
        inner = `<span class="zone__sigil" aria-hidden="true">${cell.kind === 'monster' ? '◇' : '✦'}</span>`;
      }
      html += `<div class="${classes.join(' ')}" ${data} role="gridcell" aria-label="${cell.side === 'enemy' ? '相手' : '自分'} ${cell.kind} ${cell.label}">
        <span class="zone__label">${cell.label}</span>
        ${inner}
      </div>`;
    }
    CL.board.innerHTML = html;
  }

  function renderHand() {
    const s = app.state;
    if (!s.player.hand.length) {
      CL.hand.innerHTML = '<div class="hand__empty">手札は空。山札と墓地を確認しよう。</div>';
      return;
    }
    CL.hand.innerHTML = s.player.hand.map((card, index) => {
      const selected = app.selected && app.selected.from === 'hand' && app.selected.index === index;
      return cardHTML(card, { selected });
    }).join('');
  }

  function renderSide() {
    const p = app.puzzle;
    const rec = recordFor(p);
    $('missionNo').textContent = `STAGE ${pad2(p.no)}`;
    $('missionName').textContent = p.name;
    $('missionEn').textContent = p.en;
    $('missionObjective').textContent = p.objective;
    $('missionPar').textContent = p.par;
    $('missionTurns').textContent = p.turnLimit;
    $('missionDiff').textContent = '★'.repeat(p.difficulty);
    $('missionTip').textContent = p.tip;
    const log = CL.log;
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.innerHTML = app.state.log.map(entry => {
      const tone = entry.tone || 'neutral';
      return `<div class="log__entry log__entry--${tone}">${esc(entry.text)}</div>`;
    }).join('');
    if (nearBottom) log.scrollTop = log.scrollHeight;
  }

  /* ============================================================
     Selection / actions
     ============================================================ */
  function clearSelection(silent) {
    app.selected = null;
    app.mode = null;
    if (!silent) sfx('cancel');
    render();
  }

  function selectHand(index) {
    const s = app.state;
    if (!s || s.winner || s.phase !== 'player' || app.busy) return;
    const card = s.player.hand[index];
    if (!card) return;
    app.selected = { from: 'hand', index, uid: card.uid };
    if (card.kind === 'monster') {
      const hasZone = app.legal.some(a => a.type === 'summon' && a.hand === index);
      app.mode = hasZone ? 'summon' : null;
    } else if (card.kind === 'spell') {
      app.mode = 'activate';
    } else {
      app.mode = 'setSpell';
    }
    sfx('select');
    render();
  }

  function selectMonster(index) {
    const card = app.state.player.monsters[index];
    if (!card) return;
    app.selected = { from: 'monster', index, uid: card.uid };
    app.mode = null;
    sfx('select');
    render();
  }

  function selectSpell(index) {
    const card = app.state.player.spells[index];
    if (!card) return;
    app.selected = { from: 'spell', index, uid: card.uid };
    app.mode = null;
    sfx('select');
    render();
  }

  function selectEnemy(index) {
    const card = app.state.enemy.monsters[index];
    if (!card) return;
    app.selected = { from: 'enemy', index, uid: card.uid };
    app.mode = null;
    sfx('select');
    render();
  }

  function startAttackMode() {
    if (!app.selected || app.selected.from !== 'monster') return;
    app.mode = 'attack';
    sfx('select');
    render();
  }

  function findAction(partial) {
    return app.legal.find(a => Object.keys(partial).every(key => a[key] === partial[key]));
  }

  async function performAction(action) {
    if (!action || app.busy || !app.state || app.state.winner || app.state.phase !== 'player') return;
    const runId = app.runId;
    app.busy = true;
    app.selected = null;
    app.mode = null;
    if (action.type === 'attack' || action.type === 'flipSummon') sfx('attack');
    else if (action.type === 'summon') sfx('summon');
    else if (action.type === 'setMonster' || action.type === 'setSpell') sfx('set');
    else if (action.type === 'activate' || action.type === 'activateSet') sfx('spell');
    else if (action.type === 'endTurn') sfx('turn');
    else sfx('select');
    E.applyActionMut(app.state, action, app.puzzle, { deferEnemy: true });
    render();
    await playEvents(app.state.events);
    if (runId !== app.runId) return;
    if (app.state.phase === 'enemy' && !app.state.winner) {
      await runEnemyLoop(runId);
    }
    if (runId !== app.runId) return;
    app.busy = false;
    render();
    if (app.state.winner) finishGame(false);
  }

  async function runEnemyLoop(runId) {
    let guard = 0;
    while (app.state.phase === 'enemy' && !app.state.winner && guard++ < 40) {
      await sleep(430);
      if (runId !== app.runId) return;
      E.stepEnemyTurn(app.state);
      render();
      await playEvents(app.state.events);
    }
  }

  function endTurn() {
    if (app.busy || !app.state || app.state.winner || app.state.phase !== 'player') return;
    performAction({ type: 'endTurn' });
  }

  async function playEvents(events) {
    if (!events || !events.length) return;
    for (const ev of events) {
      switch (ev.type) {
        case 'attack': {
          const card = document.querySelector(`.card[data-uid="${ev.uid}"]`);
          if (card) {
            card.classList.add('is-attacking');
            setTimeout(() => card.classList.remove('is-attacking'), 380);
          }
          if (ev.targetZone != null) {
            const zone = document.querySelector(`.zone[data-side="${ev.side === 'player' ? 'enemy' : 'player'}"][data-kind="monster"][data-index="${ev.targetZone}"]`);
            if (zone) {
              zone.classList.add('is-hit');
              setTimeout(() => zone.classList.remove('is-hit'), 400);
            }
            const c = centerOf(zone);
            burst(c.x, c.y, '#ff5577', 10, 2.4);
          } else {
            const hud = $(ev.side === 'player' ? 'enemyHud' : 'playerHud');
            hud.classList.add('is-flashing');
            setTimeout(() => hud.classList.remove('is-flashing'), 380);
          }
          sfx('attack');
          shake();
          await sleep(230);
          break;
        }
        case 'damage': {
          const hud = $(ev.side === 'player' ? 'playerHud' : 'enemyHud');
          const c = centerOf(hud);
          const gold = ev.source === 'reflect' || ev.source === 'curse';
          floatText(c.x, c.y - 4, '-' + fmt(ev.amount), gold ? 'gold' : '');
          burst(c.x, c.y, ev.side === 'player' ? '#ff5577' : '#43f0d0', 14, 3.2);
          hud.classList.add('is-flashing');
          setTimeout(() => hud.classList.remove('is-flashing'), 380);
          sfx('damage');
          shake();
          await sleep(250);
          break;
        }
        case 'heal': {
          const hud = $(ev.side === 'player' ? 'playerHud' : 'enemyHud');
          const c = centerOf(hud);
          floatText(c.x, c.y, '+' + fmt(ev.amount), 'heal');
          sfx('heal');
          await sleep(180);
          break;
        }
        case 'destroy': {
          const zone = document.querySelector(`.zone[data-side="${ev.side}"][data-kind="${ev.kind || 'monster'}"][data-index="${ev.zone}"]`);
          if (zone) {
            zone.classList.add('is-dead', 'is-hit');
            const c = centerOf(zone);
            burst(c.x, c.y, ev.side === 'enemy' ? '#f5d24a' : '#ff5577', 16, 3.2);
            setTimeout(() => zone.classList.remove('is-dead'), 520);
          }
          sfx('damage');
          await sleep(190);
          break;
        }
        case 'flip':
        case 'reveal':
        case 'flipSummon': {
          const card = document.querySelector(`.card[data-uid="${ev.uid}"]`);
          if (card) {
            card.classList.add('is-flipping');
            setTimeout(() => card.classList.remove('is-flipping'), 540);
          }
          sfx('flip');
          await sleep(170);
          break;
        }
        case 'trapReveal': {
          toast('TRAP: ' + ev.name);
          sfx('trap');
          const card = document.querySelector(`.card[data-uid="${ev.uid}"]`);
          if (card) {
            card.classList.add('is-flipping');
            setTimeout(() => card.classList.remove('is-flipping'), 540);
          }
          await sleep(260);
          break;
        }
        case 'spell': {
          toast('SPELL: ' + ev.name);
          sfx('spell');
          await sleep(180);
          break;
        }
        case 'enemySummon': {
          toast('相手の召喚: ' + ev.name);
          sfx('summon');
          await sleep(180);
          break;
        }
        case 'enemyTurn': {
          toast('ENEMY TURN');
          sfx('turn');
          await sleep(220);
          break;
        }
        case 'playerTurn': {
          toast('YOUR TURN');
          sfx('turn');
          await sleep(180);
          break;
        }
        case 'win': {
          if (ev.side === 'player') {
            confetti();
            sfx('win');
            await sleep(500);
          } else {
            sfx('lose');
            await sleep(300);
          }
          break;
        }
        default:
          await sleep(60);
      }
    }
  }

  /* ============================================================
     Action tray
     ============================================================ */
  function addBtn(label, opts) {
    opts = opts || {};
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (opts.className || 'btn--ghost') + (opts.small ? ' btn--small' : '');
    b.textContent = label;
    if (opts.disabled) b.disabled = true;
    if (opts.title) b.title = opts.title;
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    CL.trayButtons.appendChild(b);
    return b;
  }

  function renderTray() {
    const s = app.state;
    const p = app.puzzle;
    CL.trayButtons.innerHTML = '';
    const busy = app.busy || s.winner || s.phase !== 'player';
    $('endTurnBtn').disabled = busy;
    $('endTurnBtn2').disabled = busy;
    $('endTurnBtn').classList.toggle('is-hot', !busy && !app.selected && s.actions > 0);
    $('endTurnBtn2').classList.toggle('is-hot', !busy && !app.selected && s.actions > 0);

    if (s.winner) {
      CL.trayHint.innerHTML = s.winner === 'player'
        ? '<b>ZERO POINT</b> — 相手LPを0にした。'
        : '<b>DUEL LOST</b> — リトライして最短を目指せ。';
      addBtn('結果を見る', { className: 'btn--gold', onClick: () => showResult(false) });
      return;
    }
    if (s.phase === 'enemy' || app.busy) {
      CL.trayHint.innerHTML = '<b>相手のターン</b> — 行動を解決中…';
      addBtn('TURN END', { disabled: true, small: true });
      return;
    }

    if (!app.selected) {
      CL.trayHint.innerHTML = '手札のカード、または自分のモンスターを選択。 <span style="color:var(--dim)">PAR ' + p.par + ' 手</span>';
      addBtn('最適解', { small: true, onClick: openSolution });
      addBtn('ルール', { small: true, onClick: openHelp });
      return;
    }

    const sel = app.selected;
    if (sel.from === 'hand') {
      const card = s.player.hand[sel.index];
      if (!card) { app.selected = null; return renderTray(); }
      CL.trayHint.innerHTML = `<b>${esc(card.name)}</b> — ${esc(card.text)}`;
      if (card.kind === 'monster') {
        const canSummon = app.legal.some(a => a.type === 'summon' && a.hand === sel.index);
        const canSet = app.legal.some(a => a.type === 'setMonster' && a.hand === sel.index);
        addBtn('召喚', {
          className: 'btn--gold', disabled: !canSummon,
          onClick: () => { app.mode = 'summon'; render(); }
        });
        addBtn('裏側セット', {
          className: 'btn--ghost', disabled: !canSet,
          onClick: () => { app.mode = 'setMonster'; render(); }
        });
        if (!canSummon && !canSet) {
          CL.trayHint.innerHTML += ' <span style="color:var(--red)">（召喚権なし / ゾーン満杯）</span>';
        }
      } else if (card.kind === 'spell') {
        const canAct = app.legal.some(a => a.type === 'activate' && a.hand === sel.index);
        const canSet = app.legal.some(a => a.type === 'setSpell' && a.hand === sel.index);
        addBtn('発動', {
          className: 'btn--gold', disabled: !canAct,
          onClick: () => performAction(findAction({ type: 'activate', hand: sel.index }))
        });
        addBtn('セット', {
          className: 'btn--ghost', disabled: !canSet,
          onClick: () => { app.mode = 'setSpell'; render(); }
        });
      } else {
        const canSet = app.legal.some(a => a.type === 'setSpell' && a.hand === sel.index);
        addBtn('裏側セット', {
          className: 'btn--gold', disabled: !canSet,
          onClick: () => { app.mode = 'setSpell'; render(); }
        });
        CL.trayHint.innerHTML += ' <span style="color:var(--dim)">罠はセット後、相手ターンから自動発動。</span>';
      }
      addBtn('詳細', { small: true, onClick: () => openCardDetail(card, { conceal: false }) });
      addBtn('キャンセル', { small: true, onClick: () => clearSelection() });
      return;
    }

    if (sel.from === 'monster') {
      const card = s.player.monsters[sel.index];
      if (!card) { app.selected = null; return renderTray(); }
      if (app.mode === 'attack') {
        const canDirect = app.legal.some(a => a.type === 'attack' && a.zone === sel.index && a.target === 'direct');
        CL.trayHint.innerHTML = `<b>${esc(card.name)}</b> — 攻撃対象を選択。${canDirect ? ' 直接攻撃も可能。' : ''}`;
        addBtn('直接攻撃', {
          className: 'btn--gold', disabled: !canDirect,
          onClick: () => performAction(findAction({ type: 'attack', zone: sel.index, target: 'direct' }))
        });
        addBtn('キャンセル', { small: true, onClick: () => { app.mode = null; render(); } });
        return;
      }
      CL.trayHint.innerHTML = `<b>${esc(card.name)}</b> — ${esc(card.text || '')}`;
      const canAttack = app.legal.some(a => a.type === 'attack' && a.zone === sel.index);
      const canFlip = card.faceDown && app.legal.some(a => a.type === 'flipSummon' && a.zone === sel.index);
      const canChange = app.legal.some(a => a.type === 'changePosition' && a.zone === sel.index);
      if (card.faceDown) {
        addBtn('反転召喚', {
          className: 'btn--gold', disabled: !canFlip,
          onClick: () => performAction(findAction({ type: 'flipSummon', zone: sel.index }))
        });
        if (canFlip) CL.trayHint.innerHTML += ' <span style="color:var(--dim)">リバース効果が発動する。</span>';
      } else {
        addBtn('攻撃', {
          className: 'btn--gold', disabled: !canAttack,
          onClick: startAttackMode
        });
        addBtn('表示変更', {
          className: 'btn--ghost', disabled: !canChange,
          onClick: () => performAction(findAction({ type: 'changePosition', zone: sel.index }))
        });
      }
      addBtn('詳細', { small: true, onClick: () => openCardDetail(card, { conceal: false }) });
      addBtn('キャンセル', { small: true, onClick: () => clearSelection() });
      return;
    }

    if (sel.from === 'spell') {
      const card = s.player.spells[sel.index];
      if (!card) { app.selected = null; return renderTray(); }
      CL.trayHint.innerHTML = `<b>${esc(card.name)}</b> — ${esc(card.text || '')}`;
      if (card.kind === 'trap') {
        CL.trayHint.innerHTML += ' <span style="color:var(--dim)">罠は自動発動。相手の攻撃を待とう。</span>';
      } else {
        const canAct = app.legal.some(a => a.type === 'activateSet' && a.zone === sel.index);
        addBtn('発動', {
          className: 'btn--gold', disabled: !canAct,
          onClick: () => performAction(findAction({ type: 'activateSet', zone: sel.index }))
        });
        if (!canAct) CL.trayHint.innerHTML += ' <span style="color:var(--dim)">セットした次のターンから発動可能。</span>';
      }
      addBtn('詳細', { small: true, onClick: () => openCardDetail(card, { conceal: false }) });
      addBtn('キャンセル', { small: true, onClick: () => clearSelection() });
      return;
    }

    if (sel.from === 'enemy') {
      const card = s.enemy.monsters[sel.index];
      if (!card) { app.selected = null; return renderTray(); }
      CL.trayHint.innerHTML = card.faceDown
        ? '<b>裏側守備表示</b> — 正体不明。攻撃するとリバースする可能性がある。'
        : `<b>${esc(card.name)}</b> — ATK ${E.atkOf(card)} / DEF ${card.def}`;
      addBtn('詳細', { small: true, onClick: () => openCardDetail(card, { conceal: card.faceDown }) });
      addBtn('キャンセル', { small: true, onClick: () => clearSelection() });
      return;
    }
    addBtn('キャンセル', { small: true, onClick: () => clearSelection() });
  }

  /* ============================================================
     Board / hand events
     ============================================================ */
  function onBoardClick(event) {
    const zone = event.target.closest('.zone');
    if (!zone) return;
    const side = zone.dataset.side;
    const kind = zone.dataset.kind;
    const index = zone.dataset.index != null ? Number(zone.dataset.index) : null;
    if (kind === 'deck' || kind === 'grave') {
      openZoneInfo(side, kind);
      return;
    }
    if (!app.state || app.state.winner || app.busy || app.state.phase !== 'player') return;

    // Attack target
    if (app.mode === 'attack' && side === 'enemy' && kind === 'monster' && index != null) {
      const action = findAction({ type: 'attack', zone: app.selected.index, target: index });
      if (action) { performAction(action); return; }
    }

    if (side === 'player' && kind === 'monster' && index != null) {
      const card = app.state.player.monsters[index];
      if (!card && app.selected && app.selected.from === 'hand' && (app.mode === 'summon' || app.mode === 'setMonster')) {
        const type = app.mode === 'summon' ? 'summon' : 'setMonster';
        const action = findAction({ type, hand: app.selected.index, zone: index });
        if (action) { performAction(action); return; }
      }
      if (card) { selectMonster(index); return; }
    }
    if (side === 'player' && kind === 'spell' && index != null) {
      const card = app.state.player.spells[index];
      if (!card && app.selected && app.selected.from === 'hand' && app.mode === 'setSpell') {
        const action = findAction({ type: 'setSpell', hand: app.selected.index, zone: index });
        if (action) { performAction(action); return; }
      }
      if (card) { selectSpell(index); return; }
    }
    if (side === 'enemy' && kind === 'monster' && index != null) {
      const card = app.state.enemy.monsters[index];
      if (card) selectEnemy(index);
      return;
    }
    if (app.selected) clearSelection(true);
  }

  function onHandClick(event) {
    const cardEl = event.target.closest('.card');
    if (!cardEl) return;
    const uid = Number(cardEl.dataset.uid);
    const index = app.state.player.hand.findIndex(c => c.uid === uid);
    if (index >= 0) selectHand(index);
  }

  function onBoardKey(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const zone = event.target.closest('.zone');
    if (!zone) return;
    event.preventDefault();
    zone.click();
  }

  /* ============================================================
     Modals
     ============================================================ */
  function openModal(html, opts) {
    opts = opts || {};
    closeDrawer();
    pauseTimer();
    app.modalOpen = true;
    app.modalDismissible = opts.dismissible !== false;
    CL.modal.innerHTML = `<div class="modal ${opts.className || ''}" role="dialog" aria-modal="true">${html}</div>`;
    CL.modal.classList.add('is-open');
    CL.modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => closeModal()));
    if (opts.onMount) opts.onMount(CL.modal.firstElementChild);
    const focusable = CL.modal.querySelector('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 30);
  }

  function closeModal(opts) {
    opts = opts || {};
    CL.modal.classList.remove('is-open');
    CL.modal.innerHTML = '';
    app.modalOpen = false;
    if (opts.resume !== false && app.gameStarted && app.state && !app.state.winner) startTimer();
  }

  function closeDrawer() {
    CL.side.classList.remove('is-open');
    CL.scrim.classList.remove('is-open');
  }

  function openHelp() {
    openModal(`
      <button class="modal__close" data-close aria-label="閉じる">×</button>
      <div class="modal__kicker">HOW TO PLAY</div>
      <h2 class="modal__title">LPを0にせよ。</h2>
      <p class="modal__sub">24 ZONES / SHORTEST LINE WINS</p>
      <p class="modal__lead">相手のライフポイントを0にすれば勝利。ただし、決められたターン数と「最短手数」が勝負。無駄な一手は評価を落とす。</p>
      <div class="rules">
        <div class="rule"><div class="rule__icon">⚔</div><div><b>召喚 / 裏側セット</b><p>モンスターは1ターンに1体まで。攻撃表示で召喚するか、<code>裏側守備表示</code>でセットする。セットしたモンスターは直接攻撃を防ぎ、攻撃された時にリバースする。</p></div></div>
        <div class="rule"><div class="rule__icon">✦</div><div><b>魔法・罠</b><p>魔法は手札から即発動、またはセットして次のターンに発動。罠はセット後、相手ターンから自動で反応する。発動条件はカードテキストを確認。</p></div></div>
        <div class="rule"><div class="rule__icon">↻</div><div><b>反転召喚 / 表示変更</b><p>裏側モンスターは1ターンに1体まで反転召喚できる。リバース効果は攻撃された時にも発動。攻撃後の表示変更はできない。</p></div></div>
        <div class="rule"><div class="rule__icon">☄</div><div><b>戦闘</b><p>攻撃表示同士はATK勝負。守備表示にはDEFで受け、貫通持ちだけが超過ダメージを与える。相手モンスターがいると直接攻撃はできない。</p></div></div>
        <div class="rule"><div class="rule__icon">★</div><div><b>評価</b><p>クリア時の手数がPAR以下なら三ツ星。PARより多くても勝利は勝利。タイムとベスト手数をローカルに記録する。</p></div></div>
      </div>
      <div class="modal__actions">
        <button class="btn btn--gold" data-close>理解した</button>
      </div>
    `);
  }

  function openStageSelect() {
    const rec = app.store.records || {};
    const cleared = PUZZLES.filter(p => rec[p.id] && rec[p.id].cleared).length;
    const cards = PUZZLES.map((p, i) => {
      const r = rec[p.id];
      const stars = r ? (r.stars || 0) : 0;
      const starHtml = [0, 1, 2].map(n => `<span class="${n < stars ? 'on' : ''}">★</span>`).join('');
      return `<button class="stage-card ${i === app.stageIndex ? 'is-current' : ''}" data-stage="${i}">
        <span class="stage-card__no">STAGE ${pad2(p.no)}</span>
        <span class="stage-card__best">${r ? 'BEST <b>' + r.bestActions + '手</b>' : 'BEST <b>—</b>'}</span>
        <span class="stage-card__name">${esc(p.name)}</span>
        <span class="stage-card__en">${esc(p.en)}</span>
        <span class="stage-card__meta"><span>PAR <b>${p.par}</b></span><span>TURN <b>${p.turnLimit}</b></span><span class="stars">${starHtml}</span></span>
      </button>`;
    }).join('');
    openModal(`
      <button class="modal__close" data-close aria-label="閉じる">×</button>
      <div class="modal__kicker">SELECT MISSION</div>
      <h2 class="modal__title">ステージ選択</h2>
      <p class="modal__sub">${cleared} / ${PUZZLES.length} CLEARED &nbsp;·&nbsp; 24-ZONE DUEL FIELD</p>
      <div class="stage-grid">${cards}</div>
      <div class="modal__actions">
        <button class="btn btn--ghost btn--small" id="resetRecords">記録リセット</button>
        <button class="btn btn--ghost btn--small" id="stageHelp">ルール</button>
        <button class="btn btn--gold" data-close>閉じる</button>
      </div>
    `, {
      className: 'modal--wide',
      onMount(modal) {
        modal.querySelectorAll('[data-stage]').forEach(el => {
          el.addEventListener('click', () => {
            const index = Number(el.dataset.stage);
            closeModal({ resume: false });
            loadStage(index, { showIntro: true });
          });
        });
        $('resetRecords').addEventListener('click', () => {
          app.store.records = {};
          saveStore();
          toast('記録をリセットした');
          openStageSelect();
        });
        $('stageHelp').addEventListener('click', openHelp);
      }
    });
  }

  function openSolution() {
    const p = app.puzzle;
    const temp = E.createState(p);
    const lines = [];
    let ok = true;
    for (const step of p.solution) {
      const action = E.toAction(temp, step);
      if (!action || !E.isLegal(temp, action)) { ok = false; break; }
      lines.push(E.describeAction(temp, action));
      E.applyActionMut(temp, action, p);
      if (temp.winner) break;
    }
    openModal(`
      <button class="modal__close" data-close aria-label="閉じる">×</button>
      <div class="modal__kicker">SHORTEST LINE</div>
      <h2 class="modal__title">最短解</h2>
      <p class="modal__sub">STAGE ${pad2(p.no)} / ${esc(p.name)} &nbsp;·&nbsp; ${p.par} ACTIONS</p>
      <p class="modal__lead">${ok ? 'この手順で相手LPを0にできる。再生すると、最初から自動で実演する。' : '解の検証に失敗した。リトライしてほしい。'}</p>
      <ol class="solution-list">
        ${lines.map((line, i) => `<li><span>${esc(line)}${i === lines.length - 1 ? ' <em>— ZERO POINT</em>' : ''}</span></li>`).join('')}
      </ol>
      <div class="modal__actions">
        <button class="btn btn--ghost" data-close>閉じる</button>
        <button class="btn btn--gold" id="replaySolution" ${ok ? '' : 'disabled'}>最適解を再生</button>
      </div>
    `, {
      onMount(modal) {
        $('replaySolution').addEventListener('click', () => {
          closeModal({ resume: false });
          startAutoplay();
        });
      }
    });
  }

  async function startAutoplay() {
    const p = app.puzzle;
    loadStage(app.stageIndex, { showIntro: false, autoplay: true, noTimer: true });
    const runId = app.runId;
    app.busy = true;
    render();
    toast('最適解を再生中');
    await sleep(550);
    for (const step of p.solution) {
      if (runId !== app.runId || app.state.winner) break;
      const action = E.toAction(app.state, step);
      if (!action || !E.isLegal(app.state, action)) {
        toast('再生を中断した');
        break;
      }
      E.applyActionMut(app.state, action, p, { deferEnemy: true });
      render();
      await playEvents(app.state.events);
      if (runId !== app.runId) return;
      if (app.state.phase === 'enemy' && !app.state.winner) await runEnemyLoop(runId);
      await sleep(320);
    }
    if (runId !== app.runId) return;
    app.busy = false;
    render();
    if (app.state.winner) finishGame(true);
    else toast('再生終了');
  }

  function openCardDetail(card, opts) {
    opts = opts || {};
    const concealed = !!opts.conceal;
    const name = concealed ? '？？？' : card.name;
    const text = concealed ? '裏側守備表示。攻撃するか反転召喚するまで正体は分からない。' : (card.text || '');
    const kind = concealed ? 'SET' : kindName(card);
    const pos = card.faceDown ? '裏側守備表示' : (card.kind === 'monster' ? (card.pos === 'attack' ? '攻撃表示' : '守備表示') : 'セット');
    openModal(`
      <button class="modal__close" data-close aria-label="閉じる">×</button>
      <div class="modal__kicker">CARD DATA</div>
      <div class="detail">
        <div class="detail__card">${cardHTML(card, { conceal: concealed, animateEnter: false })}</div>
        <div class="detail__info">
          <h2 class="detail__name">${esc(name)}</h2>
          <div class="detail__en">${concealed ? 'UNKNOWN' : esc(card.en)}</div>
          <span class="detail__type">${esc(kind)} · ${esc(pos)}</span>
          <div class="detail__stats">
            <div>ATK<b>${concealed ? '?' : E.atkOf(card)}</b></div>
            <div>DEF<b>${concealed ? '?' : card.def}</b></div>
          </div>
          <div class="detail__text">${esc(text)}</div>
          ${!concealed && card.tag ? `<div class="detail__note">TAG: ${esc(card.tag)}</div>` : ''}
        </div>
      </div>
      <div class="modal__actions"><button class="btn btn--gold" data-close>閉じる</button></div>
    `);
  }

  function openZoneInfo(side, kind) {
    const s = app.state[side];
    const isPlayer = side === 'player';
    const title = kind === 'grave' ? '墓地 / GRAVEYARD' : '山札 / DECK';
    let body = '';
    if (kind === 'grave') {
      body = s.grave.length
        ? `<div class="solution-list">${s.grave.map(c => `<li><span>${esc(c.name)} <em>${kindName(c)}</em></span></li>`).join('')}</div>`
        : '<p class="modal__lead">墓地は空。</p>';
    } else {
      body = `<p class="modal__lead">${isPlayer ? '自分の' : '相手の'}山札は <b style="color:var(--gold)">${s.deck.length}</b> 枚。${isPlayer ? '次のドローまで順序は非公開。' : '内容は非公開。'}</p>`;
    }
    openModal(`
      <button class="modal__close" data-close aria-label="閉じる">×</button>
      <div class="modal__kicker">${isPlayer ? 'YOUR' : 'ENEMY'} ${kind.toUpperCase()}</div>
      <h2 class="modal__title">${title}</h2>
      <p class="modal__sub">${esc(app.puzzle.enemyName)} / ${esc(app.puzzle.name)}</p>
      ${body}
      <div class="modal__actions"><button class="btn btn--gold" data-close>閉じる</button></div>
    `);
  }

  /* ============================================================
     Result
     ============================================================ */
  function finishGame(demo) {
    if (app.finished) return;
    app.finished = true;
    stopTimer();
    const s = app.state;
    const p = app.puzzle;
    const win = s.winner === 'player';
    const elapsed = currentElapsed();
    const stars = win ? E.scoreStar(s.actions, p.par) : 0;
    let newRecord = false;
    if (win && !demo) {
      const prev = app.store.records[p.id] || null;
      const bestActions = prev ? Math.min(prev.bestActions || 999, s.actions) : s.actions;
      const bestTime = prev && prev.bestTime != null ? Math.min(prev.bestTime, elapsed) : elapsed;
      newRecord = !prev || s.actions < (prev.bestActions || 999) || elapsed < (prev.bestTime || 1e9);
      app.store.records[p.id] = {
        cleared: true,
        stars: Math.max(prev ? (prev.stars || 0) : 0, stars),
        bestActions,
        bestTime,
        lastActions: s.actions,
        lastTime: elapsed
      };
      saveStore();
    }
    setTimeout(() => showResult(demo, { win, stars, elapsed, newRecord }), REDUCED ? 80 : 560);
  }

  function showResult(demo, data) {
    const s = app.state;
    const p = app.puzzle;
    const win = data ? data.win : s.winner === 'player';
    const stars = data ? data.stars : (win ? E.scoreStar(s.actions, p.par) : 0);
    const elapsed = data ? data.elapsed : currentElapsed();
    const rec = app.store.records[p.id] || null;
    const starHtml = [0, 1, 2].map(n => `<span class="${n < stars ? 'on' : ''}">★</span>`).join('');
    const reason = s.winner === 'enemy'
      ? (s.player.lp <= 0 ? 'LPが0になった。' : 'ターン上限に達した。')
      : '';
    const title = demo ? 'OPTIMAL LINE' : (win ? 'ZERO POINT' : 'DUEL LOST');
    const nextIndex = app.stageIndex + 1;
    const hasNext = nextIndex < PUZZLES.length;
    openModal(`
      <div class="result ${win || demo ? '' : 'result--lose'}">
        <div class="modal__kicker">${demo ? 'SHORTEST LINE REPLAY' : (win ? 'MISSION COMPLETE' : 'MISSION FAILED')}</div>
        <div class="result__big">${title}</div>
        <div class="modal__sub">STAGE ${pad2(p.no)} / ${esc(p.name)}</div>
        ${win || demo ? `<div class="result__stars">${starHtml}</div>` : `<p class="modal__lead">${esc(reason)}</p>`}
        <div class="result__stats">
          <div>手数<b class="${win && s.actions <= p.par ? 'gold' : ''}">${s.actions}</b></div>
          <div>最短<b>${p.par}</b></div>
          <div>タイム<b>${demo ? '—' : formatTime(elapsed)}</b></div>
        </div>
        ${demo ? '<div class="result__record">最適解の実演。記録には加算されない。</div>' : ''}
        ${!demo && win && data && data.newRecord ? '<div class="result__record">NEW BEST RECORD</div>' : ''}
        ${!demo && win && rec ? `<div class="result__record" style="color:var(--dim)">BEST ${rec.bestActions} 手 / ${formatTime(rec.bestTime)}</div>` : ''}
        <div class="modal__actions" style="justify-content:center">
          ${win && !demo && hasNext ? '<button class="btn btn--gold" id="resultNext">次のステージ</button>' : ''}
          <button class="btn ${win && !demo && hasNext ? 'btn--ghost' : 'btn--gold'}" id="resultRetry">リトライ</button>
          <button class="btn btn--ghost" id="resultStages">ステージ選択</button>
          ${!win ? '<button class="btn btn--ghost" id="resultSolution">最適解</button>' : ''}
        </div>
      </div>
    `, {
      dismissible: false,
      onMount(modal) {
        const next = $('resultNext');
        if (next) next.addEventListener('click', () => {
          closeModal({ resume: false });
          loadStage(nextIndex, { showIntro: true });
        });
        $('resultRetry').addEventListener('click', () => {
          closeModal({ resume: false });
          loadStage(app.stageIndex, { showIntro: true });
        });
        $('resultStages').addEventListener('click', () => {
          closeModal({ resume: false });
          openStageSelect();
        });
        const sol = $('resultSolution');
        if (sol) sol.addEventListener('click', () => {
          closeModal({ resume: false });
          openSolution();
        });
      }
    });
  }

  /* ============================================================
     Drawer / misc
     ============================================================ */
  function openDrawer() {
    CL.side.classList.add('is-open');
    CL.scrim.classList.add('is-open');
  }
  function toggleSound() {
    app.store.sound = !app.store.sound;
    saveStore();
    $('soundBtn').classList.toggle('is-off', !app.store.sound);
    $('soundBtn').textContent = app.store.sound ? '♪' : '×';
    if (app.store.sound) { ensureAudio(); sfx('select'); }
    toast(app.store.sound ? 'サウンド ON' : 'サウンド OFF');
  }
  function cancelAll() {
    if (app.modalOpen) {
      if (app.modalDismissible) closeModal();
      return;
    }
    if (app.selected) clearSelection();
  }

  /* ============================================================
     Boot / listeners
     ============================================================ */
  function bind() {
    CL.board.addEventListener('click', onBoardClick);
    CL.board.addEventListener('keydown', onBoardKey);
    CL.hand.addEventListener('click', onHandClick);
    CL.scrim.addEventListener('click', closeDrawer);
    $('sideClose').addEventListener('click', closeDrawer);
    $('logBtn').addEventListener('click', openDrawer);
    $('stageBtn').addEventListener('click', openStageSelect);
    $('stageBtn2').addEventListener('click', openStageSelect);
    $('helpBtn').addEventListener('click', openHelp);
    $('helpBtn2').addEventListener('click', openHelp);
    $('hintBtn').addEventListener('click', openSolution);
    $('solutionBtn').addEventListener('click', openSolution);
    $('soundBtn').addEventListener('click', toggleSound);
    $('restartBtn').addEventListener('click', restartStage);
    $('endTurnBtn').addEventListener('click', endTurn);
    $('endTurnBtn2').addEventListener('click', endTurn);
    CL.modal.addEventListener('click', event => {
      if (event.target === CL.modal && app.modalDismissible) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { cancelAll(); return; }
      if (app.modalOpen) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        const tag = (event.target && event.target.tagName) || '';
        if (tag === 'BUTTON') return;
        event.preventDefault();
        if (!app.selected) endTurn();
      } else if (event.key.toLowerCase() === 'h') {
        openSolution();
      } else if (event.key.toLowerCase() === 'r') {
        restartStage();
      } else if (event.key.toLowerCase() === 'm') {
        toggleSound();
      }
    });
    document.addEventListener('pointerdown', () => { if (app.store.sound) ensureAudio(); }, { once: true });
    window.addEventListener('resize', () => { if (window.innerWidth > 1180) closeDrawer(); }, { passive: true });
  }

  function boot() {
    loadStore();
    $('soundBtn').classList.toggle('is-off', !app.store.sound);
    $('soundBtn').textContent = app.store.sound ? '♪' : '×';
    bind();
    const last = Number.isFinite(app.store.lastStage) ? app.store.lastStage : 0;
    loadStage(last, { showIntro: true });
    // Pause the timer while the intro is open.
    pauseTimer();
  }

  boot();
})();
