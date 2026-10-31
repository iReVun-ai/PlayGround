/* LP→0 — deterministic rules engine (no DOM, no timers). */

import { buildDeck, getCard } from './cards.js';

export const ZONES = 6;
export const START_LP = 8000;
export const HAND_START = 5;

let uidCounter = 0;

const other = (side) => (side === 'player' ? 'ai' : 'player');

export const sideLabel = (side) => (side === 'player' ? '11ai\'ame' : 'H大好き分岐ｵﾚ');

function makeInstance(defId) {
  return {
    uid: `card_${++uidCounter}`,
    defId,
    atkMod: 0,
    position: 'attack',
    faceDown: false,
    attacksLeft: 0,
    changedPosition: false,
    attacked: false,
    setTurn: null,
    revived: false,
  };
}

export function snapshot(inst) {
  if (!inst) return null;
  return {
    uid: inst.uid,
    defId: inst.defId,
    atkMod: inst.atkMod,
    position: inst.position,
    faceDown: inst.faceDown,
    attacksLeft: inst.attacksLeft,
    revived: inst.revived,
  };
}

export function effectiveAtk(inst) {
  return getCard(inst.defId).atk + inst.atkMod;
}

export function effectiveDef(inst) {
  return getCard(inst.defId).def;
}

export function shuffle(list, rng = Math.random) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function createPlayer(side) {
  const deck = shuffle(buildDeck(side).map(makeInstance));
  return {
    side,
    lp: START_LP,
    deck,
    hand: [],
    monster: Array(ZONES).fill(null),
    spell: Array(ZONES).fill(null),
    grave: [],
    banished: [],
    summoned: false,
    setTrap: false,
  };
}

export function createGame({ rng = Math.random } = {}) {
  uidCounter = 0;
  const state = {
    rng,
    active: 'player',
    turn: 0,
    winner: null,
    winReason: null,
    log: [],
    players: {
      player: createPlayer('player'),
      ai: createPlayer('ai'),
    },
    stats: { summons: 0, attacks: 0, spells: 0, traps: 0, damageDealt: { player: 0, ai: 0 } },
  };
  for (const side of ['player', 'ai']) {
    for (let i = 0; i < HAND_START; i += 1) state.players[side].hand.push(state.players[side].deck.pop());
  }
  addLog(state, 'デュエル開始 — LP 8000 / 24 ZONES', 'system');
  return state;
}

export function startDuel(state) {
  const events = [];
  state.active = 'player';
  beginTurn(state, events);
  return { ok: true, events };
}

export function addLog(state, text, tone = 'neutral') {
  state.log.push({ text, tone, turn: state.turn });
  if (state.log.length > 80) state.log.shift();
}

function checkWin(state, events) {
  if (state.winner) return;
  for (const side of ['player', 'ai']) {
    if (state.players[side].lp <= 0) {
      state.players[side].lp = 0;
      state.winner = other(side);
      state.winReason = 'lp';
      addLog(state, `${sideLabel(state.winner)} の勝利 — LP 0`, 'win');
      events.push({ type: 'win', side: state.winner, loser: side, reason: 'lp' });
      return;
    }
  }
}

function beginTurn(state, events) {
  if (state.winner) return;
  state.turn += 1;
  const p = state.players[state.active];
  p.summoned = false;
  p.setTrap = false;
  for (const inst of [...p.monster, ...p.spell]) {
    if (!inst) continue;
    inst.attacked = false;
    inst.changedPosition = false;
    inst.attacksLeft = inst.faceDown || inst.position !== 'attack' ? 0 : 1;
  }
  events.push({ type: 'turn', side: state.active, turn: state.turn });
  addLog(state, `TURN ${state.turn} — ${sideLabel(state.active)}`, 'turn');
  drawCards(state, state.active, 1, events, 'turn');
}

function drawCards(state, side, count, events, reason = 'draw') {
  const p = state.players[side];
  for (let i = 0; i < count; i += 1) {
    if (!p.deck.length) {
      if (!state.winner) {
        state.winner = other(side);
        state.winReason = 'deck';
        addLog(state, `${sideLabel(side)} はデッキ切れ — ${sideLabel(state.winner)} の勝利`, 'win');
        events.push({ type: 'win', side: state.winner, loser: side, reason: 'deck' });
      }
      return;
    }
    const card = p.deck.pop();
    p.hand.push(card);
    events.push({ type: 'draw', side, card: snapshot(card), handSize: p.hand.length, reason });
    addLog(state, `${sideLabel(side)} が1枚ドロー（手札 ${p.hand.length}）`, 'draw');
    if (p.hand.length > 8) {
      const discarded = p.hand.shift();
      p.grave.push(discarded);
      events.push({ type: 'discard', side, card: snapshot(discarded), reason: 'overflow' });
      addLog(state, `手札上限 — ${getCard(discarded.defId).name} を墓地へ`, 'warn');
    }
  }
}

export function healPlayer(state, side, amount, events, reason = 'heal') {
  const p = state.players[side];
  const before = p.lp;
  p.lp = Math.min(START_LP, p.lp + amount);
  const healed = p.lp - before;
  if (healed > 0) {
    events.push({ type: 'heal', side, amount: healed, reason });
    addLog(state, `${sideLabel(side)} のLPが ${healed} 回復`, 'heal');
  }
}

function damagePlayer(state, side, amount, events, reason = 'effect', source = null) {
  if (amount <= 0 || state.winner) return;
  const p = state.players[side];
  p.lp = Math.max(0, p.lp - amount);
  state.stats.damageDealt[other(side)] += amount;
  events.push({ type: 'damage', side, amount, reason, source });
  addLog(state, `${sideLabel(side)} に ${amount} ダメージ`, reason === 'battle' ? 'battle' : 'burn');
  checkWin(state, events);
}

function findTrap(state, side, trapKey) {
  const p = state.players[side];
  return p.spell.findIndex((inst) => {
    if (!inst || !inst.faceDown || inst.setTurn === state.turn) return false;
    const def = getCard(inst.defId);
    return def.type === 'trap' && def.trapKey === trapKey;
  });
}

function revealTrap(state, side, index, events) {
  const p = state.players[side];
  const inst = p.spell[index];
  if (!inst) return null;
  inst.faceDown = false;
  const card = snapshot(inst);
  const def = getCard(inst.defId);
  p.spell[index] = null;
  p.grave.push(inst);
  state.stats.traps += 1;
  events.push({ type: 'trap', side, index, card, name: def.name, jp: def.jp });
  addLog(state, `【罠発動】${def.name} — ${def.text}`, 'trap');
  return inst;
}

function triggerTrap(state, side, trapKey, events) {
  const index = findTrap(state, side, trapKey);
  if (index < 0) return null;
  return revealTrap(state, side, index, events);
}

function destroyMonster(state, side, index, events, cause = 'effect') {
  const p = state.players[side];
  const inst = p.monster[index];
  if (!inst) return null;
  p.monster[index] = null;
  const card = snapshot(inst);
  const def = getCard(inst.defId);
  inst.faceDown = false;
  p.grave.push(inst);
  events.push({ type: 'destroy', side, row: 'monster', index, card, cause, name: def.name });
  addLog(state, `${def.name} が破壊された`, 'destroy');
  triggerDestroyed(state, side, inst, events);
  return card;
}

function triggerDestroyed(state, side, inst, events) {
  const def = getCard(inst.defId);
  for (const effect of def.effects || []) {
    if (effect.on !== 'destroyed') continue;
    if (effect.kind === 'burn') {
      damagePlayer(state, other(side), effect.value, events, 'effect', def.name);
    }
  }
}

function strongestEnemyIndex(state, side) {
  const enemy = state.players[other(side)];
  let best = -1;
  let bestAtk = -1;
  enemy.monster.forEach((inst, index) => {
    if (!inst) return;
    const atk = effectiveAtk(inst);
    if (atk > bestAtk) {
      bestAtk = atk;
      best = index;
    }
  });
  return best;
}

function applySummonEffects(state, side, index, events) {
  const inst = state.players[side].monster[index];
  if (!inst || inst.faceDown) return;
  const def = getCard(inst.defId);
  for (const effect of def.effects || []) {
    if (effect.on !== 'summon') continue;
    const enemy = other(side);
    if (effect.kind === 'burn') {
      damagePlayer(state, enemy, effect.value, events, 'effect', def.name);
    } else if (effect.kind === 'heal') {
      healPlayer(state, side, effect.value, events, 'effect');
    } else if (effect.kind === 'draw') {
      drawCards(state, side, effect.value, events, 'effect');
    } else if (effect.kind === 'buff_all') {
      const p = state.players[side];
      p.monster.forEach((mon, monIndex) => {
        if (!mon || mon.faceDown) return;
        mon.atkMod += effect.value;
        events.push({
          type: 'buff', side, row: 'monster', index: monIndex,
          amount: effect.value, card: snapshot(mon), source: def.name,
        });
      });
      addLog(state, `自分のモンスター全体のATKが ${effect.value} アップ`, 'buff');
    } else if (effect.kind === 'destroy_strongest') {
      const target = strongestEnemyIndex(state, side);
      if (target >= 0) destroyMonster(state, enemy, target, events, 'effect');
    }
  }
}

function checkPitfall(state, side, index, events) {
  const inst = state.players[side].monster[index];
  if (!inst || inst.faceDown) return;
  const atk = effectiveAtk(inst);
  if (atk < 1500) return;
  const trap = triggerTrap(state, other(side), 'pitfall', events);
  if (trap) {
    destroyMonster(state, side, index, events, 'trap');
  }
}

function battleDamage(state, side, amount, events) {
  if (amount <= 0 || state.winner) return 0;
  let dmg = amount;
  const barrier = triggerTrap(state, side, 'life_barrier', events);
  if (barrier) {
    healPlayer(state, side, 300, events, 'trap');
    dmg = 0;
    addLog(state, 'ライフ・バリアが戦闘ダメージを無効化', 'trap');
  }
  if (dmg > 0) {
    const p = state.players[side];
    p.lp = Math.max(0, p.lp - dmg);
    state.stats.damageDealt[other(side)] += dmg;
    events.push({ type: 'damage', side, amount: dmg, reason: 'battle' });
    addLog(state, `${sideLabel(side)} に戦闘ダメージ ${dmg}`, 'battle');
    checkWin(state, events);
  }
  return dmg;
}

/* ─── validation helpers ─────────────────────────────────────── */

export function canAct(state, side) {
  return !state.winner && state.active === side;
}

export function emptyMonsterZones(state, side) {
  return state.players[side].monster
    .map((inst, index) => (inst ? -1 : index))
    .filter((index) => index >= 0);
}

export function emptySpellZones(state, side) {
  return state.players[side].spell
    .map((inst, index) => (inst ? -1 : index))
    .filter((index) => index >= 0);
}

export function hasMonsterInHand(state, side) {
  return state.players[side].hand.some((inst) => getCard(inst.defId).type === 'monster');
}

export function hasTrapInHand(state, side) {
  return state.players[side].hand.some((inst) => getCard(inst.defId).type === 'trap');
}

export function legalSummonZones(state, side) {
  const p = state.players[side];
  if (!canAct(state, side) || p.summoned) return [];
  return emptyMonsterZones(state, side);
}

export function legalTrapZones(state, side) {
  const p = state.players[side];
  if (!canAct(state, side) || p.setTrap) return [];
  return emptySpellZones(state, side);
}

export function legalSpellTargets(state, side, handIndex) {
  const p = state.players[side];
  const inst = p.hand[handIndex];
  if (!inst) return [];
  const def = getCard(inst.defId);
  if (def.type !== 'spell' || !def.target) return [];
  if (def.target === 'own') {
    return p.monster
      .map((mon, index) => (mon && !mon.faceDown ? index : -1))
      .filter((index) => index >= 0);
  }
  if (def.target === 'enemy') {
    return state.players[other(side)].monster
      .map((mon, index) => (mon ? index : -1))
      .filter((index) => index >= 0);
  }
  return [];
}

export function legalAttackTargets(state, side, attackerIndex) {
  const p = state.players[side];
  const attacker = p.monster[attackerIndex];
  if (!attacker || attacker.faceDown || attacker.position !== 'attack' || attacker.attacksLeft <= 0) {
    return { ok: false, indexes: [], direct: false };
  }
  if (!canAct(state, side)) return { ok: false, indexes: [], direct: false };
  const enemy = state.players[other(side)];
  const occupied = enemy.monster.map((inst, index) => (inst ? index : -1)).filter((index) => index >= 0);
  if (!occupied.length) return { ok: true, indexes: [], direct: true };
  const taunts = occupied.filter((index) => getCard(enemy.monster[index].defId).passive?.taunt);
  if (taunts.length) return { ok: true, indexes: taunts, direct: false, forced: 'taunt' };
  return { ok: true, indexes: occupied, direct: false };
}

export function canSwitchPosition(state, side, index) {
  if (!canAct(state, side)) return false;
  const inst = state.players[side].monster[index];
  return Boolean(inst && !inst.changedPosition && !inst.attacked);
}

/* ─── actions ────────────────────────────────────────────────── */

export function summonMonster(state, side, handIndex, zoneIndex, mode = 'attack') {
  if (!canAct(state, side)) return { ok: false, error: 'いまは召喚できません。' };
  const p = state.players[side];
  const inst = p.hand[handIndex];
  if (!inst) return { ok: false, error: 'カードが見つかりません。' };
  const def = getCard(inst.defId);
  if (def.type !== 'monster') return { ok: false, error: 'モンスター以外は召喚できません。' };
  if (p.summoned) return { ok: false, error: 'このターンの召喚権は使用済みです。' };
  if (!p.monster[zoneIndex]) {
    if (zoneIndex < 0 || zoneIndex >= ZONES) return { ok: false, error: 'そのゾーンは使えません。' };
  } else {
    return { ok: false, error: 'そのゾーンは埋まっています。' };
  }
  p.hand.splice(handIndex, 1);
  const set = mode === 'set';
  inst.faceDown = set;
  inst.position = set ? 'defense' : 'attack';
  inst.attacksLeft = set ? 0 : 1;
  inst.setTurn = state.turn;
  inst.changedPosition = false;
  p.monster[zoneIndex] = inst;
  p.summoned = true;
  state.stats.summons += 1;
  const events = [{
    type: set ? 'setMonster' : 'summon',
    side, row: 'monster', index: zoneIndex, card: snapshot(inst),
    mode, name: def.name, jp: def.jp,
  }];
  addLog(state, `${def.name} を${set ? 'セット（裏守備）' : '召喚'}`, 'summon');
  if (!set) applySummonEffects(state, side, zoneIndex, events);
  checkPitfall(state, side, zoneIndex, events);
  checkWin(state, events);
  return { ok: true, events };
}

export function setTrapCard(state, side, handIndex, zoneIndex) {
  if (!canAct(state, side)) return { ok: false, error: 'いまはセットできません。' };
  const p = state.players[side];
  const inst = p.hand[handIndex];
  if (!inst) return { ok: false, error: 'カードが見つかりません。' };
  const def = getCard(inst.defId);
  if (def.type !== 'trap') return { ok: false, error: '罠カードのみセットできます。' };
  if (p.setTrap) return { ok: false, error: 'このターンの罠セットは使用済みです。' };
  if (p.spell[zoneIndex]) return { ok: false, error: 'そのゾーンは埋まっています。' };
  p.hand.splice(handIndex, 1);
  inst.faceDown = true;
  inst.position = 'set';
  inst.setTurn = state.turn;
  p.spell[zoneIndex] = inst;
  p.setTrap = true;
  const events = [{
    type: 'setTrap', side, row: 'spell', index: zoneIndex, card: snapshot(inst), name: def.name, jp: def.jp,
  }];
  addLog(state, `${def.name} をセット`, 'set');
  return { ok: true, events };
}

function reviveMonster(state, side, events) {
  const p = state.players[side];
  const zones = emptyMonsterZones(state, side);
  if (!zones.length) return false;
  const graveMonsters = p.grave
    .map((inst, index) => ({ inst, index }))
    .filter(({ inst }) => getCard(inst.defId).type === 'monster');
  if (!graveMonsters.length) return false;
  graveMonsters.sort((a, b) => getCard(b.inst.defId).atk - getCard(a.inst.defId).atk);
  const { index: graveIndex } = graveMonsters[0];
  const [inst] = p.grave.splice(graveIndex, 1);
  inst.faceDown = false;
  inst.position = 'defense';
  inst.atkMod = 0;
  inst.attacksLeft = 0;
  inst.setTurn = state.turn;
  inst.revived = true;
  inst.changedPosition = true;
  const zone = zones[0];
  p.monster[zone] = inst;
  const def = getCard(inst.defId);
  events.push({
    type: 'summon', side, row: 'monster', index: zone, card: snapshot(inst),
    mode: 'revive', name: def.name, jp: def.jp,
  });
  addLog(state, `${def.name} を墓地から特殊召喚`, 'summon');
  applySummonEffects(state, side, zone, events);
  return true;
}

export function castSpell(state, side, handIndex, target = null) {
  if (!canAct(state, side)) return { ok: false, error: 'いまは発動できません。' };
  const p = state.players[side];
  const inst = p.hand[handIndex];
  if (!inst) return { ok: false, error: 'カードが見つかりません。' };
  const def = getCard(inst.defId);
  if (def.type !== 'spell') return { ok: false, error: '魔法カードではありません。' };
  const events = [];
  const enemy = other(side);

  if (def.target === 'own') {
    const mon = target && p.monster[target.index];
    if (!mon || mon.faceDown) return { ok: false, error: '対象のモンスターを選んでください。' };
  }
  if (def.target === 'enemy') {
    const mon = target && state.players[enemy].monster[target.index];
    if (!mon) return { ok: false, error: '対象のモンスターを選んでください。' };
  }
  if (def.spellKey === 'revive') {
    const hasGraveMonster = p.grave.some((c) => getCard(c.defId).type === 'monster');
    if (!hasGraveMonster) return { ok: false, error: '墓地にモンスターがいません。' };
    if (!emptyMonsterZones(state, side).length) return { ok: false, error: 'モンスターゾーンが空いていません。' };
  }

  p.hand.splice(handIndex, 1);
  p.grave.push(inst);
  state.stats.spells += 1;
  events.push({ type: 'spell', side, card: snapshot(inst), name: def.name, jp: def.jp });
  addLog(state, `【魔法発動】${def.name} — ${def.text}`, 'spell');

  if (def.spellKey === 'buff') {
    const mon = p.monster[target.index];
    mon.atkMod += def.value;
    events.push({
      type: 'buff', side, row: 'monster', index: target.index, amount: def.value,
      card: snapshot(mon), source: def.name,
    });
    addLog(state, `${getCard(mon.defId).name} のATKが ${def.value} アップ`, 'buff');
  } else if (def.spellKey === 'heal') {
    healPlayer(state, side, def.value, events, 'spell');
  } else if (def.spellKey === 'draw') {
    drawCards(state, side, def.value, events, 'spell');
  } else if (def.spellKey === 'destroy') {
    destroyMonster(state, enemy, target.index, events, 'spell');
  } else if (def.spellKey === 'revive') {
    reviveMonster(state, side, events);
  }

  checkWin(state, events);
  return { ok: true, events };
}

export function switchPosition(state, side, index) {
  if (!canAct(state, side)) return { ok: false, error: 'いまは変更できません。' };
  const inst = state.players[side].monster[index];
  if (!inst) return { ok: false, error: 'モンスターがいません。' };
  if (inst.changedPosition || inst.attacked) return { ok: false, error: 'このモンスターはすでに行動済みです。' };
  const events = [];
  if (inst.faceDown) {
    inst.faceDown = false;
    inst.position = 'attack';
    inst.attacksLeft = 1;
    inst.changedPosition = true;
    events.push({
      type: 'flip', side, row: 'monster', index, card: snapshot(inst),
      name: getCard(inst.defId).name,
    });
    addLog(state, `${getCard(inst.defId).name} を反転召喚（攻撃表示）`, 'position');
  } else if (inst.position === 'attack') {
    inst.position = 'defense';
    inst.attacksLeft = 0;
    inst.changedPosition = true;
    events.push({ type: 'position', side, row: 'monster', index, card: snapshot(inst), position: 'defense' });
    addLog(state, `${getCard(inst.defId).name} を守備表示に変更`, 'position');
  } else {
    inst.position = 'attack';
    inst.attacksLeft = 1;
    inst.changedPosition = true;
    events.push({ type: 'position', side, row: 'monster', index, card: snapshot(inst), position: 'attack' });
    addLog(state, `${getCard(inst.defId).name} を攻撃表示に変更`, 'position');
  }
  return { ok: true, events };
}

export function attack(state, side, attackerIndex, target = null) {
  if (!canAct(state, side)) return { ok: false, error: 'いまは攻撃できません。' };
  const p = state.players[side];
  const attacker = p.monster[attackerIndex];
  if (!attacker) return { ok: false, error: '攻撃モンスターがいません。' };
  if (state.turn === 1) return { ok: false, error: '先攻1ターン目は攻撃できません。' };
  const legal = legalAttackTargets(state, side, attackerIndex);
  if (!legal.ok) return { ok: false, error: 'このモンスターは攻撃できません。' };
  if (target && !legal.indexes.includes(target.index)) {
    return { ok: false, error: 'その対象には攻撃できません。' };
  }
  if (!target && !legal.direct) return { ok: false, error: '対象のモンスターを選んでください。' };
  if (target && legal.direct) return { ok: false, error: '相手モンスターがいません。' };

  const enemy = other(side);
  const ep = state.players[enemy];
  const events = [];
  const aDef = getCard(attacker.defId);
  const aAtk = effectiveAtk(attacker);
  attacker.attacksLeft -= 1;
  attacker.attacked = true;
  state.stats.attacks += 1;

  if (!target) {
    events.push({
      type: 'attack', side, attackerIndex, direct: true, attacker: snapshot(attacker),
      target: null, aAtk,
    });
    addLog(state, `${aDef.name} のダイレクトアタック！`, 'attack');
    const dealt = battleDamage(state, enemy, aAtk, events);
    if (dealt > 0 && aDef.passive?.lifesteal) healPlayer(state, side, dealt, events, 'lifesteal');
    checkWin(state, events);
    return { ok: true, events };
  }

  const targetInst = ep.monster[target.index];
  if (!targetInst) return { ok: false, error: '対象がいません。' };
  const tDef = getCard(targetInst.defId);
  const wasFaceDown = targetInst.faceDown;
  events.push({
    type: 'attack', side, attackerIndex, direct: false,
    attacker: snapshot(attacker), target: snapshot(targetInst),
    targetIndex: target.index, aAtk,
  });
  addLog(state, `${aDef.name} が ${tDef.name} を攻撃`, 'attack');

  // Reactive defense trap resolves before the battle.
  const ward = triggerTrap(state, enemy, 'negate_attack', events);
  if (ward) {
    destroyMonster(state, side, attackerIndex, events, 'trap');
    checkWin(state, events);
    return { ok: true, events };
  }

  if (wasFaceDown) {
    targetInst.faceDown = false;
    targetInst.position = 'defense';
    targetInst.attacksLeft = 0;
    events.push({
      type: 'flip', side: enemy, row: 'monster', index: target.index,
      card: snapshot(targetInst), name: tDef.name, reason: 'battle',
    });
    addLog(state, `${tDef.name} を反転 — 守備力 ${effectiveDef(targetInst)}`, 'position');
  }

  const tValue = targetInst.position === 'attack' ? effectiveAtk(targetInst) : effectiveDef(targetInst);
  const targetShielded = Boolean(tDef.passive?.shielded);
  const attackerShielded = Boolean(aDef.passive?.shielded);
  const pierce = Boolean(aDef.passive?.pierce);
  let dealt = 0;

  if (aAtk > tValue) {
    let dmg = targetInst.position === 'attack' ? aAtk - tValue : (pierce ? aAtk - tValue : 0);
    if (targetInst.position === 'defense' && targetShielded) dmg = 0;
    if (dmg > 0) dealt = battleDamage(state, enemy, dmg, events);
    destroyMonster(state, enemy, target.index, events, 'battle');
    if (dealt > 0 && aDef.passive?.lifesteal) healPlayer(state, side, dealt, events, 'lifesteal');
    events.push({ type: 'battleResult', winner: side, damage: dealt, destroyed: 'target' });
  } else if (aAtk === tValue) {
    if (targetInst.position === 'attack') {
      destroyMonster(state, enemy, target.index, events, 'battle');
      destroyMonster(state, side, attackerIndex, events, 'battle');
      events.push({ type: 'battleResult', winner: null, damage: 0, destroyed: 'both' });
      addLog(state, '相打ち — 両者破壊', 'battle');
    } else {
      events.push({ type: 'battleResult', winner: null, damage: 0, destroyed: null, blocked: true });
      addLog(state, `攻撃は防がれた（DEF ${tValue}）`, 'battle');
    }
  } else {
    let dmg = targetInst.position === 'attack' ? tValue - aAtk : 0;
    if (attackerShielded) dmg = 0;
    if (dmg > 0) dealt = battleDamage(state, side, dmg, events);
    destroyMonster(state, side, attackerIndex, events, 'battle');
    if (dealt > 0 && tDef.passive?.lifesteal) healPlayer(state, enemy, dealt, events, 'lifesteal');
    events.push({ type: 'battleResult', winner: enemy, damage: dealt, destroyed: 'attacker' });
  }

  checkWin(state, events);
  return { ok: true, events };
}

export function beginEnemyTurn(state) {
  const events = [];
  if (state.winner) return { ok: false, events };
  state.active = 'ai';
  beginTurn(state, events);
  return { ok: true, events };
}

export function endTurn(state) {
  if (state.winner) return { ok: false, events: [], error: 'デュエルは終了しています。' };
  const events = [{ type: 'endTurn', side: state.active, turn: state.turn }];
  addLog(state, `${sideLabel(state.active)} ターン終了`, 'turn');
  state.active = other(state.active);
  beginTurn(state, events);
  return { ok: true, events };
}

/* Read-only conveniences for UI / AI. */
export function boardCount(state, side) {
  return state.players[side].monster.filter(Boolean).length;
}

export function strongestMonster(state, side, { faceUpOnly = false } = {}) {
  let best = null;
  state.players[side].monster.forEach((inst, index) => {
    if (!inst) return;
    if (faceUpOnly && inst.faceDown) return;
    if (!best || effectiveAtk(inst) > effectiveAtk(best.inst)) best = { inst, index };
  });
  return best;
}

export function publicState(state) {
  return {
    active: state.active,
    turn: state.turn,
    winner: state.winner,
    players: {
      player: { lp: state.players.player.lp, hand: state.players.player.hand.length, deck: state.players.player.deck.length },
      ai: { lp: state.players.ai.lp, hand: state.players.ai.hand.length, deck: state.players.ai.deck.length },
    },
  };
}
