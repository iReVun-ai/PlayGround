'use strict';

/* ============================================================
   最速LP0デュエル — core rules engine
============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const other = (key) => (key === 'player' ? 'opponent' : 'player');
const labelOf = (key) => (key === 'player' ? 'あなた' : '兄');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(ms) {
  const totalTenths = Math.max(0, Math.floor(ms / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function loadBest() {
  try {
    const raw = localStorage.getItem('ygo_speed_best_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.time === 'number' && parsed.time > 0) return parsed;
  } catch (_) { /* ignore */ }
  return null;
}

function saveBest(best) {
  try {
    localStorage.setItem('ygo_speed_best_v1', JSON.stringify(best));
  } catch (_) { /* ignore */ }
}

function loadSound() {
  try { return localStorage.getItem('ygo_sound_v1') !== '0'; } catch (_) { return true; }
}

const state = {
  gameId: 0,
  uid: 0,
  players: null,
  emz: [null, null],
  turn: 1,
  active: 'player',
  over: false,
  busy: false,
  running: false,
  started: false,
  mode: 'idle',
  pending: null,
  selection: null,
  log: [],
  timerStart: 0,
  elapsed: 0,
  best: loadBest(),
  sound: loadSound(),
  tauntTimer: null,
  warnTimer: null,
  result: null
};

/* ---------------- sides & instances ---------------- */
function newSide(owner) {
  return {
    owner,
    lp: 8000,
    deck: shuffle([...DECK_LIST]),
    extra: [...EXTRA_LIST],
    hand: [],
    monsters: [null, null, null, null, null],
    spells: [null, null, null, null, null],
    field: null,
    graveyard: [],
    hasSummoned: false
  };
}

function createInst(id, owner) {
  return {
    uid: ++state.uid,
    id,
    owner,
    position: 'attack',
    faceDown: false,
    boost: 0,
    changed: false,
    attacked: false,
    summonedTurn: state.turn,
    zone: null
  };
}

function isMonster(instOrId) {
  const id = typeof instOrId === 'string' ? instOrId : instOrId && instOrId.id;
  if (!id || !CARD_DB[id]) return false;
  return CARD_DB[id].type === 'monster' || CARD_DB[id].type === 'extra';
}

function getInst(z) {
  if (z.area === 'emz') return state.emz[z.index];
  if (z.area === 'field') return state.players[z.owner].field;
  return state.players[z.owner][z.area][z.index];
}

function setInst(z, inst) {
  if (z.area === 'emz') {
    state.emz[z.index] = inst;
    if (inst) inst.zone = { area: 'emz', index: z.index };
    return;
  }
  if (z.area === 'field') {
    state.players[z.owner].field = inst;
  } else {
    state.players[z.owner][z.area][z.index] = inst;
  }
  if (inst) inst.zone = { area: z.area, owner: z.owner, index: z.index };
}

function removeInst(inst, toGrave = true) {
  if (!inst || !inst.zone) return;
  const z = inst.zone;
  if (z.area === 'emz') {
    if (state.emz[z.index] === inst) state.emz[z.index] = null;
  } else if (z.area === 'field') {
    if (state.players[z.owner].field === inst) state.players[z.owner].field = null;
  } else {
    const arr = state.players[z.owner][z.area];
    if (arr && arr[z.index] === inst) arr[z.index] = null;
  }
  inst.zone = null;
  if (toGrave) state.players[inst.owner].graveyard.push({ id: inst.id, owner: inst.owner });
}

function allMonsters(sideKey) {
  const side = state.players[sideKey];
  const out = [];
  side.monsters.forEach((inst) => { if (inst) out.push(inst); });
  state.emz.forEach((inst) => { if (inst && inst.owner === sideKey) out.push(inst); });
  return out;
}

function strongestMonster(sideKey) {
  const mons = allMonsters(sideKey);
  if (!mons.length) return null;
  return mons.slice().sort((a, b) => effAtk(b) - effAtk(a))[0];
}

function strongestVisible(sideKey) {
  const visible = allMonsters(sideKey).filter((m) => !m.faceDown);
  if (visible.length) return visible.sort((a, b) => effAtk(b) - effAtk(a))[0];
  return allMonsters(sideKey)[0] || null;
}

function fieldBoost(sideKey) {
  const field = state.players[sideKey].field;
  if (!field) return 0;
  return CARD_DB[field.id].fieldBoost || 0;
}

function effAtk(inst) {
  return Math.max(0, CARD_DB[inst.id].atk + (inst.boost || 0) + fieldBoost(inst.owner));
}

function effDef(inst) {
  return Math.max(0, CARD_DB[inst.id].def + (inst.boost || 0));
}

function findInstByUid(uid) {
  for (const key of ['player', 'opponent']) {
    const side = state.players[key];
    for (const inst of side.monsters) if (inst && inst.uid === uid) return inst;
    for (const inst of side.spells) if (inst && inst.uid === uid) return inst;
    if (side.field && side.field.uid === uid) return side.field;
  }
  for (const inst of state.emz) if (inst && inst.uid === uid) return inst;
  return null;
}

/* ---------------- log ---------------- */
function addLog(type, text) {
  state.log.push({ type, text });
  if (state.log.length > 90) state.log.shift();
}

/* ---------------- LP ---------------- */
function damage(sideKey, amount, source) {
  if (amount <= 0 || state.over) return false;
  const side = state.players[sideKey];
  side.lp = Math.max(0, side.lp - amount);
  addLog('damage', `${labelOf(sideKey)}に${amount}ダメージ${source ? `（${source}）` : ''}`);
  flashLP(sideKey);
  sfx('damage');
  renderHUD();
  if (sideKey === 'player' && Math.random() < 0.4) {
    taunt(pick(['その程度か。', '最速で終わらせる。', 'まだ足りないな。']));
  }
  const ended = checkGameOver();
  return ended;
}

function heal(sideKey, amount, source) {
  if (amount <= 0 || state.over) return;
  const side = state.players[sideKey];
  const before = side.lp;
  side.lp = Math.min(8000, side.lp + amount);
  const gained = side.lp - before;
  if (gained > 0) {
    addLog('heal', `${labelOf(sideKey)}は${gained}LP回復${source ? `（${source}）` : ''}`);
    sparkleLP(sideKey);
    renderHUD();
  }
}

function checkGameOver() {
  if (state.over) return true;
  if (state.players.opponent.lp <= 0) { endGame('player'); return true; }
  if (state.players.player.lp <= 0) { endGame('opponent'); return true; }
  return false;
}

function endGame(winner) {
  if (state.over) return;
  state.over = true;
  state.running = false;
  state.busy = true;
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  state.elapsed = Math.max(0, performance.now() - state.timerStart);
  const win = winner === 'player';
  addLog('win', win ? '決着！ あなたの勝利！' : '決着… 兄の勝利。');
  let newRecord = false;
  if (win) {
    if (!state.best || state.elapsed < state.best.time) {
      state.best = { time: state.elapsed, turns: state.turn };
      saveBest(state.best);
      newRecord = true;
    }
  }
  updateBestDisplays();
  render();
  sfx(win ? 'win' : 'lose');
  state.result = { win, newRecord };
  setTimeout(() => showResult(win, newRecord), 780);
}

/* ---------------- turn flow ---------------- */
function drawCards(sideKey, n = 1, opts = {}) {
  const side = state.players[sideKey];
  for (let i = 0; i < n; i++) {
    if (!side.deck.length) {
      if (!opts.silent) addLog('damage', `${labelOf(sideKey)}のデッキが尽きた！ 1000ダメージ`);
      damage(sideKey, 1000, 'デッキ切れ');
      if (state.over) return;
    } else {
      side.hand.push(side.deck.pop());
    }
  }
  if (!opts.silent && sideKey === 'player') sfx('draw');
}

function resetTurnFlags(sideKey) {
  const side = state.players[sideKey];
  side.hasSummoned = false;
  for (const inst of allMonsters(sideKey)) {
    inst.changed = false;
    inst.attacked = false;
  }
}

function clearBoosts(sideKey) {
  for (const inst of allMonsters(sideKey)) inst.boost = 0;
}

function startGame() {
  initAudio();
  closeModal();
  state.gameId++;
  state.uid = 0;
  state.players = { player: newSide('player'), opponent: newSide('opponent') };
  state.emz = [null, null];
  state.turn = 1;
  state.active = 'player';
  state.over = false;
  state.busy = false;
  state.running = true;
  state.started = true;
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  state.log = [];
  state.elapsed = 0;
  state.timerStart = performance.now();
  state.result = null;

  for (let i = 0; i < 5; i++) {
    drawCards('player', 1, { silent: true });
    drawCards('opponent', 1, { silent: true });
  }

  addLog('sys', '決闘開始。24ゾーン、LP8000。最速で決着をつけろ。');
  startPlayerTurn(true);
  taunt('兄「先手はくれてやる。最速で来い」');
  sfx('start');
}

function startPlayerTurn(isFirst = false) {
  state.active = 'player';
  state.busy = false;
  resetTurnFlags('player');
  addLog('turn', `--- あなたのターン (TURN ${state.turn}) ---`);
  drawCards('player', 1);
  if (!isFirst) sfx('turn');
  render();
}

function endPlayerTurn() {
  if (state.over || state.busy || state.active !== 'player') return;
  clearModes();
  clearBoosts('player');
  state.active = 'opponent';
  state.busy = true;
  addLog('sys', 'あなたはターンを終了した。');
  render();
  const gen = state.gameId;
  setTimeout(() => {
    if (gen === state.gameId && !state.over) aiTurn(gen);
  }, 420);
}

/* ---------------- summoning ---------------- */
async function summonMonster(sideKey, opts) {
  const gen = state.gameId;
  const side = state.players[sideKey];
  const c = CARD_DB[opts.cardId];
  const tributes = (opts.tributes || []).filter((t) => t && t.zone);

  for (const t of tributes) {
    addLog(sideKey === 'player' ? 'player' : 'opponent', `${CARD_DB[t.id].name}を生贄に捧げた`, 'sys');
    removeInst(t, true);
  }

  if (opts.isExtra) {
    const idx = side.extra.indexOf(opts.cardId);
    if (idx >= 0) side.extra.splice(idx, 1);
  } else {
    let idx = opts.handIndex;
    if (typeof idx !== 'number' || side.hand[idx] !== opts.cardId) {
      idx = side.hand.indexOf(opts.cardId);
    }
    if (idx >= 0) side.hand.splice(idx, 1);
  }

  const inst = createInst(opts.cardId, sideKey);
  inst.position = opts.position === 'set' ? 'defense' : (opts.position || 'attack');
  inst.faceDown = opts.position === 'set';
  inst.changed = true;
  setInst(opts.zone, inst);
  if (!opts.isExtra) side.hasSummoned = true;

  const posText = opts.position === 'set'
    ? '裏側守備表示でセットした'
    : opts.isExtra
      ? 'をEXゾーンに特殊召喚した'
      : 'を攻撃表示で召喚した';

  if (sideKey === 'opponent' && opts.position === 'set') {
    addLog('opponent', '兄はモンスターを裏側守備表示でセットした', 'opponent');
  } else {
    addLog(sideKey === 'player' ? 'player' : 'opponent', `${c.name}${posText}`, sideKey === 'player' ? 'player' : 'opponent');
  }

  sfx(opts.isExtra ? 'extra' : opts.position === 'set' ? 'set' : 'summon');
  banner(opts.position === 'set' ? 'SET' : c.name, opts.isExtra ? 'summon' : 'summon');
  render();
  flashZone(inst, 'zone-flash');
  await sleep(360);
  if (gen !== state.gameId) return null;

  if (c.onSummon && c.onSummon.burn) {
    damage(other(sideKey), c.onSummon.burn, c.name);
    if (gen !== state.gameId || state.over) return null;
  }
  if (c.onSummon && c.onSummon.destroyStrongest) {
    const target = strongestMonster(other(sideKey));
    if (target) {
      addLog('spell', `${c.name}の効果で${CARD_DB[target.id].name}を破壊！`, 'spell');
      destroyInst(target);
    }
    render();
    await sleep(280);
    if (gen !== state.gameId || state.over) return null;
  }

  await checkPitfall(sideKey, inst);
  return inst;
}

async function checkPitfall(ownerKey, summonedInst) {
  if (!summonedInst || !summonedInst.zone || summonedInst.faceDown) return;
  const oppKey = other(ownerKey);
  const side = state.players[oppKey];
  const trap = side.spells.find((inst) => inst && inst.faceDown && inst.id === 'pitfall');
  if (!trap) return;
  if (CARD_DB[summonedInst.id].atk < 1800) return;
  removeInst(trap, true);
  addLog('trap', '罠発動：落とし穴！', 'trap');
  banner('落とし穴 発動', 'trap');
  sfx('trap');
  render();
  await sleep(460);
  if (!summonedInst.zone) return;
  destroyInst(summonedInst);
  render();
}

/* ---------------- spell / trap ---------------- */
function spellPlayable(sideKey, id) {
  const c = CARD_DB[id];
  const side = state.players[sideKey];
  if (c.field) return true;
  if (id === 'lightning') return allMonsters(other(sideKey)).length > 0;
  if (id === 'revive') {
    return side.graveyard.some((card) => isMonster(card)) && side.monsters.some((x) => !x);
  }
  if (id === 'evilLight') return allMonsters(other(sideKey)).some((m) => m.faceDown);
  return true;
}

async function castSpell(sideKey, handIndex, target, gen) {
  const side = state.players[sideKey];
  const id = side.hand[handIndex];
  if (!id) return;
  const c = CARD_DB[id];
  side.hand.splice(handIndex, 1);

  addLog(sideKey === 'player' ? 'player' : 'opponent', `${labelOf(sideKey)}は「${c.name}」を発動！`, 'spell');
  banner(c.name, 'spell');
  sfx('spell');
  render();
  await sleep(320);
  if (gen !== state.gameId || state.over) return;

  if (c.field) {
    const old = side.field;
    if (old) {
      removeInst(old, true);
      addLog('sys', `フィールド魔法「${CARD_DB[old.id].name}」を墓地へ送った`, 'sys');
    }
    const inst = createInst(id, sideKey);
    setInst({ area: 'field', owner: sideKey, index: 0 }, inst);
    addLog(sideKey === 'player' ? 'player' : 'opponent', 'フィールド魔法「疾風の草原」を発動。攻撃力＋300！', 'spell');
    render();
    await sleep(280);
    return;
  }

  side.graveyard.push({ id, owner: sideKey });

  if (id === 'fireball') {
    damage(other(sideKey), 1000, '火球');
  } else if (id === 'greatfire') {
    damage(other(sideKey), 1500, '大火球');
  } else if (id === 'lightning') {
    let victim = target;
    if (!victim || !victim.zone) victim = strongestMonster(other(sideKey));
    if (victim) {
      addLog('spell', `落雷が${CARD_DB[victim.id].name}を撃ち抜いた！`, 'spell');
      destroyInst(victim);
    } else {
      addLog('sys', '落雷の対象がいなかった…', 'sys');
    }
  } else if (id === 'gale') {
    const own = allMonsters(sideKey);
    own.forEach((m) => { m.boost += 700; });
    addLog('spell', `疾風の剣！ 自分のモンスター${own.length}体の攻撃力＋700`, 'spell');
  } else if (id === 'wisdom') {
    addLog('spell', `${labelOf(sideKey)}はカードを2枚ドロー`, 'spell');
    drawCards(sideKey, 2);
  } else if (id === 'revive') {
    const candidates = side.graveyard
      .map((card, index) => ({ card, index }))
      .filter((x) => isMonster(x.card))
      .sort((a, b) => CARD_DB[b.card.id].atk - CARD_DB[a.card.id].atk);
    const zoneIndex = side.monsters.findIndex((x) => !x);
    if (candidates.length && zoneIndex >= 0) {
      const chosen = candidates[0];
      side.graveyard.splice(chosen.index, 1);
      const inst = createInst(chosen.card.id, sideKey);
      inst.position = 'defense';
      inst.changed = true;
      setInst({ area: 'monsters', owner: sideKey, index: zoneIndex }, inst);
      addLog('spell', `蘇生の儀！ ${CARD_DB[inst.id].name}を守備表示で特殊召喚`, 'spell');
      banner('REVIVE', 'summon');
      render();
      flashZone(inst, 'zone-flash');
      await sleep(300);
      await checkPitfall(sideKey, inst);
    }
  } else if (id === 'evilLight') {
    const sets = allMonsters(other(sideKey)).filter((m) => m.faceDown);
    sets.forEach((m) => destroyInst(m));
    if (sets.length) {
      addLog('spell', `破邪の光！ 裏側モンスター${sets.length}体を破壊し、${sets.length * 300}ダメージ`, 'spell');
      damage(other(sideKey), sets.length * 300, '破邪の光');
    } else {
      addLog('sys', '破邪の光の対象がなかった…', 'sys');
    }
  }

  render();
}

function setTrap(sideKey, handIndex, zoneIndex) {
  const side = state.players[sideKey];
  const id = side.hand[handIndex];
  if (!id) return;
  const c = CARD_DB[id];
  side.hand.splice(handIndex, 1);
  const inst = createInst(id, sideKey);
  inst.position = 'defense';
  inst.faceDown = true;
  inst.changed = true;
  setInst({ area: 'spells', owner: sideKey, index: zoneIndex }, inst);
  if (sideKey === 'player') {
    addLog('player', `「${c.name}」を裏側でセットした`, 'trap');
  } else {
    addLog('opponent', '兄は魔法・罠ゾーンにカードを裏側でセットした', 'trap');
  }
  sfx('set');
  banner('SET', 'trap');
  render();
  flashZone(inst, 'zone-flash');
}

/* ---------------- destruction & flip ---------------- */
function destroyInst(inst) {
  if (!inst || !inst.zone) return;
  const name = CARD_DB[inst.id].name;
  addLog('destroy', `${labelOf(inst.owner)}の${name}を破壊！`);
  removeInst(inst, true);
}

function flipInst(inst, reason) {
  if (!inst || !inst.faceDown) return;
  inst.faceDown = false;
  inst.position = reason === 'summon' ? 'attack' : 'defense';
  const c = CARD_DB[inst.id];
  addLog(inst.owner === 'player' ? 'player' : 'opponent', `${c.name}がリバース！`, inst.owner === 'player' ? 'player' : 'opponent');
  banner(`REVERSE ${c.name}`, 'summon');
  sfx('flip');
  if (c.flip && c.flip.burn) damage(other(inst.owner), c.flip.burn, 'リバース効果');
  if (c.flip && c.flip.heal) heal(inst.owner, c.flip.heal, 'リバース効果');
  render();
  flashZone(inst, 'zone-flash');
}

/* ---------------- battle ---------------- */
async function attackTrap(defSideKey, attacker, target) {
  const side = state.players[defSideKey];
  const trap = side.spells.find((inst) => {
    if (!inst || !inst.faceDown) return false;
    if (CARD_DB[inst.id].type !== 'trap') return false;
    if (inst.id === 'morale' && !target) return false;
    return true;
  });
  if (!trap) return null;
  const id = trap.id;
  removeInst(trap, true);
  addLog('trap', `罠発動：${CARD_DB[id].name}！`, 'trap');
  banner(`${CARD_DB[id].name} 発動`, 'trap');
  sfx('trap');
  render();
  await sleep(520);

  if (id === 'ambush') {
    addLog('trap', '攻撃を無効にし、攻撃モンスターを破壊！', 'trap');
    destroyInst(attacker);
    render();
    return { negated: true };
  }
  if (id === 'mirror') {
    addLog('trap', '攻撃を無効にし、800ダメージを与える！', 'trap');
    damage(attacker.owner, 800, '鏡の盾');
    render();
    return { negated: true };
  }
  if (id === 'morale') {
    if (target && target.zone) {
      target.boost += 1000;
      addLog('trap', '攻撃されたモンスターの攻撃力・守備力＋1000！', 'trap');
    }
    render();
    return { negated: false, morale: true };
  }
  return null;
}

async function performAttack(attacker, target) {
  const gen = state.gameId;
  if (!attacker || !attacker.zone || state.over) return;
  state.busy = true;
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  attacker.attacked = true;
  const atkKey = attacker.owner;
  const defKey = other(atkKey);
  addLog(atkKey === 'player' ? 'player' : 'opponent',
    `${CARD_DB[attacker.id].name}で${target ? `「${CARD_DB[target.id].name}」を攻撃` : 'ダイレクトアタック'}！`,
    atkKey === 'player' ? 'player' : 'opponent');
  sfx('attack');
  render();
  await sleep(260);
  if (gen !== state.gameId) return;

  const trapResult = await attackTrap(defKey, attacker, target);
  if (gen !== state.gameId) return;
  if (trapResult && trapResult.negated) {
    await sleep(320);
    if (gen !== state.gameId) return;
    finishAttack();
    return;
  }
  let morale = !!(trapResult && trapResult.morale);
  if (!attacker.zone) { finishAttack(); return; }
  if (target && !target.zone) { finishAttack(); return; }

  if (target && target.faceDown) {
    flipInst(target, 'attacked');
    await sleep(360);
    if (gen !== state.gameId) return;
    if (state.over) { finishAttack(); return; }
    if (!target.zone) { finishAttack(); return; }
  }

  if (!target) {
    const dmg = effAtk(attacker);
    impactAt(attacker, null);
    damage(defKey, dmg, 'ダイレクトアタック');
  } else {
    const a = effAtk(attacker);
    if (target.position === 'defense') {
      const d = effDef(target);
      addLog('sys', `攻撃力${a} VS 守備力${d}`, 'sys');
      if (a > d) {
        destroyInst(target);
      } else if (a < d) {
        damage(atkKey, d - a, '反撃');
      } else {
        addLog('sys', '攻撃は弾かれた。', 'sys');
      }
    } else {
      const d = effAtk(target);
      addLog('sys', `攻撃力${a} VS 攻撃力${d}`, 'sys');
      if (a > d) {
        destroyInst(target);
        damage(defKey, a - d, '戦闘ダメージ');
      } else if (a < d) {
        destroyInst(attacker);
        damage(atkKey, d - a, '戦闘ダメージ');
      } else {
        destroyInst(attacker);
        destroyInst(target);
        addLog('damage', '相打ち！ 両者のモンスターが破壊された。', 'damage');
      }
    }
    impactAt(attacker, target);
  }

  if (morale && target && target.zone) target.boost = Math.max(0, target.boost - 1000);
  render();
  await sleep(320);
  if (gen !== state.gameId) return;
  finishAttack();

  function finishAttack() {
    if (state.active === 'player' && !state.over) state.busy = false;
    render();
  }
}

/* ---------------- result rank ---------------- */
function resultRank(ms, turns) {
  if (ms <= 60000 && turns <= 4) return { grade: 'S', label: '神速' };
  if (ms <= 95000) return { grade: 'A', label: '最速' };
  if (ms <= 140000) return { grade: 'B', label: '快勝' };
  return { grade: 'C', label: '勝利' };
}

/* ---------------- sound ---------------- */
let audioCtx = null;

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  } catch (_) { audioCtx = null; }
}

function tone(freq, duration, type, volume, when) {
  if (!state.sound || !audioCtx) return;
  const t0 = audioCtx.currentTime + (when || 0);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(volume || 0.035, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function sfx(kind) {
  if (!state.sound) return;
  if (!audioCtx) return;
  switch (kind) {
    case 'click': tone(620, 0.05, 'square', 0.015); break;
    case 'draw': tone(740, 0.06, 'triangle', 0.02); break;
    case 'turn': tone(440, 0.08, 'sine', 0.025); break;
    case 'summon': tone(320, 0.1, 'triangle', 0.03); tone(640, 0.12, 'sine', 0.025, 0.06); break;
    case 'extra': [392, 523, 659].forEach((f, i) => tone(f, 0.12, 'triangle', 0.03, i * 0.06)); break;
    case 'set': tone(300, 0.07, 'sine', 0.025); tone(240, 0.09, 'sine', 0.02, 0.06); break;
    case 'attack': tone(150, 0.12, 'sawtooth', 0.025); break;
    case 'damage': tone(95, 0.16, 'square', 0.03); break;
    case 'heal': [523, 659, 784].forEach((f, i) => tone(f, 0.1, 'sine', 0.02, i * 0.05)); break;
    case 'spell': tone(620, 0.08, 'sine', 0.025); tone(880, 0.1, 'sine', 0.02, 0.05); break;
    case 'trap': tone(260, 0.09, 'square', 0.03); tone(180, 0.12, 'square', 0.025, 0.07); break;
    case 'flip': tone(480, 0.06, 'triangle', 0.025); tone(720, 0.08, 'triangle', 0.02, 0.04); break;
    case 'start': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.14, 'triangle', 0.028, i * 0.08)); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'sine', 0.035, i * 0.1)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'sine', 0.03, i * 0.13)); break;
    default: tone(440, 0.05, 'sine', 0.015);
  }
}

function toggleSound() {
  state.sound = !state.sound;
  try { localStorage.setItem('ygo_sound_v1', state.sound ? '1' : '0'); } catch (_) { /* ignore */ }
  if (state.sound) { initAudio(); sfx('click'); }
  renderHUD();
}

function updateBestDisplays() {
  const best = state.best;
  const bestLabel = $('#bestLabel');
  const bestRecord = $('#bestRecord');
  const bestTurns = $('#bestTurns');
  if (!bestLabel) return;
  if (best) {
    bestLabel.textContent = `BEST ${formatTime(best.time)} · ${best.turns}T`;
    bestRecord.textContent = formatTime(best.time);
    bestTurns.textContent = `${best.turns}ターンで最速クリア`;
  } else {
    bestLabel.textContent = 'BEST --:--.-';
    bestRecord.textContent = '--:--.-';
    bestTurns.textContent = '記録なし';
  }
}

function tickTimer() {
  if (!state.running) return;
  const el = $('#timer');
  if (!el) return;
  state.elapsed = performance.now() - state.timerStart;
  el.textContent = formatTime(state.elapsed);
}
