/* LP→0 — UI controller: input, rendering, animation, sound, flow. */

import { ATTRIBUTES, getCard } from './cards.js';
import * as engine from './engine.js';
import { nextAiAction } from './ai.js';
import { cardArt, cardBack, avatarArt } from './art.js';
import { audio } from './audio.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const els = {
  app: $('#app'),
  title: $('#titleScreen'),
  result: $('#resultScreen'),
  resultTitle: $('#resultTitle'),
  resultKicker: $('#resultKicker'),
  resultSub: $('#resultSub'),
  resultTurns: $('#resultTurns'),
  resultLp: $('#resultLp'),
  resultDamage: $('#resultDamage'),
  board: $('#board'),
  hand: $('#hand'),
  actions: $('#actions'),
  hint: $('#hint'),
  hintText: $('#hintText'),
  inspect: $('#inspect'),
  inspectEmpty: $('#inspectEmpty'),
  inspectBody: $('#inspectBody'),
  logList: $('#logList'),
  logModal: $('#logModal'),
  logListModal: $('#logListModal'),
  rulesModal: $('#rulesModal'),
  banner: $('#banner'),
  toast: $('#toast'),
  fx: $('#fxLayer'),
  turnChip: $('#turnChip'),
  orbTurn: $('#orbTurn'),
  orbLabel: $('#orbLabel'),
  handCount: $('#handCount'),
  statSummon: $('#statSummon'),
  statTrap: $('#statTrap'),
  statPhase: $('#statPhase'),
  playerPlate: $('#playerPlate'),
  enemyPlate: $('#enemyPlate'),
  playerLp: $('#playerLp'),
  enemyLp: $('#enemyLp'),
  playerLpFill: $('#playerLpFill'),
  enemyLpFill: $('#enemyLpFill'),
  playerLpBar: $('#playerLpBar'),
  enemyLpBar: $('#enemyLpBar'),
  playerHand: $('#playerHand'),
  enemyHand: $('#enemyHand'),
  playerDeck: $('#playerDeck'),
  enemyDeck: $('#enemyDeck'),
  playerGrave: $('#playerGrave'),
  enemyGrave: $('#enemyGrave'),
  btnSound: $('#btnSound'),
  btnRules: $('#btnRules'),
  btnLog: $('#btnLog'),
  btnStart: $('#btnStart'),
  btnRulesTitle: $('#btnRulesTitle'),
  btnSoundTitle: $('#btnSoundTitle'),
  btnRematch: $('#btnRematch'),
  btnTitle: $('#btnTitle'),
  cardDetail: $('#cardDetail'),
  cardDetailBody: $('#cardDetailBody'),
  cardDetailClose: $('#cardDetailClose'),
};

const ZONE_NUMBERS = {
  'ai-spell': [1, 2, 3, 4, 5, 6],
  'ai-monster': [7, 8, 9, 10, 11, 12],
  'player-monster': [13, 14, 15, 16, 17, 18],
  'player-spell': [19, 20, 21, 22, 23, 24],
};

const artCache = new Map();
const avatarCache = new Map();
const backMarkup = cardBack();

let game = null;
let selection = null;
let hoverRef = null;
let inspectPin = null;
let detailDismissedRef = null;
let busy = false;
let toastTimer = null;
let dealHandNext = false;

/* ── helpers ─────────────────────────────────────────────────── */

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function artFor(def) {
  if (!artCache.has(def.id)) artCache.set(def.id, cardArt(def));
  return artCache.get(def.id);
}

function avatarFor(side) {
  if (!avatarCache.has(side)) avatarCache.set(side, avatarArt(side));
  return avatarCache.get(side);
}

function sideIs(side) { return side === 'player' ? 'player' : 'ai'; }
function player() { return game.players.player; }
function rival() { return game.players.ai; }

function padTurn(turn) { return String(turn || 0).padStart(2, '0'); }

function cardDef(inst) { return inst ? getCard(inst.defId) : null; }

function clearSelection() {
  selection = null;
  hoverRef = null;
  inspectPin = null;
  detailDismissedRef = null;
  if (game) renderAll();
}

function readDisplayedLp(side) {
  const text = side === 'player' ? els.playerLp.textContent : els.enemyLp.textContent;
  return Number(String(text).replace(/[^\d]/g, '')) || 0;
}

/* ── card rendering ──────────────────────────────────────────── */

function keywordsFor(def) {
  const list = [];
  const passive = def.passive || {};
  if (passive.pierce) list.push(['PIERCE', '貫通']);
  if (passive.shielded) list.push(['SHIELD', '戦闘ダメージ無効']);
  if (passive.taunt) list.push(['TAUNT', '挑発']);
  if (passive.lifesteal) list.push(['DRAIN', '与ダメ回復']);
  if (def.effects?.some((e) => e.on === 'summon')) list.push(['ON SUMMON', '召喚時効果']);
  if (def.effects?.some((e) => e.on === 'destroyed')) list.push(['ON DESTROY', '破壊時効果']);
  return list;
}

function cardMarkup(inst, options = {}) {
  const { context = 'hand', faceDown = false, selected = false, stateClass = '' } = options;
  const def = cardDef(inst);
  if (!def) return '';
  const attr = ATTRIBUTES[def.attribute] || ATTRIBUTES.void;
  const isMonster = def.type === 'monster';
  const atk = isMonster ? engine.effectiveAtk(inst) : null;
  const dfn = isMonster ? engine.effectiveDef(inst) : null;
  const level = isMonster ? '★'.repeat(Math.min(def.level, 8)) : '';
  const baseClass = `card card--${context} attr-${def.attribute} rarity-${def.rarity || 1}${selected ? ' selected' : ''}${stateClass ? ` ${stateClass}` : ''}`;
  const uidAttr = `data-uid="${inst.uid}"`;

  if (faceDown) {
    return `<div class="${baseClass} card--back" ${uidAttr}>
      ${backMarkup}
      <div class="position-badge def" title="裏守備">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.4 9.6 3v3.2c0 2-1.4 3.5-3.6 4.3-2.2-.8-3.6-2.3-3.6-4.3V3Z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>
      </div>
    </div>`;
  }

  const positionBadge = context === 'board' && isMonster
    ? `<div class="position-badge ${inst.position === 'attack' ? 'atk' : 'def'}" title="${inst.position === 'attack' ? '攻撃表示' : '守備表示'}">
        ${inst.position === 'attack'
          ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M9.8 1.4 6.1 5.1 4.9 3.9 4 4.8l2.2 2.2 4.6-4.6Z" fill="currentColor"/><path d="M4.3 6.6 1.4 9.5l1.1 1.1 2.9-2.9Z" fill="currentColor"/></svg>'
          : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.4 9.6 3v3.2c0 2-1.4 3.5-3.6 4.3-2.2-.8-3.6-2.3-3.6-4.3V3Z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>'}
      </div>`
    : '';

  const kw = keywordsFor(def);
  const effectBadge = context === 'board' && kw.length
    ? `<div class="effect-badge">${kw[0][0]}</div>`
    : '';

  const stats = isMonster
    ? `<div class="card-stats">
        <span class="atk${inst.atkMod > 0 ? ' buff' : ''}">ATK<b>${atk}</b></span>
        <span class="def">DEF<b>${dfn}</b></span>
      </div>`
    : `<div class="card-stats">
        <span class="card-kind">${def.type === 'spell' ? 'SPELL' : 'TRAP'}</span>
        <span>${attr.label}</span>
      </div>`;

  return `<div class="${baseClass}" ${uidAttr}>
    <div class="card-inner">
      <div class="card-art">${artFor(def)}</div>
      <div class="card-top">
        <span class="card-name">${esc(def.name)}</span>
        <span class="card-level">${level}</span>
      </div>
      <div class="card-type">${def.type === 'monster' ? 'MONSTER' : def.type === 'spell' ? 'SPELL' : 'TRAP'}<span>${attr.label}</span></div>
      <div class="card-text">${esc(def.text || '')}</div>
      ${stats}
      <div class="card-holo"></div>
    </div>
    ${positionBadge}
    ${effectBadge}
  </div>`;
}

/* ── board rendering ─────────────────────────────────────────── */

function legalContext() {
  const ctx = {
    summonZones: [], trapZones: [], spellTargets: [], spellTargetsAlly: [],
    attackTargets: [], direct: false, attacker: null,
  };
  if (!game || busy) return ctx;
  if (selection?.type === 'hand') {
    const inst = player().hand[selection.index];
    const def = cardDef(inst);
    if (!def) return ctx;
    if (def.type === 'monster' && !player().summoned) {
      ctx.summonZones = engine.legalSummonZones(game, 'player');
    }
    if (def.type === 'trap' && !player().setTrap) {
      ctx.trapZones = engine.legalTrapZones(game, 'player');
    }
    if (def.type === 'spell') {
      const targets = engine.legalSpellTargets(game, 'player', selection.index);
      if (def.target === 'enemy') ctx.spellTargets = targets;
      if (def.target === 'own') ctx.spellTargetsAlly = targets;
    }
  }
  if (selection?.type === 'attacker') {
    const legal = engine.legalAttackTargets(game, 'player', selection.index);
    if (legal.ok) {
      ctx.attackTargets = legal.indexes;
      ctx.direct = legal.direct;
      ctx.attacker = selection.index;
    }
  }
  return ctx;
}

function renderBoard() {
  if (!game) return;
  const ctx = legalContext();
  const mode = selection?.type === 'hand' && selection.mode === 'set' ? 'SET' : 'SUMMON';
  const playerTurn = game.active === 'player' && !game.winner;
  const rows = [
    ['ai', 'spell'], ['ai', 'monster'], ['player', 'monster'], ['player', 'spell'],
  ];

  for (const [side, row] of rows) {
    const rowEl = $(`#row-${side}-${row}`);
    if (!rowEl) continue;
    const list = side === 'player' ? player()[row] : rival()[row];
    const numbers = ZONE_NUMBERS[`${side}-${row}`];
    rowEl.innerHTML = list.map((inst, index) => {
      const zoneNumber = String(numbers[index]).padStart(2, '0');
      let classes = 'zone';
      let word = '';
      if (inst) classes += ' zone--filled';

      if (!inst) {
        if (side === 'player' && row === 'monster' && ctx.summonZones.includes(index)) {
          classes += ' legal';
          word = playerTurn ? mode : 'SUMMON';
        }
        if (side === 'player' && row === 'spell' && ctx.trapZones.includes(index)) {
          classes += ' legal legal--magenta';
          word = 'SET TRAP';
        }
      }

      if (inst && side === 'ai' && row === 'monster' && ctx.attackTargets.includes(index)) {
        classes += ' target';
        word = 'TARGET';
      }
      if (inst && side === 'player' && row === 'monster' && ctx.spellTargetsAlly.includes(index)) {
        classes += ' legal';
        word = 'TARGET';
      }
      if (inst && side === 'player' && row === 'monster' && ctx.attacker === index) {
        classes += ' attack-source';
      }

      let cardClass = '';
      if (inst && side === 'ai' && row === 'monster' && ctx.attackTargets.includes(index)) cardClass = 'target-card';
      if (inst && selection?.type === 'attacker' && side === 'player' && row === 'monster' && selection.index === index) cardClass = 'selected';

      const card = inst ? cardMarkup(inst, {
        context: 'board',
        faceDown: inst.faceDown,
        selected: Boolean(cardClass === 'selected'),
        stateClass: `${cardClass === 'target-card' ? 'target-card' : ''}${game.active === 'player' && inst.faceDown ? '' : ''}`,
      }) : '';

      const interactive = Boolean(inst) || classes.includes('legal') || classes.includes('target');
      return `<div class="${classes}" data-side="${side}" data-row="${row}" data-index="${index}"
        ${interactive ? 'role="button" tabindex="0"' : 'role="group"'}
        aria-label="${side === 'player' ? '自分' : '相手'}の${row === 'monster' ? 'モンスター' : '罠'}ゾーン ${numbers[index]}${inst ? ` ${cardDef(inst).name}` : ''}">
        <span class="zone-num">${zoneNumber}</span>
        <span class="zone-word">${word}</span>
        ${card}
      </div>`;
    }).join('');
  }

  els.enemyPlate.classList.toggle('direct-target', ctx.direct);
  els.enemyPlate.setAttribute('aria-label', ctx.direct ? '相手にダイレクトアタック' : '対戦相手');
}

/* ── hand rendering ──────────────────────────────────────────── */

function renderHand() {
  if (!game) return;
  const hand = player().hand;
  const previousScroll = els.hand.scrollLeft;
  if (!hand.length) {
    els.hand.innerHTML = '<div class="hand-empty">手札は空です — 次のドローを待とう。</div>';
  } else {
    els.hand.innerHTML = hand.map((inst, index) => {
      const selected = selection?.type === 'hand' && selection.index === index;
      const inner = cardMarkup(inst, { context: 'hand', selected });
      return inner.replace('<div class="card ', `<div data-hand-index="${index}" style="--i:${index}" class="card `);
    }).join('');
    if (dealHandNext) {
      $$('.card--hand', els.hand).forEach((card, index) => {
        card.classList.add('deal-in');
        card.style.animationDelay = `${index * 55}ms`;
      });
    }
  }
  els.handCount.textContent = hand.length;
  requestAnimationFrame(() => { els.hand.scrollLeft = previousScroll; });
}

/* ── actions / hint ──────────────────────────────────────────── */

function canDirect() {
  if (selection?.type !== 'attacker') return false;
  const legal = engine.legalAttackTargets(game, 'player', selection.index);
  return legal.ok && legal.direct;
}

function renderActions() {
  if (!game) { els.actions.innerHTML = ''; return; }
  const buttons = [];
  const locked = busy || game.winner || game.active !== 'player';

  if (!locked && selection?.type === 'hand') {
    const inst = player().hand[selection.index];
    const def = cardDef(inst);
    if (!def) { selection = null; }
    else if (def.type === 'monster') {
      const used = player().summoned;
      buttons.push(`<div class="actions-row">
        <button class="actbtn ${selection.mode === 'summon' ? 'actbtn--primary' : ''}" data-act="mode-summon" ${used ? 'disabled' : ''}>召喚<span>ATTACK</span></button>
        <button class="actbtn ${selection.mode === 'set' ? 'actbtn--gold' : ''}" data-act="mode-set" ${used ? 'disabled' : ''}>セット<span>DEFENSE</span></button>
      </div>`);
      if (used) buttons.push('<span class="action-note">召喚権は使用済み</span>');
      buttons.push('<button class="actbtn" data-act="cancel">キャンセル<span>CANCEL</span></button>');
    } else if (def.type === 'trap') {
      buttons.push('<span class="action-note">空き罠ゾーンを選択</span>');
      buttons.push('<button class="actbtn" data-act="cancel">キャンセル<span>CANCEL</span></button>');
    } else {
      const targets = def.target ? engine.legalSpellTargets(game, 'player', selection.index) : [];
      const needsTarget = Boolean(def.target);
      buttons.push(`<button class="actbtn actbtn--primary" data-act="cast" ${needsTarget && !targets.length ? 'disabled' : ''}>発動<span>ACTIVATE</span></button>`);
      buttons.push('<button class="actbtn" data-act="cancel">キャンセル<span>CANCEL</span></button>');
    }
  } else if (!locked && selection?.type === 'attacker') {
    if (canDirect()) {
      buttons.push('<button class="actbtn actbtn--danger" data-act="attack-direct">ダイレクトアタック<span>ATTACK</span></button>');
    }
    if (engine.canSwitchPosition(game, 'player', selection.index)) {
      const inst = player().monster[selection.index];
      const next = inst?.position === 'attack' ? '守備に変更' : '攻撃に変更';
      buttons.push(`<button class="actbtn" data-act="switch">${next}<span>POSITION</span></button>`);
    }
    buttons.push('<button class="actbtn" data-act="cancel">キャンセル<span>CANCEL</span></button>');
  } else if (!locked && selection?.type === 'ownMonster') {
    if (engine.canSwitchPosition(game, 'player', selection.index)) {
      const inst = player().monster[selection.index];
      const label = inst?.faceDown ? '反転召喚' : inst?.position === 'attack' ? '守備に変更' : '攻撃に変更';
      buttons.push(`<button class="actbtn actbtn--gold" data-act="switch">${label}<span>POSITION</span></button>`);
    }
    buttons.push('<button class="actbtn" data-act="cancel">キャンセル<span>CANCEL</span></button>');
  } else if (!locked) {
    buttons.push('<span class="action-note">手札か自分のモンスターを選択</span>');
  } else if (game.active === 'ai' && !game.winner) {
    buttons.push('<span class="action-note thinking">相手のターン — 自動で進行中</span>');
  }

  buttons.push(`<button class="actbtn actbtn--end" data-act="end" ${locked ? 'disabled' : ''}>ターン終了<span>END TURN</span></button>`);
  els.actions.innerHTML = buttons.join('');
}

function renderHint() {
  if (!game) return;
  let text = '手札からカードを選択してデュエルを進めよう。';
  let warn = false;

  if (busy && game.active === 'ai') {
    text = '相手がカードを選んでいる… 罠は自動で発動する。';
  } else if (game.winner) {
    text = game.winner === 'player' ? '決着 — 相手のLPを0にした。' : '決着 — あなたのLPが0になった。';
  } else if (game.active === 'ai') {
    text = '相手のターン。攻撃に備えよう。';
  } else if (selection?.type === 'hand') {
    const inst = player().hand[selection.index];
    const def = cardDef(inst);
    if (def?.type === 'monster') {
      if (player().summoned) {
        text = 'このターンの召喚権は使用済み。位置変更か攻撃を選ぼう。';
        warn = true;
      } else {
        text = `「${def.name}」を${selection.mode === 'set' ? '裏守備でセット' : '攻撃表示で召喚'}する空きゾーンを選択。`;
      }
    } else if (def?.type === 'trap') {
      text = player().setTrap ? 'このターンの罠セットは使用済み。' : '罠をセットする空きアークナゾーンを選択。';
      warn = player().setTrap;
    } else if (def) {
      if (def.target) {
        const targets = engine.legalSpellTargets(game, 'player', selection.index);
        text = targets.length ? `「${def.name}」の対象を盤面から選択。` : '対象となるモンスターがいない。';
        warn = !targets.length;
      } else {
        text = `「${def.name}」を発動するには右のACTIVATEを押そう。`;
      }
    }
  } else if (selection?.type === 'attacker') {
    const legal = engine.legalAttackTargets(game, 'player', selection.index);
    if (legal.direct) text = '相手モンスターはいない — ダイレクトアタック可能。';
    else if (legal.forced === 'taunt') text = '挑発モンスターが攻撃対象を強制している。';
    else text = '攻撃対象のモンスターを選択。';
  } else if (selection?.type === 'ownMonster') {
    text = 'このモンスターの表示形式を変更できる。';
  } else if (game.turn === 1) {
    text = '先攻1ターン目は攻撃できない。盤面を整えよう。';
  }

  els.hintText.textContent = text;
  els.hint.classList.toggle('warn', warn);
}

/* ── plates / meta / log / inspect ───────────────────────────── */

function setLpVisual(side, value, flash = false) {
  const isPlayer = side === 'player';
  const lpEl = isPlayer ? els.playerLp : els.enemyLp;
  const fillEl = isPlayer ? els.playerLpFill : els.enemyLpFill;
  const barEl = isPlayer ? els.playerLpBar : els.enemyLpBar;
  const clamped = Math.max(0, Math.min(engine.START_LP, Math.round(value)));
  lpEl.textContent = String(clamped);
  const pct = (clamped / engine.START_LP) * 100;
  fillEl.style.width = `${pct}%`;
  fillEl.classList.toggle('low', clamped <= 2000);
  barEl.setAttribute('aria-valuenow', String(clamped));
  if (flash) {
    lpEl.classList.remove('hit');
    void lpEl.offsetWidth;
    lpEl.classList.add('hit');
    setTimeout(() => lpEl.classList.remove('hit'), 600);
  }
}

function renderPlates() {
  setLpVisual('player', player().lp);
  setLpVisual('ai', rival().lp);
  els.playerHand.textContent = player().hand.length;
  els.enemyHand.textContent = rival().hand.length;
  els.playerDeck.textContent = player().deck.length;
  els.enemyDeck.textContent = rival().deck.length;
  els.playerGrave.textContent = player().grave.length;
  els.enemyGrave.textContent = rival().grave.length;
  els.playerPlate.classList.toggle('active', game.active === 'player' && !game.winner);
  els.enemyPlate.classList.toggle('active', game.active === 'ai' && !game.winner);
}

function renderMeta() {
  els.turnChip.textContent = `TURN ${padTurn(game.turn)}`;
  els.orbTurn.textContent = padTurn(game.turn);
  const yours = game.active === 'player';
  els.orbLabel.textContent = game.winner ? 'DUEL END' : yours ? 'YOUR TURN' : 'ENEMY TURN';
  $('.orb-core', els.board).classList.toggle('enemy', !yours);
  els.statSummon.querySelector('b').textContent = `${player().summoned ? 1 : 0} / 1`;
  els.statSummon.classList.toggle('used', player().summoned);
  els.statTrap.querySelector('b').textContent = `${player().setTrap ? 1 : 0} / 1`;
  els.statTrap.classList.toggle('used', player().setTrap);
  els.statPhase.querySelector('b').textContent = game.winner ? 'DUEL END' : yours ? 'MAIN / BATTLE' : 'ENEMY';
}

function renderLog() {
  if (!game) return;
  const entries = game.log.slice(-18).map((entry) => (
    `<div class="logentry" data-tone="${entry.tone || 'neutral'}">${esc(entry.text)}</div>`
  )).join('');
  els.logList.innerHTML = entries;
  requestAnimationFrame(() => { els.logList.scrollTop = els.logList.scrollHeight; });

  if (!els.logModal.hidden) {
    els.logListModal.innerHTML = game.log.slice(-60).map((entry) => (
      `<div class="logentry" data-tone="${entry.tone || 'neutral'}">${esc(entry.text)}</div>`
    )).join('');
    requestAnimationFrame(() => { els.logListModal.scrollTop = els.logListModal.scrollHeight; });
  }
}

function currentInspectRef() {
  if (hoverRef) return hoverRef;
  if (inspectPin) return inspectPin;
  if (selection?.type === 'hand') return { kind: 'hand', index: selection.index };
  if (selection?.type === 'attacker' || selection?.type === 'ownMonster') {
    return { kind: 'board', side: 'player', row: 'monster', index: selection.index };
  }
  return null;
}

function refKey(ref) {
  if (!ref) return '';
  return ref.kind === 'hand'
    ? `hand:${ref.index}`
    : `board:${ref.side}:${ref.row}:${ref.index}`;
}

function detailCardMarkup(inst, faceDown, position) {
  if (!inst) return '';
  if (faceDown) {
    return `
      <div class="cd-head">
        <div class="cd-swatch card--back">${backMarkup}</div>
        <div class="cd-copy">
          <div class="cd-type">SET CARD · HIDDEN</div>
          <div class="cd-name">裏側表示</div>
          <div class="cd-jp">${position === 'set' ? 'TRAP / SET' : 'MONSTER / SET'}</div>
        </div>
      </div>
      <p class="cd-text">相手からは正体が見えない。攻撃された時、または反転召喚で表になる。</p>`;
  }

  const def = cardDef(inst);
  if (!def) return '';
  const attr = ATTRIBUTES[def.attribute] || ATTRIBUTES.void;
  const isMonster = def.type === 'monster';
  const typeLabel = def.type === 'monster' ? 'MONSTER' : def.type === 'spell' ? 'SPELL' : 'TRAP';
  const stats = isMonster
    ? `<div class="cd-stats"><span>ATK <b>${engine.effectiveAtk(inst)}</b></span><span class="def">DEF <b>${engine.effectiveDef(inst)}</b></span></div>`
    : `<div class="cd-stats"><span>${def.type === 'spell' ? 'SPELL' : 'TRAP'}</span><span>${attr.label}</span></div>`;
  return `
    <div class="cd-head">
      <div class="cd-swatch attr-${def.attribute}">${artFor(def)}</div>
      <div class="cd-copy">
        <div class="cd-type">${typeLabel} · ${attr.label}</div>
        <div class="cd-name">${esc(def.name)}</div>
        <div class="cd-jp">${esc(def.jp)}</div>
        ${stats}
      </div>
    </div>
    <p class="cd-text">${esc(def.text || '')}</p>`;
}

function renderCardDetail(ref, inst, faceDown, position) {
  if (!inst || detailDismissedRef === refKey(ref)) {
    els.cardDetail.hidden = true;
    els.cardDetailBody.innerHTML = '';
    return;
  }
  els.cardDetail.hidden = false;
  els.cardDetailBody.innerHTML = detailCardMarkup(inst, faceDown, position);
}

function renderInspect() {
  const ref = currentInspectRef();
  let inst = null;
  let faceDown = false;
  let position = null;
  if (ref && game) {
    if (ref.kind === 'hand') {
      inst = player().hand[ref.index];
    } else if (ref.kind === 'board') {
      inst = game.players[ref.side]?.[ref.row]?.[ref.index];
      faceDown = Boolean(inst?.faceDown);
      position = inst?.position;
    }
  }
  renderCardDetail(ref, inst, faceDown, position);
  if (!inst) {
    els.inspectEmpty.hidden = false;
    els.inspectBody.hidden = true;
    els.inspectBody.innerHTML = '';
    return;
  }
  els.inspectEmpty.hidden = true;
  els.inspectBody.hidden = false;

  if (faceDown) {
    els.inspectBody.innerHTML = `
      <div class="inspect-card card--back">${backMarkup}</div>
      <div class="inspect-name">裏側表示</div>
      <div class="inspect-jp">SET CARD</div>
      <div class="inspect-type"><span>${position === 'set' ? 'TRAP / SET' : 'MONSTER / SET'}</span><span>HIDDEN</span></div>
      <p class="inspect-text">相手からは正体が見えない。攻撃された時、または反転召喚で表になる。</p>`;
    return;
  }

  const def = cardDef(inst);
  const attr = ATTRIBUTES[def.attribute] || ATTRIBUTES.void;
  const kw = keywordsFor(def);
  const isMonster = def.type === 'monster';
  const level = isMonster ? `LV ${def.level}` : def.type.toUpperCase();
  els.inspectBody.innerHTML = `
    <div class="inspect-card attr-${def.attribute}">
      <div class="inspect-card-art">${artFor(def)}</div>
      <div class="inspect-card-shade"></div>
      <div class="inspect-card-tag">${def.type === 'monster' ? 'MONSTER' : def.type === 'spell' ? 'SPELL' : 'TRAP'} · ${attr.label}</div>
    </div>
    <div class="inspect-name">${esc(def.name)}</div>
    <div class="inspect-jp">${esc(def.jp)}</div>
    <div class="inspect-type"><span>${level}${isMonster ? ` · ${attr.jp}` : ''}</span><span>${attr.label}</span></div>
    ${isMonster ? `<div class="inspect-stats">
      <span class="atk">ATK<b>${engine.effectiveAtk(inst)}</b></span>
      <span class="def">DEF<b>${engine.effectiveDef(inst)}</b></span>
    </div>` : ''}
    <p class="inspect-text">${esc(def.text || '')}</p>
    ${kw.length ? `<div class="inspect-keywords">${kw.map(([en, jp]) => `<span class="kw${['SHIELD', 'TAUNT', 'PIERCE', 'DRAIN'].includes(en) ? '' : ' kw--gold'}">${en} · ${jp}</span>`).join('')}</div>` : ''}
  `;
}

/* ── full render ─────────────────────────────────────────────── */

function validateSelection() {
  if (!selection || !game) return;
  if (selection.type === 'hand') {
    if (!player().hand[selection.index]) selection = null;
  } else if (selection.type === 'attacker' || selection.type === 'ownMonster') {
    if (!player().monster[selection.index]) selection = null;
  }
}

function renderAll() {
  if (!game) return;
  validateSelection();
  renderPlates();
  renderBoard();
  renderHand();
  renderActions();
  renderHint();
  renderLog();
  renderInspect();
  renderMeta();
}

/* ── FX ──────────────────────────────────────────────────────── */

function rectCenter(target) {
  const rect = target.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
}

function plateCenter(side) {
  return rectCenter(side === 'player' ? els.playerPlate : els.enemyPlate);
}

function spawnSparks(x, y, color, count = 12, spread = 64) {
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark', color);
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * spread;
    spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    spark.style.animationDelay = `${Math.random() * 80}ms`;
    els.fx.appendChild(spark);
    setTimeout(() => spark.remove(), 850);
  }
}

function impactRing(x, y, color) {
  const ring = document.createElement('span');
  ring.className = 'impact-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.setProperty('--impact', color);
  els.fx.appendChild(ring);
  setTimeout(() => ring.remove(), 620);
}

function floatText(text, x, y, cls = '') {
  const el = document.createElement('span');
  el.className = `floatnum ${cls}`.trim();
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  els.fx.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function shakeScreen() {
  els.app.classList.remove('shake');
  void els.app.offsetWidth;
  els.app.classList.add('shake');
  setTimeout(() => els.app.classList.remove('shake'), 380);
}

function zoneElement(side, row, index) {
  return $(`.zone[data-side="${side}"][data-row="${row}"][data-index="${index}"]`);
}

function zoneCardElement(side, row, index) {
  return zoneElement(side, row, index)?.querySelector('.card');
}

function pulseDeck(side) {
  const el = side === 'player' ? els.playerDeck : els.enemyDeck;
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 520);
}

function flashZone(side, row, index, color) {
  const zone = zoneElement(side, row, index);
  if (!zone) return false;
  const { x, y } = rectCenter(zone);
  impactRing(x, y, color);
  spawnSparks(x, y, color, 8, 40);
  return true;
}

function shatterCard(side, row, index) {
  const card = zoneCardElement(side, row, index);
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const ghost = card.cloneNode(true);
  ghost.classList.add('ghost-card');
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.setProperty('--rot', `${(Math.random() * 14 - 7).toFixed(1)}deg`);
  els.fx.appendChild(ghost);
  spawnSparks(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ff8b98', 14, 70);
  setTimeout(() => ghost.remove(), 650);
}

function showCast(ev, kind = 'SPELL') {
  const { x, y } = rectCenter(els.board);
  const wrap = document.createElement('div');
  wrap.className = `cast-callout cast-callout--${kind.toLowerCase()}`;
  wrap.style.left = `${x}px`;
  wrap.style.top = `${y}px`;
  wrap.innerHTML = `
    <span class="cast-kind">${kind}</span>
    <b>${esc(ev.name || '')}</b>
    <i>${esc(ev.jp || '')}</i>`;
  els.fx.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1100);
}

function showBanner(text, side = '', duration = 1450) {
  els.banner.textContent = text;
  els.banner.classList.remove('show', 'enemy');
  if (side === 'ai') els.banner.classList.add('enemy');
  els.banner.style.animationDuration = `${duration}ms`;
  void els.banner.offsetWidth;
  els.banner.classList.add('show');
  clearTimeout(showBanner.timer);
  showBanner.timer = setTimeout(() => els.banner.classList.remove('show'), duration + 80);
}

async function animateAttack(ev) {
  const attacker = zoneCardElement(ev.side, 'monster', ev.attackerIndex);
  const targetEl = ev.direct
    ? (ev.side === 'player' ? els.enemyPlate : els.playerPlate)
    : zoneCardElement(ev.side === 'player' ? 'ai' : 'player', 'monster', ev.targetIndex);
  audio.play('attack');
  if (attacker) {
    const a = rectCenter(attacker);
    const t = targetEl ? rectCenter(targetEl) : plateCenter(ev.side === 'player' ? 'ai' : 'player');
    attacker.style.setProperty('--dx', `${(t.x - a.x) * 0.78}px`);
    attacker.style.setProperty('--dy', `${(t.y - a.y) * 0.78}px`);
    attacker.classList.remove('lunge');
    void attacker.offsetWidth;
    attacker.classList.add('lunge');
    setTimeout(() => {
      impactRing(t.x, t.y, ev.side === 'player' ? '#5eeaff' : '#ff4fd8');
      spawnSparks(t.x, t.y, ev.side === 'player' ? '#7bf0ff' : '#ff7ae8', 10, 52);
    }, 150);
    await sleep(340);
    attacker.classList.remove('lunge');
    attacker.style.removeProperty('--dx');
    attacker.style.removeProperty('--dy');
  } else {
    await sleep(220);
  }
}

async function playEvents(events = []) {
  const displayed = { player: readDisplayedLp('player'), ai: readDisplayedLp('ai') };
  for (const ev of events) {
    switch (ev.type) {
      case 'turn': {
        showBanner(ev.side === 'player' ? 'YOUR TURN' : 'ENEMY TURN', ev.side, 1350);
        audio.play('turn');
        await sleep(520);
        break;
      }
      case 'draw': {
        audio.play('draw');
        pulseDeck(ev.side);
        await sleep(80);
        break;
      }
      case 'summon': {
        const color = ev.side === 'player' ? '#5eeaff' : '#ff4fd8';
        flashZone(ev.side, 'monster', ev.index, color);
        audio.play('summon');
        await sleep(300);
        break;
      }
      case 'setMonster': {
        flashZone(ev.side, 'monster', ev.index, '#ffd36e');
        audio.play('set');
        await sleep(190);
        break;
      }
      case 'setTrap': {
        flashZone(ev.side, 'spell', ev.index, '#ffd36e');
        audio.play('set');
        await sleep(190);
        break;
      }
      case 'spell': {
        showCast(ev, 'SPELL');
        audio.play('spell');
        await sleep(380);
        break;
      }
      case 'trap': {
        showCast(ev, 'TRAP');
        audio.play('trap');
        await sleep(460);
        break;
      }
      case 'attack': {
        await animateAttack(ev);
        break;
      }
      case 'flip':
      case 'position': {
        flashZone(ev.side, 'monster', ev.index, '#a9c9ff');
        audio.play('select');
        await sleep(150);
        break;
      }
      case 'damage': {
        displayed[ev.side] = Math.max(0, displayed[ev.side] - ev.amount);
        setLpVisual(ev.side, displayed[ev.side], true);
        const c = plateCenter(ev.side);
        const isBattle = ev.reason === 'battle';
        floatText(`-${ev.amount}`, c.x, c.y, isBattle ? '' : 'burn');
        if (isBattle) {
          shakeScreen();
          audio.play('hit');
        } else {
          audio.play('burn');
        }
        spawnSparks(c.x, c.y, isBattle ? '#ff6d7e' : '#ffb15c', 12, 70);
        await sleep(220);
        break;
      }
      case 'heal': {
        displayed[ev.side] = Math.min(engine.START_LP, displayed[ev.side] + ev.amount);
        setLpVisual(ev.side, displayed[ev.side], false);
        const c = plateCenter(ev.side);
        floatText(`+${ev.amount}`, c.x, c.y, 'heal');
        spawnSparks(c.x, c.y, '#5dffa8', 10, 52);
        audio.play('heal');
        await sleep(210);
        break;
      }
      case 'buff': {
        const z = zoneElement(ev.side, 'monster', ev.index);
        if (z) {
          const c = rectCenter(z);
          floatText(`ATK +${ev.amount}`, c.x, c.y, 'buff');
          spawnSparks(c.x, c.y, '#ffd36e', 8, 40);
        }
        audio.play('buff');
        await sleep(150);
        break;
      }
      case 'destroy': {
        shatterCard(ev.side, ev.row, ev.index);
        await sleep(240);
        break;
      }
      case 'battleResult': {
        if (ev.blocked) {
          const c = rectCenter(els.board);
          floatText('BLOCKED', c.x, c.y, 'blocked');
        }
        await sleep(100);
        break;
      }
      case 'discard': {
        audio.play('set');
        await sleep(90);
        break;
      }
      case 'endTurn': {
        audio.play('click');
        await sleep(100);
        break;
      }
      case 'win': {
        await sleep(280);
        break;
      }
      default:
        break;
    }
  }
  // Keep the DOM's LP display in sync with the authoritative state.
  setLpVisual('player', player().lp);
  setLpVisual('ai', rival().lp);
}

/* ── player actions ──────────────────────────────────────────── */

async function performPlayerAction(actionFn) {
  if (!game || busy || game.winner) return;
  if (game.active !== 'player') { showToast('相手のターンです。'); return; }
  busy = true;
  let result;
  try {
    result = actionFn();
  } catch (error) {
    console.error(error);
    result = { ok: false, error: '処理中にエラーが発生しました。' };
  }
  if (!result?.ok) {
    busy = false;
    showToast(result?.error || 'その行動はできません。');
    renderActions();
    return;
  }
  selection = null;
  hoverRef = null;
  inspectPin = null;
  renderActions();
  renderHint();
  await playEvents(result.events);
  renderAll();
  busy = false;
  renderActions();
  renderHint();
  if (game.winner) finishGame();
}

function onHandClick(index) {
  if (!game || busy || game.winner) return;
  if (game.active !== 'player') { showToast('相手のターンです。'); return; }
  detailDismissedRef = null;
  if (selection?.type === 'hand' && selection.index === index) {
    clearSelection();
    return;
  }
  const inst = player().hand[index];
  if (!inst) return;
  const def = cardDef(inst);
  hoverRef = null;
  inspectPin = { kind: 'hand', index };
  if (def.type === 'monster') {
    selection = { type: 'hand', index, mode: 'summon' };
  } else if (def.type === 'trap') {
    selection = { type: 'hand', index, mode: 'setTrap' };
  } else {
    selection = { type: 'hand', index, mode: 'spell' };
    if (def.target) {
      const targets = engine.legalSpellTargets(game, 'player', index);
      if (!targets.length) showToast('対象となるモンスターがいません。');
    }
  }
  audio.play('select');
  renderAll();
}

function onZoneClick(side, row, index) {
  if (!game || busy || game.winner) return;
  detailDismissedRef = null;
  const inst = game.players[side]?.[row]?.[index];

  if (selection?.type === 'hand') {
    const handInst = player().hand[selection.index];
    const def = cardDef(handInst);
    if (!def) { clearSelection(); return; }
    if (def.type === 'monster' && side === 'player' && row === 'monster' && !inst) {
      performPlayerAction(() => engine.summonMonster(game, 'player', selection.index, index, selection.mode));
      return;
    }
    if (def.type === 'trap' && side === 'player' && row === 'spell' && !inst) {
      performPlayerAction(() => engine.setTrapCard(game, 'player', selection.index, index));
      return;
    }
    if (def.type === 'spell' && def.target === 'enemy' && side === 'ai' && row === 'monster' && inst) {
      const handIndex = selection.index;
      performPlayerAction(() => engine.castSpell(game, 'player', handIndex, { index }));
      return;
    }
    if (def.type === 'spell' && def.target === 'own' && side === 'player' && row === 'monster' && inst && !inst.faceDown) {
      const handIndex = selection.index;
      performPlayerAction(() => engine.castSpell(game, 'player', handIndex, { index }));
      return;
    }
    if (inst) showToast('そのゾーンには置けません。');
    return;
  }

  if (selection?.type === 'attacker') {
    if (side === 'ai' && row === 'monster' && inst) {
      const attacker = selection.index;
      performPlayerAction(() => engine.attack(game, 'player', attacker, { index }));
      return;
    }
    if (side === 'player' && row === 'monster' && inst) {
      selectOwnMonster(index);
    }
    return;
  }

  if (inst && side === 'player' && row === 'monster') {
    selectOwnMonster(index);
    return;
  }
  if (inst) {
    inspectPin = { kind: 'board', side, row, index };
    hoverRef = null;
    renderInspect();
    return;
  }
  clearSelection();
}

function selectOwnMonster(index) {
  const inst = player().monster[index];
  if (!inst) return;
  detailDismissedRef = null;
  inspectPin = { kind: 'board', side: 'player', row: 'monster', index };
  hoverRef = null;
  if (!inst.faceDown && inst.position === 'attack' && inst.attacksLeft > 0 && game.active === 'player') {
    selection = { type: 'attacker', index };
  } else {
    selection = { type: 'ownMonster', index };
  }
  audio.play('select');
  renderAll();
}

function attackDirect() {
  if (selection?.type !== 'attacker' || !canDirect()) return;
  const index = selection.index;
  performPlayerAction(() => engine.attack(game, 'player', index, null));
}

async function endPlayerTurn() {
  if (!game || busy || game.winner) return;
  if (game.active !== 'player') { showToast('相手のターンです。'); return; }
  busy = true;
  selection = null;
  hoverRef = null;
  inspectPin = null;
  renderActions();
  renderHint();
  const result = engine.endTurn(game);
  await playEvents(result.events);
  renderAll();
  if (game.winner) { finishGame(); return; }
  await runAiTurn();
}

function executeAiAction(action) {
  switch (action.kind) {
    case 'summon':
      return engine.summonMonster(game, 'ai', action.handIndex, action.zone, action.mode);
    case 'setTrap':
      return engine.setTrapCard(game, 'ai', action.handIndex, action.zone);
    case 'spell':
      return engine.castSpell(game, 'ai', action.handIndex, action.target);
    case 'attack':
      return engine.attack(game, 'ai', action.attackerIndex, action.target);
    default:
      return { ok: false, error: 'unknown ai action' };
  }
}

async function runAiTurn() {
  if (!game || game.winner) return;
  busy = true;
  renderActions();
  renderHint();
  await sleep(420);
  let guard = 0;
  while (game && game.active === 'ai' && !game.winner && guard < 80) {
    guard += 1;
    const action = nextAiAction(game);
    if (!action) break;
    const result = executeAiAction(action);
    if (!result?.ok) {
      console.warn('AI action failed:', action, result?.error);
      break;
    }
    await playEvents(result.events);
    renderAll();
    await sleep(210);
  }
  if (game && !game.winner) {
    const result = engine.endTurn(game);
    await playEvents(result.events);
    renderAll();
  }
  busy = false;
  renderActions();
  renderHint();
  if (game?.winner) finishGame();
}

/* ── result / start / title ──────────────────────────────────── */

function confetti() {
  const colors = ['#5eeaff', '#ff4fd8', '#ffd36e', '#a06bff', '#5dffa8'];
  for (let i = 0; i < 50; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.style.left = `${Math.random() * 100}vw`;
    spark.style.top = `${Math.random() * 30 + 10}vh`;
    spark.style.width = `${2 + Math.random() * 5}px`;
    spark.style.height = spark.style.width;
    spark.style.setProperty('--spark', colors[i % colors.length]);
    const angle = Math.random() * Math.PI * 2;
    spark.style.setProperty('--dx', `${Math.cos(angle) * (30 + Math.random() * 120)}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * (30 + Math.random() * 120) + 80}px`);
    spark.style.animationDuration = `${1.4 + Math.random() * 1.4}s`;
    els.fx.appendChild(spark);
    setTimeout(() => spark.remove(), 3200);
  }
}

function finishGame() {
  busy = true;
  els.cardDetail.hidden = true;
  renderActions();
  const won = game.winner === 'player';
  setTimeout(() => {
    els.result.hidden = false;
    els.result.classList.toggle('defeat', !won);
    els.resultTitle.textContent = won ? 'VICTORY' : 'DEFEAT';
    els.resultKicker.textContent = won ? 'LP→0 COMPLETE' : 'DUEL COMPLETE';
    els.resultSub.textContent = won
      ? '相手のLPを0にした。24ゾーンを制したのはあなた。'
      : 'あなたのLPが0になった。次は盤面を読み切ろう。';
    els.resultTurns.textContent = String(game.turn);
    els.resultLp.textContent = String(player().lp);
    els.resultDamage.textContent = String(game.stats.damageDealt.player);
    audio.play(won ? 'win' : 'lose');
    if (won) confetti();
  }, 650);
}

async function newDuel() {
  els.result.hidden = true;
  els.result.classList.remove('defeat');
  els.app.hidden = false;
  game = engine.createGame();
  selection = null;
  hoverRef = null;
  inspectPin = null;
  detailDismissedRef = null;
  busy = true;
  dealHandNext = true;
  renderAll();
  dealHandNext = false;
  showBanner('DUEL START', '', 1200);
  await sleep(700);
  const started = engine.startDuel(game);
  await playEvents(started.events);
  renderAll();
  busy = false;
  renderActions();
  renderHint();
}

async function startFromTitle() {
  audio.unlock();
  audio.play('click');
  els.title.classList.add('leaving');
  setTimeout(() => {
    els.title.hidden = true;
    els.title.classList.remove('leaving');
  }, 620);
  await newDuel();
}

function backToTitle() {
  els.result.hidden = true;
  els.app.hidden = true;
  els.title.hidden = false;
  els.title.classList.remove('leaving');
  game = null;
  selection = null;
  busy = false;
  els.cardDetail.hidden = true;
  els.banner.classList.remove('show');
}

/* ── toasts / modals / sound ─────────────────────────────────── */

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2300);
}

function openModal(el) {
  el.hidden = false;
  if (el === els.logModal) renderLog();
}
function closeModal(el) { el.hidden = true; }

function updateSoundUI() {
  els.btnSound.classList.toggle('muted', audio.muted);
  els.btnSound.setAttribute('aria-label', audio.muted ? 'サウンドをオン' : 'サウンドをオフ');
  const state = $('.sound-state', els.btnSoundTitle);
  if (state) state.textContent = audio.muted ? 'SOUND OFF' : 'SOUND ON';
  els.btnSoundTitle.classList.toggle('muted', audio.muted);
}

function toggleSound() {
  audio.unlock();
  audio.setMuted(!audio.muted);
  if (!audio.muted) audio.play('click');
  updateSoundUI();
}

/* ── event wiring ────────────────────────────────────────────── */

function bindEvents() {
  els.hand.addEventListener('click', (event) => {
    const card = event.target.closest('.card--hand');
    if (!card || !els.hand.contains(card)) return;
    onHandClick(Number(card.dataset.handIndex));
  });

  els.board.addEventListener('click', (event) => {
    const zone = event.target.closest('.zone');
    if (!zone) return;
    onZoneClick(zone.dataset.side, zone.dataset.row, Number(zone.dataset.index));
  });

  els.board.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const zone = event.target.closest('.zone');
    if (!zone) return;
    event.preventDefault();
    onZoneClick(zone.dataset.side, zone.dataset.row, Number(zone.dataset.index));
  });

  els.actions.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-act]');
    if (!btn || btn.disabled && btn.dataset.act !== 'end') return;
    const action = btn.dataset.act;
    if (action === 'mode-summon' || action === 'mode-set') {
      if (selection?.type === 'hand') {
        selection.mode = action === 'mode-set' ? 'set' : 'summon';
        renderBoard();
        renderActions();
        renderHint();
        audio.play('click');
      }
      return;
    }
    if (action === 'cancel') { clearSelection(); audio.play('click'); return; }
    if (action === 'cast') {
      if (selection?.type === 'hand') {
        const index = selection.index;
        performPlayerAction(() => engine.castSpell(game, 'player', index, null));
      }
      return;
    }
    if (action === 'attack-direct') { attackDirect(); return; }
    if (action === 'switch') {
      if (selection?.type === 'attacker' || selection?.type === 'ownMonster') {
        const index = selection.index;
        performPlayerAction(() => engine.switchPosition(game, 'player', index));
      }
      return;
    }
    if (action === 'end') { if (!busy) endPlayerTurn(); }
  });

  els.enemyPlate.addEventListener('click', () => {
    if (canDirect()) attackDirect();
  });

  els.cardDetailClose.addEventListener('click', (event) => {
    event.stopPropagation();
    detailDismissedRef = refKey(currentInspectRef());
    els.cardDetail.hidden = true;
    audio.play('click');
  });

  const hoverIn = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const handCard = event.target.closest('.card--hand');
    if (handCard) {
      hoverRef = { kind: 'hand', index: Number(handCard.dataset.handIndex) };
      renderInspect();
      return;
    }
    const boardCard = event.target.closest('.card--board');
    if (boardCard) {
      const zone = boardCard.closest('.zone');
      if (zone) {
        hoverRef = { kind: 'board', side: zone.dataset.side, row: zone.dataset.row, index: Number(zone.dataset.index) };
        renderInspect();
      }
    }
  };
  const hoverOut = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (event.relatedTarget?.closest?.('.card')) return;
    hoverRef = null;
    renderInspect();
  };
  els.hand.addEventListener('pointerover', hoverIn);
  els.hand.addEventListener('pointerout', hoverOut);
  els.board.addEventListener('pointerover', hoverIn);
  els.board.addEventListener('pointerout', hoverOut);

  els.btnStart.addEventListener('click', startFromTitle);
  els.btnRematch.addEventListener('click', async () => {
    els.result.hidden = true;
    audio.play('click');
    await newDuel();
  });
  els.btnTitle.addEventListener('click', backToTitle);
  els.btnRules.addEventListener('click', () => { audio.play('click'); openModal(els.rulesModal); });
  els.btnRulesTitle.addEventListener('click', () => { audio.unlock(); audio.play('click'); openModal(els.rulesModal); });
  els.btnLog.addEventListener('click', () => { audio.play('click'); openModal(els.logModal); });
  els.btnSound.addEventListener('click', toggleSound);
  els.btnSoundTitle.addEventListener('click', toggleSound);

  $$('[data-close]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = el.dataset.close;
      if (target === 'rules') closeModal(els.rulesModal);
      if (target === 'log') closeModal(els.logModal);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!els.rulesModal.hidden) { closeModal(els.rulesModal); return; }
      if (!els.logModal.hidden) { closeModal(els.logModal); return; }
      if (!els.cardDetail.hidden) {
        detailDismissedRef = refKey(currentInspectRef());
        els.cardDetail.hidden = true;
        return;
      }
      if (selection) clearSelection();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) audio.unlock();
  });
}

/* ── ambient background ──────────────────────────────────────── */

function startBackground() {
  const canvas = $('#bgfx');
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  const stars = [];
  const dust = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars.length = 0;
    dust.length = 0;
    const starCount = Math.round((width * height) / 16000);
    for (let i = 0; i < starCount; i += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.25,
        a: Math.random() * 0.55 + 0.12,
        tw: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.8,
      });
    }
    for (let i = 0; i < 22; i += 1) {
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 12 + Math.random() * 48,
        hue: Math.random() > 0.5 ? '94,234,255' : '255,79,216',
        a: 0.012 + Math.random() * 0.02,
        vy: -(0.05 + Math.random() * 0.14),
      });
    }
  }

  let last = 0;
  function frame(now) {
    if (now - last > 33) {
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const d of dust) {
        d.y += d.vy;
        if (d.y < -d.r) { d.y = height + d.r; d.x = Math.random() * width; }
        const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        grad.addColorStop(0, `rgba(${d.hue},${d.a})`);
        grad.addColorStop(1, `rgba(${d.hue},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const s of stars) {
        s.tw += 0.014 * s.speed;
        const alpha = s.a * (0.65 + Math.sin(s.tw) * 0.35);
        ctx.fillStyle = `rgba(190,225,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  if (!reduced) requestAnimationFrame(frame);
}

/* ── boot ────────────────────────────────────────────────────── */

function boot() {
  $('#playerAvatar').innerHTML = avatarFor('player');
  $('#enemyAvatar').innerHTML = avatarFor('ai');
  $('#titleAvatarPlayer').innerHTML = avatarFor('player');
  $('#titleAvatarAi').innerHTML = avatarFor('ai');
  updateSoundUI();
  bindEvents();
  startBackground();
  renderActions();
}

boot();
