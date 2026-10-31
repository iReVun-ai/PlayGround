(() => {
  'use strict';

  /* ───────────────────────── CARD DATA ───────────────────────── */

  const CARD_LIB = {
    flame_wyrm: {
      id: 'flame_wyrm', name: '焔翼竜ヴァルガ', en: 'EMBER WYRM', type: 'monster', kind: 'WYRM',
      element: 'fire', color: '#ff7043', lv: 4, atk: 1800, def: 1200, glyph: '炎',
      text: '灼熱の翼を持つ飛竜。その一撃は盤面を焼き払う。'
    },
    tide_oracle: {
      id: 'tide_oracle', name: '蒼潮のリヴァ', en: 'TIDE ORACLE', type: 'monster', kind: 'AQUA',
      element: 'water', color: '#35baff', lv: 4, atk: 1600, def: 1400, glyph: '潮',
      text: '召喚時：自分のLPを300回復する。'
    },
    volt_hare: {
      id: 'volt_hare', name: '雷兎ボルトラ', en: 'VOLT HARE', type: 'monster', kind: 'BEAST',
      element: 'light', color: '#ffd45e', lv: 4, atk: 1700, def: 1000, glyph: '雷',
      text: '攻撃時：相手に200ダメージを与える。'
    },
    iron_bulwark: {
      id: 'iron_bulwark', name: '鉄壁ガーディアン', en: 'IRON BULWARK', type: 'monster', kind: 'GOLEM',
      element: 'earth', color: '#d7a761', lv: 4, atk: 700, def: 2300, glyph: '壁',
      text: '圧倒的な守備力で攻撃を受け止める城壁。'
    },
    night_fang: {
      id: 'night_fang', name: '夜牙ノクス', en: 'NIGHT FANG', type: 'monster', kind: 'FIEND',
      element: 'dark', color: '#b074ff', lv: 4, atk: 1500, def: 1500, glyph: '夜',
      text: '相手モンスターを無視して直接攻撃できる。'
    },
    gale_blade: {
      id: 'gale_blade', name: '風刃ハヤテ', en: 'GALE BLADE', type: 'monster', kind: 'WARRIOR',
      element: 'wind', color: '#5dffaf', lv: 4, atk: 1400, def: 1200, glyph: '風',
      text: '1ターンに2回攻撃できる。'
    },
    star_priestess: {
      id: 'star_priestess', name: '星詠みセレス', en: 'STAR SEER', type: 'monster', kind: 'SPELLCASTER',
      element: 'light', color: '#ffe08a', lv: 4, atk: 1100, def: 1900, glyph: '星',
      text: '召喚時：デッキから1枚ドローする。'
    },
    grave_hound: {
      id: 'grave_hound', name: '墓守のハウンド', en: 'GRAVE HOUND', type: 'monster', kind: 'BEAST',
      element: 'dark', color: '#8d79d9', lv: 4, atk: 1900, def: 800, glyph: '墓',
      text: '破壊された時：相手に400ダメージを与える。'
    },
    blaze_emperor: {
      id: 'blaze_emperor', name: '紅蓮皇アグニ', en: 'BLAZE EMPEROR', type: 'monster', kind: 'PYRO',
      element: 'fire', color: '#ff4d2e', lv: 6, atk: 2400, def: 1800, glyph: '皇',
      text: '生贄1体。召喚時：相手に500ダメージを与える。'
    },
    abyss_king: {
      id: 'abyss_king', name: '深淵王アビス', en: 'ABYSS KING', type: 'monster', kind: 'SEA SERPENT',
      element: 'water', color: '#247cff', lv: 6, atk: 2300, def: 2100, glyph: '淵',
      text: '生贄1体。召喚時：相手の魔法・罠を1枚破壊する。'
    },
    mecha_gear: {
      id: 'mecha_gear', name: '機神ギアス', en: 'MECHA GEAR', type: 'monster', kind: 'MACHINE',
      element: 'earth', color: '#b9c6d8', lv: 6, atk: 2200, def: 2400, glyph: '機',
      text: '生贄1体。このカードは戦闘では破壊されない。'
    },
    zero_dragon: {
      id: 'zero_dragon', name: '終焉竜ゼロ', en: 'ZERO DRAGON', type: 'monster', kind: 'DRAGON',
      element: 'dark', color: '#ff3d86', lv: 8, atk: 3000, def: 2500, glyph: '零',
      text: '生贄2体。召喚時：相手に700ダメージを与える。'
    },
    star_reading: {
      id: 'star_reading', name: '星読みの儀式', en: 'STAR READING', type: 'spell', kind: 'SPELL',
      element: 'spell', color: '#ffd36e', glyph: '読', text: 'デッキから2枚ドローする。'
    },
    repair: {
      id: 'repair', name: '修復プロトコル', en: 'REPAIR PROTOCOL', type: 'spell', kind: 'SPELL',
      element: 'spell', color: '#5dffaf', glyph: '癒', text: '自分のLPを1000回復する。'
    },
    meteor: {
      id: 'meteor', name: '隕石落下', en: 'METEOR FALL', type: 'spell', kind: 'SPELL',
      element: 'spell', color: '#ff8a3d', glyph: '隕', text: '相手に800ダメージを与える。'
    },
    gravity: {
      id: 'gravity', name: '重力崩壊', en: 'GRAVITY COLLAPSE', type: 'spell', kind: 'SPELL',
      element: 'spell', color: '#9b7bff', glyph: '重', text: '相手の攻撃力が最も高いモンスターを破壊する。'
    },
    overclock: {
      id: 'overclock', name: 'オーバークロック', en: 'OVERCLOCK', type: 'spell', kind: 'SPELL',
      element: 'spell', color: '#45e8ff', glyph: '速', text: '自分のモンスター1体のATKを1000アップする。'
    },
    red_blade: {
      id: 'red_blade', name: '紅蓮の剣', en: 'CRIMSON BLADE', type: 'spell', kind: 'SPELL',
      element: 'spell', color: '#ff5c5c', glyph: '剣', text: '自分のモンスター1体に+700 ATKを付与する。'
    },
    mirror_veil: {
      id: 'mirror_veil', name: 'ミラー・ヴェール', en: 'MIRROR VEIL', type: 'trap', kind: 'TRAP',
      element: 'trap', color: '#ff5b9e', glyph: '鏡', text: '相手の攻撃を無効にし、相手に500ダメージを与える。'
    },
    dimension_hole: {
      id: 'dimension_hole', name: '次元の穴', en: 'DIMENSION HOLE', type: 'trap', kind: 'TRAP',
      element: 'trap', color: '#a16bff', glyph: '穴', text: '相手がモンスターを召喚した時、そのモンスターを破壊する。'
    },
    binding_chain: {
      id: 'binding_chain', name: '呪縛の鎖', en: 'BINDING CHAIN', type: 'trap', kind: 'TRAP',
      element: 'trap', color: '#7b8dff', glyph: '鎖', text: '相手の攻撃を無効にし、そのモンスターのATKを0にする。'
    },
    counter_signal: {
      id: 'counter_signal', name: '反撃の狼煙', en: 'COUNTER SIGNAL', type: 'trap', kind: 'TRAP',
      element: 'trap', color: '#ff9b5e', glyph: '煙', text: '戦闘ダメージを受けた時、同じダメージを相手に与える。'
    }
  };

  const DECK_LIST = [
    ['flame_wyrm', 2], ['tide_oracle', 1], ['volt_hare', 2], ['iron_bulwark', 1],
    ['night_fang', 1], ['gale_blade', 1], ['star_priestess', 1], ['grave_hound', 1],
    ['blaze_emperor', 1], ['abyss_king', 1], ['mecha_gear', 1], ['zero_dragon', 1],
    ['star_reading', 1], ['repair', 1], ['meteor', 1], ['gravity', 1], ['overclock', 1], ['red_blade', 1],
    ['mirror_veil', 1], ['dimension_hole', 1], ['binding_chain', 1], ['counter_signal', 1]
  ];

  const PLAYER_NAME = "11ai'ame";
  const RIVAL_NAME = 'H大好き分岐ｵﾚ';
  const MAX_HP = 9999;
  const START_LP = 4000;
  const HAND_LIMIT = 8;

  /* ───────────────────────── HELPERS ───────────────────────── */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const pad2 = (value) => String(value).padStart(2, '0');
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const otherSide = (side) => (side === 'player' ? 'rival' : 'player');
  const sideLabel = (side) => (side === 'player' ? PLAYER_NAME : RIVAL_NAME);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let uidCounter = 0;
  const newCard = (id) => ({ uid: `c${++uidCounter}`, id });
  const cardDef = (card) => CARD_LIB[card.id];
  const isMonster = (card) => cardDef(card).type === 'monster';

  function makeDeck() {
    const cards = [];
    for (const [id, count] of DECK_LIST) {
      for (let i = 0; i < count; i += 1) cards.push(newCard(id));
    }
    return shuffle(cards);
  }

  function makeSide() {
    return {
      lp: START_LP,
      deck: [],
      hand: [],
      monster: Array(6).fill(null),
      spell: Array(6).fill(null),
      gy: [],
      summonUsed: false
    };
  }

  const state = {
    version: 0,
    started: false,
    over: false,
    busy: false,
    turn: 'player',
    round: 0,
    turnSeq: 0,
    player: makeSide(),
    rival: makeSide(),
    sel: null,
    mode: null,
    pending: null,
    log: [],
    stats: { damage: 0, destroyed: 0 },
    sound: true,
    _lp: { player: START_LP, rival: START_LP },
    _handKey: '',
    _feedTimers: []
  };

  const side = (name) => (name === 'player' ? state.player : state.rival);

  function zoneRef(name, row, index) {
    return side(name)[row][index];
  }

  function zoneEl(name, row, index) {
    const id = name === 'player'
      ? (row === 'monster' ? 'playerMonsterRow' : 'playerSpellRow')
      : (row === 'monster' ? 'rivalMonsterRow' : 'rivalSpellRow');
    return document.querySelector(`#${id} .zone[data-index="${index}"]`);
  }

  function cardEl(name, row, index) {
    const zone = zoneEl(name, row, index);
    return zone ? zone.querySelector('.card') : null;
  }

  function panelEl(name) {
    return name === 'player' ? els.playerPanel : els.rivalPanel;
  }

  function tributeCount(lv) {
    if (lv >= 7) return 2;
    if (lv >= 5) return 1;
    return 0;
  }

  function atkOf(slot) {
    if (!slot) return 0;
    const base = cardDef(slot.card);
    return Math.max(0, slot.atkZero ? 0 : base.atk + (slot.tempAtk || 0) + (slot.equipAtk || 0));
  }

  function defOf(slot) {
    return slot ? cardDef(slot.card).def : 0;
  }

  function aliveMonsters(name) {
    return side(name).monster.filter(Boolean);
  }

  function emptyMonsterZones(name) {
    return side(name).monster.reduce((total, slot) => total + (slot ? 0 : 1), 0);
  }

  function emptySpellZones(name) {
    return side(name).spell.reduce((total, slot) => total + (slot ? 0 : 1), 0);
  }

  function cardTypeTitle(card) {
    const def = cardDef(card);
    if (def.type === 'monster') return `LV${def.lv} / ${def.kind}`;
    return def.type === 'spell' ? 'SPELL CARD / 魔法' : 'TRAP CARD / 罠';
  }

  function cardSummary(card) {
    const def = cardDef(card);
    if (def.type === 'monster') return `ATK ${def.atk} / DEF ${def.def}｜${def.text}`;
    return def.text;
  }

  /* ───────────────────────── DOM ───────────────────────── */

  const els = {
    app: $('#app'),
    landing: $('#landing'),
    startBtn: $('#startBtn'),
    howBtn: $('#howBtn'),
    helpBtn: $('#helpBtn'),
    logBtn: $('#logBtn'),
    soundBtn: $('#soundBtn'),
    restartBtn: $('#restartBtn'),
    board: $('#board'),
    hand: $('#hand'),
    handCount: $('#handCount'),
    playerHandCount: $('#playerHandCount'),
    playerDeck: $('#playerDeck'),
    rivalDeck: $('#rivalDeck'),
    rivalHand: $('#rivalHand'),
    rivalGY: $('#rivalGY'),
    playerGY: $('#playerGY'),
    deckCount: $('#deckCount'),
    rivalHandVisual: $('#rivalHandVisual'),
    playerMonsterCount: $('#playerMonsterCount'),
    playerSpellCount: $('#playerSpellCount'),
    playerLP: $('#playerLP'),
    rivalLP: $('#rivalLP'),
    playerLPBar: $('#playerLPBar'),
    rivalLPBar: $('#rivalLPBar'),
    playerPanel: $('#playerPanel'),
    rivalPanel: $('#rivalPanel'),
    playerStatus: $('#playerStatus'),
    rivalStatus: $('#rivalStatus'),
    playerTurnPip: $('#playerTurnPip'),
    rivalTurnPip: $('#rivalTurnPip'),
    turnLabel: $('#turnLabel'),
    phaseLabel: $('#phaseLabel'),
    liveDot: $('#liveDot'),
    turnBanner: $('#turnBanner'),
    targetHint: $('#targetHint'),
    eventFeed: $('#eventFeed'),
    contextKicker: $('#contextKicker'),
    contextTitle: $('#contextTitle'),
    contextText: $('#contextText'),
    actionButtons: $('#actionButtons'),
    endTurnBtn: $('#endTurnBtn'),
    endModal: $('#endModal'),
    endCard: $('.end-card'),
    endKicker: $('#endKicker'),
    endTitle: $('#endTitle'),
    endText: $('#endText'),
    endTurns: $('#endTurns'),
    endDamage: $('#endDamage'),
    endDestroyed: $('#endDestroyed'),
    rematchBtn: $('#rematchBtn'),
    backTitleBtn: $('#backTitleBtn'),
    helpModal: $('#helpModal'),
    logModal: $('#logModal'),
    graveModal: $('#graveModal'),
    logList: $('#logList'),
    graveGrid: $('#graveGrid'),
    graveTitle: $('#graveTitle'),
    toastStack: $('#toastStack')
  };

  /* ───────────────────────── COSMOS BACKGROUND ───────────────────────── */

  const canvas = $('#cosmos');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let dust = [];
  let shooting = null;
  let lastShoot = 0;
  let pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = window.innerWidth < 700 ? 76 : 150;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 0.8 + 0.2,
      r: Math.random() * 1.4 + 0.3,
      p: Math.random() * Math.PI * 2,
      c: Math.random() > 0.78 ? (Math.random() > 0.5 ? '69,232,255' : '255,61,134') : '210,235,255'
    }));
    dust = Array.from({ length: window.innerWidth < 700 ? 18 : 34 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.4,
      v: Math.random() * 0.12 + 0.02,
      a: Math.random() * 0.3 + 0.06
    }));
  }

  function drawCosmos(time) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    pointer.x += (pointer.tx - pointer.x) * 0.025;
    pointer.y += (pointer.ty - pointer.y) * 0.025;

    for (const s of stars) {
      const twinkle = 0.38 + Math.sin(time * 0.0012 + s.p) * 0.24;
      const x = s.x + pointer.x * s.z * 9;
      const y = s.y + pointer.y * s.z * 9;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${s.c},${clamp(twinkle, 0.08, 0.8)})`;
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.2) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.c},0.08)`;
        ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const d of dust) {
      d.y -= d.v;
      if (d.y < -4) {
        d.y = h + 4;
        d.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(166,247,255,${d.a})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (time - lastShoot > 5200 && Math.random() > 0.82) {
      lastShoot = time;
      shooting = {
        x: Math.random() * w * 0.72,
        y: -20,
        vx: 220 + Math.random() * 160,
        vy: 120 + Math.random() * 90,
        life: 1
      };
    }
    if (shooting) {
      const s = shooting;
      s.x += s.vx * 0.016;
      s.y += s.vy * 0.016;
      s.life -= 0.012;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - 60, s.y - 34);
      grad.addColorStop(0, `rgba(210,248,255,${s.life})`);
      grad.addColorStop(1, 'rgba(69,232,255,0)');
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 60, s.y - 34);
      ctx.stroke();
      if (s.life <= 0) shooting = null;
    }

    if (!reduceMotion) requestAnimationFrame(drawCosmos);
  }

  resizeCanvas();
  requestAnimationFrame(drawCosmos);
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ───────────────────────── RENDERING ───────────────────────── */

  function buildField() {
    const rows = [
      ['rivalSpellRow', 'rival', 'spell'],
      ['rivalMonsterRow', 'rival', 'monster'],
      ['playerMonsterRow', 'player', 'monster'],
      ['playerSpellRow', 'player', 'spell']
    ];
    for (const [id, owner, row] of rows) {
      const container = document.getElementById(id);
      container.innerHTML = '';
      for (let index = 0; index < 6; index += 1) {
        const zone = document.createElement('div');
        zone.className = 'zone';
        zone.dataset.side = owner;
        zone.dataset.row = row;
        zone.dataset.index = String(index);
        zone.dataset.occupied = 'false';
        zone.setAttribute('role', 'button');
        zone.tabIndex = 0;
        container.appendChild(zone);
      }
    }
  }

  function zoneSignature(slot) {
    if (!slot) return 'empty';
    return [
      slot.card.uid,
      slot.faceDown ? 1 : 0,
      slot.faceDown ? 'hidden' : slot.pos,
      slot.attacked ? 1 : 0,
      slot.attacks || 0,
      slot.atkZero ? 1 : 0,
      slot.tempAtk || 0,
      slot.equipAtk || 0
    ].join('|');
  }

  function createCardElement(card, options = {}) {
    const def = cardDef(card);
    const el = document.createElement('div');
    el.className = 'card';
    el.style.setProperty('--el', def.color);
    el.dataset.cardId = card.id;
    if (def.type === 'spell') el.classList.add('is-spell');
    if (def.type === 'trap') el.classList.add('is-trap');
    if (options.owner === 'rival') el.classList.add('is-opponent');
    if (options.faceDown) el.classList.add('is-face-down');
    if (options.setVisible) el.classList.add('is-set');
    if (options.exhausted) el.classList.add('exhausted');
    if (options.animate === false) el.style.animation = 'none';

    const level = def.type === 'monster'
      ? `LV${def.lv}`
      : (def.type === 'spell' ? 'MAGIC' : 'TRAP');
    const type = def.type === 'monster' ? def.kind : def.en;
    const foot = def.type === 'monster'
      ? `<span class="card-atk"><span class="card-stat-label">ATK</span><b>${def.atk}</b></span><span class="card-def"><span class="card-stat-label">DEF</span><b>${def.def}</b></span>`
      : `<span class="card-kind">${def.type === 'spell' ? 'SPELL' : 'TRAP'}</span><span class="card-status">${options.faceDown || options.setVisible ? 'SET' : 'READY'}</span>`;
    const position = options.position
      ? `<span class="card-position ${options.position === 'defense' ? 'def' : ''}">${options.position === 'defense' ? 'DEF' : 'ATK'}</span>`
      : '';

    el.innerHTML = `
      <span class="back-sigil"></span>
      <div class="card-top"><span class="card-level">${level}</span><span class="card-type">${type}</span></div>
      <div class="card-art"><span class="card-sigil">${def.glyph}</span><span class="card-element">${def.element.toUpperCase()}</span></div>
      <div class="card-name"><strong>${def.name}</strong><small>${def.en}</small></div>
      <div class="card-foot">${foot}</div>
      ${position}
      ${options.setVisible ? '<span class="set-mark">SET</span>' : ''}
    `;
    return el;
  }

  function getHighlights() {
    return {
      placeMonster: state.mode === 'placeMonster' && state.turn === 'player' && !state.busy && !state.over,
      placeSpell: state.mode === 'placeSpell' && state.turn === 'player' && !state.busy && !state.over,
      tribute: state.mode === 'tribute' && state.turn === 'player' && !state.busy && !state.over,
      targetOwn: state.mode === 'targetOwn' && state.turn === 'player' && !state.busy && !state.over,
      attack: state.mode === 'attack' && state.turn === 'player' && !state.busy && !state.over
    };
  }

  function renderZones() {
    const highlights = getHighlights();
    const tributes = state.pending && state.pending.tributes ? state.pending.tributes : [];
    for (const owner of ['player', 'rival']) {
      for (const row of ['monster', 'spell']) {
        for (let index = 0; index < 6; index += 1) {
          const zone = zoneEl(owner, row, index);
          if (!zone) continue;
          const slot = zoneRef(owner, row, index);
          const sig = zoneSignature(slot);
          if (zone.dataset.sig !== sig) {
            zone.innerHTML = '';
            if (slot) {
              const isFaceDown = slot.faceDown && owner === 'rival';
              const setVisible = slot.faceDown && owner === 'player';
              zone.appendChild(createCardElement(slot.card, {
                owner,
                faceDown: isFaceDown,
                setVisible,
                position: slot.faceDown
                  ? (owner === 'player' && row === 'monster' ? 'defense' : null)
                  : (row === 'monster' ? slot.pos : null),
                exhausted: Boolean(slot.attacked)
              }));
            }
            zone.dataset.sig = sig;
          }

          zone.className = 'zone';
          zone.dataset.occupied = slot ? 'true' : 'false';

          let valid = false;
          let target = false;
          if (highlights.placeMonster && owner === 'player' && row === 'monster' && (!slot || tributes.includes(index))) valid = true;
          if (highlights.placeSpell && owner === 'player' && row === 'spell' && !slot) valid = true;
          if (highlights.tribute && owner === 'player' && row === 'monster' && slot) valid = true;
          if (highlights.targetOwn && owner === 'player' && row === 'monster' && slot && !slot.faceDown) valid = true;
          if (highlights.attack && owner === 'rival' && row === 'monster' && slot) target = true;

          if (valid) zone.classList.add('is-valid');
          if (target) zone.classList.add('is-target');
          if (tributes.includes(index) && owner === 'player' && row === 'monster') zone.classList.add('is-selected');

          if (state.sel && state.sel.type === 'zone' && state.sel.owner === owner && state.sel.row === row && state.sel.index === index) {
            zone.classList.add('is-selected');
          }
          if (slot && owner === 'player' && state.turn === 'player' && !state.busy && !state.over) {
            zone.classList.add('is-clickable');
          }

          const cardName = slot
            ? (slot.faceDown && owner === 'rival' ? '裏側のカード' : cardDef(slot.card).name)
            : '空きゾーン';
          const sideName = owner === 'player' ? '自分' : '相手';
          const rowName = row === 'monster' ? 'モンスター' : '魔法・罠';
          zone.setAttribute('aria-label', `${sideName}の${rowName}ゾーン ${index + 1}、${cardName}${valid ? '、選択可能' : ''}${target ? '、攻撃対象' : ''}`);
        }
      }
    }
  }

  function renderHand() {
    const hand = state.player.hand;
    const key = hand.map((card) => card.uid).join(',');
    if (els.hand.dataset.key !== key) {
      els.hand.innerHTML = '';
      if (!hand.length) {
        const empty = document.createElement('div');
        empty.className = 'hand-empty';
        empty.textContent = 'NO CARDS IN HAND';
        els.hand.appendChild(empty);
      } else {
        hand.forEach((card, index) => {
          const offset = index - (hand.length - 1) / 2;
          const wrapper = document.createElement('button');
          wrapper.type = 'button';
          wrapper.className = 'hand-card';
          wrapper.dataset.uid = card.uid;
          wrapper.style.setProperty('--i', index);
          wrapper.style.setProperty('--hand-rot', `${(offset * 3.1).toFixed(2)}deg`);
          wrapper.style.setProperty('--hand-y', `${(Math.abs(offset) * 2.4).toFixed(2)}px`);
          wrapper.setAttribute('aria-label', `${cardDef(card).name}。${cardSummary(card)}`);
          wrapper.appendChild(createCardElement(card, { owner: 'player' }));
          els.hand.appendChild(wrapper);
        });
      }
      els.hand.dataset.key = key;
    }

    const locked = state.turn !== 'player' || state.busy || state.over;
    const selectedUid = state.sel && state.sel.type === 'hand' ? state.sel.uid : null;
    $$('.hand-card', els.hand).forEach((wrapper) => {
      wrapper.classList.toggle('is-selected', wrapper.dataset.uid === selectedUid);
      wrapper.classList.toggle('is-disabled', locked);
      wrapper.disabled = locked;
    });
    els.handCount.textContent = pad2(hand.length);
  }

  function renderLP(owner, animateChange = false) {
    const data = side(owner);
    const valueEl = owner === 'player' ? els.playerLP : els.rivalLP;
    const barEl = owner === 'player' ? els.playerLPBar : els.rivalLPBar;
    const previous = state._lp[owner];
    valueEl.textContent = String(data.lp);
    barEl.style.transform = `scaleX(${clamp(data.lp / START_LP, 0, 1)})`;
    if (previous !== data.lp) {
      if (animateChange) {
        valueEl.classList.remove('is-hit');
        void valueEl.offsetWidth;
        valueEl.classList.add('is-hit');
        setTimeout(() => valueEl.classList.remove('is-hit'), 520);
      }
      state._lp[owner] = data.lp;
    }
    const panel = panelEl(owner);
    panel.classList.toggle('is-low', data.lp > 0 && data.lp <= 1000);
  }

  function renderPanels() {
    const player = state.player;
    const rival = state.rival;
    els.playerDeck.textContent = pad2(player.deck.length);
    els.rivalDeck.textContent = pad2(rival.deck.length);
    els.playerHandCount.textContent = pad2(player.hand.length);
    els.rivalHand.textContent = pad2(rival.hand.length);
    els.deckCount.textContent = pad2(player.deck.length);
    els.playerGY.textContent = pad2(player.gy.length);
    els.rivalGY.textContent = pad2(rival.gy.length);
    els.playerMonsterCount.textContent = player.monster.filter(Boolean).length;
    els.playerSpellCount.textContent = player.spell.filter(Boolean).length;

    const rivalKey = rival.hand.map((card) => card.uid).join(',');
    if (els.rivalHandVisual.dataset.key !== rivalKey) {
      els.rivalHandVisual.innerHTML = '';
      rival.hand.forEach((_, index) => {
        const back = document.createElement('div');
        back.className = 'mini-back';
        back.style.setProperty('--r', `${(index - (rival.hand.length - 1) / 2) * 4}deg`);
        back.style.setProperty('--y', `${Math.abs(index - (rival.hand.length - 1) / 2) * 2}px`);
        els.rivalHandVisual.appendChild(back);
      });
      els.rivalHandVisual.dataset.key = rivalKey;
    }

    const playerActive = state.started && !state.over && state.turn === 'player';
    const rivalActive = state.started && !state.over && state.turn === 'rival';
    els.playerPanel.classList.toggle('is-active', playerActive);
    els.rivalPanel.classList.toggle('is-active', rivalActive);
    els.playerTurnPip.textContent = pad2(state.round || 0);
    els.rivalTurnPip.textContent = pad2(state.round || 0);

    if (!state.started) {
      els.phaseLabel.textContent = 'STANDBY';
      els.playerStatus.textContent = 'READY';
      els.rivalStatus.textContent = 'AWAITING DUEL';
    } else if (state.over) {
      els.phaseLabel.textContent = 'DUEL OVER';
      els.playerStatus.textContent = 'DUEL COMPLETE';
      els.rivalStatus.textContent = 'DUEL COMPLETE';
    } else if (state.turn === 'player') {
      els.phaseLabel.textContent = state.busy ? 'RESOLVING' : 'YOUR TURN';
      els.playerStatus.textContent = state.busy ? 'RESOLVING…' : 'YOUR TURN';
      els.rivalStatus.textContent = 'STANDBY';
    } else {
      els.phaseLabel.textContent = state.busy ? 'RIVAL THINKING' : 'RIVAL TURN';
      els.playerStatus.textContent = 'STANDBY';
      els.rivalStatus.textContent = state.busy ? 'THINKING…' : 'RIVAL TURN';
    }

    els.turnLabel.textContent = `TURN ${pad2(state.round || 0)}`;
    els.endTurnBtn.disabled = !state.started || state.over || state.busy || state.turn !== 'player';
    renderLP('player');
    renderLP('rival');
  }

  function updateContext() {
    if (!state.started) {
      els.contextKicker.textContent = 'COMMAND';
      els.contextTitle.textContent = 'デュエル開始を待機中';
      els.contextText.textContent = 'START GAME でデュエルを開始。';
      return;
    }
    if (state.over) {
      els.contextKicker.textContent = 'DUEL COMPLETE';
      els.contextTitle.textContent = state.player.lp > 0 ? '勝利。' : '敗北。';
      els.contextText.textContent = 'REMATCH でもう一度デュエルする。';
      return;
    }
    if (state.busy && state.turn === 'player') {
      els.contextKicker.textContent = 'RESOLVING';
      els.contextTitle.textContent = '処理中…';
      els.contextText.textContent = 'カード効果と戦闘を解決しています。';
      return;
    }
    if (state.turn !== 'player') {
      els.contextKicker.textContent = 'RIVAL TURN';
      els.contextTitle.textContent = '相手のターン';
      els.contextText.textContent = 'LPが0になるまで、盤面を見守れ。';
      return;
    }

    if (state.mode === 'tribute') {
      const have = state.pending.tributes.length;
      const need = state.pending.req;
      els.contextKicker.textContent = 'TRIBUTE SUMMON';
      els.contextTitle.textContent = `生贄を選択 ${have} / ${need}`;
      els.contextText.textContent = '自分のモンスターをタップして生贄にする。';
      return;
    }
    if (state.mode === 'placeMonster') {
      els.contextKicker.textContent = state.pending.faceDown ? 'SET MONSTER' : 'SUMMON';
      els.contextTitle.textContent = 'モンスターゾーンを選択';
      els.contextText.textContent = state.pending.faceDown ? '裏側守備表示でセットする。' : '表側攻撃表示で召喚する。';
      return;
    }
    if (state.mode === 'placeSpell') {
      els.contextKicker.textContent = 'SET CARD';
      els.contextTitle.textContent = '魔法・罠ゾーンを選択';
      els.contextText.textContent = 'カードを伏せて配置する。';
      return;
    }
    if (state.mode === 'attack') {
      els.contextKicker.textContent = 'BATTLE';
      els.contextTitle.textContent = '攻撃対象を選択';
      els.contextText.textContent = canDirectAttack(state.pending.attacker)
        ? '相手モンスター、または DIRECT ATTACK を選択。'
        : '相手モンスターをタップして攻撃。';
      return;
    }
    if (state.mode === 'targetOwn') {
      els.contextKicker.textContent = 'TARGET';
      els.contextTitle.textContent = '対象モンスターを選択';
      els.contextText.textContent = '自分の表側モンスター1体を選択する。';
      return;
    }

    if (state.sel) {
      const card = selectedCard();
      if (!card) return;
      const def = cardDef(card);
      els.contextKicker.textContent = cardTypeTitle(card);
      els.contextTitle.textContent = def.name;
      els.contextText.textContent = cardSummary(card);
      return;
    }

    els.contextKicker.textContent = 'COMMAND';
    els.contextTitle.textContent = 'カードを選択';
    els.contextText.textContent = '手札をタップして、サモン・セット・発動。';
  }

  function addActionButton(label, sub, action, extraClass = '', disabled = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-btn ${extraClass}`;
    button.dataset.act = action;
    button.disabled = disabled;
    button.innerHTML = `${label}${sub ? `<small>${sub}</small>` : ''}`;
    if (disabled) button.title = '現在は使用できません';
    els.actionButtons.appendChild(button);
  }

  function renderActions() {
    els.actionButtons.innerHTML = '';
    if (!state.started || state.over || state.busy || state.turn !== 'player') return;

    if (state.mode === 'tribute') {
      addActionButton('CANCEL', 'キャンセル', 'cancel', 'muted');
      return;
    }
    if (state.mode === 'placeMonster' || state.mode === 'placeSpell' || state.mode === 'targetOwn') {
      addActionButton('CANCEL', 'キャンセル', 'cancel', 'muted');
      return;
    }
    if (state.mode === 'attack') {
      if (canDirectAttack(state.pending.attacker)) addActionButton('DIRECT', '直接攻撃', 'direct', 'danger');
      addActionButton('CANCEL', 'キャンセル', 'cancel', 'muted');
      return;
    }

    if (!state.sel) return;

    if (state.sel.type === 'hand') {
      const card = selectedCard();
      if (!card) return;
      const def = cardDef(card);
      if (def.type === 'monster') {
        const canSummon = canPlaceSummon(card);
        addActionButton('SUMMON', '召喚', 'summon', '', !canSummon);
        addActionButton('SET', '伏せ', 'setMonster', 'gold', !canSummon);
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      } else if (def.type === 'spell') {
        addActionButton('ACTIVATE', '発動', 'activate', '', spellTargetMissing(card));
        addActionButton('SET', '伏せ', 'setSpell', 'gold', emptySpellZones('player') === 0);
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      } else {
        addActionButton('SET', '伏せ', 'setSpell', 'gold', emptySpellZones('player') === 0);
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      }
      return;
    }

    if (state.sel.type === 'zone' && state.sel.owner === 'player') {
      const slot = zoneRef('player', state.sel.row, state.sel.index);
      if (!slot) {
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
        return;
      }
      const def = cardDef(slot.card);
      if (state.sel.row === 'monster') {
        if (slot.faceDown) {
          addActionButton('FLIP', '反転召喚', 'flip', '', slot.setSeq >= state.turnSeq);
        } else if (slot.pos === 'attack') {
          addActionButton('ATTACK', '攻撃', 'attack', '', slot.attacked || slot.positionChanged);
          addActionButton('DEFEND', '守備へ', 'position', 'gold', slot.positionChanged || slot.attacked);
        } else {
          addActionButton('ATTACK POS', '攻撃表示', 'position', 'gold', slot.positionChanged || slot.attacked);
        }
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      } else if (def.type === 'spell' && slot.faceDown) {
        addActionButton('ACTIVATE', '発動', 'activateSet', '', slot.setSeq >= state.turnSeq || spellTargetMissing(slot.card));
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      } else if (def.type === 'trap' && slot.faceDown) {
        els.contextText.textContent = '伏せた罠は条件を満たすと自動で発動する。';
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      } else {
        addActionButton('CANCEL', '戻す', 'cancel', 'muted');
      }
    }
  }

  function renderAll() {
    renderPanels();
    renderHand();
    renderZones();
    updateContext();
    renderActions();
  }

  function selectedCard() {
    if (!state.sel) return null;
    if (state.sel.type === 'hand') {
      return state.player.hand.find((card) => card.uid === state.sel.uid) || null;
    }
    const slot = zoneRef(state.sel.owner, state.sel.row, state.sel.index);
    return slot ? slot.card : null;
  }

  function selectedSlot() {
    if (!state.sel || state.sel.type !== 'zone') return null;
    return zoneRef(state.sel.owner, state.sel.row, state.sel.index);
  }

  function clearSelection() {
    state.sel = null;
    state.mode = null;
    state.pending = null;
    els.targetHint.classList.remove('show');
  }

  /* ───────────────────────── FEEDBACK ───────────────────────── */

  function logDuel(text, kind = 'neutral') {
    state.log.push({ turn: state.round, text, kind });
    if (state.log.length > 120) state.log.shift();
    refreshOpenLog();
  }

  function feed(text, kind = 'player') {
    const line = document.createElement('div');
    line.className = `event-line ${kind}`;
    line.textContent = text;
    els.eventFeed.appendChild(line);
    while (els.eventFeed.children.length > 4) els.eventFeed.firstElementChild.remove();
    const timer = setTimeout(() => {
      line.classList.add('fade');
      setTimeout(() => line.remove(), 460);
    }, 4200);
    state._feedTimers.push(timer);
  }

  function toast(text, kind = '') {
    const item = document.createElement('div');
    item.className = `toast ${kind}`;
    item.textContent = text;
    els.toastStack.appendChild(item);
    while (els.toastStack.children.length > 3) els.toastStack.firstElementChild.remove();
    setTimeout(() => {
      item.classList.add('fade');
      setTimeout(() => item.remove(), 360);
    }, 2400);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = true;
    if (!$$('.modal-layer:not([hidden])').length) document.body.classList.remove('modal-open');
  }

  function renderLog() {
    els.logList.innerHTML = '';
    if (!state.log.length) {
      const empty = document.createElement('div');
      empty.className = 'log-entry';
      empty.innerHTML = '<b>—</b><span>まだ記録はない。</span>';
      els.logList.appendChild(empty);
      return;
    }
    for (const entry of state.log) {
      const row = document.createElement('div');
      row.className = `log-entry ${entry.kind}`;
      row.innerHTML = `<b>T${pad2(entry.turn)}</b><span>${entry.text}</span>`;
      els.logList.appendChild(row);
    }
    els.logList.scrollTop = els.logList.scrollHeight;
  }

  function refreshOpenLog() {
    if (!els.logModal.hidden) renderLog();
  }

  function openGrave(owner) {
    const grave = side(owner).gy;
    els.graveTitle.textContent = `${sideLabel(owner)} の墓地`;
    els.graveGrid.innerHTML = '';
    if (!grave.length) {
      const empty = document.createElement('div');
      empty.className = 'grave-empty';
      empty.textContent = '墓地は空です。';
      els.graveGrid.appendChild(empty);
    } else {
      grave.forEach((card) => {
        const holder = document.createElement('div');
        holder.className = 'grave-card';
        holder.appendChild(createCardElement(card, { owner, animate: false }));
        els.graveGrid.appendChild(holder);
      });
    }
    openModal('graveModal');
  }

  /* ───────────────────────── MATCH FLOW ───────────────────────── */

  function dealInitialHands() {
    for (let i = 0; i < 5; i += 1) {
      state.player.hand.push(state.player.deck.pop());
      state.rival.hand.push(state.rival.deck.pop());
    }
  }

  function resetMatch() {
    state.version += 1;
    state.started = true;
    state.over = false;
    state.busy = false;
    state.turn = 'player';
    state.round = 0;
    state.turnSeq = 0;
    state.player = makeSide();
    state.rival = makeSide();
    state.player.deck = makeDeck();
    state.rival.deck = makeDeck();
    dealInitialHands();
    state.sel = null;
    state.mode = null;
    state.pending = null;
    state.log = [];
    state.stats = { damage: 0, destroyed: 0 };
    state._lp = { player: START_LP, rival: START_LP };
    state._handKey = '';
    state._feedTimers.forEach(clearTimeout);
    state._feedTimers = [];
    els.eventFeed.innerHTML = '';
    els.toastStack.innerHTML = '';
    els.hand.dataset.key = '';
    els.rivalHandVisual.dataset.key = '';
    els.endModal.hidden = true;
    closeModal('helpModal');
    closeModal('logModal');
    closeModal('graveModal');
    logDuel('デュエル開始。LP 4000 / 24ゾーン。', 'gold');
    renderAll();
  }

  function startDuel() {
    if (state.started && !state.over) return;
    ensureAudio();
    sfx('start');
    resetMatch();
    els.landing.classList.add('is-hidden');
    document.body.classList.remove('preduel');
    els.startBtn.blur();
    setTimeout(() => {
      nextTurn('player');
    }, reduceMotion ? 40 : 180);
  }

  function drawCards(owner, count = 1) {
    const data = side(owner);
    for (let i = 0; i < count; i += 1) {
      if (!data.deck.length) {
        endGame(otherSide(owner), 'DECK OUT');
        toast(`${sideLabel(owner)} のデッキが尽きた。`, 'gold');
        return false;
      }
      const card = data.deck.pop();
      data.hand.push(card);
      if (data.hand.length > HAND_LIMIT) {
        const discarded = data.hand.shift();
        data.gy.push(discarded);
        logDuel(`${sideLabel(owner)} は手札上限で ${cardDef(discarded).name} を墓地へ送った。`, owner);
        feed(`${sideLabel(owner)} の手札上限`, owner);
      }
      if (owner === 'player') sfx('draw');
    }
    return true;
  }

  function showBanner(owner) {
    const banner = els.turnBanner;
    banner.classList.remove('show', 'rival');
    banner.querySelector('.banner-kicker').textContent = `TURN ${pad2(state.round)}`;
    banner.querySelector('.banner-text').textContent = owner === 'player' ? 'YOUR TURN' : 'RIVAL TURN';
    banner.querySelector('.banner-sub').textContent = owner === 'player' ? 'LPを0にせよ' : '分岐を守れ';
    if (owner === 'rival') banner.classList.add('rival');
    void banner.offsetWidth;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), reduceMotion ? 250 : 900);
  }

  function nextTurn(owner) {
    if (state.over) return;
    state.turn = owner;
    state.turnSeq += 1;
    if (owner === 'player') state.round += 1;
    const data = side(owner);
    data.summonUsed = false;
    for (const slot of data.monster) {
      if (!slot) continue;
      slot.attacked = false;
      slot.attacks = 0;
      slot.positionChanged = false;
    }
    clearSelection();
    state.busy = owner === 'rival';
    if (!drawCards(owner, 1)) return;
    renderAll();
    showBanner(owner);
    logDuel(`${sideLabel(owner)} のターン。`, owner);
    feed(owner === 'player' ? 'YOUR TURN — カードを選択' : 'RIVAL TURN — 思考中', owner);
    if (owner === 'player') {
      sfx('turn');
    } else {
      const version = state.version;
      setTimeout(() => {
        if (version === state.version) runAI(version);
      }, reduceMotion ? 260 : 950);
    }
  }

  function clearTempBuffs(owner) {
    const data = side(owner);
    let changed = false;
    for (const slot of data.monster) {
      if (!slot) continue;
      if (slot.tempAtk) {
        slot.tempAtk = 0;
        changed = true;
      }
      if (slot.atkZero) {
        slot.atkZero = false;
        changed = true;
      }
    }
    return changed;
  }

  function endTurn() {
    if (!state.started || state.over || state.busy || state.turn !== 'player') return;
    clearSelection();
    const changed = clearTempBuffs('player');
    state.busy = true;
    renderAll();
    if (changed) {
      feed('一時効果が終了した。', 'gold');
    }
    logDuel(`${PLAYER_NAME} はターンを終了した。`, 'player');
    sfx('turn');
    const version = state.version;
    setTimeout(() => {
      if (version !== state.version || state.over) return;
      nextTurn('rival');
    }, reduceMotion ? 100 : 380);
  }

  function endRivalTurn() {
    if (state.over) return;
    clearSelection();
    clearTempBuffs('rival');
    state.busy = true;
    renderAll();
    logDuel(`${RIVAL_NAME} はターンを終了した。`, 'rival');
    const version = state.version;
    setTimeout(() => {
      if (version !== state.version || state.over) return;
      nextTurn('player');
    }, reduceMotion ? 120 : 520);
  }

  /* ───────────────────────── SELECTION ───────────────────────── */

  function selectHand(uid) {
    if (!state.started || state.over || state.busy || state.turn !== 'player') return;
    if (state.sel && state.sel.type === 'hand' && state.sel.uid === uid && !state.mode) {
      clearSelection();
      renderAll();
      return;
    }
    clearSelection();
    state.sel = { type: 'hand', uid };
    sfx('select');
    renderAll();
  }

  function selectZone(owner, row, index) {
    if (!state.started || state.over || state.busy || state.turn !== 'player') return;
    if (state.sel && state.sel.type === 'zone' && state.sel.owner === owner && state.sel.row === row && state.sel.index === index && !state.mode) {
      clearSelection();
      renderAll();
      return;
    }
    const slot = zoneRef(owner, row, index);
    if (!slot) {
      toast('空きゾーン。手札を選んで配置する。');
      return;
    }
    if (owner === 'rival') {
      if (slot.faceDown) {
        toast('裏側のカードは確認できない。', 'rival');
      } else {
        const def = cardDef(slot.card);
        toast(`${def.name}｜ATK ${atkOf(slot)} / DEF ${defOf(slot)}`, 'rival');
      }
      return;
    }
    clearSelection();
    state.sel = { type: 'zone', owner, row, index };
    sfx('select');
    renderAll();
  }

  function toggleTribute(index) {
    if (!state.pending || state.mode !== 'tribute') return;
    const slot = state.player.monster[index];
    if (!slot) return;
    const pos = state.pending.tributes.indexOf(index);
    if (pos >= 0) {
      state.pending.tributes.splice(pos, 1);
    } else if (state.pending.tributes.length < state.pending.req) {
      state.pending.tributes.push(index);
    }
    if (state.pending.tributes.length === state.pending.req) {
      state.mode = 'placeMonster';
      feed('生贄を確定。モンスターゾーンを選択。', 'gold');
      sfx('select');
    }
    renderAll();
  }

  /* ───────────────────────── PLAYER COMMANDS ───────────────────────── */

  function canDirectAttack(index) {
    const slot = state.player.monster[index];
    if (!slot) return false;
    if (cardDef(slot.card).id === 'night_fang') return true;
    return aliveMonsters('rival').length === 0;
  }

  function canPlaceSummon(card) {
    const def = cardDef(card);
    const req = tributeCount(def.lv);
    const enoughTributes = aliveMonsters('player').length >= req;
    const hasZone = emptyMonsterZones('player') > 0 || req > 0;
    return !state.player.summonUsed && enoughTributes && hasZone;
  }

  function spellTargetMissing(card) {
    const def = cardDef(card);
    if (def.id === 'overclock' || def.id === 'red_blade') {
      return !aliveMonsters('player').some((slot) => !slot.faceDown);
    }
    if (def.id === 'gravity') return aliveMonsters('rival').length === 0;
    return false;
  }

  function prepareSummon(faceDown) {
    if (!state.sel || state.sel.type !== 'hand') return;
    const card = selectedCard();
    if (!card || !isMonster(card)) return;
    if (state.player.summonUsed) {
      toast('このターンの召喚権はもう使った。', 'gold');
      return;
    }
    const def = cardDef(card);
    const req = tributeCount(def.lv);
    if (!emptyMonsterZones('player') && req === 0) {
      toast('モンスターゾーンが空いていない。', 'gold');
      return;
    }
    if (aliveMonsters('player').length < req) {
      toast(`生贄が ${req} 体必要。`, 'gold');
      return;
    }
    state.pending = {
      cardUid: card.uid,
      faceDown,
      req,
      tributes: []
    };
    if (req > 0) {
      state.mode = 'tribute';
      feed(`生贄を ${req} 体選択。`, 'gold');
    } else {
      state.mode = 'placeMonster';
      feed(faceDown ? '裏側守備でセット。' : '召喚するゾーンを選択。', 'gold');
    }
    sfx('select');
    renderAll();
  }

  function prepareSetSpell() {
    if (!state.sel || state.sel.type !== 'hand') return;
    const card = selectedCard();
    if (!card) return;
    const def = cardDef(card);
    if (def.type === 'monster') return;
    if (!emptySpellZones('player')) {
      toast('魔法・罠ゾーンが空いていない。', 'gold');
      return;
    }
    state.pending = { cardUid: card.uid };
    state.mode = 'placeSpell';
    feed('魔法・罠ゾーンを選択。', 'gold');
    sfx('select');
    renderAll();
  }

  function prepareAttack() {
    if (!state.sel || state.sel.type !== 'zone') return;
    const slot = selectedSlot();
    if (!slot || slot.faceDown || slot.pos !== 'attack' || slot.attacked) {
      toast('攻撃できない。', 'gold');
      return;
    }
    if (slot.positionChanged) {
      toast('表示形式を変更したモンスターは攻撃できない。', 'gold');
      return;
    }
    state.pending = { attacker: state.sel.index };
    state.mode = 'attack';
    els.targetHint.textContent = canDirectAttack(state.sel.index)
      ? '攻撃対象、または DIRECT ATTACK'
      : '攻撃対象のモンスターを選択';
    els.targetHint.classList.add('show');
    sfx('select');
    renderAll();
  }

  function flipSummon() {
    if (!state.sel || state.sel.type !== 'zone') return;
    const slot = selectedSlot();
    if (!slot || !slot.faceDown) return;
    if (slot.setSeq >= state.turnSeq) {
      toast('セットしたターンには反転できない。', 'gold');
      return;
    }
    const zoneIndex = state.sel.index;
    slot.faceDown = false;
    slot.pos = 'attack';
    slot.positionChanged = true;
    state.sel = null;
    sfx('summon');
    feed(`${PLAYER_NAME} は ${cardDef(slot.card).name} を反転召喚。`, 'player');
    logDuel(`${cardDef(slot.card).name} を反転召喚した。`, 'player');
    flashZone('player', 'monster', zoneIndex);
    renderAll();
  }

  function changePosition() {
    if (!state.sel || state.sel.type !== 'zone') return;
    const slot = selectedSlot();
    if (!slot || slot.faceDown) return;
    if (slot.positionChanged) {
      toast('このターンはもう表示形式を変更した。', 'gold');
      return;
    }
    slot.pos = slot.pos === 'attack' ? 'defense' : 'attack';
    slot.positionChanged = true;
    sfx('set');
    feed(`${cardDef(slot.card).name} を${slot.pos === 'attack' ? '攻撃' : '守備'}表示に変更。`, 'player');
    logDuel(`${cardDef(slot.card).name} の表示形式を変更。`, 'player');
    renderAll();
  }

  function handleAction(action) {
    if (!state.started || state.over || state.busy || state.turn !== 'player') return;
    switch (action) {
      case 'cancel':
        clearSelection();
        renderAll();
        break;
      case 'summon':
        prepareSummon(false);
        break;
      case 'setMonster':
        prepareSummon(true);
        break;
      case 'setSpell':
        prepareSetSpell();
        break;
      case 'activate':
        activateSelectedSpell();
        break;
      case 'activateSet':
        activateSelectedSetSpell();
        break;
      case 'attack':
        prepareAttack();
        break;
      case 'direct':
        if (state.mode === 'attack') {
          resolveBattle('player', state.pending.attacker, null, true);
        }
        break;
      case 'position':
        changePosition();
        break;
      case 'flip':
        flipSummon();
        break;
      default:
        break;
    }
  }

  function onHandClick(event) {
    const wrapper = event.target.closest('.hand-card');
    if (!wrapper || wrapper.disabled) return;
    const card = state.player.hand.find((item) => item.uid === wrapper.dataset.uid);
    if (!card) return;
    selectHand(card.uid);
  }

  function handleZoneActivate(zone) {
    if (!zone) return;
    const owner = zone.dataset.side;
    const row = zone.dataset.row;
    const index = Number(zone.dataset.index);
    if (!state.started || state.over || state.busy || state.turn !== 'player') return;
    const slot = zoneRef(owner, row, index);

    if (state.mode === 'placeMonster') {
      if (owner === 'player' && row === 'monster' && (!slot || state.pending.tributes.includes(index))) {
        performSummon('player', state.pending.cardUid, index, {
          faceDown: state.pending.faceDown,
          tributes: state.pending.tributes.slice()
        });
      } else {
        toast('空いているモンスターゾーンを選択。', 'gold');
      }
      return;
    }
    if (state.mode === 'placeSpell') {
      if (owner === 'player' && row === 'spell' && !slot) {
        performSetSpell('player', state.pending.cardUid, index);
      } else {
        toast('空いている魔法・罠ゾーンを選択。', 'gold');
      }
      return;
    }
    if (state.mode === 'tribute') {
      if (owner === 'player' && row === 'monster' && slot) toggleTribute(index);
      else toast('生贄にする自分のモンスターを選択。', 'gold');
      return;
    }
    if (state.mode === 'targetOwn') {
      if (owner === 'player' && row === 'monster' && slot && !slot.faceDown) {
        applyPendingTarget(index);
      } else {
        toast('自分の表側モンスターを選択。', 'gold');
      }
      return;
    }
    if (state.mode === 'attack') {
      if (owner === 'rival' && row === 'monster' && slot) {
        resolveBattle('player', state.pending.attacker, index, false);
      } else {
        toast('攻撃対象のモンスターを選択。', 'gold');
      }
      return;
    }

    if (owner === 'player') selectZone(owner, row, index);
    else if (slot) {
      const def = cardDef(slot.card);
      if (slot.faceDown) toast('裏側のカード。', 'rival');
      else toast(`${def.name}｜${def.type === 'monster' ? `ATK ${atkOf(slot)} / DEF ${defOf(slot)}` : '魔法・罠'}`, 'rival');
    } else {
      toast('相手の空きゾーン。');
    }
  }

  /* ───────────────────────── DAMAGE / RESULT ───────────────────────── */

  function applyDamage(owner, amount, options = {}) {
    if (state.over) return 0;
    const value = Math.max(0, Math.round(amount));
    if (!value) return 0;
    const data = side(owner);
    const before = data.lp;
    data.lp = Math.max(0, data.lp - value);
    const actual = before - data.lp;
    if (owner === 'rival') state.stats.damage += actual;
    state._lp[owner] = before;
    renderLP(owner, true);
    showFloatOnOwner(owner, `-${actual}`, false);
    sfx('damage');
    shakeScreen();
    if (data.lp <= 0) endGame(otherSide(owner), 'LP 0');
    return actual;
  }

  function applyHeal(owner, amount) {
    if (state.over) return 0;
    const data = side(owner);
    const actual = Math.min(Math.max(0, Math.round(amount)), MAX_HP - data.lp);
    if (!actual) return 0;
    data.lp += actual;
    state._lp[owner] = data.lp - actual;
    renderLP(owner, true);
    showFloatOnOwner(owner, `+${actual}`, true);
    sfx('heal');
    return actual;
  }

  function endGame(winner, reason) {
    if (state.over) return;
    state.over = true;
    state.busy = true;
    clearSelection();
    const playerWon = winner === 'player';
    logDuel(playerWon ? `勝利。${reason}` : `敗北。${reason}`, playerWon ? 'gold' : 'rival');
    feed(playerWon ? 'VICTORY — LP TO 0' : 'DEFEAT — LP TO 0', playerWon ? 'gold' : 'rival');
    els.phaseLabel.textContent = 'DUEL OVER';
    sfx(playerWon ? 'win' : 'lose');
    renderAll();
    const version = state.version;
    setTimeout(() => {
      if (version !== state.version) return;
      els.endCard.classList.toggle('defeat', !playerWon);
      els.endKicker.textContent = reason === 'DECK OUT' ? 'DECK OUT / DUEL COMPLETE' : 'LP 0 / DUEL COMPLETE';
      els.endTitle.textContent = playerWon ? 'VICTORY' : 'DEFEAT';
      els.endText.textContent = playerWon
        ? (reason === 'DECK OUT' ? '相手のデッキを尽きさせた。' : '相手のLPを0にした。')
        : (reason === 'DECK OUT' ? '自分のデッキが尽きた。' : '自分のLPが0になった。');
      els.endTurns.textContent = pad2(state.round);
      els.endDamage.textContent = String(state.stats.damage).padStart(4, '0');
      els.endDestroyed.textContent = pad2(state.stats.destroyed);
      els.endModal.hidden = false;
    }, reduceMotion ? 120 : 900);
  }

  /* ───────────────────────── SUMMON / SET ───────────────────────── */

  function releaseBusy() {
    state.busy = state.turn === 'rival' && !state.over;
    renderAll();
  }

  function takeHandCard(owner, uid) {
    const hand = side(owner).hand;
    const index = hand.findIndex((card) => card.uid === uid);
    if (index < 0) return null;
    return hand.splice(index, 1)[0];
  }

  function makeZoneCard(card, faceDown) {
    return {
      card,
      faceDown: Boolean(faceDown),
      pos: faceDown ? 'defense' : 'attack',
      attacked: false,
      attacks: 0,
      positionChanged: false,
      setSeq: state.turnSeq,
      summonedSeq: state.turnSeq,
      tempAtk: 0,
      equipAtk: 0,
      atkZero: false
    };
  }

  function performSummon(owner, cardUid, index, options = {}) {
    return (async () => {
      if (state.over) return;
      const data = side(owner);
      const t = options.tributes || [];
      if (data.monster[index] && !t.includes(index)) return;
      const card = takeHandCard(owner, cardUid);
      if (!card) return;
      const version = state.version;
      state.busy = true;
      for (const tributeIndex of t) {
        const tribute = data.monster[tributeIndex];
        if (!tribute) continue;
        data.monster[tributeIndex] = null;
        data.gy.push(tribute.card);
        logDuel(`${sideLabel(owner)} は ${cardDef(tribute.card).name} を生贄にした。`, owner);
      }
      if (data.monster[index]) return;
      data.summonUsed = true;
      const slot = makeZoneCard(card, options.faceDown);
      data.monster[index] = slot;
      state.sel = null;
      state.mode = null;
      state.pending = null;
      renderAll();
      sfx(options.faceDown ? 'set' : 'summon');
      flashZone(owner, 'monster', index);
      feed(
        options.faceDown
          ? `${sideLabel(owner)} がカードをセット。`
          : `${sideLabel(owner)} が ${cardDef(card).name} を召喚。`,
        owner
      );
      logDuel(
        options.faceDown
          ? `${sideLabel(owner)} がモンスター1体をセットした。`
          : `${sideLabel(owner)} が ${cardDef(card).name} を召喚した。`,
        owner
      );
      await wait(reduceMotion ? 60 : 320);
      if (version !== state.version || state.over) return;

      if (!options.faceDown) {
        const trapOwner = otherSide(owner);
        const trapIndex = findReadyTrap(trapOwner, 'summon');
        if (trapIndex >= 0) {
          const result = await triggerTrap(trapOwner, trapIndex, {
            summonSide: owner,
            summonIndex: index
          });
          if (version !== state.version || state.over) return;
          if (result.destroyed) {
            releaseBusy();
            return;
          }
        }
        await onSummon(owner, index);
      }
      if (version !== state.version || state.over) return;
      releaseBusy();
    })();
  }

  function performSetSpell(owner, cardUid, index) {
    if (state.over) return;
    const data = side(owner);
    if (data.spell[index]) return;
    const card = takeHandCard(owner, cardUid);
    if (!card) return;
    const slot = makeZoneCard(card, true);
    slot.pos = 'set';
    data.spell[index] = slot;
    state.sel = null;
    state.mode = null;
    state.pending = null;
    sfx('set');
    flashZone(owner, 'spell', index);
    feed(`${sideLabel(owner)} が魔法・罠を1枚セット。`, owner);
    logDuel(`${sideLabel(owner)} が魔法・罠をセットした。`, owner);
    renderAll();
  }

  async function onSummon(owner, index) {
    const slot = side(owner).monster[index];
    if (!slot || slot.faceDown) return;
    const def = cardDef(slot.card);
    const enemy = otherSide(owner);
    if (def.id === 'tide_oracle') {
      applyHeal(owner, 300);
      feed(`${def.name} の効果：LP 300回復。`, owner);
    } else if (def.id === 'star_priestess') {
      if (drawCards(owner, 1)) {
        feed(`${def.name} の効果：1枚ドロー。`, owner);
        if (owner === 'player') sfx('draw');
      }
    } else if (def.id === 'blaze_emperor') {
      feed(`${def.name} の効果：500ダメージ。`, owner);
      applyDamage(enemy, 500, { effect: true });
    } else if (def.id === 'abyss_king') {
      const targets = side(enemy).spell
        .map((item, spellIndex) => (item ? spellIndex : -1))
        .filter((spellIndex) => spellIndex >= 0);
      if (targets.length) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        feed(`${def.name} の効果：魔法・罠を破壊。`, owner);
        await destroySpell(enemy, target);
      }
    } else if (def.id === 'zero_dragon') {
      feed(`${def.name} の効果：700ダメージ。`, owner);
      applyDamage(enemy, 700, { effect: true });
    }
    renderAll();
  }

  /* ───────────────────────── SPELLS ───────────────────────── */

  async function activateSelectedSpell() {
    if (!state.sel) return;
    if (state.sel.type === 'hand') {
      const card = selectedCard();
      if (!card) return;
      if (cardDef(card).type !== 'spell') {
        toast('罠カードはセットして自動発動させる。', 'gold');
        return;
      }
      startSpellActivation('hand', 'player', card, null);
    }
  }

  function activateSelectedSetSpell() {
    if (!state.sel || state.sel.type !== 'zone') return;
    const slot = selectedSlot();
    if (!slot || !slot.faceDown || cardDef(slot.card).type !== 'spell') return;
    if (slot.setSeq >= state.turnSeq) {
      toast('セットしたターンには発動できない。', 'gold');
      return;
    }
    startSpellActivation('zone', 'player', slot.card, state.sel.index);
  }

  function startSpellActivation(source, owner, card, zoneIndex) {
    if (state.over) return;
    const def = cardDef(card);
    const targeted = def.id === 'overclock' || def.id === 'red_blade';
    if (targeted) {
      if (!aliveMonsters(owner).some((slot) => !slot.faceDown)) {
        toast('対象にできる表側モンスターがいない。', 'gold');
        return;
      }
      state.pending = { spellSource: source, owner, card, zoneIndex };
      state.mode = 'targetOwn';
      state.sel = null;
      feed(`${def.name} の対象を選択。`, 'gold');
      sfx('select');
      renderAll();
      return;
    }
    if (def.id === 'gravity') {
      if (!aliveMonsters(otherSide(owner)).length) {
        toast('相手モンスターがいない。', 'gold');
        return;
      }
    }
    resolveSpell(owner, card, null, source, zoneIndex);
  }

  function applyPendingTarget(index) {
    const pending = state.pending;
    if (!pending || !pending.card) return;
    const slot = side(pending.owner).monster[index];
    if (!slot || slot.faceDown) return;
    const { card, spellSource, zoneIndex } = pending;
    state.pending = null;
    state.mode = null;
    resolveSpell(pending.owner, card, index, spellSource, zoneIndex);
  }

  async function resolveSpell(owner, card, targetIndex, source, zoneIndex) {
    if (state.over) return;
    const def = cardDef(card);
    const version = state.version;
    const data = side(owner);
    state.busy = true;
    state.sel = null;
    state.mode = null;
    state.pending = null;
    if (source === 'hand') {
      takeHandCard(owner, card.uid);
    } else if (source === 'zone' && zoneIndex !== null) {
      const slot = data.spell[zoneIndex];
      if (slot) slot.faceDown = false;
    }
    renderAll();
    sfx('spell');
    showCardReveal(card, 'SPELL ACTIVATE');
    feed(`${sideLabel(owner)} が ${def.name} を発動。`, owner);
    logDuel(`${sideLabel(owner)} が ${def.name} を発動した。`, owner);
    await wait(reduceMotion ? 80 : 520);
    if (version !== state.version || state.over) return;

    if (def.id === 'star_reading') {
      drawCards(owner, 2);
    } else if (def.id === 'repair') {
      applyHeal(owner, 1000);
    } else if (def.id === 'meteor') {
      applyDamage(otherSide(owner), 800, { effect: true });
    } else if (def.id === 'gravity') {
      const enemy = otherSide(owner);
      let target = null;
      side(enemy).monster.forEach((slot, index) => {
        if (!slot) return;
        if (!target || atkOf(slot) > atkOf(target.slot)) target = { slot, index };
      });
      if (target) await destroyMonster(enemy, target.index, { battle: false });
    } else if (def.id === 'overclock' && targetIndex !== null) {
      const slot = data.monster[targetIndex];
      if (slot && !slot.faceDown) {
        slot.tempAtk += 1000;
        feed(`${cardDef(slot.card).name} のATKが1000アップ。`, owner);
      }
    } else if (def.id === 'red_blade' && targetIndex !== null) {
      const slot = data.monster[targetIndex];
      if (slot && !slot.faceDown) {
        slot.equipAtk += 700;
        feed(`${cardDef(slot.card).name} に紅蓮の剣を装備。`, owner);
      }
    }

    if (version !== state.version || state.over) return;
    if (source === 'zone' && zoneIndex !== null) {
      const slot = data.spell[zoneIndex];
      if (slot) {
        data.spell[zoneIndex] = null;
        data.gy.push(card);
      }
    } else if (source === 'hand') {
      data.gy.push(card);
    }
    renderAll();
    await wait(reduceMotion ? 60 : 260);
    if (version !== state.version || state.over) return;
    releaseBusy();
  }

  /* ───────────────────────── TRAPS ───────────────────────── */

  function findReadyTrap(owner, trigger) {
    const data = side(owner);
    const priority = trigger === 'attack'
      ? ['mirror_veil', 'binding_chain']
      : trigger === 'summon'
        ? ['dimension_hole']
        : trigger === 'damage'
          ? ['counter_signal']
          : [];
    for (const id of priority) {
      for (let index = 0; index < data.spell.length; index += 1) {
        const slot = data.spell[index];
        if (!slot || !slot.faceDown || slot.setSeq >= state.turnSeq) continue;
        if (cardDef(slot.card).id === id) return index;
      }
    }
    return -1;
  }

  async function triggerTrap(owner, index, context = {}) {
    const data = side(owner);
    const slot = data.spell[index];
    if (!slot) return { negated: false };
    const def = cardDef(slot.card);
    const version = state.version;
    state.busy = true;
    slot.faceDown = false;
    renderAll();
    sfx('trap');
    showCardReveal(slot.card, 'TRAP ACTIVATE');
    feed(`${sideLabel(owner)} の罠発動：${def.name}`, owner);
    logDuel(`${sideLabel(owner)} が罠 ${def.name} を発動した。`, owner);
    await wait(reduceMotion ? 80 : 620);
    if (version !== state.version || state.over) return { negated: false };

    const result = { negated: false, destroyed: false, reflected: false };
    if (def.id === 'mirror_veil') {
      result.negated = true;
      applyDamage(otherSide(owner), 500, { effect: true });
    } else if (def.id === 'binding_chain') {
      result.negated = true;
      if (context.attackerSlot) context.attackerSlot.atkZero = true;
    } else if (def.id === 'dimension_hole') {
      if (context.summonSide && context.summonIndex !== null) {
        const victim = side(context.summonSide).monster[context.summonIndex];
        if (victim) {
          await destroyMonster(context.summonSide, context.summonIndex, { battle: false });
          result.destroyed = true;
        }
      }
    } else if (def.id === 'counter_signal') {
      const damage = context.damage || 0;
      if (damage > 0) {
        result.reflected = true;
        applyDamage(otherSide(owner), damage, { effect: true });
      }
    }

    if (data.spell[index]) {
      data.spell[index] = null;
      data.gy.push(slot.card);
    }
    if (version === state.version) renderAll();
    await wait(reduceMotion ? 40 : 220);
    return result;
  }

  /* ───────────────────────── DESTRUCTION ───────────────────────── */

  async function destroyMonster(owner, index, options = {}) {
    if (state.over) return false;
    const data = side(owner);
    const slot = data.monster[index];
    if (!slot) return false;
    const def = cardDef(slot.card);
    if (options.battle && def.id === 'mecha_gear') {
      feed(`${def.name} は戦闘では破壊されない。`, owner);
      logDuel(`${def.name} は戦闘破壊を無効化した。`, owner);
      return false;
    }
    const element = cardEl(owner, 'monster', index);
    const zone = zoneEl(owner, 'monster', index);
    if (element) element.classList.add('destroying');
    if (zone) zone.classList.add('is-hit');
    sfx('destroy');
    const version = state.version;
    await wait(reduceMotion ? 60 : 390);
    if (version !== state.version) return false;
    data.monster[index] = null;
    data.gy.push(slot.card);
    if (owner === 'rival') state.stats.destroyed += 1;
    renderAll();
    feed(`${def.name} が破壊された。`, owner);
    logDuel(`${sideLabel(owner)} の ${def.name} が破壊された。`, owner);
    await onDestroyed(owner, slot.card);
    return true;
  }

  async function destroySpell(owner, index) {
    const data = side(owner);
    const slot = data.spell[index];
    if (!slot) return false;
    const def = cardDef(slot.card);
    const element = cardEl(owner, 'spell', index);
    if (element) element.classList.add('destroying');
    const version = state.version;
    await wait(reduceMotion ? 50 : 330);
    if (version !== state.version) return false;
    data.spell[index] = null;
    data.gy.push(slot.card);
    renderAll();
    feed(`${def.name} が破壊された。`, owner);
    logDuel(`${sideLabel(owner)} の ${def.name} が破壊された。`, owner);
    return true;
  }

  async function onDestroyed(owner, card) {
    const def = cardDef(card);
    if (def.id === 'grave_hound') {
      feed(`${def.name} の効果：400ダメージ。`, owner);
      applyDamage(otherSide(owner), 400, { effect: true });
      await wait(reduceMotion ? 40 : 260);
    }
  }

  /* ───────────────────────── BATTLE ───────────────────────── */

  function maxAttacks(slot) {
    return cardDef(slot.card).id === 'gale_blade' ? 2 : 1;
  }

  async function resolveBattle(attackerOwner, attackerIndex, defenderIndex, direct = false) {
    if (state.over) return;
    const defenderOwner = otherSide(attackerOwner);
    const attackerData = side(attackerOwner);
    const defenderData = side(defenderOwner);
    const attackerSlot = attackerData.monster[attackerIndex];
    if (!attackerSlot || attackerSlot.faceDown || attackerSlot.pos !== 'attack') return;
    if (attackerSlot.attacked) return;
    const version = state.version;
    const attackerDef = cardDef(attackerSlot.card);
    state.busy = true;
    state.sel = null;
    state.mode = null;
    state.pending = null;
    els.targetHint.classList.remove('show');
    attackerSlot.attacks = (attackerSlot.attacks || 0) + 1;
    attackerSlot.attacked = attackerSlot.attacks >= maxAttacks(attackerSlot);
    renderAll();
    sfx('attack');

    const attackerEl = cardEl(attackerOwner, 'monster', attackerIndex);
    if (attackerEl) attackerEl.classList.add('attacking');
    await wait(reduceMotion ? 60 : 230);
    if (version !== state.version || state.over) return;

    const trapIndex = findReadyTrap(defenderOwner, 'attack');
    if (trapIndex >= 0) {
      const trapResult = await triggerTrap(defenderOwner, trapIndex, {
        attackerSide: attackerOwner,
        attackerSlot
      });
      if (version !== state.version || state.over) return;
      if (trapResult.negated) {
        feed('攻撃は罠によって無効化された。', defenderOwner);
        logDuel('攻撃が罠で無効化された。', defenderOwner);
        renderAll();
        releaseBusy();
        return;
      }
    }

    let defenderSlot = null;
    if (!direct) {
      defenderSlot = defenderData.monster[defenderIndex];
      if (!defenderSlot) {
        renderAll();
        releaseBusy();
        return;
      }
      if (defenderSlot.faceDown) {
        defenderSlot.faceDown = false;
        defenderSlot.pos = 'defense';
        renderAll();
        feed(`${cardDef(defenderSlot.card).name} を公開。`, defenderOwner);
        await wait(reduceMotion ? 50 : 270);
        if (version !== state.version || state.over) return;
      }
    }

    const targetEl = defenderSlot
      ? cardEl(defenderOwner, 'monster', defenderIndex)
      : (defenderOwner === 'player' ? els.playerLP : els.rivalLP);
    const targetRect = targetEl ? targetEl.getBoundingClientRect() : null;
    const impactPoint = targetRect
      ? { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    await animateBeam(attackerEl, targetEl, attackerOwner);
    if (version !== state.version || state.over) return;
    showImpact(impactPoint.x, impactPoint.y, attackerOwner === 'player' ? 'var(--cyan)' : 'var(--magenta)');
    shakeScreen();
    sfx('hit');

    const atk = atkOf(attackerSlot);
    let damageToDefender = 0;
    let damageToAttacker = 0;
    let destroyAttacker = false;
    let destroyDefender = false;
    let targetName = '';

    if (defenderSlot) {
      targetName = cardDef(defenderSlot.card).name;
      const targetValue = defenderSlot.pos === 'attack' ? atkOf(defenderSlot) : defOf(defenderSlot);
      if (atk > targetValue) {
        destroyDefender = true;
        if (defenderSlot.pos === 'attack') damageToDefender = atk - targetValue;
      } else if (atk < targetValue) {
        if (defenderSlot.pos === 'attack') {
          destroyAttacker = true;
          damageToAttacker = targetValue - atk;
        } else {
          damageToAttacker = targetValue - atk;
        }
      } else if (defenderSlot.pos === 'attack') {
        destroyAttacker = true;
        destroyDefender = true;
      }
    } else {
      damageToDefender = atk;
    }

    if (destroyDefender) {
      await destroyMonster(defenderOwner, defenderIndex, { battle: true });
      if (version !== state.version || state.over) return;
    }
    if (destroyAttacker) {
      await destroyMonster(attackerOwner, attackerIndex, { battle: true });
      if (version !== state.version || state.over) return;
    }

    if (damageToDefender > 0) {
      applyDamage(defenderOwner, damageToDefender, { battle: true });
      if (version !== state.version || state.over) return;
    }
    if (damageToAttacker > 0) {
      applyDamage(attackerOwner, damageToAttacker, { battle: true });
      if (version !== state.version || state.over) return;
    }

    if (damageToDefender > 0) {
      const counterIndex = findReadyTrap(defenderOwner, 'damage');
      if (counterIndex >= 0) {
        await triggerTrap(defenderOwner, counterIndex, { damage: damageToDefender });
        if (version !== state.version || state.over) return;
      }
    }

    const survivingAttacker = side(attackerOwner).monster[attackerIndex];
    if (survivingAttacker && attackerDef.id === 'volt_hare') {
      feed(`${attackerDef.name} の効果：200ダメージ。`, attackerOwner);
      applyDamage(defenderOwner, 200, { effect: true });
      if (version !== state.version || state.over) return;
    }

    if (defenderSlot) {
      const text = `${attackerDef.name} が ${targetName} を攻撃。`;
      logDuel(text + (damageToDefender ? ` ${damageToDefender}ダメージ。` : ''), attackerOwner);
      feed(text, attackerOwner);
    } else {
      logDuel(`${attackerDef.name} の直接攻撃。${damageToDefender}ダメージ。`, attackerOwner);
      feed(`${attackerDef.name} の直接攻撃！ ${damageToDefender}ダメージ。`, attackerOwner);
    }
    renderAll();
    await wait(reduceMotion ? 50 : 300);
    if (version !== state.version || state.over) return;
    releaseBusy();
  }

  /* ───────────────────────── AI ───────────────────────── */

  function aiEmptySpellIndex() {
    const spots = [2, 3, 1, 4, 0, 5];
    return spots.find((index) => !state.rival.spell[index]) ?? -1;
  }

  function aiEmptyMonsterIndex() {
    const spots = [2, 3, 1, 4, 0, 5];
    return spots.find((index) => !state.rival.monster[index]) ?? -1;
  }

  function aiChooseSummon() {
    const rivals = state.rival;
    let best = null;
    for (const card of rivals.hand) {
      const def = cardDef(card);
      if (def.type !== 'monster') continue;
      const req = tributeCount(def.lv);
      if (aliveMonsters('rival').length < req) continue;
      const score = def.atk - req * 780 + def.def * 0.18 + def.lv * 35;
      if (!best || score > best.score) best = { card, def, req, score };
    }
    return best;
  }

  function aiTributesFor(req) {
    return state.rival.monster
      .map((slot, index) => ({ slot, index }))
      .filter((item) => item.slot)
      .sort((a, b) => atkOf(a.slot) - atkOf(b.slot))
      .slice(0, req)
      .map((item) => item.index);
  }

  async function aiSetTrap() {
    const trap = state.rival.hand.find((card) => cardDef(card).type === 'trap');
    if (!trap) return false;
    const index = aiEmptySpellIndex();
    if (index < 0) return false;
    performSetSpell('rival', trap.uid, index);
    await wait(reduceMotion ? 60 : 430);
    return true;
  }

  async function aiSummon(version) {
    if (state.over || state.version !== version) return;
    const choice = aiChooseSummon();
    if (!choice) return;
    const index = aiEmptyMonsterIndex();
    if (index < 0) return;
    const tributes = aiTributesFor(choice.req);
    if (tributes.length < choice.req) return;
    const shouldSet = choice.req === 0
      && choice.def.def > choice.def.atk
      && state.player.monster.some((slot) => slot && atkOf(slot) >= choice.def.def - 300);
    await performSummon('rival', choice.card.uid, index, {
      faceDown: shouldSet,
      tributes
    });
    await wait(reduceMotion ? 40 : 320);
  }

  function aiPickSpell() {
    const player = state.player;
    const rival = state.rival;
    const ownBest = Math.max(0, ...rival.monster.filter(Boolean).map((slot) => atkOf(slot)));
    const enemyBest = Math.max(0, ...player.monster.filter(Boolean).map((slot) => atkOf(slot)));
    for (const card of rival.hand) {
      const def = cardDef(card);
      if (def.type !== 'spell') continue;
      if (def.id === 'repair' && rival.lp < 2400) return { card, target: null };
      if (def.id === 'meteor' && (player.lp <= 800 || (player.lp < 2600 && Math.random() < 0.55))) return { card, target: null };
      if (def.id === 'gravity' && enemyBest >= Math.max(1800, ownBest)) return { card, target: null };
      if ((def.id === 'overclock' || def.id === 'red_blade') && ownBest > 0 && player.monster.filter(Boolean).length) {
        let target = -1;
        let bestAtk = -1;
        rival.monster.forEach((slot, index) => {
          if (slot && !slot.faceDown && atkOf(slot) > bestAtk) {
            bestAtk = atkOf(slot);
            target = index;
          }
        });
        if (target >= 0) return { card, target };
      }
      if (def.id === 'star_reading' && rival.hand.length <= 3) return { card, target: null };
    }
    return null;
  }

  async function aiSpell(version) {
    const pick = aiPickSpell();
    if (!pick) return;
    await resolveSpell('rival', pick.card, pick.target, 'hand', null);
    await wait(reduceMotion ? 40 : 280);
  }

  function aiChooseAttack(slot) {
    const atk = atkOf(slot);
    if (atk <= 0) return null;
    const playerMonsters = state.player.monster
      .map((target, index) => ({ target, index }))
      .filter((item) => item.target);
    const directAllowed = cardDef(slot.card).id === 'night_fang' || playerMonsters.length === 0;
    let best = null;
    if (directAllowed) {
      best = {
        direct: true,
        targetIndex: null,
        score: state.player.lp <= atk ? 100000 : 650 + atk
      };
    }
    for (const { target, index } of playerMonsters) {
      const targetValue = target.pos === 'attack' ? atkOf(target) : defOf(target);
      let score;
      let damage = 0;
      if (atk > targetValue) {
        damage = target.pos === 'attack' ? atk - targetValue : 0;
        score = 850 + damage + (target.faceDown ? 130 : 0) + (targetValue >= 1900 ? 160 : 0);
        if (target.pos === 'attack' && state.player.lp <= damage) score += 100000;
      } else if (atk === targetValue) {
        score = 340;
      } else {
        score = -1100 - (targetValue - atk);
      }
      if (!best || score > best.score) {
        best = { direct: false, targetIndex: index, score, damage };
      }
    }
    if (!best || best.score <= 0) return null;
    return best;
  }

  async function aiAttacks(version) {
    for (let index = 0; index < 6; index += 1) {
      let guard = 0;
      while (guard < 3) {
        guard += 1;
        if (state.version !== version || state.over) return;
        const slot = state.rival.monster[index];
        if (!slot || slot.faceDown || slot.pos !== 'attack' || slot.attacked) break;
        const choice = aiChooseAttack(slot);
        if (!choice) break;
        await resolveBattle('rival', index, choice.targetIndex, choice.direct);
        await wait(reduceMotion ? 40 : 280);
        if (state.over || state.version !== version) return;
        const current = state.rival.monster[index];
        if (!current || current.attacked) break;
      }
    }
  }

  async function runAI(version) {
    if (version !== state.version || state.over) return;
    state.busy = true;
    renderAll();
    await wait(reduceMotion ? 120 : 420);
    if (version !== state.version || state.over) return;

    await aiSetTrap();
    if (version !== state.version || state.over) return;

    await aiSummon(version);
    if (version !== state.version || state.over) return;

    await aiSpell(version);
    if (version !== state.version || state.over) return;

    await aiAttacks(version);
    if (version !== state.version || state.over) return;

    await wait(reduceMotion ? 100 : 360);
    endRivalTurn();
  }

  /* ───────────────────────── VISUAL FX ───────────────────────── */

  function showImpact(x, y, color) {
    const ring = document.createElement('div');
    ring.className = 'impact-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.color = color;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 620);
  }

  function showFloatOnOwner(owner, text, heal) {
    const valueEl = owner === 'player' ? els.playerLP : els.rivalLP;
    const rect = valueEl.getBoundingClientRect();
    const item = document.createElement('div');
    item.className = `damage-float${heal ? ' heal' : ''}`;
    item.textContent = text;
    item.style.left = `${rect.left + rect.width / 2}px`;
    item.style.top = `${rect.top - 4}px`;
    document.body.appendChild(item);
    setTimeout(() => item.remove(), 1000);
  }

  function shakeScreen() {
    if (reduceMotion) return;
    document.body.classList.remove('screen-shake');
    void document.body.offsetWidth;
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 380);
  }

  function flashZone(owner, row, index) {
    const zone = zoneEl(owner, row, index);
    if (!zone) return;
    zone.classList.remove('flash-cyan');
    void zone.offsetWidth;
    zone.classList.add('flash-cyan');
    setTimeout(() => zone.classList.remove('flash-cyan'), 1000);
  }

  function showCardReveal(card, label) {
    const holder = document.createElement('div');
    holder.className = 'card-reveal';
    holder.appendChild(createCardElement(card, { owner: 'player', animate: false }));
    const tag = document.createElement('span');
    tag.className = 'reveal-label';
    tag.textContent = label;
    holder.appendChild(tag);
    document.body.appendChild(holder);
    setTimeout(() => holder.remove(), 1250);
  }

  function animateBeam(fromEl, toEl, owner) {
    return new Promise((resolve) => {
      if (reduceMotion || !fromEl || !toEl) {
        setTimeout(resolve, reduceMotion ? 20 : 140);
        return;
      }
      const a = fromEl.getBoundingClientRect();
      const b = toEl.getBoundingClientRect();
      const x1 = a.left + a.width / 2;
      const y1 = a.top + a.height / 2;
      const x2 = b.left + b.width / 2;
      const y2 = b.top + b.height / 2;
      const length = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const beam = document.createElement('div');
      beam.className = `attack-beam ${owner === 'rival' ? 'rival-beam' : 'player-beam'}`;
      beam.style.left = `${x1}px`;
      beam.style.top = `${y1}px`;
      beam.style.width = `${length}px`;
      beam.style.animation = 'none';
      beam.style.transformOrigin = '0 50%';
      document.body.appendChild(beam);
      const frames = [
        { opacity: 0, transform: `rotate(${angle}rad) scaleX(0)` },
        { opacity: 1, transform: `rotate(${angle}rad) scaleX(1)`, offset: 0.3 },
        { opacity: 0.9, transform: `rotate(${angle}rad) scaleX(1)`, offset: 0.7 },
        { opacity: 0, transform: `rotate(${angle}rad) scaleX(1)`, offset: 1 }
      ];
      beam.animate(frames, { duration: 360, easing: 'cubic-bezier(.16,.84,.3,1)' });
      setTimeout(() => {
        beam.remove();
        resolve();
      }, 370);
    });
  }

  /* ───────────────────────── AUDIO ───────────────────────── */

  let audioCtx = null;

  function ensureAudio() {
    if (!state.sound) return null;
    try {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        audioCtx = new AudioCtor();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return audioCtx;
    } catch {
      return null;
    }
  }

  function tone(freq, duration, type = 'sine', gain = 0.03, slide = 0, delay = 0) {
    if (!state.sound) return;
    const context = ensureAudio();
    if (!context) return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), start);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), start + duration);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp).connect(context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function noise(duration = 0.2, gain = 0.025, cutoff = 900) {
    if (!state.sound) return;
    const context = ensureAudio();
    if (!context) return;
    const frames = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const amp = context.createGain();
    amp.gain.value = gain;
    source.connect(filter).connect(amp).connect(context.destination);
    source.start();
  }

  function sfx(name) {
    if (!state.sound) return;
    switch (name) {
      case 'start':
        tone(180, 0.28, 'sawtooth', 0.025, 220);
        tone(440, 0.4, 'triangle', 0.025, 660, 0.1);
        break;
      case 'select':
        tone(760, 0.07, 'triangle', 0.02, 220);
        break;
      case 'draw':
        tone(920, 0.08, 'sine', 0.016, 320);
        break;
      case 'summon':
        tone(180, 0.34, 'sawtooth', 0.024, 160);
        tone(360, 0.45, 'triangle', 0.022, 240, 0.05);
        tone(540, 0.5, 'sine', 0.012, 140, 0.1);
        break;
      case 'set':
        tone(140, 0.18, 'square', 0.018, -40);
        break;
      case 'spell':
        tone(520, 0.3, 'sine', 0.026, 440);
        tone(780, 0.42, 'triangle', 0.018, 260, 0.06);
        break;
      case 'trap':
        tone(160, 0.28, 'sawtooth', 0.024, -40);
        tone(240, 0.36, 'square', 0.014, 80, 0.04);
        break;
      case 'attack':
        tone(240, 0.16, 'sawtooth', 0.025, -140);
        noise(0.12, 0.018, 1500);
        break;
      case 'hit':
        noise(0.26, 0.05, 700);
        tone(82, 0.22, 'sawtooth', 0.03, -30);
        break;
      case 'damage':
        tone(130, 0.2, 'sawtooth', 0.02, -70);
        break;
      case 'heal':
        tone(520, 0.22, 'sine', 0.023, 260);
        tone(780, 0.3, 'sine', 0.017, 160, 0.08);
        break;
      case 'destroy':
        noise(0.3, 0.04, 1200);
        tone(110, 0.25, 'sawtooth', 0.02, -70);
        break;
      case 'turn':
        tone(440, 0.12, 'triangle', 0.018, 90);
        tone(660, 0.16, 'triangle', 0.015, 120, 0.08);
        break;
      case 'win':
        [392, 523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.5, 'triangle', 0.028, 20, index * 0.11));
        break;
      case 'lose':
        [330, 277, 220, 164].forEach((freq, index) => tone(freq, 0.55, 'sawtooth', 0.023, -30, index * 0.13));
        break;
      default:
        tone(600, 0.05, 'sine', 0.012);
    }
  }

  function setSound(enabled) {
    state.sound = enabled;
    document.body.classList.toggle('muted', !enabled);
    els.soundBtn.setAttribute('aria-label', enabled ? 'サウンドをオフにする' : 'サウンドをオンにする');
    try {
      localStorage.setItem('lp0-muted', enabled ? '0' : '1');
    } catch {}
    if (enabled) {
      ensureAudio();
      sfx('select');
    }
  }

  /* ───────────────────────── INPUT / MODALS / INIT ───────────────────────── */

  function bindEvents() {
    els.startBtn.addEventListener('click', startDuel);
    els.howBtn.addEventListener('click', () => openModal('helpModal'));
    els.helpBtn.addEventListener('click', () => openModal('helpModal'));
    els.logBtn.addEventListener('click', () => {
      renderLog();
      openModal('logModal');
    });
    els.soundBtn.addEventListener('click', () => setSound(!state.sound));
    els.restartBtn.addEventListener('click', () => {
      if (!state.started) {
        startDuel();
        return;
      }
      ensureAudio();
      resetMatch();
      toast('デュエルを再構築した。', 'gold');
      setTimeout(() => nextTurn('player'), reduceMotion ? 30 : 180);
    });

    els.rematchBtn.addEventListener('click', () => {
      ensureAudio();
      resetMatch();
      setTimeout(() => nextTurn('player'), reduceMotion ? 30 : 200);
    });
    els.backTitleBtn.addEventListener('click', () => {
      state.version += 1;
      state.busy = true;
      state.over = true;
      state.started = false;
      clearSelection();
      els.endModal.hidden = true;
      els.landing.classList.remove('is-hidden');
      document.body.classList.add('preduel');
      renderAll();
    });

    els.hand.addEventListener('click', onHandClick);
    els.board.addEventListener('click', (event) => {
      const zone = event.target.closest('.zone');
      if (zone) handleZoneActivate(zone);
    });
    els.board.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const zone = event.target.closest('.zone');
      if (!zone) return;
      event.preventDefault();
      handleZoneActivate(zone);
    });

    els.actionButtons.addEventListener('click', (event) => {
      const button = event.target.closest('[data-act]');
      if (!button) return;
      handleAction(button.dataset.act);
    });
    els.endTurnBtn.addEventListener('click', endTurn);

    $$('[data-close-modal]').forEach((element) => {
      element.addEventListener('click', () => closeModal(element.dataset.closeModal));
    });
    $$('.modal-layer').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modal.id);
      });
    });

    const bindGrave = (statElement, owner) => {
      const last = statElement.querySelector('div:last-child');
      if (!last) return;
      last.style.cursor = 'pointer';
      last.title = '墓地を確認';
      last.addEventListener('click', () => openGrave(owner));
    };
    bindGrave(els.playerGY.closest('.duelist-stats'), 'player');
    bindGrave(els.rivalGY.closest('.duelist-stats'), 'rival');

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const openModals = $$('.modal-layer:not([hidden])');
        if (openModals.length) {
          closeModal(openModals[openModals.length - 1].id);
          return;
        }
        if (state.mode || state.sel) {
          clearSelection();
          renderAll();
        }
        return;
      }
      if (/^[1-8]$/.test(event.key) && state.started && !state.over && state.turn === 'player' && !state.busy) {
        const index = Number(event.key) - 1;
        const card = state.player.hand[index];
        if (card) selectHand(card.uid);
      }
    });

    document.addEventListener('contextmenu', (event) => {
      if (event.target.closest('.board, .hand, .duelist-panel')) event.preventDefault();
    });
  }

  function initSoundPreference() {
    let muted = false;
    try {
      muted = localStorage.getItem('lp0-muted') === '1';
    } catch {}
    state.sound = !muted;
    document.body.classList.toggle('muted', muted);
    els.soundBtn.setAttribute('aria-label', muted ? 'サウンドをオンにする' : 'サウンドをオフにする');
  }

  function init() {
    buildField();
    bindEvents();
    initSoundPreference();
    document.body.classList.add('preduel');
    state._lp = { player: START_LP, rival: START_LP };
    renderAll();
    setTimeout(() => {
      document.body.classList.add('ready');
    }, 80);
  }

  init();





})();
