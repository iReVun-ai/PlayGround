import { CARD_DEFS, DECK_LIST } from './cards.js';

/* ────────────────────────────── state ────────────────────────────── */

const LP_MAX = 3000;
const ZONES = 6;
const HAND_START = 5;
const PLAYER = 'player';
const ENEMY = 'enemy';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

let uidSeq = 0;
let S = makeState(true);

function makeState(withSound = true) {
  return {
    started: false,
    over: false,
    active: PLAYER,
    turnSerial: 0,
    busy: false,
    modalOpen: false,
    sound: withSound ? true : (typeof S !== 'undefined' ? S.sound : true),
    selectedUid: null,
    attackerUid: null,
    removals: [],
    fx: [],
    enterUids: new Set(),
    log: [],
    result: null,
    aiRun: 0,
    lpShown: { player: LP_MAX, enemy: LP_MAX },
    lpTweens: { player: 0, enemy: 0 },
    stats: { dealt: 0, taken: 0, acts: 0 },
    players: {
      player: createPlayer(PLAYER, 'あなた', '光'),
      enemy: createPlayer(ENEMY, 'ノクス', '冥'),
    },
  };
}

function createPlayer(side, name, mark) {
  return {
    side,
    name,
    mark,
    lp: LP_MAX,
    maxLp: LP_MAX,
    deck: [],
    hand: [],
    grave: [],
    big: Array(ZONES).fill(null),
    small: Array(ZONES).fill(null),
    summonUsed: 0,
    setUsed: 0,
    extraSummons: 0,
    ward: 0,
    skipDraw: false,
    turnsTaken: 0,
  };
}

function makeCard(defId, owner) {
  return {
    uid: `c${++uidSeq}`,
    defId,
    owner,
    zone: null,
    index: null,
    acted: false,
    attacked: false,
    stunned: false,
    summonedSerial: -99,
    mods: [],
    destroying: false,
    removal: null,
  };
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const other = side => (side === PLAYER ? ENEMY : PLAYER);
const label = side => (side === PLAYER ? 'あなた' : 'ノクス');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const defOf = card => CARD_DEFS[card.defId];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function addLog(text, side = 'system', kind = '') {
  if (!S.started && kind !== 'system') return;
  S.log.push({ text, side, kind, at: Date.now() });
  if (S.log.length > 60) S.log.shift();
}

function locate(uid) {
  if (!uid) return null;
  for (const side of [PLAYER, ENEMY]) {
    const p = S.players[side];
    for (const zone of ['big', 'small']) {
      for (let i = 0; i < ZONES; i++) {
        if (p[zone][i]?.uid === uid) return { side, zone, index: i, card: p[zone][i] };
      }
    }
    const handIndex = p.hand.findIndex(c => c.uid === uid);
    if (handIndex >= 0) return { side, zone: 'hand', index: handIndex, card: p.hand[handIndex] };
  }
  return null;
}

const findCard = uid => locate(uid)?.card ?? null;

/* ────────────────────────────── modifiers ────────────────────────────── */

function mod(card, spec) {
  const untilSerial =
    spec.duration === 'end' ? S.turnSerial : spec.duration === 'nextOwner' ? S.turnSerial + 2 : null;
  card.mods.push({ kind: spec.kind, value: spec.value || 0, untilSerial });
}

function cleanupMods(serial = S.turnSerial) {
  for (const side of [PLAYER, ENEMY]) {
    const p = S.players[side];
    for (const zone of ['big', 'small']) {
      for (const card of p[zone]) {
        if (!card) continue;
        card.mods = card.mods.filter(m => m.untilSerial == null || serial < m.untilSerial);
      }
    }
  }
}

const hasMod = (card, kind) => !!card && card.mods.some(m => m.kind === kind);
const sumMods = (card, kind) =>
  card ? card.mods.reduce((total, m) => total + (m.kind === kind ? m.value : 0), 0) : 0;

function effAtk(card) {
  if (!card) return 0;
  return Math.max(0, defOf(card).atk + sumMods(card, 'atk'));
}

function effGuard(card) {
  if (!card) return 0;
  return Math.max(0, defOf(card).guard + sumMods(card, 'guard'));
}

/* ────────────────────────────── game API ────────────────────────────── */

function damage(side, amount, kind = 'act', anchor = null) {
  const p = S.players[side];
  const actual = Math.min(p.lp, Math.max(0, Math.round(amount)));
  if (!actual) return;
  p.lp -= actual;
  S.fx.push({ type: 'damage', side, amount: actual, kind, anchor });
  if (side === ENEMY) S.stats.dealt += actual;
  else S.stats.taken += actual;
  if (kind === 'cost') addLog(`${label(side)}は${actual}LPを支払った`, side, 'cost');
  else if (kind === 'self') addLog(`${label(side)}は${actual}ダメージを受けた`, side, 'damage');
  else addLog(`${label(side)}に${actual}ダメージ`, side, 'damage');
}

function heal(side, amount) {
  const p = S.players[side];
  const actual = Math.min(p.maxLp - p.lp, Math.max(0, Math.round(amount)));
  if (!actual) return;
  p.lp += actual;
  S.fx.push({ type: 'heal', side, amount: actual });
  addLog(`${label(side)}は${actual}LP回復した`, side, 'heal');
}

function draw(side, n = 1) {
  const p = S.players[side];
  for (let i = 0; i < n; i++) {
    if (!p.deck.length) {
      if (!p.grave.length) break;
      p.deck.push(...p.grave.splice(0));
      shuffle(p.deck);
      addLog(`${label(side)}の墓地を山札に戻した`, side, 'system');
    }
    if (!p.deck.length) break;
    const card = p.deck.pop();
    card.zone = null;
    card.index = null;
    card.mods = [];
    card.acted = false;
    card.attacked = false;
    p.hand.push(card);
    S.enterUids.add(card.uid);
    addLog(`${label(side)}は1枚ドローした`, side, 'draw');
  }
}

function destroy(card) {
  if (!card || card.destroying || !card.zone) return;
  card.destroying = true;
  card.removal = 'destroy';
  S.removals.push(card);
  addLog(`「${defOf(card).name}」が破壊された`, card.owner, 'destroy');
}

function bounce(card) {
  if (!card || card.destroying || !card.zone) return;
  card.destroying = true;
  card.removal = 'bounce';
  S.removals.push(card);
  addLog(`「${defOf(card).name}」が手札に戻された`, card.owner, 'bounce');
}

function destroyAllRelics() {
  for (const side of [PLAYER, ENEMY]) {
    for (const card of S.players[side].small) if (card) destroy(card);
  }
}

function stun(card) {
  if (!card) return;
  card.stunned = true;
}

function ward(side) {
  S.players[side].ward += 1;
}

function skipDraw(side) {
  S.players[side].skipDraw = true;
}

function extraSummon(side) {
  S.players[side].extraSummons += 1;
}

function refresh(card) {
  if (!card) return;
  card.acted = false;
}

function monsters(side) {
  return S.players[side].big.filter(c => c && !c.destroying);
}

function relics(side) {
  return S.players[side].small.filter(c => c && !c.destroying);
}

function highestAtk(side) {
  return monsters(side).sort((a, b) => effAtk(b) - effAtk(a))[0] || null;
}

function highestGuard(side) {
  return monsters(side).sort((a, b) => effGuard(b) - effGuard(a))[0] || null;
}

function actedMonsters(side) {
  return monsters(side).filter(c => c.acted && !c.stunned);
}

function emptyBig(side) {
  return S.players[side].big.findIndex(c => !c);
}

function emptySmall(side) {
  return S.players[side].small.findIndex(c => !c);
}

function graveMonsters(side) {
  return S.players[side].grave.filter(c => defOf(c).kind === 'monster' && !defOf(c).token);
}

function revive(side) {
  const p = S.players[side];
  const target = graveMonsters(side).sort((a, b) => defOf(b).atk - defOf(a).atk)[0];
  const index = emptyBig(side);
  if (!target || index < 0) return;
  p.grave.splice(p.grave.indexOf(target), 1);
  target.zone = 'big';
  target.index = index;
  target.mods = [];
  target.acted = false;
  target.attacked = false;
  target.stunned = false;
  target.destroying = false;
  target.removal = null;
  target.summonedSerial = S.turnSerial;
  p.big[index] = target;
  S.enterUids.add(target.uid);
  addLog(`「${defOf(target).name}」が墓地から蘇った`, side, 'summon');
}

function summonToken(side) {
  const index = emptyBig(side);
  if (index < 0) return;
  const p = S.players[side];
  const token = makeCard('bloomtoken', side);
  token.zone = 'big';
  token.index = index;
  token.summonedSerial = S.turnSerial;
  p.big[index] = token;
  S.enterUids.add(token.uid);
  addLog('「花の精霊トークン」が特殊召喚された', side, 'summon');
}

const G = {
  other,
  player: side => S.players[side],
  damage,
  heal,
  draw,
  destroy,
  destroyAllRelics,
  bounce,
  stun,
  ward,
  skipDraw,
  extraSummon,
  refresh,
  mod,
  effAtk,
  effGuard,
  hasMod,
  monsters,
  relics,
  highestAtk,
  highestGuard,
  actedMonsters,
  emptyBig,
  emptySmall,
  graveMonsters,
  revive,
  summonToken,
  log: addLog,
};

/* ────────────────────────────── validation ────────────────────────────── */

function baseBlockReason() {
  if (!S.started) return 'デュエルが始まっていません';
  if (S.over) return 'デュエルは終了しています';
  if (S.modalOpen) return 'ルールを閉じてください';
  if (S.busy) return '処理中です';
  if (S.active !== PLAYER) return '相手のターンです';
  return null;
}

function playReason(card) {
  const block = baseBlockReason();
  if (block) return block;
  if (!card || card.owner !== PLAYER) return '自分のカードではありません';
  const d = defOf(card);
  const p = S.players[PLAYER];
  if (d.token) return 'トークンは手札にありません';
  if (d.kind === 'monster') {
    if (p.summonUsed >= 1 + p.extraSummons) return '召喚権を使い切りました';
    if (emptyBig(PLAYER) < 0) return 'BIGゾーンが埋まっています';
  } else {
    if (p.setUsed >= 1) return '設置権を使い切りました';
    if (emptySmall(PLAYER) < 0) return 'SMALLゾーンが埋まっています';
  }
  return null;
}

function canActNow(card) {
  if (!card || card.destroying || !card.zone) return 'カードが場にありません';
  if (card.acted) return 'このターンはアクト済みです';
  if (card.stunned) return '停止中です';
  const d = defOf(card);
  if (d.noAct) return 'アクトを持ちません';
  return d.canAct(G, card) || null;
}

function actReason(card) {
  const block = baseBlockReason();
  if (block) return block;
  if (!card || card.owner !== PLAYER) return '自分のカードではありません';
  return canActNow(card);
}

function canAttackNow(card) {
  if (!card || card.destroying || card.zone !== 'big') return 'モンスターではありません';
  if (defOf(card).kind !== 'monster') return 'モンスターではありません';
  if (card.owner !== S.active) return '相手のターンです';
  if (card.attacked) return 'このターンは攻撃済みです';
  if (card.stunned) return '停止中です';
  if (card.summonedSerial === S.turnSerial) return '召喚したターンは攻撃できません';
  return null;
}

function attackReason(card) {
  const block = baseBlockReason();
  if (block) return block;
  if (!card || card.owner !== PLAYER) return '自分のモンスターではありません';
  return canAttackNow(card);
}

function validTargets(attacker) {
  const foe = other(attacker.owner);
  const enemies = monsters(foe);
  if (!enemies.length) return { direct: true, monsters: [] };
  const taunts = enemies.filter(c => hasMod(c, 'taunt'));
  return {
    direct: hasMod(attacker, 'direct'),
    monsters: taunts.length ? taunts : enemies,
  };
}

/* ────────────────────────────── placing cards ────────────────────────────── */

function placeCard(card, preferred = null) {
  const d = defOf(card);
  const p = S.players[card.owner];
  const zone = d.kind === 'monster' ? 'big' : 'small';
  const handIndex = p.hand.indexOf(card);
  if (handIndex < 0) return false;
  let index = -1;
  if (
    preferred &&
    preferred.zone === zone &&
    Number.isInteger(preferred.index) &&
    preferred.index >= 0 &&
    preferred.index < ZONES &&
    !p[zone][preferred.index]
  ) {
    index = preferred.index;
  } else {
    index = zone === 'big' ? emptyBig(card.owner) : emptySmall(card.owner);
  }
  if (index < 0) return false;
  if (d.kind === 'monster') {
    if (p.summonUsed >= 1 + p.extraSummons) return false;
    p.summonUsed += 1;
    card.summonedSerial = S.turnSerial;
    addLog(`「${d.name}」を召喚した`, card.owner, 'summon');
    sfx('summon');
  } else {
    if (p.setUsed >= 1) return false;
    p.setUsed += 1;
    card.summonedSerial = -99;
    addLog(`「${d.name}」を設置した`, card.owner, 'set');
    sfx('set');
  }
  p.hand.splice(handIndex, 1);
  card.zone = zone;
  card.index = index;
  card.acted = false;
  card.attacked = false;
  card.stunned = false;
  card.mods = [];
  card.destroying = false;
  card.removal = null;
  p[zone][index] = card;
  S.enterUids.add(card.uid);
  S.selectedUid = null;
  S.attackerUid = null;
  renderAll();
  const el = document.querySelector(`[data-uid="${card.uid}"]`);
  if (el) spawnRing(el.getBoundingClientRect(), d.kind === 'monster' ? '#e8c37a' : '#6fe7ff');
  flushFx();
  return true;
}

function playerPlayCard(card, preferred = null) {
  const reason = playReason(card);
  if (reason) {
    toast(reason);
    return false;
  }
  return placeCard(card, preferred);
}

/* ────────────────────────────── acts ────────────────────────────── */

async function executeAct(card) {
  const state = S;
  const d = defOf(card);
  const p = S.players[card.owner];
  const el = document.querySelector(`[data-uid="${card.uid}"]`);
  const rect = el ? el.getBoundingClientRect() : null;

  if (p.ward > 0) {
    p.ward -= 1;
    card.acted = true;
    addLog(`結界が「${d.name}」のアクトを無効化した`, card.owner, 'ward');
    S.fx.push({ type: 'negate', rect });
    sfx('negate');
    renderAll();
    flushFx();
    await sleep(520);
    return;
  }

  card.acted = true;
  S.stats.acts += 1;
  addLog(`${label(card.owner)}：${d.name}《${d.actName}》`, card.owner, 'act');
  if (el) pulseCard(el);
  sfx('act');
  S.fx.push({ type: 'act', rect });
  await sleep(160);
  if (S !== state) return;
  d.act(G, card);
  renderAll();
  flushFx();
  await settleRemovals();
  if (S !== state) return;
  checkGameOver();
}

async function playerActivate(card) {
  const reason = actReason(card);
  if (reason) {
    toast(reason);
    return;
  }
  const state = S;
  S.busy = true;
  S.selectedUid = null;
  S.attackerUid = null;
  renderAll();
  await executeAct(card);
  if (S !== state) return;
  if (!S.over) {
    S.busy = false;
    renderAll();
  }
}

/* ────────────────────────────── combat ────────────────────────────── */

function battlePreview(attacker, target) {
  if (!attacker || !target) return null;
  const a = effAtk(attacker);
  const d = effAtk(target);
  const aShield = hasMod(attacker, 'battleShield');
  const dShield = hasMod(target, 'battleShield');
  if (a > d) {
    return {
      cls: dShield ? 'hold' : 'win',
      text: dShield ? `-${a - d} / 耐性` : `破壊 -${a - d}`,
      damage: a - d,
      destroys: dShield ? null : 'target',
    };
  }
  if (a < d) {
    return {
      cls: aShield ? 'hold' : 'lose',
      text: aShield ? `被弾 -${d - a} / 耐性` : `自滅 -${d - a}`,
      damage: d - a,
      destroys: aShield ? null : 'self',
    };
  }
  const text = !aShield && !dShield ? '相打ち' : aShield && dShield ? '両者生存' : dShield ? '自滅 / 耐性' : '敵破壊 / 耐性';
  return {
    cls: !aShield && !dShield ? 'tie' : 'hold',
    text,
    damage: 0,
    destroys: !aShield && !dShield ? 'both' : dShield ? 'self' : 'target',
  };
}

function startAttack(attacker) {
  const reason = attackReason(attacker);
  if (reason) {
    toast(reason);
    return;
  }
  const targets = validTargets(attacker);
  if (!targets.monsters.length && targets.direct) {
    performAttack(attacker, null);
    return;
  }
  S.attackerUid = attacker.uid;
  S.selectedUid = null;
  sfx('target');
  renderAll();
}

async function performAttack(attacker, targetUid = null, { ai = false } = {}) {
  if (!attacker || S.over) return;
  if (S.busy && !ai) return;
  const state = S;
  const target = targetUid ? findCard(targetUid) : null;
  if (!ai) {
    const targets = validTargets(attacker);
    if (target && !targets.monsters.some(c => c.uid === target.uid)) {
      toast('そのモンスターは攻撃できません');
      return;
    }
    if (!target && !targets.direct) {
      toast('先に相手モンスターを攻撃してください');
      return;
    }
  }

  S.busy = true;
  S.selectedUid = null;
  S.attackerUid = null;
  const attackerEl = document.querySelector(`[data-uid="${attacker.uid}"]`);
  const targetEl = target ? document.querySelector(`[data-uid="${target.uid}"]`) : null;
  const aRect = attackerEl ? attackerEl.getBoundingClientRect() : null;
  const tRect = targetEl ? targetEl.getBoundingClientRect() : lpRect(other(attacker.owner));

  if (attackerEl && tRect && aRect) {
    const dx = tRect.left + tRect.width / 2 - (aRect.left + aRect.width / 2);
    const dy = tRect.top + tRect.height / 2 - (aRect.top + aRect.height / 2);
    attackerEl.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${dx * 0.72}px, ${dy * 0.72}px) scale(1.06)` },
        { transform: 'translate(0,0) scale(1)' },
      ],
      { duration: 360, easing: 'cubic-bezier(.2,.8,.3,1)' }
    );
  }
  sfx('attack');
  await sleep(250);
  if (S !== state) return;

  attacker.attacked = true;
  const foe = other(attacker.owner);
  const aName = defOf(attacker).name;

  if (!target) {
    const dmg = effAtk(attacker);
    addLog(`「${aName}」の直接攻撃！`, attacker.owner, 'battle');
    damage(foe, dmg, 'battle', tRect);
    spawnSlash(tRect, '#ff6b6b');
    shake(dmg >= 1000 ? 2 : 1);
    sfx('hit');
  } else {
    const tName = defOf(target).name;
    const atkA = effAtk(attacker);
    const atkD = effAtk(target);
    const aShield = hasMod(attacker, 'battleShield');
    const dShield = hasMod(target, 'battleShield');
    addLog(`「${aName}」が「${tName}」を攻撃`, attacker.owner, 'battle');
    if (atkA > atkD) {
      if (!dShield) destroy(target);
      damage(target.owner, atkA - atkD, 'battle', tRect);
      spawnSlash(tRect, '#ffd27a');
      sfx('hit');
    } else if (atkA < atkD) {
      if (!aShield) destroy(attacker);
      damage(attacker.owner, atkD - atkA, 'battle', aRect);
      if (aRect) spawnSlash(aRect, '#ff5f6d');
      sfx('hit');
    } else {
      if (!dShield) destroy(target);
      if (!aShield) destroy(attacker);
      addLog('相打ち — 両者破壊', 'system', 'battle');
      spawnSlash(tRect, '#ffffff');
      sfx('destroy');
    }
    shake(atkA >= 1800 || atkD >= 1800 ? 2 : 1);
  }

  renderAll();
  flushFx();
  await settleRemovals();
  if (S !== state) return;
  checkGameOver();
  if (!ai && !S.over) S.busy = false;
  renderAll();
}

/* ────────────────────────────── removals ────────────────────────────── */

async function settleRemovals() {
  if (!S.removals.length) return;
  const state = S;
  renderAll();
  await sleep(400);
  if (S !== state) return;
  const removed = S.removals.splice(0);
  for (const card of removed) {
    const p = S.players[card.owner];
    if (card.zone) {
      const zone = p[card.zone];
      if (zone && zone[card.index] === card) zone[card.index] = null;
    }
    card.destroying = false;
    card.zone = null;
    card.index = null;
    card.acted = false;
    card.attacked = false;
    card.stunned = false;
    card.mods = [];
    if (card.removal === 'bounce') {
      p.hand.push(card);
      S.enterUids.add(card.uid);
      addLog(`「${defOf(card).name}」が手札に加わった`, card.owner, 'bounce');
    } else if (!defOf(card).token) {
      p.grave.push(card);
    }
    card.removal = null;
  }
  renderAll();
}

/* ────────────────────────────── turn lifecycle ────────────────────────────── */

function beginTurn(side) {
  if (S.over || !S.started) return;
  S.active = side;
  S.turnSerial += 1;
  S.players[side].turnsTaken += 1;
  cleanupMods(S.turnSerial);
  const p = S.players[side];
  p.summonUsed = 0;
  p.setUsed = 0;
  p.extraSummons = 0;

  for (const zone of ['big', 'small']) {
    for (const card of p[zone]) {
      if (!card) continue;
      if (card.stunned) {
        card.acted = true;
        card.attacked = true;
        card.stunned = false;
        addLog(`「${defOf(card).name}」は停止している`, side, 'stun');
      } else {
        card.acted = false;
        card.attacked = false;
      }
    }
  }

  S.selectedUid = null;
  S.attackerUid = null;
  S.busy = false;
  addLog(`── ${label(side)}のターン（TURN ${String(S.turnSerial).padStart(2, '0')}）──`, side, 'turn');

  if (p.skipDraw) {
    p.skipDraw = false;
    addLog(`${label(side)}のドローは時空停止でスキップされた`, side, 'ward');
    sfx('negate');
  } else {
    draw(side, 1);
  }

  renderAll();
  flushFx();
  banner(side === PLAYER ? 'YOUR TURN' : "NOX'S TURN", `TURN ${String(S.turnSerial).padStart(2, '0')}`);
  sfx('turn');

  if (side === ENEMY) {
    S.busy = true;
    renderAll();
    scheduleAi();
  }
}

async function finishTurn() {
  if (!S.started || S.over) return;
  const state = S;
  S.busy = true;
  S.selectedUid = null;
  S.attackerUid = null;
  cleanupMods(S.turnSerial);
  addLog(`${label(S.active)}のターン終了`, S.active, 'turn');
  renderAll();
  await sleep(420);
  if (S !== state || S.over) return;
  beginTurn(other(S.active));
}

async function requestEndTurn() {
  if (baseBlockReason()) {
    toast(baseBlockReason());
    return;
  }
  await finishTurn();
}

function checkGameOver() {
  if (S.over || !S.started) return false;
  if (S.players[PLAYER].lp <= 0 || S.players[ENEMY].lp <= 0) {
    S.over = true;
    S.busy = true;
    S.result = S.players[ENEMY].lp <= 0 ? 'win' : 'lose';
    renderAll();
    sfx(S.result === 'win' ? 'win' : 'lose');
    setTimeout(() => showGameOver(S.result), 900);
    return true;
  }
  return false;
}

/* ────────────────────────────── AI ────────────────────────────── */

function scheduleAi() {
  const state = S;
  const token = ++S.aiRun;
  setTimeout(() => {
    if (S === state) runAi(token);
  }, 700);
}

const aiAlive = (token, state = S) =>
  state === S && token === S.aiRun && S.started && !S.over && S.active === ENEMY;

async function waitModal(token, state = S) {
  while (S.modalOpen && aiAlive(token, state)) await sleep(250);
}

async function runAi(token) {
  const state = S;
  if (!aiAlive(token, state)) return;
  S.busy = true;
  renderAll();
  await waitModal(token, state);
  await sleep(550);
  if (!aiAlive(token, state)) return;
  await aiTakeTurn(token);
  if (!aiAlive(token, state)) return;
  await sleep(380);
  if (!aiAlive(token, state)) return;
  await finishTurn();
}

async function aiTakeTurn(token) {
  const state = S;
  if (!aiAlive(token, state)) return;

  // 1. normal summon
  if (aiSummon()) {
    await sleep(520);
    await waitModal(token, state);
    if (!aiAlive(token, state)) return;
  }

  // 2. set one relic (it may be activated immediately in the act phase)
  if (aiSetRelic()) {
    await sleep(460);
    await waitModal(token, state);
    if (!aiAlive(token, state)) return;
  }

  // 3. resolve every useful act, best first
  for (let step = 0; step < 12; step++) {
    if (!aiAlive(token, state)) return;
    await waitModal(token, state);
    if (!aiAlive(token, state)) return;
    const card = chooseAiAct();
    if (!card) break;
    await executeAct(card);
    if (!aiAlive(token, state)) return;
    await sleep(380);
  }

  // 4. Hayate may have granted an extra summon
  if (S.players[ENEMY].summonUsed < 1 + S.players[ENEMY].extraSummons) {
    if (aiSummon()) {
      await sleep(440);
      await waitModal(token, state);
      if (!aiAlive(token, state)) return;
    }
  }

  // 5. battle
  for (let step = 0; step < 8; step++) {
    if (!aiAlive(token, state)) return;
    await waitModal(token, state);
    if (!aiAlive(token, state)) return;
    const plan = chooseAiAttack();
    if (!plan) break;
    await performAttack(plan.attacker, plan.target ? plan.target.uid : null, { ai: true });
    if (!aiAlive(token, state)) return;
    await sleep(430);
  }
}

function aiSummon() {
  const p = S.players[ENEMY];
  if (p.summonUsed >= 1 + p.extraSummons) return false;
  if (emptyBig(ENEMY) < 0) return false;
  const candidates = p.hand.filter(c => defOf(c).kind === 'monster');
  if (!candidates.length) return false;
  const scored = candidates
    .map(c => ({
      card: c,
      score:
        defOf(c).atk +
        defOf(c).guard * 0.28 +
        (c.defId === 'varga' ? 220 : 0) +
        (c.defId === 'seraph' ? 120 : 0) +
        (c.defId === 'golem' ? 90 : 0) +
        (c.defId === 'magnet' ? 60 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return placeCard(scored[0].card);
}

function aiSetRelic() {
  const p = S.players[ENEMY];
  if (p.setUsed >= 1) return false;
  if (emptySmall(ENEMY) < 0) return false;
  const candidates = p.hand.filter(c => defOf(c).kind === 'relic');
  if (!candidates.length) return false;
  const card = candidates.sort((a, b) => aiActScore(b) - aiActScore(a))[0];
  return placeCard(card);
}

function chooseAiAct() {
  const candidates = [];
  for (const card of [...monsters(ENEMY), ...relics(ENEMY)]) {
    if (card.destroying || card.acted) continue;
    const reason = canActNow(card);
    if (reason) continue;
    candidates.push({ card, score: aiActScore(card) });
  }
  if (!candidates.length) return null;
  if (S.players[ENEMY].ward > 0) {
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0].card;
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].score > 0 ? candidates[0].card : null;
}

function aiActScore(card) {
  const id = card.defId;
  const p = S.players[ENEMY];
  const foe = S.players[PLAYER];
  const fm = monsters(PLAYER);
  const mm = monsters(ENEMY);
  const strongestFoe = highestAtk(PLAYER);
  const strongestMine = highestAtk(ENEMY);

  switch (id) {
    case 'flarewolf':
      return 55;
    case 'golem':
      return fm.length ? 68 : 18;
    case 'twinblade':
      return fm.length && !canAttackNow(card) ? 88 : 0;
    case 'witch':
      return p.lp > 700 && p.hand.length <= 4 ? 55 : 12;
    case 'varga': {
      if (!strongestFoe || p.lp <= 900) return 0;
      return effAtk(strongestFoe) >= 1600 ? 115 : 70;
    }
    case 'seraph':
      return p.lp < 2300 ? 96 : 0;
    case 'hayate': {
      const bigInHand = p.hand.some(c => defOf(c).kind === 'monster' && defOf(c).atk >= 1700);
      return bigInHand ? 32 : 0;
    }
    case 'leviathan':
      return relics(PLAYER).length && p.lp > 1000 ? 58 : 0;
    case 'magnet':
      return strongestFoe && effAtk(strongestFoe) >= 1300 ? 78 : 12;
    case 'chrono':
      return p.lp > 900 ? 50 : 0;
    case 'sprout':
      return emptyBig(ENEMY) >= 0 && mm.length < 4 ? 48 : 0;
    case 'blade':
      return mm.length ? 72 : 0;
    case 'shield':
      return mm.length && fm.length ? 52 : 16;
    case 'bolt':
      return foe.lp <= 600 ? 200 : 86;
    case 'fountain':
      return p.lp < 2200 ? 100 : 0;
    case 'archive':
      return p.lp > 1200 && p.hand.length <= 4 ? 66 : 0;
    case 'revival':
      return graveMonsters(ENEMY).length && emptyBig(ENEMY) >= 0 && p.lp > 800 ? 88 : 0;
    case 'ring':
      return actedMonsters(ENEMY).some(c => effAtk(c) >= 1500) ? 68 : 0;
    case 'vortex': {
      const theirs = relics(PLAYER).length;
      const mine = relics(ENEMY).length;
      return theirs >= 2 && theirs > mine ? 74 : 0;
    }
    case 'crystal':
      return 56;
    case 'altar':
      return 34;
    case 'bounce':
      if (!strongestFoe) return 0;
      return effAtk(strongestFoe) > (strongestMine ? effAtk(strongestMine) : 0) ? 86 : 38;
    default:
      return 0;
  }
}

function chooseAiAttack() {
  const attackers = monsters(ENEMY).filter(c => !canAttackNow(c));
  if (!attackers.length) return null;
  let best = null;

  for (const attacker of attackers) {
    const targets = validTargets(attacker);
    const atkA = effAtk(attacker);
    const foeLp = S.players[PLAYER].lp;

    if (targets.direct && (!targets.monsters.length || hasMod(attacker, 'direct'))) {
      const score = atkA + (foeLp <= atkA ? 10000 : 0);
      if (!best || score > best.score) best = { attacker, target: null, score };
    }

    for (const target of targets.monsters) {
      if (target.destroying) continue;
      const atkD = effAtk(target);
      let score;
      if (atkA > atkD) {
        const dmg = atkA - atkD;
        score = 820 + dmg * 1.4 + (target.defId === 'golem' ? 120 : 0);
        if (foeLp <= dmg) score += 10000;
        if (hasMod(target, 'battleShield')) score -= 380;
      } else if (atkA === atkD) {
        score = 230 + atkD * 0.2;
        if (hasMod(target, 'battleShield')) score -= 240;
      } else {
        score = -900;
      }
      if (score > 0 && (!best || score > best.score)) best = { attacker, target, score };
    }
  }
  return best;
}

/* ────────────────────────────── rendering ────────────────────────────── */

const $ = selector => document.querySelector(selector);
const $all = selector => [...document.querySelectorAll(selector)];

const els = {
  enemyStrip: $('#enemyStrip'),
  playerStrip: $('#playerStrip'),
  enemyBoard: $('#enemyBoard'),
  playerBoard: $('#playerBoard'),
  hand: $('#hand'),
  handScroll: $('#handScroll'),
  actionBar: $('#actionBar'),
  logList: $('#logList'),
  ticker: $('#ticker'),
  turnPill: $('#turnPill'),
  turnLabel: $('#turnLabel'),
  turnCount: $('#turnCount'),
  endTurnBtn: $('#endTurnBtn'),
  banner: $('#turnBanner'),
  toastStack: $('#toastStack'),
  fxLayer: $('#fxLayer'),
  intro: $('#introOverlay'),
  rules: $('#rulesOverlay'),
  gameover: $('#gameoverOverlay'),
  gameoverCard: $('#gameoverCard'),
  gameoverKicker: $('#gameoverKicker'),
  gameoverTitle: $('#gameoverTitle'),
  gameoverSub: $('#gameoverSub'),
  gameoverStats: $('#gameoverStats'),
  soundBtn: $('#soundBtn'),
  app: $('#app'),
};

let renderCtx = { targetIds: new Set(), attacker: null, handCard: null };

const fmt = n => Number(n).toLocaleString('ja-JP');

function cardHTML(card, { hand = false } = {}) {
  const d = defOf(card);
  const isMonster = d.kind === 'monster';
  const atk = effAtk(card);
  const guard = effGuard(card);
  const acted = card.acted;
  const attacked = card.attacked;
  const spent = isMonster ? acted && attacked : acted;
  const selected = S.selectedUid === card.uid;
  const inHand = hand || !card.zone;
  const playable = inHand && card.owner === PLAYER && !playReason(card);
  const atkMod = sumMods(card, 'atk');
  const guardMod = sumMods(card, 'guard');

  const badges = [];
  if (card.stunned) badges.push('<span class="mini-badge stop">停止</span>');
  if (hasMod(card, 'taunt')) badges.push('<span class="mini-badge taunt">固定</span>');
  if (hasMod(card, 'battleShield')) badges.push('<span class="mini-badge shield">耐性</span>');
  if (hasMod(card, 'direct')) badges.push('<span class="mini-badge direct">直撃</span>');
  if (atkMod) badges.push(`<span class="mini-badge buff">ATK+${atkMod}</span>`);
  if (guardMod) badges.push(`<span class="mini-badge buff">DEF+${guardMod}</span>`);

  const classes = [
    'card',
    d.kind,
    hand ? 'in-hand' : 'on-field',
    selected ? 'selected' : '',
    acted ? 'act-used' : '',
    isMonster && attacked ? 'atk-used' : '',
    spent ? 'spent' : '',
    playable ? 'playable' : '',
    card.destroying ? 'destroying' : '',
    S.enterUids.has(card.uid) ? 'enter' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const aria = [
    d.name,
    isMonster ? `ATK ${atk} DEF ${guard}` : 'リリック',
    acted ? 'アクト済み' : '',
    isMonster && attacked ? '攻撃済み' : '',
  ]
    .filter(Boolean)
    .join('、');

  return `
    <button type="button" class="${classes}" data-uid="${card.uid}" data-side="${card.owner}" data-zone="${card.zone || 'hand'}" aria-label="${aria}" style="--p1:${d.palette[0]};--p2:${d.palette[1]};--p3:${d.palette[2]}">
      <span class="card-face">
        <span class="card-art">
          <span class="card-kanji" aria-hidden="true">${d.kanji}</span>
          <span class="card-glyph" aria-hidden="true">${d.glyph}</span>
          <span class="card-kind">${isMonster ? 'MONSTER' : 'RELIC'}</span>
          <span class="card-badges">${badges.slice(0, 2).join('')}</span>
          <span class="card-state" aria-hidden="true">
            <i class="pip act ${acted ? 'off' : 'on'}"></i>
            ${isMonster ? `<i class="pip atk ${attacked ? 'off' : 'on'}"></i>` : ''}
          </span>
          ${
            isMonster
              ? `<span class="card-stats"><span class="stat atk"><i>ATK</i>${atk}</span><span class="stat def"><i>DEF</i>${guard}</span></span>`
              : `<span class="card-ready">${acted ? 'USED' : 'ACT'}</span>`
          }
        </span>
        <span class="card-name">${d.name}</span>
        ${
          hand
            ? `<span class="card-actline"><b>${d.actName}</b>${d.actText}</span>`
            : ''
        }
      </span>
      ${spent ? `<span class="spent-veil" aria-hidden="true">${isMonster ? 'SPENT' : 'USED'}</span>` : ''}
    </button>`;
}

function slotHTML(side, zone, index) {
  const card = S.players[side][zone][index];
  const empty = !card;
  const canPlace =
    empty &&
    renderCtx.handCard &&
    renderCtx.handCard.owner === PLAYER &&
    side === PLAYER &&
    ((defOf(renderCtx.handCard).kind === 'monster' && zone === 'big') ||
      (defOf(renderCtx.handCard).kind === 'relic' && zone === 'small'));

  const targetable = !!card && renderCtx.targetIds.has(card.uid);

  const classes = [
    'slot',
    zone,
    side,
    empty ? 'empty' : 'filled',
    canPlace ? 'can-place' : '',
    targetable ? 'targetable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  let preview = '';
  if (targetable && renderCtx.attacker) {
    const info = battlePreview(renderCtx.attacker, card);
    if (info) preview = `<span class="battle-preview ${info.cls}">${info.text}</span>`;
  }

  return `
    <div class="${classes}" data-side="${side}" data-zone="${zone}" data-index="${index}">
      ${card ? cardHTML(card) : `<span class="slot-mark">${zone === 'big' ? ROMAN[index] : '·'}</span>`}
      ${preview}
    </div>`;
}

function stripHTML(side) {
  const p = S.players[side];
  const isEnemy = side === ENEMY;
  const active = S.started && !S.over && S.active === side;
  const thinking = isEnemy && S.started && S.active === ENEMY && S.busy && !S.over;
  const lpPct = clamp((p.lp / p.maxLp) * 100, 0, 100);
  const handBacks = Array.from({ length: Math.min(5, p.hand.length) }, () => '<i class="mini-back"></i>').join('');
  const extraHand = p.hand.length > 5 ? `<b class="hand-extra">+${p.hand.length - 5}</b>` : '';

  return `
    <div class="avatar avatar-${side}" aria-hidden="true"><span>${p.mark}</span></div>
    <div class="p-info">
      <div class="p-name-row">
        <span class="p-name">${p.name}</span>
        ${active ? '<span class="active-badge">ACTIVE</span>' : ''}
        ${thinking ? '<span class="thinking-dots" aria-label="考え中"><i></i><i></i><i></i></span>' : ''}
        ${p.ward > 0 ? `<span class="status-badge ward" title="相手の次のアクトを無効化">結界 ${p.ward}</span>` : ''}
        ${p.skipDraw ? '<span class="status-badge time" title="次のドローをスキップ">時空停止</span>' : ''}
      </div>
      <div class="lp-row">
        <span class="lp-num ${lpPct <= 25 ? 'low' : ''}" data-lp="${side}">${fmt(p.lp)}</span>
        <span class="lp-max">/ ${fmt(p.maxLp)}</span>
        <span class="lp-bar" data-lpbar="${side}"><i style="width:${lpPct}%"></i></span>
        <span class="lp-tag">LP</span>
      </div>
    </div>
    <div class="p-piles">
      ${isEnemy ? `<div class="enemy-hand" aria-label="相手の手札 ${p.hand.length}枚">${handBacks}${extraHand}</div>` : ''}
      <span class="pile"><b>${p.hand.length}</b><small>HAND</small></span>
      <span class="pile"><b>${p.deck.length}</b><small>DECK</small></span>
      <span class="pile grave"><b>${p.grave.length}</b><small>GRAVE</small></span>
    </div>`;
}

function boardHTML(side) {
  const big = S.players[side].big.map((_, i) => slotHTML(side, 'big', i)).join('');
  const small = S.players[side].small.map((_, i) => slotHTML(side, 'small', i)).join('');
  return side === ENEMY
    ? `<div class="board-row small-row">${small}</div><div class="board-row big-row">${big}</div>`
    : `<div class="board-row big-row">${big}</div><div class="board-row small-row">${small}</div>`;
}

function renderSide(side) {
  const strip = side === ENEMY ? els.enemyStrip : els.playerStrip;
  const board = side === ENEMY ? els.enemyBoard : els.playerBoard;
  strip.innerHTML = stripHTML(side);
  board.innerHTML = boardHTML(side);
  strip.classList.toggle('is-active', S.started && !S.over && S.active === side);
  board.classList.toggle('is-active', S.started && !S.over && S.active === side);
}

function renderHand() {
  const p = S.players[PLAYER];
  const scrollLeft = els.handScroll.scrollLeft;
  els.hand.innerHTML = p.hand.length
    ? p.hand.map(card => cardHTML(card, { hand: true })).join('')
    : '<div class="hand-empty">手札がありません</div>';
  els.handScroll.scrollLeft = scrollLeft;
}

/* ────────────────────────────── action bar ────────────────────────────── */

function actionButton(action, text, { primary = false, disabled = false, reason = '', extra = '' } = {}) {
  return `<button type="button" class="btn ${primary ? 'primary' : 'ghost'} ${extra}" data-action="${action}" data-reason="${reason}" aria-disabled="${disabled}">${text}</button>`;
}

function renderActionBar() {
  const card = findCard(S.selectedUid);

  if (S.attackerUid) {
    const attacker = findCard(S.attackerUid);
    if (attacker) {
      const info = validTargets(attacker);
      const directDmg = effAtk(attacker);
      const name = defOf(attacker).name;
      els.actionBar.innerHTML = `
        <div class="ab-info">
          <span class="ab-kicker target">ATTACK MODE</span>
          <strong class="ab-name">${name}</strong>
          <span class="ab-meta">ATK ${directDmg} ／ ${info.monsters.length ? '光る相手モンスターを選択' : '相手モンスターなし'}</span>
          <p class="ab-act">${info.monsters.length ? '対象をタップ。戦闘結果がカード上に表示されます。' : 'ダイレクトアタックでLPにダメージ。'}</p>
        </div>
        <div class="ab-actions">
          ${info.direct ? actionButton('direct', `ダイレクトアタック <b>${directDmg}</b>`, { primary: true, extra: 'direct-btn' }) : ''}
          ${actionButton('cancel', 'キャンセル')}
        </div>`;
      return;
    }
    S.attackerUid = null;
  }

  if (!card) {
    const p = S.players[PLAYER];
    els.actionBar.innerHTML = `
      <div class="ab-info">
        <span class="ab-kicker">COMMAND</span>
        <strong class="ab-name">カードを選択して行動</strong>
        <span class="ab-meta">召喚 ${p.summonUsed}/${1 + p.extraSummons} ・ 設置 ${p.setUsed}/1 ・ 各カードのACTは1回</span>
        <p class="ab-act">手札のカードをタップ。場のカードはタップでACT／攻撃。空きゾーンに直接置くこともできます。</p>
      </div>
      <div class="ab-actions">
        ${actionButton('rules', 'ルール')}
      </div>`;
    return;
  }

  const d = defOf(card);
  const isMonster = d.kind === 'monster';
  const isOwn = card.owner === PLAYER;
  const loc = locate(card.uid);
  const inHand = loc?.zone === 'hand';
  const statLine = isMonster ? `ATK ${effAtk(card)} ／ DEF ${effGuard(card)}` : 'SMALL ZONE ／ RELIC';

  if (!isOwn) {
    els.actionBar.innerHTML = `
      <div class="ab-info">
        <span class="ab-kicker foe">ENEMY CARD</span>
        <strong class="ab-name">${d.name}</strong>
        <span class="ab-meta">${statLine}</span>
        <p class="ab-act"><b>ACT</b> ${d.actName} — ${d.actText}</p>
      </div>
      <div class="ab-actions">${actionButton('cancel', '閉じる')}</div>`;
    return;
  }

  if (inHand) {
    const reason = playReason(card);
    const verb = isMonster ? '召喚する' : '設置する';
    const rights = isMonster ? `召喚 ${S.players[PLAYER].summonUsed}/${1 + S.players[PLAYER].extraSummons}` : '設置 1/1';
    els.actionBar.innerHTML = `
      <div class="ab-info">
        <span class="ab-kicker">${isMonster ? 'BIG ZONE ／ MONSTER' : 'SMALL ZONE ／ RELIC'}</span>
        <strong class="ab-name">${d.name}</strong>
        <span class="ab-meta">${statLine} ／ ${rights}</span>
        <p class="ab-act"><b>ACT</b> ${d.actName} — ${d.actText}</p>
      </div>
      <div class="ab-actions">
        ${actionButton('play', verb, { primary: true, disabled: !!reason, reason: reason || '' })}
        ${actionButton('cancel', '閉じる')}
      </div>
      <div class="ab-note ${reason ? 'warn' : ''}">${reason || (isMonster ? 'BIGゾーンをタップして置く場所を選べます' : 'SMALLゾーンをタップして置く場所を選べます')}</div>`;
    return;
  }

  const reasonAct = actReason(card);
  const reasonAtk = isMonster ? attackReason(card) : 'モンスターではありません';
  const status = [];
  if (card.acted) status.push('ACT済み');
  if (isMonster && card.attacked) status.push('攻撃済み');
  if (isMonster && card.summonedSerial === S.turnSerial) status.push('召喚酔い');
  if (card.stunned) status.push('停止中');
  if (hasMod(card, 'taunt')) status.push('攻撃対象固定');
  if (hasMod(card, 'battleShield')) status.push('戦闘破壊耐性');
  if (hasMod(card, 'direct')) status.push('直接攻撃可');
  if (sumMods(card, 'atk')) status.push(`ATK+${sumMods(card, 'atk')}`);
  if (sumMods(card, 'guard')) status.push(`DEF+${sumMods(card, 'guard')}`);

  els.actionBar.innerHTML = `
    <div class="ab-info">
      <span class="ab-kicker">${isMonster ? 'BIG ZONE ／ MONSTER' : 'SMALL ZONE ／ RELIC'}</span>
      <strong class="ab-name">${d.name}</strong>
      <span class="ab-meta">${statLine}${status.length ? ` ／ ${status.join('・')}` : ''}</span>
      <p class="ab-act"><b>ACT</b> ${d.actName} — ${d.actText}</p>
    </div>
    <div class="ab-actions">
      ${actionButton('act', `ACT — ${d.actName}`, { primary: true, disabled: !!reasonAct, reason: reasonAct || '' })}
      ${isMonster ? actionButton('attack', `攻撃 ${effAtk(card)}`, { disabled: !!reasonAtk, reason: reasonAtk || '' }) : ''}
      ${actionButton('cancel', '閉じる')}
    </div>
    ${reasonAct || (isMonster && reasonAtk) ? `<div class="ab-note warn">${reasonAct || reasonAtk}</div>` : ''}`;
}

/* ────────────────────────────── chrome ────────────────────────────── */

function renderTop() {
  let turnText = 'STANDBY';
  let cls = 'turn-pill';
  if (S.over) {
    turnText = 'DUEL OVER';
    cls += ' over';
  } else if (S.started) {
    turnText = S.active === PLAYER ? 'YOUR TURN' : "NOX'S TURN";
    cls += S.active === PLAYER ? ' your-turn' : ' foe-turn';
  }
  els.turnPill.className = cls;
  els.turnLabel.textContent = turnText;
  els.turnCount.textContent = `TURN ${String(S.turnSerial).padStart(2, '0')}`;
  els.endTurnBtn.disabled = !S.started || S.over || S.busy || S.active !== PLAYER || S.modalOpen;
  document.body.classList.toggle('is-busy', S.busy);
  document.body.dataset.phase = !S.started ? 'intro' : S.over ? 'over' : S.active;
  els.soundBtn.setAttribute('aria-pressed', String(S.sound));
  els.soundBtn.classList.toggle('off', !S.sound);
  els.soundBtn.textContent = S.sound ? '♪' : '♪̸';
}

function renderLog() {
  const entries = S.log.slice(-30);
  els.logList.innerHTML = entries
    .map(entry => {
      const tag = entry.side === PLAYER ? 'YOU' : entry.side === ENEMY ? 'NOX' : '◆';
      return `<li class="log-entry side-${entry.side} kind-${entry.kind}"><span class="log-tag">${tag}</span><span class="log-text">${entry.text}</span></li>`;
    })
    .join('');
  els.logList.scrollTop = els.logList.scrollHeight;

  const last = S.log[S.log.length - 1];
  if (!S.started) {
    els.ticker.innerHTML = '<span class="ticker-mark">XII</span><span>十二界が、決闘者を待っている。</span>';
  } else if (last) {
    const tag = last.side === PLAYER ? 'YOU' : last.side === ENEMY ? 'NOX' : '◆';
    els.ticker.innerHTML = `<span class="ticker-tag side-${last.side}">${tag}</span><span>${last.text}</span>`;
  }
  els.ticker.classList.toggle('is-live', !!S.started && !S.over);
}

function syncLp() {
  for (const side of [PLAYER, ENEMY]) {
    const el = document.querySelector(`[data-lp="${side}"]`);
    if (!el) continue;
    const target = S.players[side].lp;
    if (S.lpTweens[side]) cancelAnimationFrame(S.lpTweens[side]);
    const start = S.lpShown[side];
    if (start === target) {
      el.textContent = fmt(target);
      continue;
    }
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 480);
      const eased = 1 - Math.pow(1 - k, 3);
      const value = Math.round(start + (target - start) * eased);
      S.lpShown[side] = value;
      const live = document.querySelector(`[data-lp="${side}"]`);
      if (live) live.textContent = fmt(value);
      if (k < 1) S.lpTweens[side] = requestAnimationFrame(step);
      else {
        S.lpShown[side] = target;
        S.lpTweens[side] = 0;
      }
    };
    S.lpTweens[side] = requestAnimationFrame(step);
  }
}

function renderAll() {
  const selected = findCard(S.selectedUid);
  if (!selected) S.selectedUid = null;

  renderCtx = { targetIds: new Set(), attacker: null, handCard: null };
  if (S.attackerUid) {
    const attacker = findCard(S.attackerUid);
    if (attacker && S.started && !S.over) {
      const info = validTargets(attacker);
      renderCtx.attacker = attacker;
      renderCtx.targetIds = new Set(info.monsters.map(c => c.uid));
    } else {
      S.attackerUid = null;
    }
  }
  if (selected && !selected.zone && selected.owner === PLAYER) renderCtx.handCard = selected;

  renderSide(ENEMY);
  renderSide(PLAYER);
  renderHand();
  renderActionBar();
  renderTop();
  renderLog();
  syncLp();

  if (S.enterUids.size) setTimeout(() => S.enterUids.clear(), 700);
}

/* ────────────────────────────── effects ────────────────────────────── */

function lpRect(side) {
  const el = document.querySelector(`[data-lpbar="${side}"]`);
  if (el) return el.getBoundingClientRect();
  return { left: innerWidth / 2 - 60, top: innerHeight / 2, width: 120, height: 20 };
}

function pulseCard(el) {
  try {
    el.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.09)', filter: 'brightness(1.6)' },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: 320, easing: 'ease-out' }
    );
  } catch {}
}

function spawnFloat(rect, text, cls = 'damage') {
  const el = document.createElement('span');
  el.className = `fx-float ${cls}`;
  el.textContent = text;
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  els.fxLayer.append(el);
  try {
    el.animate(
      [
        { transform: 'translate(-50%,-50%) translateY(8px) scale(.72)', opacity: 0 },
        { transform: 'translate(-50%,-50%) translateY(-4px) scale(1.08)', opacity: 1, offset: 0.22 },
        { transform: 'translate(-50%,-50%) translateY(-58px) scale(1)', opacity: 0 },
      ],
      { duration: 1000, easing: 'cubic-bezier(.2,.7,.3,1)' }
    );
  } catch {}
  setTimeout(() => el.remove(), 1050);
}

function spawnSlash(rect, color = '#ffd27a') {
  const el = document.createElement('span');
  el.className = 'fx-slash';
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--slash', color);
  els.fxLayer.append(el);
  try {
    el.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(-28deg) scale(.3)', opacity: 0 },
        { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1.25)', opacity: 1, offset: 0.35 },
        { transform: 'translate(-50%,-50%) rotate(4deg) scale(1.55)', opacity: 0 },
      ],
      { duration: 520, easing: 'ease-out' }
    );
  } catch {}
  setTimeout(() => el.remove(), 560);
}

function spawnRing(rect, color = '#e8c37a') {
  if (!rect) return;
  const el = document.createElement('span');
  el.className = 'fx-ring';
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--ring', color);
  els.fxLayer.append(el);
  try {
    el.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.95 },
        { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 },
      ],
      { duration: 620, easing: 'ease-out' }
    );
  } catch {}
  setTimeout(() => el.remove(), 660);
}

function spawnSpark(rect) {
  if (!rect) return;
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('span');
    el.className = 'fx-spark';
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    els.fxLayer.append(el);
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
    const dist = 26 + Math.random() * 34;
    try {
      el.animate(
        [
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          {
            transform: `translate(-50%,-50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(.2)`,
            opacity: 0,
          },
        ],
        { duration: 520 + Math.random() * 250, easing: 'ease-out' }
      );
    } catch {}
    setTimeout(() => el.remove(), 800);
  }
}

function shake(strength = 1) {
  els.app.classList.remove('shake-1', 'shake-2');
  void els.app.offsetWidth;
  els.app.classList.add(strength > 1 ? 'shake-2' : 'shake-1');
  setTimeout(() => els.app.classList.remove('shake-1', 'shake-2'), 420);
}

function flushFx() {
  const events = S.fx.splice(0);
  for (const ev of events) {
    if (ev.type === 'damage') {
      const rect = ev.anchor || lpRect(ev.side);
      spawnFloat(rect, `-${fmt(ev.amount)}`, ev.kind === 'cost' ? 'cost' : 'damage');
    } else if (ev.type === 'heal') {
      spawnFloat(ev.anchor || lpRect(ev.side), `+${fmt(ev.amount)}`, 'heal');
    } else if (ev.type === 'negate') {
      spawnFloat(ev.rect || lpRect(ENEMY), 'NULL', 'negate');
    } else if (ev.type === 'act' && ev.rect) {
      spawnSpark(ev.rect);
    }
  }
}

function toast(text) {
  if (!els.toastStack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  els.toastStack.append(el);
  while (els.toastStack.children.length > 3) els.toastStack.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 1700);
}

function banner(title, sub) {
  if (!els.banner) return;
  els.banner.innerHTML = `<span>${title}</span><small>${sub}</small>`;
  els.banner.classList.remove('show');
  void els.banner.offsetWidth;
  els.banner.classList.add('show');
  clearTimeout(banner.timer);
  banner.timer = setTimeout(() => els.banner.classList.remove('show'), 1500);
}

/* ────────────────────────────── audio ────────────────────────────── */

let audioCtx = null;

function initAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {}
}

function tone({ freq = 440, to = null, dur = 0.12, type = 'sine', gain = 0.025, delay = 0 }) {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), now);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + dur);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(amp).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  } catch {}
}

function noiseBurst({ dur = 0.16, gain = 0.03, delay = 0 } = {}) {
  if (!audioCtx) return;
  try {
    const frames = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    const buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const amp = audioCtx.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    amp.gain.value = gain;
    src.buffer = buffer;
    src.connect(filter).connect(amp).connect(audioCtx.destination);
    src.start(audioCtx.currentTime + delay);
  } catch {}
}

function sfx(name) {
  if (!S.sound) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  try {
    switch (name) {
      case 'click':
        tone({ freq: 680, to: 900, dur: 0.055, type: 'square', gain: 0.012 });
        break;
      case 'target':
        tone({ freq: 1200, to: 1500, dur: 0.06, type: 'triangle', gain: 0.018 });
        break;
      case 'draw':
        tone({ freq: 1000, to: 1500, dur: 0.07, type: 'sine', gain: 0.012 });
        break;
      case 'summon':
        tone({ freq: 220, to: 330, dur: 0.18, type: 'triangle', gain: 0.03 });
        tone({ freq: 440, to: 660, dur: 0.16, type: 'sine', gain: 0.02, delay: 0.08 });
        break;
      case 'set':
        tone({ freq: 480, to: 560, dur: 0.1, type: 'triangle', gain: 0.02 });
        break;
      case 'act':
        tone({ freq: 880, to: 1320, dur: 0.12, type: 'sine', gain: 0.022 });
        tone({ freq: 1760, dur: 0.07, type: 'triangle', gain: 0.012, delay: 0.05 });
        break;
      case 'attack':
        noiseBurst({ dur: 0.14, gain: 0.025 });
        tone({ freq: 220, to: 90, dur: 0.14, type: 'sawtooth', gain: 0.02 });
        break;
      case 'hit':
        noiseBurst({ dur: 0.18, gain: 0.055 });
        tone({ freq: 130, to: 48, dur: 0.18, type: 'sine', gain: 0.055 });
        break;
      case 'destroy':
        noiseBurst({ dur: 0.3, gain: 0.04 });
        tone({ freq: 170, to: 40, dur: 0.28, type: 'sawtooth', gain: 0.03 });
        break;
      case 'heal':
        tone({ freq: 660, dur: 0.1, type: 'sine', gain: 0.022 });
        tone({ freq: 880, dur: 0.12, type: 'sine', gain: 0.022, delay: 0.07 });
        tone({ freq: 1100, dur: 0.18, type: 'sine', gain: 0.018, delay: 0.15 });
        break;
      case 'negate':
        tone({ freq: 420, to: 110, dur: 0.3, type: 'sawtooth', gain: 0.03 });
        break;
      case 'turn':
        tone({ freq: 130, to: 196, dur: 0.35, type: 'triangle', gain: 0.03 });
        tone({ freq: 392, dur: 0.18, type: 'sine', gain: 0.012, delay: 0.1 });
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) =>
          tone({ freq: f, dur: 0.24, type: 'triangle', gain: 0.03, delay: i * 0.12 })
        );
        break;
      case 'lose':
        [330, 262, 196].forEach((f, i) =>
          tone({ freq: f, to: f * 0.9, dur: 0.3, type: 'sine', gain: 0.028, delay: i * 0.16 })
        );
        break;
      default:
        break;
    }
  } catch {}
}

/* ────────────────────────────── overlays ────────────────────────────── */

function dealOpeningHands() {
  for (const side of [PLAYER, ENEMY]) {
    const p = S.players[side];
    p.deck = shuffle(DECK_LIST.map(id => makeCard(id, side)));
    for (let i = 0; i < HAND_START; i++) {
      const card = p.deck.pop();
      card.zone = null;
      card.index = null;
      p.hand.push(card);
      S.enterUids.add(card.uid);
    }
  }
}

function startDuel() {
  if (S.started) return;
  initAudio();
  S = makeState(S.sound);
  const state = S;
  S.started = true;
  S.busy = true;
  dealOpeningHands();
  addLog('デュエル開始 — 十二界の火が灯る', 'system', 'turn');
  els.intro.classList.add('leaving');
  els.gameover.classList.add('hidden');
  els.rules.classList.add('hidden');
  S.modalOpen = false;
  els.fxLayer.innerHTML = '';
  els.toastStack.innerHTML = '';
  renderAll();
  banner('DUEL START', 'ZONE XII');
  sfx('turn');
  setTimeout(() => {
    if (S !== state) return;
    els.intro.classList.add('hidden');
    els.intro.classList.remove('leaving');
  }, 460);
  setTimeout(() => {
    if (S !== state) return;
    if (S.started && !S.over) beginTurn(PLAYER);
  }, 640);
}

function showIntro() {
  S.aiRun += 1;
  const sound = S.sound;
  S = makeState(sound);
  els.intro.classList.remove('hidden', 'leaving');
  els.rules.classList.add('hidden');
  els.gameover.classList.add('hidden');
  renderAll();
}

function restartDuel() {
  els.gameover.classList.add('hidden');
  S.aiRun += 1;
  S.started = false;
  startDuel();
}

function openRules() {
  S.modalOpen = true;
  els.rules.classList.remove('hidden');
  renderTop();
}

function closeRules() {
  S.modalOpen = false;
  els.rules.classList.add('hidden');
  renderTop();
}

function showGameOver(result) {
  if (!S.over) return;
  els.rules.classList.add('hidden');
  els.gameover.classList.remove('hidden');
  els.gameoverCard.classList.toggle('win', result === 'win');
  els.gameoverCard.classList.toggle('lose', result !== 'win');
  els.gameoverKicker.textContent = result === 'win' ? 'DUEL COMPLETE / ZONE CLEARED' : 'DUEL COMPLETE / ZONE LOST';
  els.gameoverTitle.textContent = result === 'win' ? 'VICTORY' : 'DEFEAT';
  els.gameoverSub.textContent =
    result === 'win' ? '勝利 — 十二界はあなたのものだ' : '敗北 — 冥界が静かに微笑む';
  els.gameoverStats.innerHTML = `
    <div><span>TURN</span><b>${String(S.turnSerial).padStart(2, '0')}</b></div>
    <div><span>DAMAGE DEALT</span><b>${fmt(S.stats.dealt)}</b></div>
    <div><span>ACTS USED</span><b>${fmt(S.stats.acts)}</b></div>
    <div><span>LP LEFT</span><b>${fmt(S.players[PLAYER].lp)}</b></div>`;
  renderTop();
  if (result === 'win') confetti();
}

function confetti() {
  const colors = ['#e8c37a', '#6fe7ff', '#ff6b8a', '#a8ffcf', '#c8b6ff'];
  for (let i = 0; i < 42; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = '-12px';
    el.style.background = colors[i % colors.length];
    el.style.width = `${4 + Math.random() * 6}px`;
    el.style.height = `${8 + Math.random() * 10}px`;
    els.fxLayer.append(el);
    try {
      el.animate(
        [
          { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
          {
            transform: `translateY(${innerHeight + 40}px) rotate(${360 + Math.random() * 480}deg)`,
            opacity: 0.85,
          },
        ],
        { duration: 1800 + Math.random() * 1400, easing: 'cubic-bezier(.2,.5,.4,1)', delay: Math.random() * 450 }
      );
    } catch {}
    setTimeout(() => el.remove(), 3800);
  }
}

/* ────────────────────────────── interaction ────────────────────────────── */

function selectCard(uid) {
  if (!S.started || S.over) return;
  if (!locate(uid)) return;
  if (S.attackerUid) S.attackerUid = null;
  S.selectedUid = S.selectedUid === uid ? null : uid;
  sfx('click');
  renderAll();
}

function onBoardClick(event) {
  if (!S.started || S.over) return;
  const target = event.target;
  const cardEl = target.closest?.('.card');
  const slotEl = target.closest?.('.slot');

  if (S.attackerUid) {
    if (!cardEl) return;
    const attacker = findCard(S.attackerUid);
    const card = findCard(cardEl.dataset.uid);
    if (!attacker || !card) return;
    const info = validTargets(attacker);
    if (info.monsters.some(c => c.uid === card.uid)) void performAttack(attacker, card.uid);
    else toast('そのカードは攻撃対象ではありません');
    return;
  }

  if (cardEl) {
    selectCard(cardEl.dataset.uid);
    return;
  }

  if (slotEl && S.selectedUid) {
    const card = findCard(S.selectedUid);
    if (!card || card.zone) return;
    const side = slotEl.dataset.side;
    const zone = slotEl.dataset.zone;
    const index = Number(slotEl.dataset.index);
    if (side !== PLAYER) {
      toast('自分のゾーンにのみ置けます');
      return;
    }
    const d = defOf(card);
    if (d.kind === 'monster' && zone !== 'big') {
      toast('モンスターはBIGゾーンに召喚します');
      return;
    }
    if (d.kind === 'relic' && zone !== 'small') {
      toast('リリックはSMALLゾーンに設置します');
      return;
    }
    playerPlayCard(card, { zone, index });
  }
}

function onHandClick(event) {
  const cardEl = event.target.closest?.('.card');
  if (!cardEl) return;
  selectCard(cardEl.dataset.uid);
}

function handleActionClick(event) {
  const btn = event.target.closest?.('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const card = findCard(S.selectedUid);

  if (btn.getAttribute('aria-disabled') === 'true' && action !== 'cancel' && action !== 'rules') {
    toast(btn.dataset.reason || '今は使えません');
    return;
  }

  switch (action) {
    case 'play':
      if (card) playerPlayCard(card);
      break;
    case 'act':
      if (card) void playerActivate(card);
      break;
    case 'attack':
      if (card) startAttack(card);
      break;
    case 'direct': {
      const attacker = findCard(S.attackerUid);
      if (attacker) void performAttack(attacker, null);
      break;
    }
    case 'cancel':
      S.attackerUid = null;
      S.selectedUid = null;
      sfx('click');
      renderAll();
      break;
    case 'rules':
      openRules();
      break;
    default:
      break;
  }
}

function toggleSound() {
  S.sound = !S.sound;
  if (S.sound) {
    initAudio();
    sfx('click');
  }
  try {
    localStorage.setItem('zonexii-sound', S.sound ? '1' : '0');
  } catch {}
  renderTop();
}

function buildStars() {
  const holder = document.querySelector('#stars');
  if (!holder) return;
  holder.innerHTML = '';
  for (let i = 0; i < 46; i++) {
    const star = document.createElement('i');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--s', `${1 + Math.random() * 2.2}px`);
    star.style.setProperty('--d', `${3 + Math.random() * 6}s`);
    star.style.setProperty('--delay', `${Math.random() * 7}s`);
    star.style.opacity = `${0.18 + Math.random() * 0.5}`;
    holder.append(star);
  }
}

function init() {
  try {
    const saved = localStorage.getItem('zonexii-sound');
    if (saved === '0') S.sound = false;
  } catch {}

  buildStars();
  renderAll();

  document.addEventListener('pointerdown', initAudio, { once: true });

  els.enemyBoard.addEventListener('click', onBoardClick);
  els.playerBoard.addEventListener('click', onBoardClick);
  els.hand.addEventListener('click', onHandClick);
  els.actionBar.addEventListener('click', handleActionClick);
  els.endTurnBtn.addEventListener('click', () => void requestEndTurn());

  $('#startBtn').addEventListener('click', startDuel);
  $('#rematchBtn').addEventListener('click', restartDuel);
  $('#restartBtn').addEventListener('click', () => {
    if (!S.started) return;
    showIntro();
  });
  $('#helpBtn').addEventListener('click', openRules);
  $('#introRulesBtn').addEventListener('click', openRules);
  $('#gameoverRulesBtn').addEventListener('click', openRules);
  $('#rulesClose').addEventListener('click', closeRules);
  $('#rulesOk').addEventListener('click', closeRules);
  els.soundBtn.addEventListener('click', toggleSound);

  els.rules.addEventListener('click', event => {
    if (event.target === els.rules) closeRules();
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (S.modalOpen) {
      closeRules();
      return;
    }
    if (S.attackerUid) {
      S.attackerUid = null;
      renderAll();
      return;
    }
    if (S.selectedUid) {
      S.selectedUid = null;
      renderAll();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderAll();
  });
}

init();
