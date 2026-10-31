'use strict';

/* ============================================================
   最速LP0デュエル — board rendering & player interaction
============================================================ */

const ZONE_LAYOUT = (() => {
  const zones = [];
  zones.push({ area: 'field', owner: 'opponent', index: 0, row: 1, col: 1, tag: 'FIELD' });
  for (let i = 0; i < 5; i++) zones.push({ area: 'spells', owner: 'opponent', index: i, row: 1, col: i + 2, tag: 'S/T' });
  for (let i = 0; i < 5; i++) zones.push({ area: 'monsters', owner: 'opponent', index: i, row: 2, col: i + 2, tag: 'M' });
  zones.push({ area: 'emz', index: 0, row: 3, col: 2, tag: 'EX' });
  zones.push({ area: 'emz', index: 1, row: 3, col: 5, tag: 'EX' });
  for (let i = 0; i < 5; i++) zones.push({ area: 'monsters', owner: 'player', index: i, row: 4, col: i + 2, tag: 'M' });
  zones.push({ area: 'field', owner: 'player', index: 0, row: 5, col: 1, tag: 'FIELD' });
  for (let i = 0; i < 5; i++) zones.push({ area: 'spells', owner: 'player', index: i, row: 5, col: i + 2, tag: 'S/T' });
  return zones;
})();

const zoneEls = new Map();

function zoneKey(z) {
  return `${z.area}|${z.owner || 'shared'}|${z.index == null ? 0 : z.index}`;
}

function zoneKeyOfInst(inst) {
  if (!inst || !inst.zone) return null;
  return zoneKey(inst.zone);
}

function buildBoard() {
  const board = $('#board');
  if (!board) return;
  board.innerHTML = '';
  zoneEls.clear();
  for (const z of ZONE_LAYOUT) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `zone ${z.area} ${z.owner || 'shared'}`;
    btn.style.gridRow = String(z.row);
    btn.style.gridColumn = String(z.col);
    btn.dataset.zone = zoneKey(z);
    btn.dataset.area = z.area;
    btn.dataset.owner = z.owner || 'shared';
    btn.dataset.index = String(z.index == null ? 0 : z.index);
    btn.addEventListener('click', () => onZoneClick(z));
    board.appendChild(btn);
    zoneEls.set(zoneKey(z), btn);
  }
  const badge = document.createElement('div');
  badge.className = 'board-badge';
  badge.setAttribute('aria-hidden', 'true');
  badge.innerHTML = '<b>24</b><span>ZONES</span>';
  board.appendChild(badge);
}

/* ---------------- card markup ---------------- */
function cardArtStyle(card) {
  return `--art-a:${card.a};--art-b:${card.b}`;
}

function faceUpCardHTML(id, inst) {
  const c = CARD_DB[id];
  if (!c) return '';
  const monster = c.type === 'monster' || c.type === 'extra';
  const atk = inst ? effAtk(inst) : c.atk;
  const def = inst ? effDef(inst) : c.def;
  const boosted = !!(inst && inst.boost > 0);
  const typeTag = c.type === 'extra' ? 'EX' : c.type === 'spell' ? '魔' : c.type === 'trap' ? '罠' : `Lv${c.level}`;
  const pos = inst && monster ? inst.position : null;
  const title = `${c.name}｜${c.desc}`;
  return `<div class="card ${c.type} ${pos || ''} ${boosted ? 'boosted' : ''}" title="${escapeHTML(title)}">
    <div class="art" style="${cardArtStyle(c)}">${c.art}</div>
    <div class="name">${escapeHTML(c.name)}</div>
    <div class="stats">
      <span class="${monster ? 'atk' : 'dash'}">${monster ? atk : '—'}</span>
      <span class="${monster ? 'def' : 'dash'}">${monster ? def : '—'}</span>
    </div>
    <span class="lv">${typeTag}</span>
    ${monster && pos ? `<span class="pos ${pos}">${pos === 'attack' ? '攻' : '守'}</span>` : ''}
  </div>`;
}

function cardVisualHTML(inst) {
  if (inst.faceDown) return `<div class="card back ${inst.owner}"></div>`;
  return faceUpCardHTML(inst.id, inst);
}

function zoneAria(z, inst) {
  const areaName = z.area === 'monsters' ? 'モンスターゾーン'
    : z.area === 'spells' ? '魔法罠ゾーン'
      : z.area === 'field' ? 'フィールドゾーン'
        : 'エクストラモンスターゾーン';
  const ownerName = z.owner === 'player' ? '自分' : z.owner === 'opponent' ? '相手' : '共有';
  if (!inst) return `${ownerName}の${areaName}${z.index != null ? z.index + 1 : ''} 空き`;
  if (inst.faceDown) return `${ownerName}の${areaName} 裏側守備表示`;
  const c = CARD_DB[inst.id];
  if (isMonster(inst)) {
    return `${ownerName}の${areaName} ${c.name} ${inst.position === 'attack' ? '攻撃表示' : '守備表示'} 攻撃力${effAtk(inst)} 守備力${effDef(inst)}`;
  }
  return `${ownerName}の${areaName} ${c.name}`;
}

/* ---------------- renders ---------------- */
function render() {
  if (!state.players) return;
  renderHUD();
  renderBoard();
  renderHand();
  renderDock();
  renderPrompt();
  renderLog();
}

function renderHUD() {
  if (!state.players) return;
  const p = state.players.player;
  const o = state.players.opponent;

  $('#oppLP').textContent = o.lp;
  $('#meLP').textContent = p.lp;
  $('#oppBar').style.width = `${Math.max(0, Math.min(100, (o.lp / 8000) * 100))}%`;
  $('#meBar').style.width = `${Math.max(0, Math.min(100, (p.lp / 8000) * 100))}%`;
  $('#oppHand').textContent = o.hand.length;
  $('#meHand').textContent = p.hand.length;
  $('#oppDeck').textContent = o.deck.length;
  $('#meDeck').textContent = p.deck.length;
  $('#oppGrave').textContent = o.graveyard.length;
  $('#meGrave').textContent = p.graveyard.length;
  $('#oppExtra').textContent = o.extra.length;
  $('#meExtra').textContent = p.extra.length;

  const turnState = state.over ? '決着' : state.active === 'player' ? 'あなたのターン' : '兄のターン';
  $('#turnLabel').textContent = `TURN ${state.turn} · ${turnState}`;
  $('#timer').textContent = formatTime(state.running ? performance.now() - state.timerStart : state.elapsed);
  updateBestDisplays();

  const pill = $('#phasePill');
  pill.className = 'phase-pill';
  if (state.over) {
    pill.textContent = 'DUEL OVER';
    pill.classList.add('gold');
  } else if (state.active === 'opponent') {
    pill.textContent = 'OPPONENT TURN';
    pill.classList.add('opponent');
  } else if (state.mode === 'attackTarget') {
    pill.textContent = 'BATTLE PHASE';
    pill.classList.add('gold');
  } else if (state.mode === 'selectTribute' || state.mode === 'placeMonster' || state.mode === 'placeExtra' || state.mode === 'placeSpell' || state.mode === 'spellTarget') {
    pill.textContent = 'ACTION';
    pill.classList.add('gold');
  } else {
    pill.textContent = 'MAIN PHASE';
  }

  const canEnd = state.started && state.active === 'player' && !state.busy && !state.over;
  $('#endTurnBtn').disabled = !canEnd;
  $('#extraBtn').disabled = !canEnd;
  $('#soundBtn').textContent = state.sound ? '♪' : '×';
  $('#soundBtn').title = state.sound ? 'サウンド ON' : 'サウンド OFF';
  $('#sideSub').textContent = `TURN ${state.turn} / 24 ZONES`;
}

function renderBoard() {
  for (const z of ZONE_LAYOUT) {
    const el = zoneEls.get(zoneKey(z));
    if (!el) continue;
    const inst = getInst(z);
    const target = isTargetable(z);
    const picked = !!(inst && state.mode === 'selectTribute' && state.pending && state.pending.selected.includes(inst.uid));
    const isAttacker = !!(inst && state.mode === 'attackTarget' && state.pending && state.pending.attacker === inst);

    el.classList.toggle('targetable', target);
    el.classList.toggle('tribute-picked', picked);
    el.classList.toggle('attacker', isAttacker);
    el.classList.toggle('empty', !inst);
    el.classList.toggle('has-card', !!inst);

    let html;
    if (!inst) {
      const label = z.area === 'monsters' ? 'M' : z.area === 'spells' ? 'S/T' : z.area === 'field' ? 'FIELD' : 'EX';
      html = `<span class="zone-label">${label}</span>`;
    } else {
      html = cardVisualHTML(inst);
    }
    if (el.innerHTML !== html) el.innerHTML = html;
    el.setAttribute('aria-label', zoneAria(z, inst));
  }
}

function renderHand() {
  const hand = $('#hand');
  const p = state.players.player;
  const canAct = state.active === 'player' && !state.busy && !state.over && state.mode === 'idle';
  if (!p.hand.length) {
    hand.innerHTML = '<span class="dock-hint" style="padding:10px 4px">手札がありません</span>';
    return;
  }
  hand.innerHTML = p.hand.map((id, i) => {
    const c = CARD_DB[id];
    const selected = !!(state.selection && state.selection.source === 'hand' && state.selection.index === i);
    const label = `${c.name}｜${c.desc}${isMonster(id) ? `｜攻撃力${c.atk} 守備力${c.def}` : ''}`;
    return `<button type="button" class="hand-card ${selected ? 'selected' : ''}" data-hand-index="${i}" ${canAct ? '' : 'disabled'} aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${faceUpCardHTML(id)}</button>`;
  }).join('');
  $$('.hand-card', hand).forEach((btn) => {
    btn.addEventListener('click', () => onHandClick(Number(btn.dataset.handIndex)));
  });
}

function renderDock() {
  const dock = $('#actionDock');
  dock.innerHTML = '';
  if (!state.players) return;
  if (state.over) {
    dock.innerHTML = '<span class="dock-hint">決闘終了</span>';
    return;
  }
  if (state.mode !== 'idle') {
    dock.innerHTML = `<span class="dock-hint">${escapeHTML(promptText())}</span>`;
    return;
  }
  if (state.busy) {
    dock.innerHTML = `<span class="dock-hint">${state.active === 'opponent' ? '兄が思考中…' : '処理中…'}</span>`;
    return;
  }

  const p = state.players.player;
  const sel = state.selection;
  if (!sel) {
    dock.innerHTML = '<span class="dock-hint">手札か自分のモンスターを選択</span>';
    return;
  }

  if (sel.source === 'hand') {
    const id = p.hand[sel.index];
    if (!id) { state.selection = null; renderDock(); return; }
    const c = CARD_DB[id];
    const info = document.createElement('div');
    info.className = 'dock-info';
    info.innerHTML = `<b>${escapeHTML(c.name)}</b><span>${dockSubLine(c)}</span>`;
    dock.appendChild(info);

    if (c.type === 'monster' || c.type === 'extra') {
      const need = c.level >= 5 ? 1 : 0;
      const own = allMonsters('player');
      const hasTribute = own.length >= need;
      const placeOK = canPlaceNormal(need);
      const normalOK = !p.hasSummoned && hasTribute && placeOK;
      const btn = addDockButton(`召喚${need ? `（生贄${need}）` : ''}`, 'primary', !normalOK,
        () => beginSummon('hand', id, 'attack', false, sel.index),
        p.hasSummoned ? 'このターンはもう召喚している' : !hasTribute ? '生贄が足りない' : !placeOK ? '空きゾーンがない' : '');
      btn.dataset.action = 'summon';
      const setBtn = addDockButton('裏側セット', '', !normalOK,
        () => beginSummon('hand', id, 'set', false, sel.index), '裏側守備表示でセット');
      setBtn.dataset.action = 'set';
    } else if (c.type === 'spell') {
      const playable = spellPlayable('player', id);
      addDockButton('発動', 'primary', !playable, () => playerActivateSpell(sel.index),
        playable ? '' : '発動条件を満たしていない');
    } else if (c.type === 'trap') {
      const empty = p.spells.some((x) => !x);
      addDockButton('裏側でセット', 'primary', !empty, () => beginTrapSet(sel.index),
        empty ? '' : '魔法・罠ゾーンが空いていない');
    }
    addDockButton('閉じる', 'ghost', false, clearModes);
    return;
  }

  if (sel.source === 'field') {
    const inst = sel.inst;
    if (!inst || !inst.zone) { state.selection = null; renderDock(); return; }
    const c = CARD_DB[inst.id];
    const info = document.createElement('div');
    info.className = 'dock-info';
    const posText = inst.faceDown ? '裏側守備表示' : inst.position === 'attack' ? '攻撃表示' : '守備表示';
    info.innerHTML = `<b>${escapeHTML(c.name)}</b><span>${posText} · <span class="atk">ATK ${effAtk(inst)}</span> / <span class="def">DEF ${effDef(inst)}</span></span>`;
    dock.appendChild(info);

    if (inst.faceDown) {
      addDockButton('リバース召喚', 'primary', inst.changed, () => playerFlipSummon(inst),
        inst.changed ? 'このターンは変更できない' : '攻撃表示でリバース');
    } else if (inst.position === 'attack') {
      addDockButton('攻撃', 'primary', inst.attacked, () => playerStartAttack(inst),
        inst.attacked ? 'このターンは攻撃済み' : '');
      addDockButton('守備に変更', '', inst.changed, () => playerChangePosition(inst, 'defense'),
        inst.changed ? 'このターンは変更済み' : '');
    } else {
      addDockButton('攻撃に変更', 'primary', inst.changed, () => playerChangePosition(inst, 'attack'),
        inst.changed ? 'このターンは変更済み' : '');
    }
    addDockButton('閉じる', 'ghost', false, clearModes);
    return;
  }

  if (sel.source === 'enemy') {
    const inst = sel.inst;
    if (!inst || !inst.zone) { state.selection = null; renderDock(); return; }
    const c = CARD_DB[inst.id];
    const info = document.createElement('div');
    info.className = 'dock-info';
    if (inst.faceDown) {
      info.innerHTML = `<b>裏側守備表示</b><span>正体不明。攻撃するとリバースする。</span>`;
    } else {
      const posText = isMonster(inst) ? (inst.position === 'attack' ? '攻撃表示' : '守備表示') : '';
      info.innerHTML = `<b>${escapeHTML(c.name)}</b><span>${posText}${isMonster(inst) ? ` · <span class="atk">ATK ${effAtk(inst)}</span> / <span class="def">DEF ${effDef(inst)}</span>` : ''}</span>`;
    }
    dock.appendChild(info);
    addDockButton('閉じる', 'ghost', false, clearModes);
    return;
  }

  if (sel.source === 'fieldspell') {
    const inst = sel.inst;
    if (!inst || !inst.zone) { state.selection = null; renderDock(); return; }
    const c = CARD_DB[inst.id];
    const info = document.createElement('div');
    info.className = 'dock-info';
    info.innerHTML = `<b>${escapeHTML(c.name)}</b><span>${escapeHTML(c.desc)}</span>`;
    dock.appendChild(info);
    addDockButton('閉じる', 'ghost', false, clearModes);
  }
}

function dockSubLine(c) {
  if (c.type === 'monster' || c.type === 'extra') {
    return `Lv${c.level} · <span class="atk">ATK ${c.atk}</span> / <span class="def">DEF ${c.def}</span>`;
  }
  return escapeHTML(c.desc);
}

function addDockButton(label, cls, disabled, onClick, title) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `dock-btn ${cls || ''}`.trim();
  btn.textContent = label;
  btn.disabled = !!disabled;
  if (title) btn.title = title;
  if (!disabled) btn.addEventListener('click', () => { sfx('click'); onClick(); });
  $('#actionDock').appendChild(btn);
  return btn;
}

function canPlaceNormal(need) {
  const p = state.players.player;
  const own = allMonsters('player');
  const empty = p.monsters.some((x) => !x);
  const tributeInMonsterZone = own.some((i) => i.zone && i.zone.area === 'monsters' && i.zone.owner === 'player');
  return empty || (need > 0 && tributeInMonsterZone);
}

function promptText() {
  if (state.over) return '決闘終了';
  if (state.mode === 'selectTribute') {
    const p = state.pending;
    return `生贄にするモンスターを選択（${p ? p.selected.length : 0}/${p ? p.need : 0}）`;
  }
  if (state.mode === 'placeMonster') return '召喚するモンスターゾーンを選択';
  if (state.mode === 'placeExtra') return 'エクストラモンスターゾーンを選択';
  if (state.mode === 'placeSpell') return '罠をセットする魔法・罠ゾーンを選択';
  if (state.mode === 'attackTarget') return '攻撃対象のモンスターを選択（またはキャンセル）';
  if (state.mode === 'spellTarget') return '破壊する相手モンスターを選択';
  if (state.busy && state.active === 'opponent') return '兄が思考中…';
  if (state.busy) return '処理中…';
  if (state.active === 'player') return `TURN ${state.turn}：手札か自分のモンスターを選択`;
  return '兄のターン';
}

function renderPrompt() {
  const prompt = $('#prompt');
  const cancel = $('#cancelBtn');
  const warning = state.warnMessage;
  prompt.classList.toggle('warn', !!warning);
  $('#promptText').textContent = warning || promptText();
  const canCancel = !state.over && !state.busy && (state.mode !== 'idle' || !!state.selection);
  cancel.hidden = !canCancel;
}

function renderLog() {
  const log = $('#log');
  if (!log) return;
  log.innerHTML = state.log.map((entry) => `<div class="log-entry ${entry.type}">${escapeHTML(entry.text)}</div>`).join('');
  log.scrollTop = log.scrollHeight;
}

/* ---------------- feedback helpers ---------------- */
function flashLP(sideKey) {
  const lp = sideKey === 'player' ? $('#meLP') : $('#oppLP');
  const hud = sideKey === 'player' ? $('#meHud') : $('#oppHud');
  if (lp) {
    lp.classList.remove('hit');
    void lp.offsetWidth;
    lp.classList.add('hit');
    setTimeout(() => lp.classList.remove('hit'), 620);
  }
  if (hud) {
    hud.classList.remove('hit');
    void hud.offsetWidth;
    hud.classList.add('hit');
    setTimeout(() => hud.classList.remove('hit'), 480);
  }
}

function sparkleLP(sideKey) {
  flashLP(sideKey);
}

function flashZone(inst, cls) {
  const key = zoneKeyOfInst(inst);
  if (!key) return;
  const el = zoneEls.get(key);
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 620);
}

function impactAt(attacker, target) {
  flashZone(attacker, 'zone-flash');
  if (target) flashZone(target, 'zone-flash');
  const shell = $('#boardShell');
  if (shell) {
    shell.classList.remove('shake');
    void shell.offsetWidth;
    shell.classList.add('shake');
    setTimeout(() => shell.classList.remove('shake'), 500);
  }
}

function banner(text, kind) {
  const fx = $('#boardFx');
  if (!fx) return;
  fx.innerHTML = '';
  const el = document.createElement('div');
  el.className = `fx-banner ${kind || ''}`.trim();
  el.textContent = text;
  fx.appendChild(el);
  setTimeout(() => { if (el.parentNode === fx) el.remove(); }, 1220);
}

function taunt(text) {
  const el = $('#oppTaunt');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(state.tauntTimer);
  state.tauntTimer = setTimeout(() => el.classList.remove('show'), 2700);
}

function warnFlash(message) {
  state.warnMessage = message;
  clearTimeout(state.warnTimer);
  renderPrompt();
  state.warnTimer = setTimeout(() => {
    state.warnMessage = null;
    renderPrompt();
  }, 1350);
}

function clearModes() {
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  state.warnMessage = null;
  clearTimeout(state.warnTimer);
  render();
}

/* ---------------- targeting ---------------- */
function isTargetable(z) {
  const mode = state.mode;
  const pending = state.pending;
  const inst = getInst(z);
  if (mode === 'selectTribute') {
    return !!(inst && inst.owner === 'player' && isMonster(inst) && pending && !pending.selected.includes(inst.uid));
  }
  if (mode === 'placeMonster') {
    if (z.area !== 'monsters' || z.owner !== 'player') return false;
    if (!inst) return true;
    return !!(pending && pending.selected.includes(inst.uid));
  }
  if (mode === 'placeExtra') {
    return z.area === 'emz' && !inst;
  }
  if (mode === 'placeSpell') {
    return z.area === 'spells' && z.owner === 'player' && !inst;
  }
  if (mode === 'attackTarget' || mode === 'spellTarget') {
    return !!(inst && inst.owner === 'opponent' && isMonster(inst));
  }
  return false;
}

/* ---------------- board / hand clicks ---------------- */
function onZoneClick(z) {
  if (!state.players || state.over) return;

  if (state.mode === 'selectTribute') {
    const inst = getInst(z);
    if (inst && inst.owner === 'player' && isMonster(inst)) {
      toggleTribute(inst);
    } else {
      warnFlash('自分のモンスターを選択してください');
    }
    return;
  }

  if (state.mode === 'placeMonster' || state.mode === 'placeExtra' || state.mode === 'placeSpell') {
    if (isTargetable(z)) {
      if (state.mode === 'placeSpell') handleTrapPlacement(z);
      else handleSummonPlacement(z);
    } else {
      warnFlash('そこには置けません');
    }
    return;
  }

  if (state.mode === 'attackTarget') {
    const inst = getInst(z);
    if (inst && inst.owner === 'opponent' && isMonster(inst)) {
      confirmPlayerAttack(inst);
    } else {
      warnFlash('相手モンスターを選択してください');
    }
    return;
  }

  if (state.mode === 'spellTarget') {
    const inst = getInst(z);
    if (inst && inst.owner === 'opponent' && isMonster(inst)) {
      confirmPlayerSpellTarget(inst);
    } else {
      warnFlash('相手モンスターを選択してください');
    }
    return;
  }

  if (state.busy || state.active !== 'player' || state.mode !== 'idle') return;

  const inst = getInst(z);
  if (!inst) {
    if (state.selection) { state.selection = null; render(); }
    return;
  }

  if (inst.owner === 'player' && isMonster(inst)) {
    state.selection = { source: 'field', inst };
    sfx('click');
    render();
    return;
  }
  if (inst.owner === 'opponent') {
    state.selection = { source: 'enemy', inst };
    sfx('click');
    render();
    return;
  }
  if (z.area === 'field' && inst.owner === 'player') {
    state.selection = { source: 'fieldspell', inst };
    sfx('click');
    render();
    return;
  }
  if (inst.faceDown) {
    warnFlash('このカードは攻撃された時に自動発動します');
  } else {
    state.selection = { source: 'fieldspell', inst };
    render();
  }
}

function onHandClick(index) {
  if (state.busy || state.over || state.active !== 'player' || state.mode !== 'idle') return;
  if (!state.players.player.hand[index]) return;
  if (state.selection && state.selection.source === 'hand' && state.selection.index === index) {
    state.selection = null;
  } else {
    state.selection = { source: 'hand', index };
    sfx('click');
  }
  render();
}

/* ---------------- summon flow ---------------- */
function beginSummon(source, cardId, position, isExtra, sourceIndex) {
  if (state.busy || state.over || state.active !== 'player' || state.mode !== 'idle') return;
  const p = state.players.player;
  const c = CARD_DB[cardId];
  if (!isExtra && p.hasSummoned) { warnFlash('このターンはもう召喚している'); return; }

  const need = isExtra ? 2 : (c.level >= 5 ? 1 : 0);
  const own = allMonsters('player');
  if (own.length < need) { warnFlash(`生贄が足りない（${need}体必要）`); return; }
  if (isExtra && !state.emz.some((x) => !x)) { warnFlash('EXゾーンが空いていない'); return; }
  if (!isExtra && !canPlaceNormal(need)) { warnFlash('モンスターゾーンが空いていない'); return; }

  state.pending = { kind: 'summon', source, cardId, position, isExtra, sourceIndex, need, selected: [] };
  state.selection = null;
  state.mode = need > 0 ? 'selectTribute' : (isExtra ? 'placeExtra' : 'placeMonster');
  sfx('click');
  render();
}

function toggleTribute(inst) {
  const p = state.pending;
  if (!p) return;
  const idx = p.selected.indexOf(inst.uid);
  if (idx >= 0) {
    p.selected.splice(idx, 1);
  } else {
    if (p.selected.length >= p.need) return;
    p.selected.push(inst.uid);
  }
  if (p.selected.length === p.need) {
    state.mode = p.isExtra ? 'placeExtra' : 'placeMonster';
  }
  sfx('click');
  render();
}

async function handleSummonPlacement(z) {
  const p = state.pending;
  if (!p) return;
  const gen = state.gameId;
  const tributes = p.selected.map(findInstByUid).filter(Boolean);
  const zone = p.isExtra
    ? { area: 'emz', index: z.index }
    : { area: 'monsters', owner: 'player', index: z.index };

  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  state.busy = true;
  render();

  await summonMonster('player', {
    cardId: p.cardId,
    isExtra: p.isExtra,
    handIndex: p.isExtra ? undefined : p.sourceIndex,
    extraIndex: p.isExtra ? p.sourceIndex : undefined,
    position: p.position,
    zone,
    tributes
  });

  if (gen !== state.gameId) return;
  if (state.over) return;
  state.busy = false;
  render();
}

function beginTrapSet(handIndex) {
  const p = state.players.player;
  const id = p.hand[handIndex];
  if (!id) return;
  if (!p.spells.some((x) => !x)) { warnFlash('魔法・罠ゾーンが空いていない'); return; }
  state.pending = { kind: 'trap', sourceIndex: handIndex };
  state.selection = null;
  state.mode = 'placeSpell';
  sfx('click');
  render();
}

function handleTrapPlacement(z) {
  const p = state.pending;
  if (!p) return;
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  setTrap('player', p.sourceIndex, z.index);
  render();
}

/* ---------------- player actions ---------------- */
async function playerFlipSummon(inst) {
  if (state.busy || state.over || !inst || !inst.faceDown || inst.changed) return;
  const gen = state.gameId;
  state.busy = true;
  state.selection = null;
  render();
  flipInst(inst, 'summon');
  inst.changed = true;
  render();
  await sleep(430);
  if (gen !== state.gameId || state.over) return;
  state.busy = false;
  render();
}

function playerChangePosition(inst, position) {
  if (state.busy || state.over || !inst || !inst.zone || inst.faceDown || inst.changed) return;
  inst.position = position;
  inst.changed = true;
  addLog('player', `${CARD_DB[inst.id].name}を${position === 'attack' ? '攻撃' : '守備'}表示に変更した`, 'player');
  sfx('flip');
  state.selection = null;
  render();
}

function playerStartAttack(inst) {
  if (state.busy || state.over || !inst || !inst.zone || inst.faceDown || inst.position !== 'attack' || inst.attacked) return;
  const enemies = allMonsters('opponent');
  if (!enemies.length) {
    executePlayerAttack(inst, null);
    return;
  }
  state.mode = 'attackTarget';
  state.pending = { kind: 'attack', attacker: inst };
  state.selection = null;
  sfx('click');
  render();
}

function confirmPlayerAttack(target) {
  const p = state.pending;
  if (!p || !p.attacker) return;
  executePlayerAttack(p.attacker, target);
}

function executePlayerAttack(attacker, target) {
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  const gen = state.gameId;
  performAttack(attacker, target).then(() => {
    if (gen === state.gameId && !state.over) render();
  });
}

function playerActivateSpell(handIndex) {
  const p = state.players.player;
  const id = p.hand[handIndex];
  if (!id) return;
  const c = CARD_DB[id];
  if (!spellPlayable('player', id)) { warnFlash('発動条件を満たしていない'); return; }
  if (c.target === 'enemyMonster') {
    if (!allMonsters('opponent').length) { warnFlash('対象のモンスターがいない'); return; }
    state.mode = 'spellTarget';
    state.pending = { kind: 'spell', handIndex, id };
    state.selection = null;
    sfx('click');
    render();
    return;
  }
  executePlayerSpell(handIndex, null);
}

function confirmPlayerSpellTarget(target) {
  const p = state.pending;
  if (!p) return;
  executePlayerSpell(p.handIndex, target);
}

async function executePlayerSpell(handIndex, target) {
  const gen = state.gameId;
  state.mode = 'idle';
  state.pending = null;
  state.selection = null;
  state.busy = true;
  render();
  await castSpell('player', handIndex, target, gen);
  if (gen !== state.gameId || state.over) return;
  state.busy = false;
  render();
}
