'use strict';

/* ============================================================
   最速LP0デュエル — brother AI
============================================================ */

function activeGame(gen) {
  return gen === state.gameId && !state.over;
}

async function pause(ms, gen) {
  await sleep(ms);
  return activeGame(gen);
}

async function aiTurn(gen) {
  if (!activeGame(gen)) return;
  state.active = 'opponent';
  state.busy = true;
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  resetTurnFlags('opponent');
  addLog('turn', `--- 兄のターン (TURN ${state.turn}) ---`);
  drawCards('opponent', 1);
  render();
  if (!await pause(380, gen)) return;
  taunt(pick(['……最速で終わらせる。', 'その程度か。', '全部読めているぞ。', '行くぞ。']));

  await aiFlipSummons(gen);
  if (!await pause(230, gen)) return;

  await aiSetTrap(gen);
  if (!await pause(220, gen)) return;

  await aiPlaySpells(gen);
  if (!await pause(220, gen)) return;

  await aiSummon(gen);
  if (!await pause(300, gen)) return;

  await aiBattle(gen);
  if (!await pause(300, gen)) return;

  clearBoosts('opponent');
  if (!activeGame(gen)) return;

  state.turn++;
  state.active = 'player';
  state.busy = false;
  resetTurnFlags('player');
  addLog('turn', `--- あなたのターン (TURN ${state.turn}) ---`);
  drawCards('player', 1);
  if (state.over) return;
  render();
}

async function aiFlipSummons(gen) {
  const sets = allMonsters('opponent').filter((inst) => inst.faceDown && !inst.changed);
  for (const inst of sets) {
    if (!activeGame(gen)) return;
    if (!inst.zone) continue;
    const c = CARD_DB[inst.id];
    const playerMons = allMonsters('player');
    const maxPlayer = Math.max(0, ...playerMons.filter((m) => !m.faceDown).map(effAtk));
    const shouldFlip = !playerMons.length || c.atk >= Math.max(1400, maxPlayer) || Math.random() < 0.12;
    if (!shouldFlip) continue;
    flipInst(inst, 'summon');
    inst.changed = true;
    render();
    if (!await pause(340, gen)) return;
  }
}

async function aiSetTrap(gen) {
  const ai = state.players.opponent;
  const trapIndex = ai.hand.findIndex((id) => CARD_DB[id].type === 'trap');
  const zoneIndex = ai.spells.findIndex((x) => !x);
  if (trapIndex < 0 || zoneIndex < 0) return;
  setTrap('opponent', trapIndex, zoneIndex);
  await pause(280, gen);
}

async function aiPlaySpells(gen) {
  for (let n = 0; n < 5; n++) {
    if (!activeGame(gen)) return;
    const choice = chooseAiSpell();
    if (!choice) break;
    const ai = state.players.opponent;
    if (!ai.hand[choice.index]) break;
    await castSpell('opponent', choice.index, choice.target, gen);
    if (!activeGame(gen)) return;
    if (!await pause(340, gen)) return;
  }
}

function chooseAiSpell() {
  const ai = state.players.opponent;
  const player = state.players.player;
  const enemy = allMonsters('player');
  const visible = enemy.filter((m) => !m.faceDown);
  let best = null;

  ai.hand.forEach((id, index) => {
    const c = CARD_DB[id];
    if (c.type !== 'spell') return;
    let score = null;
    let target = null;

    if (id === 'fireball') {
      score = player.lp <= 1000 ? 1000 : 58;
    } else if (id === 'greatfire') {
      score = player.lp <= 1500 ? 1000 : 64;
    } else if (id === 'lightning') {
      if (!enemy.length) return;
      const strong = visible.slice().sort((a, b) => effAtk(b) - effAtk(a))[0] || enemy[0];
      target = strong;
      score = visible.length ? 52 + Math.min(20, effAtk(strong) / 200) : 34;
    } else if (id === 'gale') {
      const attackers = allMonsters('opponent').filter((m) => !m.faceDown && m.position === 'attack');
      if (!attackers.length) return;
      score = 36 + attackers.length * 3;
    } else if (id === 'wisdom') {
      score = ai.hand.length <= 4 ? 44 : 18;
    } else if (id === 'revive') {
      if (!ai.graveyard.some((card) => isMonster(card))) return;
      if (!ai.monsters.some((x) => !x)) return;
      score = 46;
    } else if (id === 'evilLight') {
      const sets = enemy.filter((m) => m.faceDown);
      if (!sets.length) return;
      score = 26 + sets.length * 16;
    } else if (id === 'fieldwind') {
      if (ai.field) return;
      score = 48;
    }

    if (score == null) return;
    score += Math.random() * 6;
    if (!best || score > best.score) best = { index, score, target };
  });

  return best;
}

function findSummonDest(owner, tribute) {
  const side = state.players[owner];
  const empty = side.monsters.findIndex((x) => !x);
  if (empty >= 0) return empty;
  if (tribute && tribute.zone && tribute.zone.area === 'monsters' && tribute.zone.owner === owner) {
    return tribute.zone.index;
  }
  return -1;
}

async function aiSummon(gen) {
  const ai = state.players.opponent;

  // ---- EX special summon ----
  if (ai.extra.length) {
    const own = allMonsters('opponent');
    const emzIndex = state.emz.findIndex((x) => !x);
    if (own.length >= 2 && emzIndex >= 0) {
      const extraId = [...ai.extra].sort((a, b) => CARD_DB[b].atk - CARD_DB[a].atk)[0];
      const extraCard = CARD_DB[extraId];
      const bestOwn = Math.max(0, ...own.map(effAtk));
      const playerBest = Math.max(0, ...allMonsters('player').filter((m) => !m.faceDown).map(effAtk));
      const worth = extraCard.atk >= bestOwn + 200 || playerBest > bestOwn || state.players.player.lp <= extraCard.atk;
      if (worth) {
        const tributes = [...own].sort((a, b) => effAtk(a) - effAtk(b)).slice(0, 2);
        const extraIndex = ai.extra.indexOf(extraId);
        addLog('opponent', '兄はEXデッキのモンスターを特殊召喚しようとしている…', 'opponent');
        await summonMonster('opponent', {
          cardId: extraId,
          isExtra: true,
          extraIndex,
          position: 'attack',
          zone: { area: 'emz', index: emzIndex },
          tributes
        });
        if (!activeGame(gen)) return;
        if (!await pause(370, gen)) return;
        taunt(pick(['これが俺の切り札だ。', 'EXゾーンを舐めるな。', 'この一撃で終わりだ。']));
      }
    }
  }

  if (ai.hasSummoned) return;
  if (!ai.hand.length) return;

  const handMonsters = ai.hand
    .map((id, index) => ({ id, index, c: CARD_DB[id] }))
    .filter((x) => x.c.type === 'monster');
  if (!handMonsters.length) return;

  const ownNow = allMonsters('opponent');

  // ---- tribute summon ----
  // EXモンスターは切り札なので、生贄には出さない。
  const tributePool = ownNow.filter((inst) => CARD_DB[inst.id].type !== 'extra');
  const high = handMonsters.filter((x) => x.c.level >= 5);
  if (high.length && tributePool.length >= 1) {
    const chosen = high.sort((a, b) => b.c.atk - a.c.atk)[0];
    const tribute = [...tributePool].sort((a, b) => effAtk(a) - effAtk(b))[0];
    const dest = findSummonDest('opponent', tribute);
    if (dest >= 0) {
      addLog('opponent', '兄はモンスターを生贄に捧げる…', 'opponent');
      await summonMonster('opponent', {
        cardId: chosen.id,
        handIndex: chosen.index,
        position: 'attack',
        zone: { area: 'monsters', owner: 'opponent', index: dest },
        tributes: [tribute]
      });
      if (!activeGame(gen)) return;
      if (!await pause(370, gen)) return;
      taunt(pick(['生贄を捧げろ。', 'これで盤面を掌握した。']));
      return;
    }
  }

  // ---- normal summon / set ----
  const low = handMonsters.filter((x) => x.c.level < 5);
  if (!low.length) return;
  const dest = ai.monsters.findIndex((x) => !x);
  if (dest < 0) return;

  const playerBest = Math.max(0, ...allMonsters('player').filter((m) => !m.faceDown).map(effAtk));
  const sorted = [...low].sort((a, b) => b.c.atk - a.c.atk);
  const best = sorted[0];
  const guard = [...low].filter((x) => x.c.def >= 1900).sort((a, b) => b.c.def - a.c.def)[0];

  let chosen = best;
  let position = 'attack';
  if (guard && (playerBest > best.c.atk + 200 || ai.lp <= 2600 || Math.random() < 0.14)) {
    chosen = guard;
    position = 'set';
  }

  await summonMonster('opponent', {
    cardId: chosen.id,
    handIndex: chosen.index,
    position,
    zone: { area: 'monsters', owner: 'opponent', index: dest },
    tributes: []
  });
  if (!activeGame(gen)) return;
  if (!await pause(370, gen)) return;
  if (position === 'set') taunt(pick(['伏せておく。読めるものなら読んでみろ。', '裏側守備、甘く見るなよ。']));
}

async function aiBattle(gen) {
  const attackers = allMonsters('opponent')
    .filter((m) => !m.faceDown && m.position === 'attack' && !m.attacked)
    .sort((a, b) => effAtk(b) - effAtk(a));

  for (const attacker of attackers) {
    if (!activeGame(gen)) return;
    if (!attacker.zone) continue;
    if (!await pause(220, gen)) return;

    const targets = allMonsters('player');
    if (!targets.length) {
      await performAttack(attacker, null);
    } else {
      let best = null;
      for (const t of targets) {
        const a = effAtk(attacker);
        const knownDef = t.faceDown ? 1500 : (t.position === 'defense' ? effDef(t) : effAtk(t));
        let score;
        if (a > knownDef) {
          score = (t.faceDown || t.position === 'defense') ? 180 + Math.min(knownDef, 2500) : 380 + (a - knownDef);
          if (!t.faceDown && t.position !== 'defense' && state.players.player.lp <= a - knownDef) score += 6000;
        } else if (a === knownDef) {
          score = -30;
        } else {
          score = -900;
        }
        if (!best || score > best.score) best = { target: t, score };
      }
      if (best && best.score > 0) {
        await performAttack(attacker, best.target);
      } else {
        addLog('opponent', '兄は攻撃を見送った。', 'opponent');
      }
    }

    if (!activeGame(gen)) return;
    if (!await pause(310, gen)) return;
  }
}
