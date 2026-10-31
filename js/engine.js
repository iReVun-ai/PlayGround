/*
 * ZERO POINT — deterministic duel engine.
 * Pure state + actions so puzzles can be replayed and searched.
 */
(function (global) {
  'use strict';

  const ZP = global.ZP = global.ZP || {};
  const CARDS = ZP.CARDS;

  const SIDES = ['player', 'enemy'];
  const other = side => (side === 'player' ? 'enemy' : 'player');
  const emptyZones = () => [null, null, null, null, null];

  let UID = 1;

  function makeCard(id, owner, state) {
    const def = CARDS[id];
    if (!def) throw new Error('Unknown card: ' + id);
    const card = Object.assign({}, def, {
      uid: state ? state.uidSeq++ : UID++,
      owner,
      pos: def.kind === 'monster' ? 'attack' : 'set',
      faceDown: false,
      setTurn: 0,
      flipTriggered: false,
      attacksUsed: 0,
      attacksAllowed: def.continuous && def.continuous.doubleAttack ? 2 : 1,
      atkBonus: 0,
      grantedDirect: false,
      effectUsed: false,
      changedPosition: false
    });
    return card;
  }

  function makeSide(state, owner, lp, deckIds) {
    return {
      lp,
      maxLp: lp,
      deck: (deckIds || []).map(id => makeCard(id, owner, state)),
      grave: [],
      hand: [],
      monsters: emptyZones(),
      spells: emptyZones(),
      normalUsed: false,
      flipUsed: false
    };
  }

  function createState(puzzle) {
    const state = {
      stageId: puzzle.id,
      round: 1,
      turnCount: 1,
      phase: 'player',
      winner: null,
      actions: 0,
      turnLimit: puzzle.turnLimit || 4,
      player: null,
      enemy: null,
      log: [],
      events: [],
      uidSeq: 1
    };
    state.player = makeSide(state, 'player', puzzle.playerLp || 8000, puzzle.deck || []);
    state.enemy = makeSide(state, 'enemy', puzzle.enemyLp || 8000, []);

    (puzzle.hand || []).forEach(id => state.player.hand.push(makeCard(id, 'player', state)));

    const setup = puzzle.enemySetup || {};
    (setup.monsters || []).forEach(m => {
      const card = makeCard(m.id, 'enemy', state);
      if (m.pos === 'set') {
        card.pos = 'set';
        card.faceDown = true;
        card.setTurn = 0;
      } else {
        card.pos = m.pos || 'attack';
        card.faceDown = false;
      }
      state.enemy.monsters[m.zone] = card;
    });
    (setup.spells || []).forEach(m => {
      const card = makeCard(m.id, 'enemy', state);
      card.faceDown = true;
      card.setTurn = 0;
      state.enemy.spells[m.zone] = card;
    });

    pushLog(state, 'デュエル開始。LPを0にせよ。', 'system');
    return state;
  }

  function cloneState(state) {
    const seen = new Map();
    const copy = value => {
      if (Array.isArray(value)) return value.map(copy);
      if (value && typeof value === 'object') {
        if (seen.has(value)) return seen.get(value);
        const out = {};
        seen.set(value, out);
        for (const key of Object.keys(value)) out[key] = copy(value[key]);
        return out;
      }
      return value;
    };
    return copy(state);
  }

  function pushLog(state, text, tone) {
    state.log.push({ text, tone: tone || 'neutral' });
    if (state.log.length > 140) state.log.splice(0, state.log.length - 140);
  }

  function pushEvent(state, event) {
    state.events.push(event);
  }

  function atkOf(card) {
    return Math.max(0, (card.atk || 0) + (card.atkBonus || 0));
  }

  function canDirect(card) {
    return !!(card.continuous && card.continuous.direct) || !!card.grantedDirect;
  }

  function monsterCount(sideState) {
    return sideState.monsters.filter(Boolean).length;
  }

  function firstEmpty(zones) {
    for (let i = 0; i < zones.length; i++) if (!zones[i]) return i;
    return -1;
  }

  function highestAtkMonster(sideState) {
    let best = -1, bestAtk = -1;
    sideState.monsters.forEach((card, i) => {
      if (!card || card.faceDown) return;
      const atk = atkOf(card);
      if (atk > bestAtk) { bestAtk = atk; best = i; }
    });
    return best;
  }

  function highestDefSetMonster(sideState) {
    let best = -1, bestDef = -1;
    sideState.monsters.forEach((card, i) => {
      if (!card || !card.faceDown) return;
      if (card.def > bestDef) { bestDef = card.def; best = i; }
    });
    return best;
  }

  function firstSetSpell(sideState) {
    for (let i = 0; i < sideState.spells.length; i++) {
      const card = sideState.spells[i];
      if (card && card.faceDown) return i;
    }
    return -1;
  }

  function activeTrapIndex(sideState, state, mode) {
    for (let i = 0; i < sideState.spells.length; i++) {
      const card = sideState.spells[i];
      if (!card || !card.faceDown || card.kind !== 'trap' || card.setTurn >= state.turnCount) continue;
      const trap = card.trap || {};
      if (mode === 'attack' && trap.onAttacked) return i;
      if (mode === 'reflect' && trap.reflect) return i;
    }
    return -1;
  }

  function heal(state, side, amount) {
    const s = state[side];
    const before = s.lp;
    s.lp = Math.min(s.maxLp, s.lp + amount);
    if (s.lp !== before) {
      pushLog(state, `${side === 'player' ? '自分' : '相手'}は${s.lp - before}LP回復。`, side === 'player' ? 'good' : 'bad');
      pushEvent(state, { type: 'heal', side, amount: s.lp - before });
    }
  }

  function damage(state, side, amount, meta) {
    if (state.winner) return;
    if (!amount || amount <= 0) return;
    const s = state[side];
    s.lp = Math.max(0, s.lp - amount);
    pushLog(state, `${side === 'player' ? '自分' : '相手'}に${amount}ダメージ。`, side === 'player' ? 'bad' : 'good');
    pushEvent(state, { type: 'damage', side, amount, source: meta && meta.source });
    checkWin(state);
  }

  function checkWin(state) {
    if (state.winner) return;
    if (state.enemy.lp <= 0) {
      state.winner = 'player';
      state.phase = 'over';
      pushLog(state, '相手のLPが0になった。ZERO POINT達成。', 'win');
      pushEvent(state, { type: 'win', side: 'player' });
    } else if (state.player.lp <= 0) {
      state.winner = 'enemy';
      state.phase = 'over';
      pushLog(state, '自分のLPが0になった。敗北。', 'lose');
      pushEvent(state, { type: 'win', side: 'enemy' });
    }
  }

  function sendToGrave(state, side, card, from) {
    state[side].grave.push(card);
    card.zone = null;
    card.faceDown = false;
    pushEvent(state, { type: 'grave', side, uid: card.uid, name: card.name });
  }

  function destroyMonster(state, side, zoneIndex) {
    const card = state[side].monsters[zoneIndex];
    if (!card) return null;
    state[side].monsters[zoneIndex] = null;
    sendToGrave(state, side, card);
    pushLog(state, `${side === 'player' ? '自分' : '相手'}の「${card.name}」を破壊。`, side === 'player' ? 'bad' : 'good');
    pushEvent(state, { type: 'destroy', side, zone: zoneIndex, uid: card.uid, name: card.name });
    return card;
  }

  function destroySpell(state, side, zoneIndex) {
    const card = state[side].spells[zoneIndex];
    if (!card) return null;
    state[side].spells[zoneIndex] = null;
    sendToGrave(state, side, card);
    pushLog(state, `${side === 'player' ? '自分' : '相手'}の「${card.name}」を破壊。`, side === 'player' ? 'bad' : 'good');
    pushEvent(state, { type: 'destroy', side, zone: zoneIndex, uid: card.uid, name: card.name });
    const burn = card.trap && card.trap.onDestroyedBurn;
    if (burn) {
      pushLog(state, `「${card.name}」の効果が発動。`, 'bad');
      damage(state, other(side), burn, { source: card.name });
    }
    return card;
  }

  function destroyTrap(state, side, zoneIndex, reason) {
    const card = state[side].spells[zoneIndex];
    if (!card) return null;
    state[side].spells[zoneIndex] = null;
    sendToGrave(state, side, card);
    pushLog(state, `${side === 'player' ? '自分' : '相手'}の「${card.name}」を墓地へ。${reason ? '（' + reason + '）' : ''}`, 'neutral');
    pushEvent(state, { type: 'trap', side, uid: card.uid, name: card.name });
    return card;
  }

  function draw(state, side, count) {
    const s = state[side];
    for (let i = 0; i < count; i++) {
      if (!s.deck.length) {
        pushLog(state, `${side === 'player' ? '自分' : '相手'}の山札は空。ドローできない。`, 'system');
        break;
      }
      const card = s.deck.shift();
      s.hand.push(card);
      pushLog(state, `${side === 'player' ? '自分' : '相手'}は1枚ドロー。`, side === 'player' ? 'good' : 'neutral');
      pushEvent(state, { type: 'draw', side, uid: card.uid, name: card.name });
    }
  }

  function dealBattleDamage(state, side, amount, attackerSide, attacker) {
    if (amount <= 0) return;
    const ref = activeTrapIndex(state[side], state, 'reflect');
    if (ref >= 0) {
      const trap = state[side].spells[ref];
      pushLog(state, `「${trap.name}」が戦闘ダメージを反射！`, side === 'player' ? 'good' : 'bad');
      pushEvent(state, { type: 'trapReveal', side, uid: trap.uid, name: trap.name });
      destroyTrap(state, side, ref, '反射');
      damage(state, other(side), amount, { source: 'reflect' });
      return;
    }
    damage(state, side, amount, { source: 'battle' });
    if (attacker && attacker.continuous && attacker.continuous.lifesteal && attacker.owner === attackerSide) {
      heal(state, attackerSide, amount);
    }
  }

  function triggerFlip(state, side, card) {
    if (!card || card.flipTriggered) return;
    card.flipTriggered = true;
    const flip = card.flip;
    if (!flip) return;
    pushLog(state, `リバース効果：「${card.name}」`, side === 'player' ? 'good' : 'bad');
    pushEvent(state, { type: 'flip', side, uid: card.uid, name: card.name });
    if (flip.burn) damage(state, other(side), flip.burn, { source: card.name });
    if (flip.draw) draw(state, side, flip.draw);
    if (flip.destroySetSpell) {
      const target = firstSetSpell(state[other(side)]);
      if (target >= 0) {
        pushLog(state, `「${card.name}」がセットカードを破壊。`, side === 'player' ? 'good' : 'bad');
        destroySpell(state, other(side), target);
      }
    }
  }

  function revealSetMonster(state, side, zoneIndex, cause) {
    const card = state[side].monsters[zoneIndex];
    if (!card || !card.faceDown) return card;
    card.faceDown = false;
    card.pos = 'defense';
    pushLog(state, `${side === 'player' ? '自分' : '相手'}のセットモンスター「${card.name}」を公開。`, 'neutral');
    pushEvent(state, { type: 'reveal', side, zone: zoneIndex, uid: card.uid, name: card.name, cause });
    triggerFlip(state, side, card);
    return card;
  }

  function battle(state, attackerSide, attackerZone, targetZone) {
    const defSide = other(attackerSide);
    const attacker = state[attackerSide].monsters[attackerZone];
    if (!attacker) return;
    attacker.attacksUsed += 1;

    const targetCard = targetZone == null ? null : state[defSide].monsters[targetZone];
    pushEvent(state, {
      type: 'attack', side: attackerSide, zone: attackerZone, uid: attacker.uid,
      name: attacker.name, target: targetCard ? targetCard.name : 'direct', targetZone
    });

    // Defender trap window.
    const trapIndex = activeTrapIndex(state[defSide], state, 'attack');
    if (trapIndex >= 0) {
      const trap = state[defSide].spells[trapIndex];
      const t = trap.trap || {};
      pushLog(state, `「${trap.name}」が発動！`, defSide === 'player' ? 'good' : 'bad');
      pushEvent(state, { type: 'trapReveal', side: defSide, uid: trap.uid, name: trap.name });
      if (t.onAttacked === 'negate') {
        destroyTrap(state, defSide, trapIndex, '攻撃無効');
        if (t.burn) damage(state, attackerSide, t.burn, { source: trap.name });
        pushLog(state, '攻撃は無効になった。', 'neutral');
        return;
      }
      if (t.onAttacked === 'destroy') {
        destroyTrap(state, defSide, trapIndex, '攻撃破壊');
        destroyMonster(state, attackerSide, attackerZone);
        pushLog(state, '攻撃モンスターは破壊された。', 'neutral');
        return;
      }
      if (t.onAttacked === 'bounce') {
        destroyTrap(state, defSide, trapIndex, '攻撃退避');
        state[attackerSide].monsters[attackerZone] = null;
        attacker.zone = null;
        if (attacker.owner === 'player') {
          attacker.pos = 'attack';
          attacker.faceDown = false;
          state[attackerSide].hand.push(attacker);
          pushLog(state, `「${attacker.name}」は手札に戻った。`, 'neutral');
        } else {
          sendToGrave(state, attackerSide, attacker);
          pushLog(state, `「${attacker.name}」は除外された。`, 'neutral');
        }
        pushEvent(state, { type: 'bounce', side: attackerSide, uid: attacker.uid, name: attacker.name });
        return;
      }
    }

    if (targetZone == null) {
      if (monsterCount(state[defSide]) > 0 && !canDirect(attacker)) return;
      pushLog(state, `「${attacker.name}」の直接攻撃！`, attackerSide === 'player' ? 'good' : 'bad');
      dealBattleDamage(state, defSide, atkOf(attacker), attackerSide, attacker);
      return;
    }

    let target = state[defSide].monsters[targetZone];
    if (!target) return;

    const mirrorBurn = target.continuous && target.continuous.attackedBurn && !target.effectUsed
      ? target.continuous.attackedBurn : 0;
    if (mirrorBurn) target.effectUsed = true;

    if (target.faceDown) {
      target = revealSetMonster(state, defSide, targetZone, 'attack');
      if (!target) return;
      if (state.winner) return;
    }

    const aAtk = atkOf(attacker);
    const tDef = target.def || 0;
    const tAtk = atkOf(target);
    const isDefense = target.pos !== 'attack';

    if (isDefense) {
      if (aAtk > tDef) {
        pushLog(state, `「${attacker.name}」が「${target.name}」を撃破。`, attackerSide === 'player' ? 'good' : 'bad');
        destroyMonster(state, defSide, targetZone);
        if (attacker.continuous && attacker.continuous.piercing) {
          const pierce = aAtk - tDef;
          if (pierce > 0) {
            pushLog(state, `貫通ダメージ ${pierce}！`, attackerSide === 'player' ? 'good' : 'bad');
            dealBattleDamage(state, defSide, pierce, attackerSide, attacker);
          }
        }
      } else if (aAtk < tDef) {
        pushLog(state, `「${target.name}」の守備力が上回り、「${attacker.name}」が破壊。`, attackerSide === 'player' ? 'bad' : 'good');
        destroyMonster(state, attackerSide, attackerZone);
      } else {
        pushLog(state, '攻撃力と守備力が拮抗。お互い無傷。', 'neutral');
      }
    } else {
      if (aAtk > tAtk) {
        pushLog(state, `「${attacker.name}」が「${target.name}」を撃破。`, attackerSide === 'player' ? 'good' : 'bad');
        destroyMonster(state, defSide, targetZone);
        dealBattleDamage(state, defSide, aAtk - tAtk, attackerSide, attacker);
      } else if (aAtk < tAtk) {
        pushLog(state, `「${target.name}」の反撃。 「${attacker.name}」が破壊。`, attackerSide === 'player' ? 'bad' : 'good');
        destroyMonster(state, attackerSide, attackerZone);
        dealBattleDamage(state, attackerSide, tAtk - aAtk, defSide, target);
      } else {
        pushLog(state, '相打ち。両方のモンスターが破壊。', 'neutral');
        destroyMonster(state, attackerSide, attackerZone);
        destroyMonster(state, defSide, targetZone);
      }
    }

    if (mirrorBurn) {
      pushLog(state, `「${target.name}」の反射効果。`, defSide === 'player' ? 'good' : 'bad');
      damage(state, attackerSide, mirrorBurn, { source: target.name });
    }
  }

  function canUseSpell(state, side, card) {
    if (!card || card.kind !== 'spell') return false;
    const e = card.spell || {};
    const foe = state[other(side)];
    const own = state[side];
    if (e.destroySetMonster) return highestDefSetMonster(foe) >= 0;
    if (e.destroySetSpell) return firstSetSpell(foe) >= 0;
    if (e.bounceMonster) return monsterCount(foe) > 0;
    if (e.revive) return own.grave.some(c => c.kind === 'monster') && firstEmpty(own.monsters) >= 0;
    if (e.doubleTarget || e.buff) return highestAtkMonster(own) >= 0;
    if (e.tributeBurn) return highestAtkMonster(own) >= 0;
    return true;
  }

  function applySpell(state, side, card) {
    const e = card.spell || {};
    const foeSide = other(side);
    const foe = state[foeSide];
    const own = state[side];
    pushLog(state, `魔法カード「${card.name}」を発動。`, side === 'player' ? 'good' : 'bad');
    pushEvent(state, { type: 'spell', side, uid: card.uid, name: card.name });

    if (e.burn) damage(state, foeSide, e.burn, { source: card.name });
    if (e.burnNoMonsters || e.burnElse) {
      const amount = monsterCount(foe) === 0 ? e.burnNoMonsters : e.burnElse;
      pushLog(state, monsterCount(foe) === 0 ? '相手フィールドは無人。直撃！' : '相手モンスターが邪魔をした。', 'neutral');
      damage(state, foeSide, amount, { source: card.name });
    }
    if (e.destroySetMonster) {
      const zone = highestDefSetMonster(foe);
      if (zone >= 0) {
        pushLog(state, `セットモンスター「${foe.monsters[zone].name}」を破壊。`, side === 'player' ? 'good' : 'bad');
        destroyMonster(state, foeSide, zone);
      }
    }
    if (e.destroySetSpell) {
      const zone = firstSetSpell(foe);
      if (zone >= 0) {
        pushLog(state, `セットカード「${foe.spells[zone].name}」を破壊。`, side === 'player' ? 'good' : 'bad');
        destroySpell(state, foeSide, zone);
      }
    }
    if (e.bounceMonster) {
      let zone = -1, best = -1;
      foe.monsters.forEach((c, i) => {
        if (!c) return;
        const atk = atkOf(c);
        if (atk > best) { best = atk; zone = i; }
      });
      if (zone >= 0) {
        const bounced = foe.monsters[zone];
        foe.monsters[zone] = null;
        bounced.faceDown = false;
        bounced.pos = 'attack';
        bounced.attacksUsed = 0;
        foe.hand.push(bounced);
        pushLog(state, `「${bounced.name}」を相手の手札に戻した。`, side === 'player' ? 'good' : 'bad');
        pushEvent(state, { type: 'bounce', side: foeSide, uid: bounced.uid, name: bounced.name });
      }
    }
    if (e.draw) draw(state, side, e.draw);
    if (e.revive) {
      let best = -1, bestAtk = -1;
      own.grave.forEach((c, i) => {
        if (c.kind === 'monster' && c.atk > bestAtk) { bestAtk = c.atk; best = i; }
      });
      if (best >= 0) {
        const zone = firstEmpty(own.monsters);
        const revived = own.grave.splice(best, 1)[0];
        revived.pos = 'attack';
        revived.faceDown = false;
        revived.attacksUsed = 0;
        revived.attacksAllowed = revived.continuous && revived.continuous.doubleAttack ? 2 : 1;
        own.monsters[zone] = revived;
        pushLog(state, `「${revived.name}」が墓地から蘇った。`, side === 'player' ? 'good' : 'bad');
        pushEvent(state, { type: 'specialSummon', side, zone, uid: revived.uid, name: revived.name });
        if (revived.onSummon && revived.onSummon.burn) damage(state, foeSide, revived.onSummon.burn, { source: revived.name });
      }
    }
    if (e.doubleTarget) {
      const zone = highestAtkMonster(own);
      if (zone >= 0) {
        const m = own.monsters[zone];
        m.attacksAllowed = Math.max(m.attacksAllowed, m.attacksUsed + 1, 2);
        pushLog(state, `「${m.name}」はもう1回攻撃できる。`, side === 'player' ? 'good' : 'bad');
        pushEvent(state, { type: 'buff', side, zone, uid: m.uid, name: m.name, text: '2回攻撃' });
      }
    }
    if (e.buff) {
      const zone = highestAtkMonster(own);
      if (zone >= 0) {
        const m = own.monsters[zone];
        m.atkBonus += e.buff;
        if (e.direct) m.grantedDirect = true;
        pushLog(state, `「${m.name}」の攻撃力が${e.buff}アップ${e.direct ? 'し、直接攻撃可能になった' : ''}。`, side === 'player' ? 'good' : 'bad');
        pushEvent(state, { type: 'buff', side, zone, uid: m.uid, name: m.name, text: '+' + e.buff });
      }
    }
    if (e.tributeBurn) {
      const zone = highestAtkMonster(own);
      if (zone >= 0) {
        const m = own.monsters[zone];
        pushLog(state, `「${m.name}」を生贄に捧げる。`, side === 'player' ? 'bad' : 'good');
        destroyMonster(state, side, zone);
        damage(state, foeSide, e.tributeBurn, { source: card.name });
      }
    }
  }

  function activateSpellCard(state, side, card) {
    applySpell(state, side, card);
    sendToGrave(state, side, card);
  }

  /* ---------------- Player actions ---------------- */

  function legalActions(state) {
    const out = [];
    if (!state || state.winner || state.phase !== 'player') return out;
    const P = state.player;

    // Normal summon / set
    if (!P.normalUsed) {
      P.hand.forEach((card, hand) => {
        if (card.kind !== 'monster') return;
        for (let zone = 0; zone < 5; zone++) {
          if (P.monsters[zone]) continue;
          out.push({ type: 'summon', hand, zone });
          out.push({ type: 'setMonster', hand, zone });
        }
      });
    }

    // Set spells / traps
    P.hand.forEach((card, hand) => {
      if (card.kind === 'monster') return;
      for (let zone = 0; zone < 5; zone++) {
        if (P.spells[zone]) continue;
        out.push({ type: 'setSpell', hand, zone });
      }
    });

    // Activate spells from hand
    P.hand.forEach((card, hand) => {
      if (card.kind !== 'spell') return;
      if (!canUseSpell(state, 'player', card)) return;
      out.push({ type: 'activate', hand });
    });

    // Activate set spells
    P.spells.forEach((card, zone) => {
      if (!card || card.kind !== 'spell' || !card.faceDown) return;
      if (card.setTurn >= state.turnCount) return;
      if (!canUseSpell(state, 'player', card)) return;
      out.push({ type: 'activateSet', zone });
    });

    // Flip summon
    if (!P.flipUsed) {
      P.monsters.forEach((card, zone) => {
        if (card && card.faceDown) out.push({ type: 'flipSummon', zone });
      });
    }

    // Position change
    P.monsters.forEach((card, zone) => {
      if (!card || card.faceDown || card.changedPosition || card.attacksUsed > 0) return;
      out.push({ type: 'changePosition', zone });
    });

    // Attacks
    const enemyMonsters = state.enemy.monsters
      .map((card, zone) => (card ? zone : -1))
      .filter(zone => zone >= 0);
    P.monsters.forEach((card, zone) => {
      if (!card || card.faceDown || card.pos !== 'attack') return;
      if (card.attacksUsed >= card.attacksAllowed) return;
      enemyMonsters.forEach(target => out.push({ type: 'attack', zone, target }));
      if (enemyMonsters.length === 0 || canDirect(card)) out.push({ type: 'attack', zone, target: 'direct' });
    });

    out.push({ type: 'endTurn' });
    return out;
  }

  function isLegal(state, action) {
    if (!action) return false;
    const list = legalActions(state);
    return list.some(a => actionKey(a) === actionKey(action));
  }

  function actionKey(action) {
    if (!action) return '';
    return [action.type, action.hand, action.zone, action.target].join(':');
  }

  function describeAction(state, action) {
    if (!action) return '';
    const P = state.player;
    const E = state.enemy;
    const handCard = action.hand != null ? P.hand[action.hand] : null;
    const zoneCard = action.zone != null ? P.monsters[action.zone] || P.spells[action.zone] : null;
    switch (action.type) {
      case 'summon': return `「${handCard ? handCard.name : '?'}」を召喚`;
      case 'setMonster': return `「${handCard ? handCard.name : '?'}」を裏側守備表示でセット`;
      case 'setSpell': return `「${handCard ? handCard.name : '?'}」をセット`;
      case 'activate': return `「${handCard ? handCard.name : '?'}」を発動`;
      case 'activateSet': return `セットした「${P.spells[action.zone] ? P.spells[action.zone].name : '?'}」を発動`;
      case 'flipSummon': return `「${zoneCard ? zoneCard.name : '?'}」を反転召喚`;
      case 'changePosition': return `「${zoneCard ? zoneCard.name : '?'}」の表示形式を変更`;
      case 'attack': {
        const target = action.target === 'direct' ? '直接攻撃' : `「${E.monsters[action.target] ? E.monsters[action.target].name : '?'}」を攻撃`;
        return `「${zoneCard ? zoneCard.name : '?'}」で${target}`;
      }
      case 'endTurn': return 'ターン終了';
      default: return action.type;
    }
  }

  function applyActionMut(state, action, puzzle, opts) {
    if (!state || state.winner || state.phase !== 'player') return state;
    const deferEnemy = !!(opts && opts.deferEnemy);
    state.events = [];
    if (!isLegal(state, action)) {
      pushLog(state, 'その行動は選べない。', 'system');
      return state;
    }
    state.actions += 1;
    const P = state.player;

    if (action.type === 'summon') {
      const card = P.hand.splice(action.hand, 1)[0];
      card.pos = 'attack';
      card.faceDown = false;
      card.setTurn = state.turnCount;
      P.monsters[action.zone] = card;
      P.normalUsed = true;
      pushLog(state, `「${card.name}」を召喚。`, 'good');
      pushEvent(state, { type: 'summon', side: 'player', zone: action.zone, uid: card.uid, name: card.name });
      if (card.onSummon && card.onSummon.burn) {
        pushLog(state, `召喚時効果：${card.onSummon.burn}ダメージ。`, 'good');
        damage(state, 'enemy', card.onSummon.burn, { source: card.name });
      }
    } else if (action.type === 'setMonster') {
      const card = P.hand.splice(action.hand, 1)[0];
      card.pos = 'set';
      card.faceDown = true;
      card.setTurn = state.turnCount;
      P.monsters[action.zone] = card;
      P.normalUsed = true;
      pushLog(state, `「${card.name}」を裏側守備表示でセット。`, 'good');
      pushEvent(state, { type: 'set', side: 'player', zone: action.zone, uid: card.uid, name: card.name });
    } else if (action.type === 'setSpell') {
      const card = P.hand.splice(action.hand, 1)[0];
      card.faceDown = true;
      card.setTurn = state.turnCount;
      P.spells[action.zone] = card;
      pushLog(state, `「${card.name}」をセット。`, 'good');
      pushEvent(state, { type: 'set', side: 'player', zone: action.zone, uid: card.uid, name: card.name });
    } else if (action.type === 'activate') {
      const card = P.hand.splice(action.hand, 1)[0];
      activateSpellCard(state, 'player', card);
    } else if (action.type === 'activateSet') {
      const card = P.spells[action.zone];
      P.spells[action.zone] = null;
      activateSpellCard(state, 'player', card);
    } else if (action.type === 'flipSummon') {
      const card = P.monsters[action.zone];
      card.faceDown = false;
      card.pos = 'attack';
      P.flipUsed = true;
      card.changedPosition = true;
      pushLog(state, `「${card.name}」を反転召喚。`, 'good');
      pushEvent(state, { type: 'flipSummon', side: 'player', zone: action.zone, uid: card.uid, name: card.name });
      triggerFlip(state, 'player', card);
    } else if (action.type === 'changePosition') {
      const card = P.monsters[action.zone];
      card.pos = card.pos === 'attack' ? 'defense' : 'attack';
      card.changedPosition = true;
      pushLog(state, `「${card.name}」を${card.pos === 'attack' ? '攻撃表示' : '守備表示'}に。`, 'neutral');
      pushEvent(state, { type: 'position', side: 'player', zone: action.zone, uid: card.uid, pos: card.pos });
    } else if (action.type === 'attack') {
      battle(state, 'player', action.zone, action.target === 'direct' ? null : action.target);
    } else if (action.type === 'endTurn') {
      pushLog(state, 'ターン終了。', 'system');
      if (deferEnemy) beginEnemyTurn(state, puzzle);
      else runEnemyTurn(state, puzzle);
    }

    checkWin(state);
    return state;
  }

  function resetPlayerTurn(state) {
    const P = state.player;
    P.normalUsed = false;
    P.flipUsed = false;
    P.monsters.forEach(card => {
      if (!card) return;
      card.attacksUsed = 0;
      card.changedPosition = false;
    });
  }

  function chooseLowestDefZone(state, side) {
    let best = -1, bestDef = Infinity;
    state[side].monsters.forEach((card, zone) => {
      if (!card) return;
      const def = card.faceDown || card.pos !== 'attack' ? (card.def || 0) : (card.def || 0);
      if (def < bestDef) { bestDef = def; best = zone; }
    });
    return best;
  }

  function resolveEnemyAttack(state, zone, target) {
    const E = state.enemy;
    const attacker = E.monsters[zone];
    if (!attacker || attacker.faceDown || attacker.pos !== 'attack') return false;
    if (attacker.attacksUsed > 0) return false;
    let targetZone = null;
    if (target === 'direct') {
      targetZone = null;
      if (monsterCount(state.player) > 0 && !canDirect(attacker)) return false;
    } else if (typeof target === 'number') {
      targetZone = state.player.monsters[target] ? target : null;
      if (targetZone == null) targetZone = chooseLowestDefZone(state, 'player');
      if (targetZone == null && monsterCount(state.player) > 0) targetZone = chooseLowestDefZone(state, 'player');
    } else {
      targetZone = chooseLowestDefZone(state, 'player');
      if (targetZone < 0) targetZone = null;
      if (targetZone == null && monsterCount(state.player) > 0) return false;
    }
    battle(state, 'enemy', zone, targetZone);
    return true;
  }

  function buildEnemyQueue(state, puzzle) {
    const plan = puzzle && puzzle.enemyPlans ? puzzle.enemyPlans[state.round - 1] : undefined;
    if (Array.isArray(plan)) return plan.map(step => Object.assign({}, step));
    // Default: every face-up attack monster strikes the lowest-DEF target.
    const queue = [];
    state.enemy.monsters.forEach((card, zone) => {
      if (card && !card.faceDown && card.pos === 'attack') queue.push({ op: 'attack', zone, target: 'lowest' });
    });
    return queue;
  }

  function beginEnemyTurn(state, puzzle) {
    if (state.winner) return;
    state.phase = 'enemy';
    state.turnCount += 1;
    state.enemy.monsters.forEach(card => {
      if (!card) return;
      card.attacksUsed = 0;
      card.changedPosition = false;
    });
    state.enemyQueue = buildEnemyQueue(state, puzzle);
    state.enemyIndex = 0;
    pushLog(state, '── 相手のターン ──', 'system');
    state.events = [{ type: 'enemyTurn' }];
  }

  function executeEnemyStep(state, step) {
    if (!step || state.winner) return;
    if (step.op === 'place') {
      if (state.enemy.monsters[step.zone]) return;
      const card = makeCard(step.id, 'enemy', state);
      if (step.pos === 'set') {
        card.pos = 'set';
        card.faceDown = true;
        card.setTurn = 0;
      } else {
        card.pos = step.pos || 'attack';
        card.faceDown = false;
      }
      state.enemy.monsters[step.zone] = card;
      const placed = card.pos === 'attack' ? '攻撃表示で召喚' : (card.pos === 'defense' ? '守備表示で召喚' : 'セット');
      pushLog(state, `相手は「${card.name}」を${placed}。`, 'bad');
      pushEvent(state, { type: 'enemySummon', side: 'enemy', zone: step.zone, uid: card.uid, name: card.name });
    } else if (step.op === 'placeSpell') {
      if (state.enemy.spells[step.zone]) return;
      const card = makeCard(step.id, 'enemy', state);
      card.faceDown = true;
      card.setTurn = 0;
      state.enemy.spells[step.zone] = card;
      pushLog(state, '相手はカードを1枚セット。', 'bad');
      pushEvent(state, { type: 'enemySet', side: 'enemy', zone: step.zone, uid: card.uid });
    } else if (step.op === 'attack') {
      resolveEnemyAttack(state, step.zone, step.target);
    } else if (step.op === 'burn') {
      pushLog(state, `相手の呪いが発動。${step.amount}ダメージ。`, 'bad');
      damage(state, 'player', step.amount, { source: 'curse' });
    } else if (step.op === 'flip') {
      const card = state.enemy.monsters[step.zone];
      if (card && card.faceDown) {
        card.faceDown = false;
        card.pos = 'attack';
        pushLog(state, `相手は「${card.name}」を反転召喚。`, 'bad');
        triggerFlip(state, 'enemy', card);
      }
    }
  }

  function finishEnemyTurn(state) {
    if (state.winner) return;
    state.round += 1;
    if (state.round > state.turnLimit) {
      state.winner = 'enemy';
      state.phase = 'over';
      pushLog(state, 'ターン上限に達した。時間切れ。', 'lose');
      state.events.push({ type: 'win', side: 'enemy', reason: 'timeout' });
      return;
    }
    state.turnCount += 1;
    state.phase = 'player';
    resetPlayerTurn(state);
    draw(state, 'player', 1);
    pushLog(state, `── 自分のターン ${state.round} ──`, 'system');
    state.events.push({ type: 'playerTurn', round: state.round });
  }

  // Advance one enemy step. Returns true when the enemy turn is finished.
  function stepEnemyTurn(state) {
    if (state.winner) return true;
    if (state.phase !== 'enemy') return true;
    state.events = [];
    if (!state.enemyQueue || state.enemyIndex >= state.enemyQueue.length) {
      finishEnemyTurn(state);
      return state.phase !== 'enemy';
    }
    const step = state.enemyQueue[state.enemyIndex++];
    executeEnemyStep(state, step);
    if (state.winner) return true;
    if (state.enemyIndex >= state.enemyQueue.length) {
      finishEnemyTurn(state);
      return state.phase !== 'enemy';
    }
    return false;
  }

  function runEnemyTurn(state, puzzle) {
    beginEnemyTurn(state, puzzle);
    let guard = 0;
    while (state.phase === 'enemy' && !state.winner && guard++ < 50) stepEnemyTurn(state);
    if (state.phase === 'enemy' && !state.winner) finishEnemyTurn(state);
  }

  function stateKey(state) {
    if (!state) return '';
    const strip = card => {
      if (!card) return '-';
      return [
        card.id,
        card.pos,
        card.faceDown ? 1 : 0,
        card.flipTriggered ? 1 : 0,
        card.attacksUsed,
        card.attacksAllowed,
        card.atkBonus,
        card.grantedDirect ? 1 : 0,
        card.effectUsed ? 1 : 0,
        card.changedPosition ? 1 : 0,
        card.setTurn
      ].join(',');
    };
    const side = s => [
      s.lp,
      s.normalUsed ? 1 : 0,
      s.flipUsed ? 1 : 0,
      s.hand.map(c => c.id).join('.'), // hand order affects indexes
      s.deck.map(c => c.id).join('.'),
      s.grave.map(c => c.id).join('.'),
      s.monsters.map(strip).join('|'),
      s.spells.map(strip).join('|')
    ].join(';');
    return [state.round, state.turnCount, state.phase, state.winner, state.actions, side(state.player), side(state.enemy)].join('#');
  }

  function scoreStar(actions, par) {
    if (actions <= par) return 3;
    if (actions <= par + 2) return 2;
    return 1;
  }

  // Convert a human-authored step (card id instead of hand index) to an action.
  function toAction(state, step) {
    if (!step) return null;
    let hand;
    if (step.card) {
      hand = state.player.hand.findIndex(c => c.id === step.card);
      if (hand < 0) return null;
    }
    return { type: step.type, hand, zone: step.zone, target: step.target };
  }

  function applySolution(state, steps, puzzle) {
    for (let i = 0; i < steps.length; i++) {
      const action = toAction(state, steps[i]);
      if (!action || !isLegal(state, action)) {
        return { ok: false, index: i, step: steps[i], action, state };
      }
      applyActionMut(state, action, puzzle);
      if (state.winner) return { ok: true, index: i, state };
    }
    return { ok: true, index: steps.length - 1, state };
  }

  ZP.engine = {
    createState, cloneState, legalActions, isLegal, applyActionMut,
    describeAction, actionKey, stateKey, runEnemyTurn, beginEnemyTurn, stepEnemyTurn,
    scoreStar, makeCard, atkOf, canDirect, monsterCount, other,
    chooseLowestDefZone, highestAtkMonster, highestDefSetMonster, firstSetSpell,
    toAction, applySolution
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZP.engine;
  }
})(typeof window !== 'undefined' ? window : globalThis);
