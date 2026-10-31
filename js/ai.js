/* LP→0 — rival heuristic. Returns one action at a time so the UI can breathe. */

import { getCard } from './cards.js';
import {
  effectiveAtk, effectiveDef, legalAttackTargets, legalSpellTargets,
  emptyMonsterZones, emptySpellZones, boardCount,
} from './engine.js';

const ATTACK_BIAS = 120;

function handIndexes(hand, type) {
  return hand
    .map((inst, index) => ({ inst, index, def: getCard(inst.defId) }))
    .filter(({ def }) => def.type === type);
}

function bestZone(zones) {
  if (!zones.length) return -1;
  return zones[Math.floor(zones.length / 2)];
}

function pickSummon(state) {
  const ai = state.players.ai;
  const player = state.players.player;
  if (ai.summoned) return null;
  const monsters = handIndexes(ai.hand, 'monster');
  if (!monsters.length) return null;
  const zones = emptyMonsterZones(state, 'ai');
  if (!zones.length) return null;

  const strongestPlayer = player.monster.reduce((best, inst) => {
    if (!inst) return best;
    const atk = effectiveAtk(inst);
    return Math.max(best, atk);
  }, 0);
  const playerCount = boardCount(state, 'player');

  monsters.sort((a, b) => {
    const score = (m) => m.def.atk + (m.def.effects?.some((e) => e.kind === 'burn') ? 180 : 0)
      + (m.def.effects?.some((e) => e.kind === 'draw') ? 120 : 0)
      + (m.def.effects?.some((e) => e.kind === 'destroy_strongest') ? 900 : 0);
    return score(b) - score(a);
  });

  const chosen = monsters[0];
  const hasSummonValue = chosen.def.effects?.some((e) => ['burn', 'draw', 'heal', 'destroy_strongest'].includes(e.kind));
  let mode = 'attack';

  const badTrade = strongestPlayer > chosen.def.atk + 200;
  const turtle = chosen.def.def > chosen.def.atk + 400;
  if (!hasSummonValue && (badTrade || turtle) && playerCount > 0) mode = 'set';
  if (!hasSummonValue && chosen.def.atk <= 1000 && playerCount > 0) mode = 'set';
  if (ai.lp < 2200 && chosen.def.def > chosen.def.atk) mode = 'set';

  return { kind: 'summon', handIndex: chosen.index, zone: bestZone(zones), mode };
}

function pickTrap(state) {
  const ai = state.players.ai;
  if (ai.setTrap) return null;
  const traps = handIndexes(ai.hand, 'trap');
  if (!traps.length) return null;
  const zones = emptySpellZones(state, 'ai');
  if (!zones.length) return null;
  const order = ['mirror_ward', 'pitfall', 'life_barrier'];
  traps.sort((a, b) => order.indexOf(a.def.id) - order.indexOf(b.def.id));
  return { kind: 'setTrap', handIndex: traps[0].index, zone: bestZone(zones) };
}

function pickSpell(state) {
  const ai = state.players.ai;
  const player = state.players.player;
  const spells = handIndexes(ai.hand, 'spell');
  if (!spells.length) return null;

  const find = (key, predicate = () => true) => spells.find((s) => s.def.spellKey === key && predicate(s));
  const playerMonsters = player.monster
    .map((inst, index) => ({ inst, index }))
    .filter(({ inst }) => inst);
  const strongestPlayer = playerMonsters.reduce((best, cur) => {
    if (!best) return cur;
    return effectiveAtk(cur.inst) > effectiveAtk(best.inst) ? cur : best;
  }, null);

  // Finish with burn if it is exactly lethal.
  const burn = spells.find((s) => s.def.spellKey === 'heal' && false);
  void burn;
  const burnSpell = spells.find((s) => s.def.spellKey === 'burn');
  if (burnSpell && player.lp <= burnSpell.def.value) {
    return { kind: 'spell', handIndex: burnSpell.index, target: null };
  }

  // Remove the biggest threat.
  const destroy = find('destroy');
  if (destroy && strongestPlayer && effectiveAtk(strongestPlayer.inst) >= 1800) {
    return { kind: 'spell', handIndex: destroy.index, target: { index: strongestPlayer.index } };
  }

  // Recover from the brink first.
  const heal = find('heal');
  if (heal && ai.lp <= 3000) return { kind: 'spell', handIndex: heal.index, target: null };

  // Bring back a body when the field is thin.
  const revive = find('revive');
  if (
    revive && boardCount(state, 'ai') <= 1
    && ai.grave.some((inst) => getCard(inst.defId).type === 'monster')
    && emptyMonsterZones(state, 'ai').length
  ) {
    return { kind: 'spell', handIndex: revive.index, target: null };
  }

  // Refill the hand.
  const draw = find('draw');
  if (draw && ai.hand.length <= 3) return { kind: 'spell', handIndex: draw.index, target: null };

  // Push an attacker over a key blocker, or set up a direct swing.
  const buff = find('buff');
  if (buff) {
    const ownAttackers = ai.monster
      .map((inst, index) => ({ inst, index }))
      .filter(({ inst }) => inst && !inst.faceDown && inst.position === 'attack');
    if (ownAttackers.length) {
      ownAttackers.sort((a, b) => effectiveAtk(b.inst) - effectiveAtk(a.inst));
      const target = ownAttackers[0];
      if (!strongestPlayer) {
        return { kind: 'spell', handIndex: buff.index, target: { index: target.index } };
      }
      const gap = effectiveAtk(strongestPlayer.inst) - effectiveAtk(target.inst);
      if (gap >= 0 && gap <= buff.def.value) {
        return { kind: 'spell', handIndex: buff.index, target: { index: target.index } };
      }
    }
  }

  // Chip damage when the opponent is low.
  if (burnSpell && player.lp <= 2600) return { kind: 'spell', handIndex: burnSpell.index, target: null };

  if (destroy && strongestPlayer && effectiveAtk(strongestPlayer.inst) >= 1200) {
    return { kind: 'spell', handIndex: destroy.index, target: { index: strongestPlayer.index } };
  }

  const healLate = find('heal');
  if (healLate && ai.lp <= 4800) return { kind: 'spell', handIndex: healLate.index, target: null };

  return null;
}

function scoreTarget(state, attacker, targetIndex) {
  const player = state.players.player;
  const inst = player.monster[targetIndex];
  if (!inst) return { score: -999, damage: 0 };
  const aAtk = effectiveAtk(attacker);
  const def = getCard(inst.defId);

  if (inst.faceDown) {
    const estimated = 1300;
    if (aAtk > estimated + 500) return { score: 500 + (aAtk - estimated), damage: 0 };
    if (aAtk > estimated) return { score: 180, damage: 0 };
    return { score: -600 - (estimated - aAtk), damage: 0 };
  }

  const value = inst.position === 'attack' ? effectiveAtk(inst) : effectiveDef(inst);
  const pierce = Boolean(getCard(attacker.defId).passive?.pierce);

  if (aAtk > value) {
    const damage = inst.position === 'attack' || pierce ? aAtk - value : 0;
    return { score: 460 + damage * 2 + (inst.position === 'attack' ? 180 : 0), damage };
  }
  if (aAtk === value) {
    if (inst.position === 'attack') return { score: 80 - effectiveAtk(attacker) / 8, damage: 0, trade: true };
    return { score: -140, damage: 0 };
  }
  const loss = value - aAtk;
  const counter = inst.position === 'attack' ? loss : 0;
  return { score: -420 - loss * 2 - counter * 2, damage: 0, risky: true };
}

function pickAttack(state) {
  const ai = state.players.ai;
  const player = state.players.player;
  const zone = ai.monster
    .map((inst, index) => ({ inst, index }))
    .filter(({ inst }) => inst && !inst.faceDown && inst.position === 'attack' && inst.attacksLeft > 0);
  if (!zone.length) return null;

  zone.sort((a, b) => effectiveAtk(b.inst) - effectiveAtk(a.inst));
  let best = null;

  for (const attacker of zone) {
    const legal = legalAttackTargets(state, 'ai', attacker.index);
    if (!legal.ok) continue;
    const aAtk = effectiveAtk(attacker.inst);

    if (legal.direct) {
      const lethal = aAtk >= player.lp;
      const score = lethal ? 100000 : 900 + aAtk;
      if (!best || score > best.score) best = { attackerIndex: attacker.index, target: null, score };
      continue;
    }

    for (const index of legal.indexes) {
      const result = scoreTarget(state, attacker.inst, index);
      let score = result.score;
      if (result.damage >= player.lp) score += 100000;
      score += ATTACK_BIAS;
      if (!best || score > best.score) {
        best = { attackerIndex: attacker.index, target: { index }, score };
      }
    }
  }

  if (!best || best.score < -50) return null;
  return { kind: 'attack', attackerIndex: best.attackerIndex, target: best.target };
}

export function nextAiAction(state) {
  if (state.winner || state.active !== 'ai') return null;
  return pickSummon(state) || pickTrap(state) || pickSpell(state) || pickAttack(state);
}

export function aiIntent(state) {
  const action = nextAiAction(state);
  if (!action) return 'end';
  return action.kind;
}
