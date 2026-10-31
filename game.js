/* ============================================================
   神殿決闘 — TEMPLE DUEL
   Eight square spirits + eight square relics. Reduce LP to zero.
   ============================================================ */
'use strict';

/* ---------------- data ---------------- */
const MONSTERS = {
  kongo: {
    id: 'kongo', jp: '雷門の金剛', en: 'KONGO', attr: '雷', attrName: 'THUNDER',
    atk: 2400, def: 1000, level: 6, accent: '#b39bff', accent2: '#3a2a6e',
    flavor: 'The thunder gate opens. Its fist is the last sound a rival hears.'
  },
  arhat: {
    id: 'arhat', jp: '石像の羅漢', en: 'ARHAT', attr: '土', attrName: 'EARTH',
    atk: 1200, def: 2600, level: 5, accent: '#d8a55f', accent2: '#5a3d22',
    flavor: 'A saint carved from mountain bone. Nothing moves it, not even time.'
  },
  yomi: {
    id: 'yomi', jp: '黄泉の蛇神', en: 'YOMI SERPENT', attr: '闇', attrName: 'DARK',
    atk: 2200, def: 1800, level: 6, accent: '#b07cff', accent2: '#3a1d52',
    flavor: 'It remembers every name the shrine has swallowed.'
  },
  ryumi: {
    id: 'ryumi', jp: '龍脈の巫女', en: 'DRAGON VEIN MAIDEN', attr: '水', attrName: 'WATER',
    atk: 1600, def: 2000, level: 4, accent: '#7fe3cf', accent2: '#164b4a',
    flavor: 'Where her sleeve falls, a river remembers its way home.'
  },
  onibi: {
    id: 'onibi', jp: '鬼火の大将', en: 'ONIBI WARLORD', attr: '炎', attrName: 'FIRE',
    atk: 2100, def: 1200, level: 5, accent: '#ff7a45', accent2: '#5e1a12',
    flavor: 'A general of small fires, promoted by every battlefield it lit.'
  },
  shiro: {
    id: 'shiro', jp: '白狐の守り神', en: 'WHITE FOX GUARDIAN', attr: '光', attrName: 'LIGHT',
    atk: 1800, def: 1500, level: 4, accent: '#f2d98b', accent2: '#5c4a22',
    flavor: 'Two tails, one promise: the gate will not fall tonight.'
  },
  tengu: {
    id: 'tengu', jp: '月影の天狗', en: 'MOONSHADE TENGU', attr: '風', attrName: 'WIND',
    atk: 2000, def: 1600, level: 5, accent: '#8fe0a8', accent2: '#1f4a35',
    flavor: 'He keeps the moon in his sleeve and the mountain in his laugh.'
  },
  phoenix: {
    id: 'phoenix', jp: '鳳凰の神使', en: 'PHOENIX EMISSARY', attr: '炎', attrName: 'FIRE',
    atk: 1900, def: 1900, level: 5, accent: '#ffcf6a', accent2: '#6b2a12',
    flavor: 'A letter from the sun, delivered in ash and gold.'
  }
};

const RELICS = {
  spring: {
    id: 'spring', jp: '回復の御神水', short: '御神水', en: 'SACRED SPRING', kind: 'heal',
    value: 900, keyword: 'HEAL 900', accent: '#7fe3cf',
    desc: 'Restore 900 life points. The water remembers wholeness.'
  },
  liturgy: {
    id: 'liturgy', jp: '剣の祝詞', short: '祝詞', en: 'BLADE LITURGY', kind: 'buff',
    value: 800, keyword: 'ATK +800', accent: '#f2d98b',
    desc: 'One ally gains +800 ATK until the end of this turn.'
  },
  ward: {
    id: 'ward', jp: '結界の符', short: '結界', en: 'BARRIER TALISMAN', kind: 'shield',
    value: 1000, keyword: 'SHIELD 1000', accent: '#8fd8ff',
    desc: 'Gain a 1000-point barrier. It absorbs damage before your life points.'
  },
  soulfire: {
    id: 'soulfire', jp: '魂の火', short: '魂火', en: 'SOUL FIRE', kind: 'burn',
    value: 700, keyword: 'BURN 700', accent: '#ff7a45',
    desc: 'Deal 700 damage directly to the enemy, past every spirit.'
  }
};

const RELIC_ORDER = ['spring', 'liturgy', 'ward', 'soulfire'];
const MONSTER_PAIRS = [
  ['kongo', 'arhat'],
  ['yomi', 'ryumi'],
  ['onibi', 'shiro'],
  ['tengu', 'phoenix']
];

const MAX_LP = 4000;

/* ---------------- card artwork ---------------- */
function artFrame(m, inner) {
  const u = m.id;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="bg-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${m.accent2}"/>
        <stop offset=".55" stop-color="#0b0913"/>
        <stop offset="1" stop-color="#05040a"/>
      </linearGradient>
      <radialGradient id="glow-${u}" cx=".5" cy=".42" r=".6">
        <stop offset="0" stop-color="${m.accent}" stop-opacity=".55"/>
        <stop offset=".55" stop-color="${m.accent}" stop-opacity=".14"/>
        <stop offset="1" stop-color="${m.accent}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="main-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${m.accent}"/>
        <stop offset="1" stop-color="${m.accent2}"/>
      </linearGradient>
      <radialGradient id="vig-${u}" cx=".5" cy=".44" r=".72">
        <stop offset=".42" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".82"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#bg-${u})"/>
    <circle cx="50" cy="43" r="46" fill="url(#glow-${u})"/>
    ${inner}
    <rect width="100" height="100" fill="url(#vig-${u})"/>
  </svg>`;
}

function monsterArt(m) {
  switch (m.id) {
    case 'shiro': return artFrame(m, `
      <circle cx="50" cy="35" r="23" fill="#f4e6c2" opacity=".9"/>
      <g fill="none" stroke="#b23a2e" stroke-width="2.4" opacity=".8">
        <path d="M20 68h60M27 68V52h46v16"/>
      </g>
      <g stroke="#f7f2e8" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85">
        <path d="M23 78c-10-6-10-19-1-22"/><path d="M77 78c10-6 10-19 1-22"/>
      </g>
      <path d="M31 38 26 17 45 27Z" fill="#f7f2e8"/><path d="M69 38 74 17 55 27Z" fill="#f7f2e8"/>
      <path d="M33 33 30 22 39 27Z" fill="#b23a2e" opacity=".75"/><path d="M67 33 70 22 61 27Z" fill="#b23a2e" opacity=".75"/>
      <path d="M50 28c-12 0-20 11-20 23 0 13 9 22 20 22s20-9 20-22c0-12-8-23-20-23Z" fill="#f7f2e8"/>
      <path d="M42 48l8 4-8 3Z" fill="#a52a22"/><path d="M58 48l-8 4 8 3Z" fill="#a52a22"/>
      <path d="M50 58l-3 3h6Z" fill="#2a1b1b"/>
      <path d="M50 34v7M46 35l2 5M54 35l-2 5" stroke="#b23a2e" stroke-width="1.2" opacity=".85"/>
      <path d="M36 62c3 3 7 4 10 3M64 62c-3 3-7 4-10 3" stroke="#b23a2e" stroke-width="1.1" fill="none" opacity=".6"/>
      <g fill="#ffe9a8" opacity=".8"><circle cx="20" cy="30" r="1"/><circle cx="76" cy="22" r="1.3"/><circle cx="64" cy="14" r=".7"/></g>`);

    case 'onibi': return artFrame(m, `
      <g opacity=".55">
        <path d="M18 88c-7-14 3-24 7-33 2 10 8 15 13 17-7-13-1-23 3-29 0 12 8 18 8 18s8-6 8-18c4 6 10 16 3 29 5-2 11-7 13-17 4 9 14 19 7 33Z" fill="url(#main-onibi)"/>
      </g>
      <path d="M34 29C26 22 27 12 36 11c-2 7 0 12 5 15Z" fill="#e8d8b8"/>
      <path d="M66 29c8-7 7-17-2-18 2 7 0 12-5 15Z" fill="#e8d8b8"/>
      <path d="M50 24c-14 0-22 12-21 27 1 16 10 26 21 26s20-10 21-26c1-15-7-27-21-27Z" fill="#7d2020"/>
      <path d="M50 24c-14 0-22 12-21 27 1 16 10 26 21 26V24Z" fill="#982d25" opacity=".65"/>
      <path d="M38 46l10 4-10 5Z" fill="#ffd76e"/><path d="M62 46l-10 4 10 5Z" fill="#ffd76e"/>
      <circle cx="50" cy="35" r="3" fill="#ffd76e" opacity=".9"/>
      <path d="M40 64h20l-3 6-4-3-3 4-3-4-4 3Z" fill="#f3ead6"/>
      <path d="M44 64v5M50 64v6M56 64v5" stroke="#5a1414" stroke-width=".8"/>
      <g fill="#ff9a5a" opacity=".65"><circle cx="22" cy="30" r="1.1"/><circle cx="78" cy="26" r=".8"/><circle cx="70" cy="14" r="1.3"/></g>`);

    case 'ryumi': return artFrame(m, `
      <circle cx="50" cy="46" r="34" fill="none" stroke="#8fe3d0" stroke-width="1.8" opacity=".2" stroke-dasharray="2 4"/>
      <path d="M16 80c12-2 16-18 26-22s16 8 24-2 6-18 15-23" fill="none" stroke="url(#main-ryumi)" stroke-width="7" stroke-linecap="round"/>
      <path d="M16 80c12-2 16-18 26-22s16 8 24-2 6-18 15-23" fill="none" stroke="#d9fff4" stroke-width="1" stroke-linecap="round" opacity=".45"/>
      <circle cx="82" cy="32" r="7" fill="#0d2b2b" stroke="#8fe3d0" stroke-width="1"/>
      <path d="M77 27l-4-6M87 27l4-6" stroke="#d9fff4" stroke-width="1.4"/>
      <path d="M89 33c4 0 6 2 7 4M89 36c3 2 4 4 4 6" stroke="#8fe3d0" stroke-width="1" fill="none"/>
      <circle cx="84" cy="31" r="1.2" fill="#ffe9a8"/>
      <g stroke="#8fe3d0" stroke-width=".7" opacity=".5" fill="none">
        <path d="M25 71c2-4 5-6 8-7M34 62c2-4 5-6 8-7M43 55c3-2 6-2 9-1M55 55c3 0 6 1 8 3"/>
      </g>
      <circle cx="50" cy="77" r="3.4" fill="#f2e3cc"/>
      <path d="M50 80c-4 2-6 7-6 13h12c0-6-2-11-6-13Z" fill="#f2e3cc"/>
      <path d="M44 85h12v4H44Z" fill="#b23a2e" opacity=".8"/>
      <path d="M50 81v12" stroke="#b23a2e" stroke-width="1"/>
      <g fill="#8fe3d0" opacity=".45"><circle cx="20" cy="30" r="1"/><circle cx="72" cy="18" r="1.4"/><circle cx="30" cy="18" r=".8"/></g>`);

    case 'kongo': return artFrame(m, `
      <g stroke="#f7d774" stroke-width="1.5" fill="none" opacity=".75">
        <path d="M15 7l15 23-8 3 14 25"/><path d="M85 11 69 34l8 3-12 23"/>
      </g>
      <g fill="#171226" stroke="#5d4a7a" stroke-width=".6">
        <path d="M22 92V48h8v44ZM70 92V48h8v44Z"/><path d="M13 47h74v6H13Z"/>
      </g>
      <circle cx="50" cy="53" r="17" fill="#241a2e" stroke="#f7d774" stroke-width="1.2"/>
      <circle cx="50" cy="53" r="12" fill="none" stroke="#f7d774" stroke-width=".7" opacity=".45"/>
      <path d="M50 41l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#f7d774" opacity=".9"/>
      <path d="M35 92c2-13 7-21 15-21s13 8 15 21Z" fill="#191322" stroke="#6c5a8a" stroke-width=".8"/>
      <circle cx="50" cy="64" r="6" fill="#191322" stroke="#6c5a8a" stroke-width=".8"/>
      <path d="M43 92V78M57 92V78" stroke="#f7d774" stroke-width=".8" opacity=".35"/>`);

    case 'tengu': return artFrame(m, `
      <circle cx="50" cy="37" r="26" fill="#f0e2c2" opacity=".5"/>
      <g fill="#1b1420" opacity=".92">
        <path d="M13 52c8-2 14-8 18-16 2 8 0 16-4 22 6-2 12-8 14-16 2 8 0 18-6 24 8-4 12-10 14-18 2 10-2 22-12 28Z"/>
        <path d="M87 52c-8-2-14-8-18-16-2 8 0 16 4 22-6-2-12-8-14-16-2 8 0 18 6 24-8-4-12-10-14-18-2 10 2 22 12 28Z"/>
      </g>
      <path d="M50 22c-11 0-17 9-16 20 1 12 7 20 16 20s15-8 16-20c1-11-5-20-16-20Z" fill="#b03a30"/>
      <path d="M50 22c-6 0-10 3-13 7l13 34c6 0 11-8 12-19 1-11-5-22-12-22Z" fill="#c9473b" opacity=".55"/>
      <path d="M50 41l-5 19h10Z" fill="#e8d4b4"/>
      <path d="M38 42l7 3-7 4Z" fill="#ffdf8a"/><path d="M62 42l-7 3 7 4Z" fill="#ffdf8a"/>
      <path d="M44 62c3 4 9 4 12 0" stroke="#e8d4b4" stroke-width="1.4" fill="none"/>
      <path d="M34 18h32l-4-8H38Z" fill="#1b1420"/>
      <path d="M50 66c-6 4-9 10-8 19h16c1-9-2-15-8-19Z" fill="#e8d4b4" opacity=".9"/>
      <g fill="#8fe0a8" opacity=".5"><circle cx="22" cy="26" r="1"/><circle cx="80" cy="22" r="1.2"/></g>`);

    case 'arhat': return artFrame(m, `
      <g stroke="#f7d774" fill="none" opacity=".5">
        <circle cx="50" cy="46" r="30" stroke-width=".8"/>
        <circle cx="50" cy="46" r="35" stroke-width=".5" stroke-dasharray="1 5"/>
        <path d="M50 7v9M50 76v9M11 46h9M80 46h9M22 18l7 7M71 67l7 7M78 18l-7 7M29 67l-7 7"/>
      </g>
      <circle cx="50" cy="35" r="13" fill="#9a9388"/>
      <path d="M50 48c-12 0-20 10-20 24v20h40V72c0-14-8-24-20-24Z" fill="#857e73"/>
      <path d="M30 72c0-14 8-24 20-24s20 10 20 24" fill="none" stroke="#6d675e" stroke-width="1"/>
      <path d="M38 79c4-4 8-4 12 0s8 4 12 0" stroke="#6d675e" stroke-width="1.4" fill="none"/>
      <path d="M42 34c2-2 4-2 6 0M54 34c2-2 4-2 6 0" stroke="#6d675e" stroke-width=".9" fill="none"/>
      <g fill="#7d9a63" opacity=".7"><circle cx="33" cy="64" r="3"/><circle cx="68" cy="72" r="2"/><circle cx="40" cy="84" r="1.6"/></g>
      <path d="M25 93c8-4 16-4 25 0s17 4 25 0" stroke="#f7d774" stroke-width="1" fill="none" opacity=".4"/>`);

    case 'yomi': return artFrame(m, `
      <g fill="none" stroke="#b07cff" stroke-width="1.1" opacity=".35">
        <path d="M16 82c8-10 20-6 24-16s-6-16 2-24 16-2 20-12"/>
        <path d="M84 82c-8-10-20-6-24-16s6-16-2-24-16-2-20-12"/>
      </g>
      <path d="M23 80c8-6 10-18 20-20s12 10 22 2 4-18 11-25" fill="none" stroke="#2b1c3d" stroke-width="7" stroke-linecap="round"/>
      <g fill="#c9b3e8" stroke="#2b1c3d" stroke-width=".6">
        <circle cx="25" cy="77" r="2.2"/><circle cx="30" cy="71" r="2.2"/><circle cx="36" cy="66" r="2.2"/><circle cx="43" cy="63" r="2.2"/>
        <circle cx="51" cy="63" r="2.2"/><circle cx="58" cy="61" r="2.2"/><circle cx="65" cy="57" r="2.2"/><circle cx="71" cy="51" r="2.2"/><circle cx="76" cy="43" r="2.2"/>
      </g>
      <g stroke="#c9b3e8" stroke-width="1" fill="none" opacity=".65">
        <path d="M35 63c-3 2-5 4-6 7M43 60c-3 2-5 4-6 7M51 60c-3 2-5 4-6 7M59 58c-3 2-5 4-6 7"/>
      </g>
      <path d="M76 41c4-2 8-2 12 1-4 1-6 3-7 6-2-2-3-5-5-7Z" fill="#d8c6f2"/>
      <circle cx="82" cy="41" r="1.2" fill="#b07cff"/>
      <path d="M78 37l3-6M86 37l3-5" stroke="#d8c6f2" stroke-width="1.2"/>
      <g fill="#b07cff" opacity=".5"><circle cx="20" cy="30" r="1.2"/><circle cx="30" cy="20" r=".8"/><circle cx="68" cy="20" r="1"/></g>`);

    case 'phoenix': return artFrame(m, `
      <circle cx="50" cy="40" r="22" fill="#ffd76e" opacity=".28"/>
      <g fill="url(#main-phoenix)">
        <path d="M50 54c-12-2-24-12-32-26 12 2 22 8 28 18Z"/>
        <path d="M50 54c12-2 24-12 32-26-12 2-22 8-28 18Z"/>
        <path d="M50 58c-10 2-20 0-28-6 8 8 16 14 26 16Z" opacity=".8"/>
        <path d="M50 58c10 2 20 0 28-6-8 8-16 14-26 16Z" opacity=".8"/>
      </g>
      <path d="M50 34c-6 0-10 6-10 13 0 8 4 14 10 20 6-6 10-12 10-20 0-7-4-13-10-13Z" fill="#ffcf6a"/>
      <path d="M50 34c-3 0-5 4-5 9 0 6 2 10 5 14 3-4 5-8 5-14 0-5-2-9-5-9Z" fill="#fff1c2"/>
      <circle cx="50" cy="40" r="1.4" fill="#5a1c12"/>
      <path d="M50 40l7 2-7 2Z" fill="#e86a3a"/>
      <g stroke="#ffb36a" stroke-width="1.4" fill="none" stroke-linecap="round">
        <path d="M50 67c-4 8-2 15 4 21"/><path d="M50 67c4 8 2 15-4 21"/><path d="M50 67c0 9 0 15 0 22"/>
      </g>
      <g fill="#ffd76e" opacity=".65"><circle cx="22" cy="30" r="1"/><circle cx="76" cy="26" r="1.3"/><circle cx="66" cy="18" r=".7"/></g>`);
  }
  return artFrame(m, '');
}

function relicArt(kind) {
  const glow = { heal: '#7fe3cf', buff: '#f2d98b', shield: '#8fd8ff', burn: '#ff7a45' }[kind] || '#f8e3a4';
  const wrap = inner => `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="rglow-${kind}" cx=".5" cy=".45" r=".55">
        <stop offset="0" stop-color="${glow}" stop-opacity=".38"/>
        <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="rvig-${kind}" cx=".5" cy=".45" r=".7">
        <stop offset=".45" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".55"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="#08070e"/>
    <circle cx="50" cy="46" r="46" fill="url(#rglow-${kind})"/>
    ${inner}
    <rect width="100" height="100" fill="url(#rvig-${kind})"/>
  </svg>`;
  switch (kind) {
    case 'heal': return wrap(`
      <path d="M50 20c8 13 17 22 17 32a17 17 0 0 1-34 0c0-10 9-19 17-32Z" fill="#7fe3cf" opacity=".85"/>
      <path d="M50 34c4 7 8 12 8 17a8 8 0 0 1-16 0c0-5 4-10 8-17Z" fill="#eafff9" opacity=".85"/>
      <g stroke="#7fe3cf" fill="none" opacity=".45"><path d="M22 70c8-3 16-3 24 0s16 3 24 0"/><path d="M26 80c6-2 12-2 18 0s12 2 18 0"/></g>`);
    case 'buff': return wrap(`
      <path d="M47 16h6v34h-6Z" fill="#f7d774"/><path d="M50 10l5 8H45Z" fill="#fff1c2"/>
      <path d="M38 50h24v5H38Z" fill="#c99b4a"/><path d="M47 55h6v17h-6Z" fill="#8a6a2f"/>
      <circle cx="50" cy="78" r="4" fill="#f7d774"/>
      <g stroke="#f7d774" opacity=".4" fill="none"><path d="M27 30l8 4M73 30l-8 4M25 44l8-2M75 44l-8-2"/></g>`);
    case 'shield': return wrap(`
      <path d="M50 15l24 8v21c0 16-10 28-24 36-14-8-24-20-24-36V23Z" fill="none" stroke="#8fd8ff" stroke-width="2.4"/>
      <path d="M50 23l16 6v15c0 11-7 20-16 27-9-7-16-16-16-27V29Z" fill="#8fd8ff" opacity=".13"/>
      <path d="M50 34l5 11 12 2-9 8 2 13-10-6-10 6 2-13-9-8 12-2Z" fill="#bfeaff" opacity=".8"/>`);
    case 'burn': return wrap(`
      <path d="M50 13c4 13 18 19 18 35a18 18 0 0 1-36 0c0-8 4-14 9-19-1 8 2 12 5 14 1-12 2-21 4-30Z" fill="#ff7a45"/>
      <path d="M50 37c2 7 9 10 9 18a9 9 0 0 1-18 0c0-5 3-8 5-11 0 4 2 6 3 7 0-5 0-10 1-14Z" fill="#ffd76e"/>
      <g stroke="#ff7a45" opacity=".4" fill="none"><path d="M28 82c6-2 12-2 18 0s12 2 18 0"/></g>`);
  }
  return wrap('');
}

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const other = s => (s === 'player' ? 'enemy' : 'player');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------------- sound ---------------- */
const Sound = {
  ctx: null, muted: false,
  ensure() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, type = 'sine', vol = .12, slideTo = null, delay = 0) {
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + .03);
  },
  noise(dur = .25, vol = .1, freq = 900, delay = 0) {
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
  },
  play(name) {
    if (this.muted) return;
    switch (name) {
      case 'select': this.tone(720, .07, 'sine', .05); break;
      case 'cancel': this.tone(330, .09, 'triangle', .04, 260); break;
      case 'attack': this.tone(180, .22, 'sawtooth', .07, 70); this.noise(.18, .07, 1400); break;
      case 'impact':
        this.tone(90, .34, 'sine', .16, 42); this.noise(.26, .15, 700);
        this.tone(240, .18, 'square', .04, 110); break;
      case 'block': this.tone(520, .2, 'triangle', .08, 340); this.noise(.12, .06, 1800); break;
      case 'destroy':
        this.tone(260, .4, 'sawtooth', .07, 55); this.noise(.42, .13, 900); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .5, 'sine', .06, null, i * .07)); break;
      case 'shield': this.tone(880, .45, 'sine', .06, 1320); this.tone(1320, .4, 'sine', .03, 1760, .05); break;
      case 'burn': this.noise(.4, .12, 2400); this.tone(150, .35, 'sawtooth', .06, 60); break;
      case 'buff': [392, 523, 659].forEach((f, i) => this.tone(f, .35, 'triangle', .05, null, i * .06)); break;
      case 'turn': this.tone(146, 1.2, 'sine', .1, 138); this.tone(292, .9, 'sine', .04, 280, .02); this.noise(.5, .03, 400); break;
      case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, .9, 'sine', .08, null, i * .13)); break;
      case 'lose': this.tone(196, 1.6, 'sine', .09, 98); this.tone(146, 1.8, 'triangle', .05, 73, .2); break;
    }
  }
};

/* ---------------- particles ---------------- */
const FX = {
  canvas: null, ctx: null, w: 0, h: 0, dpr: 1,
  particles: [], lastAmbient: 0, running: false,
  init() {
    this.canvas = $('#fx');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.running = true;
    requestAnimationFrame(t => this.loop(t));
  },
  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },
  spawn(x, y, opt = {}) {
    this.particles.push({
      x, y,
      vx: opt.vx ?? (Math.random() - .5) * .7,
      vy: opt.vy ?? -(.2 + Math.random() * .5),
      g: opt.g ?? 0,
      life: opt.life ?? (1600 + Math.random() * 1600),
      age: 0,
      size: opt.size ?? (1 + Math.random() * 2),
      color: opt.color ?? '#f8e3a4',
      type: opt.type ?? 'ember',
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * .12,
      drag: opt.drag ?? .995
    });
  },
  burst(x, y, color = '#f8e3a4', count = 22, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (.6 + Math.random() * 3.2) * power;
      this.spawn(x, y, {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - .4, g: .035,
        life: 500 + Math.random() * 800, size: .8 + Math.random() * 2.6,
        color: Math.random() < .45 ? '#fff6d8' : color, type: 'spark', drag: .965
      });
    }
    for (let i = 0; i < Math.round(count * .5); i++) {
      this.spawn(x + (Math.random() - .5) * 20, y + (Math.random() - .5) * 20, {
        vx: (Math.random() - .5) * .5, vy: -(.2 + Math.random() * .8),
        life: 1200 + Math.random() * 1400, size: 1 + Math.random() * 2,
        color, type: 'ember', drag: .998
      });
    }
  },
  petals() {
    this.canvas.classList.add('front');
    setTimeout(() => this.canvas.classList.remove('front'), 6500);
    const colors = ['#f8e3a4', '#d9b45f', '#ffb3a6', '#ffeccb'];
    for (let i = 0; i < 110; i++) {
      this.spawn(Math.random() * this.w, -20 - Math.random() * 200, {
        vx: (Math.random() - .5) * 1.4, vy: .5 + Math.random() * 1.6, g: .004,
        life: 5000 + Math.random() * 4000, size: 2 + Math.random() * 4,
        color: colors[(Math.random() * colors.length) | 0], type: 'petal', drag: .999
      });
    }
  },
  loop(t) {
    if (!this.running) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    if (t - this.lastAmbient > 220) {
      this.lastAmbient = t;
      this.spawn(Math.random() * this.w, this.h + 10, {
        vx: (Math.random() - .5) * .35, vy: -(.15 + Math.random() * .35),
        life: 5000 + Math.random() * 5000, size: .6 + Math.random() * 1.6,
        color: Math.random() < .3 ? '#ffb36a' : '#f8e3a4', drag: .9995
      });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += 16.7;
      if (p.age >= p.life) { this.particles.splice(i, 1); continue; }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      const k = 1 - p.age / p.life;
      if (p.type === 'petal') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, k * 2.4) * .85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * .45, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
      } else {
        ctx.globalAlpha = Math.min(1, k * 2.2);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.2, p.size * (p.type === 'spark' ? k : .8)), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(t2 => this.loop(t2));
  }
};

/* ---------------- state ---------------- */
const state = {
  round: 1,
  active: 'player',
  mode: 'idle',        // idle | target | buff
  sel: null,           // {side, kind, index}
  attacker: null,
  busy: false,
  over: false,
  player: null,
  enemy: null,
  stats: { dealt: 0, taken: 0, destroyed: 0 },
  roundAttacks: 0
};

const board = $('#board');
const cmdText = $('#cmd-text');
const cmdActions = $('#cmd-actions');
const tooltip = $('#tooltip');

function makeSide(monsterIds) {
  return {
    lp: MAX_LP,
    shield: 0,
    monsters: monsterIds.map(id => ({ ...MONSTERS[id], alive: true, buff: 0, attacked: false })),
    relics: RELIC_ORDER.map(id => ({ ...RELICS[id], used: false }))
  };
}

function buildMonsterSplit() {
  const player = [], enemy = [];
  for (const [a, b] of MONSTER_PAIRS) {
    if (Math.random() < .5) { player.push(a); enemy.push(b); }
    else { player.push(b); enemy.push(a); }
  }
  return { player: shuffle(player), enemy: shuffle(enemy) };
}

/* ---------------- rendering ---------------- */
function bigFace(m) {
  return `<div class="card-art">${monsterArt(m)}
      <span class="attr" title="${m.attrName}">${m.attr}</span>
      <span class="level">${'★'.repeat(Math.min(6, m.level))}</span>
    </div>
    <div class="card-name">${m.jp}<span class="en">${m.en}</span></div>
    <div class="card-stats">
      <span class="stat atk">ATK <b>${m.atk}</b></span>
      <span class="stat def">DEF <b>${m.def}</b></span>
    </div>
    <span class="buff" hidden>+0</span>
    <span class="stamp">攻</span>`;
}

function tinyFace(r) {
  return `<div class="card-art">${relicArt(r.kind)}</div>
    <div class="card-name">${r.short}</div>
    <div class="relic-keyword">${r.keyword}</div>
    <span class="spent-seal">封</span>`;
}

function makeCard(card, side, kind, index) {
  const el = document.createElement('div');
  el.className = `card ${kind}`;
  el.dataset.side = side;
  el.dataset.kind = kind;
  el.dataset.index = index;
  el.style.setProperty('--accent', card.accent);
  el.style.setProperty('--accent2', card.accent2 || card.accent);
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', kind === 'big'
    ? `${card.jp}, ATK ${card.atk}, DEF ${card.def}`
    : `${card.jp}, ${card.desc}`);
  el.innerHTML = `<div class="card-inner">
      <div class="card-face">${kind === 'big' ? bigFace(card) : tinyFace(card)}</div>
      <div class="card-back"></div>
    </div>`;
  return el;
}

function slotEl(side, kind, index) {
  return $(`.slot[data-side="${side}"][data-kind="${kind}"][data-index="${index}"]`);
}
function cardEl(side, kind, index) {
  const slot = slotEl(side, kind, index);
  return slot ? slot.querySelector('.card') : null;
}

function renderBoard() {
  for (const side of ['enemy', 'player']) {
    for (const kind of ['big', 'tiny']) {
      const row = $(`.row-${kind}[data-side="${side}"]`);
      row.innerHTML = '';
      const cards = kind === 'big' ? state[side].monsters : state[side].relics;
      cards.forEach((card, i) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.side = side;
        slot.dataset.kind = kind;
        slot.dataset.index = i;
        const motion = document.createElement('div');
        motion.className = 'card-motion';
        motion.style.setProperty('--bob-delay', `${(i * .62 + (side === 'enemy' ? 1.3 : 0)).toFixed(2)}s`);
        motion.style.setProperty('--bob-dur', `${(5.8 + i * .35).toFixed(2)}s`);
        const alive = kind === 'big' ? card.alive : true;
        if (alive) motion.appendChild(makeCard(card, side, kind, i));
        else slot.classList.add('is-empty');
        slot.appendChild(motion);
        row.appendChild(slot);
        if (alive) refreshCard(side, kind, i);
      });
    }
  }
}

function refreshCard(side, kind, index) {
  const el = cardEl(side, kind, index);
  if (!el) return;
  if (kind === 'big') {
    const m = state[side].monsters[index];
    if (!m || !m.alive) return;
    const atk = el.querySelector('.stat.atk b');
    if (atk) atk.textContent = m.atk + (m.buff || 0);
    const buff = el.querySelector('.buff');
    if (buff) {
      if (m.buff) { buff.hidden = false; buff.textContent = `+${m.buff}`; }
      else buff.hidden = true;
    }
    el.classList.toggle('acted', !!m.attacked);
    el.classList.toggle('selected', !!state.sel && state.sel.side === side && state.sel.kind === kind && state.sel.index === index);
    el.classList.toggle('targetable', (state.mode === 'target' && side === 'enemy' && !!state.attacker) || (state.mode === 'buff' && side === 'player'));
  } else {
    const r = state[side].relics[index];
    if (!r) return;
    el.classList.toggle('spent', !!r.used);
    el.classList.toggle('selected', !!state.sel && state.sel.side === side && state.sel.kind === kind && state.sel.index === index);
  }
}

function refreshAll() {
  for (const side of ['enemy', 'player']) {
    state[side].monsters.forEach((m, i) => { if (m.alive) refreshCard(side, 'big', i); });
    state[side].relics.forEach((r, i) => refreshCard(side, 'tiny', i));
  }
  $$('.slot').forEach(s => {
    const { side, kind, index } = s.dataset;
    s.classList.toggle('selected', !!state.sel && state.sel.side === side && state.sel.kind === kind && state.sel.index === +index);
    if (kind === 'big') {
      const m = state[side].monsters[+index];
      s.classList.toggle('is-empty', !m || !m.alive);
      s.classList.toggle('targetable', (state.mode === 'target' && side === 'enemy' && m && m.alive) || (state.mode === 'buff' && side === 'player' && m && m.alive));
    }
  });
  $('#enemy-panel').classList.toggle('direct-target', state.mode === 'target' && state.attacker !== null && !state.enemy.monsters.some(m => m.alive));
}

function dealAnimation() {
  const cards = $$('.card-inner');
  cards.forEach((el, i) => {
    el.animate([
      { opacity: 0, transform: 'translateY(-22px) rotateY(180deg) scale(.9)' },
      { opacity: 1, offset: .6 },
      { opacity: 1, transform: 'none' }
    ], { duration: 680, delay: i * 42, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
  });
}

/* ---------------- LP / panels ---------------- */
function lpEls(side) {
  return {
    num: $(`#${side}-lp`),
    fill: $(`#${side}-lp-fill`),
    shield: $(`#${side}-shield`),
    panel: $(`#${side}-panel`)
  };
}

function paintLP(side, instant = false) {
  const s = state[side], el = lpEls(side);
  el.num.textContent = Math.round(s.lp);
  el.fill.style.width = `${clamp(s.lp / MAX_LP * 100, 0, 100)}%`;
  if (s.shield > 0) {
    el.shield.hidden = false;
    el.shield.textContent = `◈ ${s.shield}`;
  } else el.shield.hidden = true;
  if (instant) {
    el.num.classList.remove('hurt');
  }
}

function animateLP(side, from, to) {
  const el = lpEls(side);
  el.num.classList.add('hurt');
  const start = performance.now(), dur = 620;
  function frame(now) {
    const k = clamp((now - start) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - k, 3);
    const v = from + (to - from) * eased;
    el.num.textContent = Math.round(v);
    el.fill.style.width = `${clamp(v / MAX_LP * 100, 0, 100)}%`;
    if (k < 1) requestAnimationFrame(frame);
    else {
      el.num.textContent = Math.round(to);
      el.fill.style.width = `${clamp(to / MAX_LP * 100, 0, 100)}%`;
      setTimeout(() => el.num.classList.remove('hurt'), 420);
    }
  }
  requestAnimationFrame(frame);
}

function damage(side, raw) {
  const s = state[side];
  let amount = Math.max(0, Math.round(raw));
  let blocked = 0;
  if (s.shield > 0 && amount > 0) {
    blocked = Math.min(s.shield, amount);
    s.shield -= blocked;
    amount -= blocked;
    if (blocked > 0) {
      Sound.play('block');
      const el = lpEls(side);
      const r = el.num.getBoundingClientRect();
      floatText(r.left + r.width / 2, r.top, `BLOCK ${blocked}`, 'shield');
      ringAt(r.left + r.width / 2, r.top + r.height / 2, '#8fd8ff');
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, '#8fd8ff', 16, .8);
    }
  }
  if (s.shield <= 0) s.shield = 0;
  const from = s.lp;
  s.lp = Math.max(0, s.lp - amount);
  if (amount > 0) {
    Sound.play('impact');
    shake();
    const el = lpEls(side);
    const r = el.num.getBoundingClientRect();
    floatText(r.left + r.width / 2, r.top + r.height / 2, `-${amount}`);
    el.panel.classList.remove('hit');
    void el.panel.offsetWidth;
    el.panel.classList.add('hit');
    setTimeout(() => el.panel.classList.remove('hit'), 550);
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, '#ff7a45', 14, 1);
    if (side === 'enemy') state.stats.dealt += amount; else state.stats.taken += amount;
  }
  paintLP(side);
  animateLP(side, from, s.lp);
  return amount;
}

function heal(side, amount) {
  const s = state[side];
  const from = s.lp;
  s.lp = Math.min(MAX_LP, s.lp + amount);
  const gained = s.lp - from;
  paintLP(side);
  animateLP(side, from, s.lp);
  if (gained > 0) {
    Sound.play('heal');
    const r = lpEls(side).num.getBoundingClientRect();
    floatText(r.left + r.width / 2, r.top + r.height / 2, `+${gained}`, 'heal');
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, '#7fe3cf', 24, .9);
    ringAt(r.left + r.width / 2, r.top + r.height / 2, '#7fe3cf');
  }
}

/* ---------------- visual helpers ---------------- */
function shake() {
  const g = $('#game');
  g.classList.remove('shake');
  void g.offsetWidth;
  g.classList.add('shake');
  setTimeout(() => g.classList.remove('shake'), 360);
}

function floatText(x, y, text, kind = '') {
  const el = document.createElement('div');
  el.className = `damage-float ${kind}`;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function ringAt(x, y, color = '#f8e3a4') {
  const el = document.createElement('div');
  el.className = 'ring-fx';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.setProperty('--ring', color);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function slashAt(x, y, rot = -24) {
  const el = document.createElement('div');
  el.className = 'slash';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.setProperty('--rot', rot + 'deg');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 450);
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function log(text, tone = '') {
  const el = $('#log-text');
  el.textContent = text;
  el.classList.remove('hot', 'good');
  if (tone) el.classList.add(tone);
}

function banner(kicker, kanji, title, sub, cls = '') {
  const layer = $('#banner-layer');
  layer.innerHTML = '';
  const el = document.createElement('div');
  el.className = `banner ${cls}`;
  el.innerHTML = `<div class="b-kanji">${kanji}</div><div class="b-title">${title}</div><div class="b-sub">${sub || kicker}</div>`;
  layer.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 1700);
}

/* ---------------- command bar ---------------- */
function setCommands(items, text) {
  if (text !== undefined) cmdText.textContent = text;
  cmdActions.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.className = `btn ${it.cls || 'ghost'}`;
    b.dataset.action = it.action;
    b.textContent = it.label;
    if (it.disabled) b.disabled = true;
    cmdActions.appendChild(b);
  }
}

function defaultCommands() {
  if (state.over) {
    setCommands([{ label: 'DUEL AGAIN', action: 'again', cls: 'primary' }], 'The duel is decided.');
    return;
  }
  const playerTurn = state.active === 'player' && !state.busy;
  let hint = 'Select a spirit to issue a command.';
  if (!playerTurn) hint = 'The shadow priest moves. Watch the altar.';
  else if (state.player.monsters.every(m => !m.alive)) hint = 'Your line is broken. Use a relic, or end the turn.';
  else if (state.player.monsters.every(m => !m.alive || m.attacked)) hint = 'Every spirit has acted. End the turn when ready.';
  setCommands([
    { label: 'RULES', action: 'rules', cls: 'ghost' },
    { label: 'END TURN', action: 'end', cls: playerTurn ? 'primary' : 'ghost', disabled: !playerTurn }
  ], hint);
}

function monsterInfo(m, side) {
  const buff = m.buff ? ` (+${m.buff})` : '';
  return `${m.jp} · ATK ${m.atk + (m.buff || 0)}${buff} / DEF ${m.def}`;
}

function showCardInfo(side, kind, index) {
  if (kind === 'big') {
    const m = state[side].monsters[index];
    if (!m || !m.alive) { clearSelection(); return; }
    if (side === 'enemy') {
      setCommands([{ label: 'CLOSE', action: 'cancel', cls: 'ghost' }],
        `${m.jp} — ATK ${m.atk} / DEF ${m.def}. ${m.flavor}`);
      return;
    }
    if (state.active !== 'player' || state.busy) {
      setCommands([{ label: 'CLOSE', action: 'cancel', cls: 'ghost' }], monsterInfo(m, side));
      return;
    }
    if (m.attacked) {
      setCommands([{ label: 'CLOSE', action: 'cancel', cls: 'ghost' }],
        `${m.jp} has already attacked this turn.`);
      return;
    }
    const targets = state.enemy.monsters.filter(x => x.alive);
    setCommands([
      { label: 'CANCEL', action: 'cancel', cls: 'ghost' },
      { label: targets.length ? 'ATTACK' : 'DIRECT ATTACK', action: 'attack', cls: 'primary' }
    ], `${monsterInfo(m, side)} — ${targets.length ? 'choose a target.' : 'the enemy line is open.'}`);
  } else {
    const r = state[side].relics[index];
    if (!r) return;
    if (side === 'enemy') {
      setCommands([{ label: 'CLOSE', action: 'cancel', cls: 'ghost' }], `${r.jp} — ${r.desc}`);
      return;
    }
    if (state.active !== 'player' || state.busy) {
      setCommands([{ label: 'CLOSE', action: 'cancel', cls: 'ghost' }], `${r.jp} — ${r.desc}`);
      return;
    }
    if (r.used) {
      setCommands([{ label: 'CLOSE', action: 'cancel', cls: 'ghost' }], `${r.jp} has already been sealed.`);
      return;
    }
    let disabled = false;
    if (r.kind === 'heal' && state.player.lp >= MAX_LP) disabled = true;
    if (r.kind === 'buff' && !state.player.monsters.some(m => m.alive)) disabled = true;
    setCommands([
      { label: 'CANCEL', action: 'cancel', cls: 'ghost' },
      { label: 'ACTIVATE', action: 'activate', cls: 'primary', disabled }
    ], `${r.jp} — ${r.desc}${disabled ? ' (no valid target)' : ''}`);
  }
}

function selectCard(side, kind, index) {
  if (state.over) return;
  state.sel = { side, kind, index };
  state.mode = 'idle';
  state.attacker = null;
  refreshAll();
  showCardInfo(side, kind, index);
  Sound.play('select');
}

function clearSelection(quiet = false) {
  state.sel = null;
  state.mode = 'idle';
  state.attacker = null;
  refreshAll();
  defaultCommands();
  if (!quiet) Sound.play('cancel');
}

/* ---------------- tooltip ---------------- */
function tooltipHTML(card, kind) {
  if (kind === 'big') {
    return `<h4>${card.jp}<span class="tt-en">${card.en} · ${card.attrName}</span></h4>
      <div class="tt-stats"><span class="a">ATK ${card.atk}</span><span class="d">DEF ${card.def}</span><span>LV ${card.level}</span></div>
      <p>${card.flavor}</p>`;
  }
  return `<h4>${card.jp}<span class="tt-en">${card.en} · RELIC</span></h4>
    <div class="tt-stats"><span style="color:${card.accent}">${card.keyword}</span></div>
    <p>${card.desc}</p>`;
}

function placeTooltip(el, card, kind) {
  tooltip.innerHTML = tooltipHTML(card, kind);
  tooltip.classList.add('show');
  const r = el.getBoundingClientRect();
  const tr = tooltip.getBoundingClientRect();
  let left = r.left + r.width / 2 - tr.width / 2;
  left = clamp(left, 8, window.innerWidth - tr.width - 8);
  let top = r.top - tr.height - 10;
  if (top < 8) top = r.bottom + 10;
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideTooltip() { tooltip.classList.remove('show'); }

/* ---------------- turn UI ---------------- */
function updateTurnUI() {
  const pill = $('#turn-pill'), label = $('#turn-label');
  pill.classList.remove('enemy', 'over');
  if (state.over) {
    pill.classList.add('over');
    label.textContent = 'DUEL OVER';
  } else if (state.active === 'enemy') {
    pill.classList.add('enemy');
    label.textContent = 'ENEMY TURN';
  } else {
    label.textContent = 'YOUR TURN';
  }
  const enemyActive = state.active === 'enemy' && !state.over;
  const playerActive = state.active === 'player' && !state.over;
  $('#enemy-panel').classList.toggle('active', enemyActive);
  $('#player-panel').classList.toggle('active', playerActive);
  $('#enemy-side-tag').textContent = enemyActive ? 'ACTING' : 'STANDBY';
  $('#player-side-tag').textContent = playerActive ? 'YOUR TURN' : 'STANDBY';
  board.classList.toggle('enemy-turn', enemyActive);
  const dt = $('#divider-text');
  dt.textContent = state.over ? `TURN ${String(state.round).padStart(2, '0')} · DUEL OVER`
    : state.active === 'enemy' ? `TURN ${String(state.round).padStart(2, '0')} · ENEMY MOVE`
      : `TURN ${String(state.round).padStart(2, '0')} · YOUR MOVE`;
  dt.classList.toggle('enemy', enemyActive);
  refreshAll();
}

/* ---------------- combat ---------------- */
async function animateAttack(side, index, targetEl, direct = false) {
  const el = cardEl(side, 'big', index);
  if (!el || !targetEl) return;
  const motion = el.closest('.card-motion');
  const ar = el.getBoundingClientRect();
  const tr = targetEl.getBoundingClientRect();
  const dx = (tr.left + tr.width / 2 - (ar.left + ar.width / 2)) * (direct ? .35 : .52);
  const dy = (tr.top + tr.height / 2 - (ar.top + ar.height / 2)) * (direct ? .35 : .52);
  Sound.play('attack');
  const anim = motion.animate([
    { transform: 'translate(0,0) scale(1)' },
    { transform: `translate(${dx * .45}px,${dy * .45}px) scale(1.08)`, offset: .42 },
    { transform: `translate(${dx}px,${dy}px) scale(1.05)`, offset: .56 },
    { transform: `translate(${dx * .3}px,${dy * .3}px) scale(1.02)`, offset: .74 },
    { transform: 'translate(0,0) scale(1)' }
  ], { duration: 760, easing: 'cubic-bezier(.2,.8,.3,1)' });
  setTimeout(() => {
    if (targetEl.isConnected) {
      const r = targetEl.getBoundingClientRect();
      slashAt(r.left + r.width / 2, r.top + r.height / 2, -24);
      slashAt(r.left + r.width / 2, r.top + r.height / 2, 28);
    }
  }, 420);
  await anim.finished.catch(() => {});
  await wait(140);
}

async function destroyMonster(side, index, silent = false) {
  const token = state.duelId;
  const m = state[side].monsters[index];
  if (!m || !m.alive) return;
  m.alive = false;
  if (state.sel && state.sel.side === side && state.sel.kind === 'big' && state.sel.index === index) state.sel = null;
  const el = cardEl(side, 'big', index);
  if (el) {
    const r = el.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, m.accent, 30, 1.25);
    if (!silent) Sound.play('destroy');
    el.style.pointerEvents = 'none';
    const inner = el.querySelector('.card-inner');
    await inner.animate([
      { opacity: 1, transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
      { opacity: 1, transform: 'scale(1.07) rotate(-2deg)', filter: 'brightness(2.4) saturate(0)', offset: .2 },
      { opacity: 0, transform: 'scale(.7) rotate(10deg) translateY(18px)', filter: 'blur(7px) brightness(.35)' }
    ], { duration: 620, easing: 'cubic-bezier(.4,0,.7,1)', fill: 'forwards' }).finished.catch(() => {});
    el.remove();
  }
  if (token !== state.duelId) return;
  const slot = slotEl(side, 'big', index);
  if (slot) {
    slot.classList.add('is-empty');
    slot.classList.remove('targetable', 'selected');
  }
  if (side === 'enemy') state.stats.destroyed++;
  await wait(180);
}

async function playerAttack(target) {
  if (state.mode !== 'target' || state.attacker === null || state.busy || state.over) return;
  const token = state.duelId;
  const aIdx = state.attacker;
  const a = state.player.monsters[aIdx];
  if (!a || !a.alive || a.attacked) { clearSelection(true); return; }
  const aliveTargets = state.enemy.monsters.filter(m => m.alive);
  if (target.kind === 'monster') {
    const d = state.enemy.monsters[target.index];
    if (!d || !d.alive) return;
  } else if (target.kind === 'lp') {
    if (aliveTargets.length) return;
  } else return;

  state.busy = true;
  state.mode = 'idle';
  state.sel = null;
  state.attacker = null;
  refreshAll();
  updateTurnUI();
  setCommands([], target.kind === 'lp' ? `${a.jp} strikes the shadow priest directly!` : `${a.jp} attacks!`);

  const atkVal = a.atk + (a.buff || 0);
  if (target.kind === 'lp') {
    const targetEl = $('#enemy-panel');
    await animateAttack('player', aIdx, targetEl, true);
    if (token !== state.duelId) return;
    const dealt = damage('enemy', atkVal);
    log(`${a.jp} strikes directly. ${dealt} life points torn away.`, 'good');
    a.attacked = true;
  } else {
    const d = state.enemy.monsters[target.index];
    const dEl = cardEl('enemy', 'big', target.index);
    await animateAttack('player', aIdx, dEl);
    if (token !== state.duelId) return;
    const defVal = d.def;
    if (atkVal > defVal) {
      const dealt = damage('enemy', atkVal - defVal);
      log(`${a.jp} breaks ${d.jp}. ${dealt} damage carried through.`, 'good');
      await destroyMonster('enemy', target.index);
    } else if (atkVal < defVal) {
      const recoil = defVal - atkVal;
      damage('player', recoil);
      log(`${a.jp} is repelled by ${d.jp}. Recoil: ${recoil}.`, 'hot');
      await destroyMonster('player', aIdx);
    } else {
      log(`Equal force. ${a.jp} and ${d.jp} destroy each other.`, 'hot');
      await destroyMonster('enemy', target.index, true);
      await destroyMonster('player', aIdx, true);
      Sound.play('destroy');
    }
    a.attacked = true;
  }

  if (token !== state.duelId) return;
  state.roundAttacks++;
  state.busy = false;
  refreshAll();
  updateTurnUI();
  defaultCommands();
  checkWin();
}

/* ---------------- relics ---------------- */
function enterBuffMode(index) {
  state.mode = 'buff';
  state.sel = { side: 'player', kind: 'tiny', index };
  state.pendingRelic = index;
  refreshAll();
  setCommands([{ label: 'CANCEL', action: 'cancel', cls: 'ghost' }],
    'Choose one of your spirits to receive +800 ATK this turn.');
  Sound.play('select');
}

async function activateRelic(side, index, targetIndex = null) {
  const r = state[side].relics[index];
  if (!r || r.used || state.over) return;
  if (r.kind === 'buff' && side === 'player' && targetIndex === null) {
    if (!state.player.monsters.some(m => m.alive)) return;
    enterBuffMode(index);
    return;
  }
  if (r.kind === 'buff') {
    if (targetIndex === null) {
      const cand = state[side].monsters.find(m => m.alive && !m.attacked) || state[side].monsters.find(m => m.alive);
      if (!cand) return;
      targetIndex = state[side].monsters.indexOf(cand);
    }
    const target = state[side].monsters[targetIndex];
    if (!target || !target.alive) return;
  }

  r.used = true;
  const el = cardEl(side, 'tiny', index);
  if (el) {
    el.classList.add('activating');
    const rect = el.getBoundingClientRect();
    FX.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, r.accent, 26, 1);
    ringAt(rect.left + rect.width / 2, rect.top + rect.height / 2, r.accent);
  }

  if (r.kind === 'heal') {
    heal(side, r.value);
    log(`${side === 'player' ? 'You' : 'The priest'} drink${side === 'player' ? '' : 's'} from the sacred spring. +${r.value} LP.`, side === 'player' ? 'good' : 'hot');
  } else if (r.kind === 'shield') {
    state[side].shield += r.value;
    paintLP(side);
    Sound.play('shield');
    const lp = lpEls(side);
    const rect = lp.num.getBoundingClientRect();
    floatText(rect.left + rect.width / 2, rect.top + rect.height / 2, `+${r.value} ◈`, 'shield');
    ringAt(rect.left + rect.width / 2, rect.top + rect.height / 2, '#8fd8ff');
    FX.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#8fd8ff', 22, .9);
    log(`${side === 'player' ? 'A barrier' : 'The priest raises a barrier'} of ${r.value}. Damage will break it first.`);
  } else if (r.kind === 'burn') {
    const foe = other(side);
    const lp = lpEls(foe);
    const rect = lp.num.getBoundingClientRect();
    slashAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
    FX.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ff7a45', 30, 1.2);
    Sound.play('burn');
    damage(foe, r.value);
    log(`${side === 'player' ? 'Soul fire' : 'The priest\'s soul fire'} sears ${r.value} life points.`, side === 'player' ? 'good' : 'hot');
  } else if (r.kind === 'buff') {
    const target = state[side].monsters[targetIndex];
    target.buff += r.value;
    const cel = cardEl(side, 'big', targetIndex);
    if (cel) {
      const rect = cel.getBoundingClientRect();
      FX.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#f2d98b', 26, 1);
      ringAt(rect.left + rect.width / 2, rect.top + rect.height / 2, '#f2d98b');
      cel.animate([
        { filter: 'brightness(1)' },
        { filter: 'brightness(2.1) saturate(1.3)', offset: .3 },
        { filter: 'brightness(1)' }
      ], { duration: 620, easing: 'ease-out' });
    }
    Sound.play('buff');
    log(`${target.jp} receives the blade liturgy. ATK +${r.value} until turn end.`, side === 'player' ? 'good' : 'hot');
  }

  if (el) {
    el.classList.add('spent');
    setTimeout(() => el.classList.remove('activating'), 900);
  }
  refreshAll();
  paintLP(side);
  paintLP(other(side));
  state.busy = false;
  updateTurnUI();
  defaultCommands();
  checkWin();
}

/* ---------------- attacks / targeting ---------------- */
function beginAttack() {
  if (state.active !== 'player' || state.busy || state.over) return;
  if (!state.sel || state.sel.side !== 'player' || state.sel.kind !== 'big') return;
  const m = state.player.monsters[state.sel.index];
  if (!m || !m.alive || m.attacked) return;
  state.attacker = state.sel.index;
  state.mode = 'target';
  refreshAll();
  const alive = state.enemy.monsters.some(x => x.alive);
  setCommands([{ label: 'CANCEL', action: 'cancel', cls: 'ghost' }],
    alive ? `${m.jp} — choose an enemy spirit to strike.`
      : `${m.jp} — no spirits remain. Strike the shadow priest directly.`);
  if (!alive) toast('DIRECT ATTACK AVAILABLE');
  Sound.play('select');
}

function cancelMode() {
  if (state.mode === 'buff') state.pendingRelic = null;
  clearSelection();
}

/* ---------------- turn flow / AI ---------------- */
async function endPlayerTurn() {
  if (state.active !== 'player' || state.busy || state.over) return;
  const token = state.duelId;
  state.sel = null; state.mode = 'idle'; state.attacker = null; state.pendingRelic = null;
  state.busy = true;
  state.player.monsters.forEach(m => { m.buff = 0; });
  state.active = 'enemy';
  state.enemy.monsters.forEach(m => { if (m.alive) m.attacked = false; });
  refreshAll();
  updateTurnUI();
  defaultCommands();
  banner('ENEMY TURN', '影', 'ENEMY TURN', 'THE SHADOW PRIEST ACTS', 'enemy');
  Sound.play('turn');
  log('The torii dims. The shadow priest begins the invocation.');
  await wait(1000);
  if (token !== state.duelId) return;
  await enemySequence();
}

async function enemyRelicPhase() {
  const e = state.enemy;
  const find = k => e.relics.findIndex(r => r.kind === k && !r.used);
  const use = async (i, target = null) => {
    state.busy = true;
    await activateRelic('enemy', i, target);
    state.busy = true;
    updateTurnUI();
    defaultCommands();
    await wait(800);
  };
  if (state.over) return;

  let i = find('soulfire');
  if (i >= 0 && state.player.lp <= RELICS.soulfire.value) {
    await use(i); return;
  }

  i = find('spring');
  if (i >= 0 && e.lp <= 1700) { await use(i); return; }

  i = find('liturgy');
  if (i >= 0) {
    const targets = state.player.monsters.filter(t => t.alive);
    const candidates = e.monsters.map((m, idx) => ({ m, idx })).filter(x => x.m.alive && !x.m.attacked);
    for (const { m, idx } of candidates) {
      const canNow = targets.some(t => m.atk + m.buff > t.def);
      const canBuffed = targets.some(t => m.atk + m.buff + RELICS.liturgy.value > t.def);
      if (!canNow && canBuffed) { await use(i, idx); return; }
    }
  }

  i = find('ward');
  if (i >= 0 && e.shield === 0 && state.player.monsters.some(m => m.alive && m.atk >= 1800) && Math.random() < .8) {
    await use(i); return;
  }

  i = find('soulfire');
  if (i >= 0 && (state.player.lp <= 2100 || Math.random() < .25)) { await use(i); return; }

  i = find('spring');
  if (i >= 0 && e.lp <= 2700 && Math.random() < .55) { await use(i); return; }
}

async function enemyAttack(index, target) {
  const token = state.duelId;
  const a = state.enemy.monsters[index];
  if (!a || !a.alive || a.attacked || state.over) return;
  state.busy = true;
  updateTurnUI();
  setCommands([], `${a.jp} attacks!`);

  const atkVal = a.atk + (a.buff || 0);
  if (target.kind === 'lp') {
    await animateAttack('enemy', index, $('#player-panel'), true);
    if (token !== state.duelId) return;
    damage('player', atkVal);
    log(`${a.jp} strikes you directly. ${atkVal} life points lost.`, 'hot');
  } else {
    const d = state.player.monsters[target.index];
    if (!d || !d.alive) return;
    await animateAttack('enemy', index, cardEl('player', 'big', target.index));
    if (token !== state.duelId) return;
    if (atkVal > d.def) {
      const dealt = damage('player', atkVal - d.def);
      log(`${a.jp} shatters ${d.jp}. ${dealt} damage breaks through.`, 'hot');
      await destroyMonster('player', target.index);
    } else if (atkVal < d.def) {
      const recoil = d.def - atkVal;
      damage('enemy', recoil);
      log(`${a.jp} breaks against ${d.jp}. The priest takes ${recoil} recoil.`, 'good');
      await destroyMonster('enemy', index);
    } else {
      log(`Equal force. ${a.jp} and ${d.jp} destroy each other.`, 'hot');
      await destroyMonster('player', target.index, true);
      await destroyMonster('enemy', index, true);
      Sound.play('destroy');
    }
  }
  if (token !== state.duelId) return;
  a.attacked = true;
  state.roundAttacks++;
  refreshAll();
  paintLP('player');
  paintLP('enemy');
  checkWin();
}

async function enemySequence() {
  if (state.over) return;
  const token = state.duelId;
  await enemyRelicPhase();
  if (token !== state.duelId) return;
  await wait(450);
  if (token !== state.duelId) return;
  for (let i = 0; i < state.enemy.monsters.length; i++) {
    if (state.over || token !== state.duelId) return;
    const m = state.enemy.monsters[i];
    if (!m || !m.alive || m.attacked) continue;
    const targets = state.player.monsters
      .map((t, index) => ({ ...t, index }))
      .filter(t => t.alive);

    if (!targets.length) {
      await enemyAttack(i, { kind: 'lp' });
      await wait(750);
      continue;
    }

    let best = null, bestDelta = -Infinity;
    for (const t of targets) {
      const delta = (m.atk + (m.buff || 0)) - t.def;
      if (delta > bestDelta) { bestDelta = delta; best = { kind: 'monster', index: t.index }; }
    }
    if (best && bestDelta > 0) {
      await enemyAttack(i, best);
      await wait(700);
    } else {
      log(`${m.jp} circles the altar, searching for an opening.`);
      await wait(480);
    }
  }
  if (state.over || token !== state.duelId) return;
  await wait(450);
  if (token !== state.duelId) return;
  startPlayerTurn();
}

function startPlayerTurn() {
  if (state.over) return;
  state.round++;
  const idleRound = state.roundAttacks === 0;
  state.roundAttacks = 0;
  state.active = 'player';
  state.busy = false;
  state.sel = null; state.mode = 'idle'; state.attacker = null; state.pendingRelic = null;
  state.player.monsters.forEach(m => { if (m.alive) m.attacked = false; });
  state.enemy.monsters.forEach(m => { m.buff = 0; });
  refreshAll();
  updateTurnUI();
  defaultCommands();
  banner('YOUR TURN', '汝', 'YOUR TURN', 'THE ALTAR ANSWERS');
  Sound.play('turn');
  if (idleRound) {
    log('The altar grows impatient. Both duelists lose 300 life points.', 'hot');
    toast('THE ALTAR GROWS IMPATIENT · -300 LP EACH');
    damage('player', 300);
    damage('enemy', 300);
    checkWin();
    if (state.over) return;
  } else {
    log('Your spirits stir. Issue a command.');
  }
}

/* ---------------- victory / defeat ---------------- */
function checkWin() {
  if (state.over) return;
  if (state.enemy.lp <= 0) finishDuel(true);
  else if (state.player.lp <= 0) finishDuel(false);
}

async function finishDuel(win) {
  if (state.over) return;
  state.over = true;
  state.busy = true;
  state.sel = null; state.mode = 'idle'; state.attacker = null; state.pendingRelic = null;
  refreshAll();
  updateTurnUI();
  defaultCommands();
  banner(win ? 'VICTORY' : 'DEFEAT', win ? '勝利' : '敗北', win ? 'VICTORY' : 'DEFEAT',
    win ? 'THE SHRINE ACCEPTS YOUR OFFERING' : 'THE SHADOW CLAIMS YOU', win ? 'win' : 'lose');
  Sound.play(win ? 'win' : 'lose');
  if (win) setTimeout(() => FX.petals(), 260);
  const token = state.duelId;
  await wait(1250);
  if (token !== state.duelId) return;
  const ov = $('#overlay');
  ov.classList.toggle('defeat', !win);
  $('#overlay-kicker').textContent = win ? 'THE SHRINE HAS SPOKEN' : 'THE TORII CLOSES';
  $('#overlay-kanji').textContent = win ? '勝利' : '敗北';
  $('#overlay-title').textContent = win ? 'VICTORY' : 'DEFEAT';
  $('#overlay-sub').textContent = win
    ? 'The shadow priest falls. Sixteen cards, one altar, and the last word is yours.'
    : 'Your life points reach zero. The shrine keeps your name in its embers.';
  const spirits = state.player.monsters.filter(m => m.alive).length;
  $('#overlay-stats').innerHTML = `
    <div><b>${String(state.round).padStart(2, '0')}</b><span>TURNS</span></div>
    <div><b>${Math.round(state.player.lp)}</b><span>LP LEFT</span></div>
    <div><b>${spirits}</b><span>SPIRITS</span></div>
    <div><b>${state.stats.dealt}</b><span>DAMAGE</span></div>`;
  ov.hidden = false;
  ov.querySelector('.overlay-inner').style.animation = 'none';
  void ov.offsetWidth;
  ov.querySelector('.overlay-inner').style.animation = '';
}

/* ---------------- new duel ---------------- */
function newDuel() {
  state.duelId = (state.duelId || 0) + 1;
  state.round = 1;
  state.active = 'player';
  state.mode = 'idle';
  state.sel = null;
  state.attacker = null;
  state.pendingRelic = null;
  state.busy = true;
  state.over = false;
  state.stats = { dealt: 0, taken: 0, destroyed: 0 };
  state.roundAttacks = 0;
  const split = buildMonsterSplit();
  state.player = makeSide(split.player);
  state.enemy = makeSide(split.enemy);

  $('#overlay').hidden = true;
  $('#rules-modal').hidden = true;
  $('#banner-layer').innerHTML = '';
  $('#fx').classList.remove('front');
  hideTooltip();
  renderBoard();
  paintLP('player', true);
  paintLP('enemy', true);
  updateTurnUI();
  defaultCommands();
  dealAnimation();
  banner('DUEL START', '開', 'DUEL START', 'EIGHT SPIRITS · EIGHT RELICS · ONE ALTAR');
  log('Sixteen square cards settle on the altar. Your move.');
  const token = state.duelId;
  setTimeout(() => {
    if (token !== state.duelId || state.over) return;
    state.busy = false;
    updateTurnUI();
    defaultCommands();
  }, 1350);
}

/* ---------------- input ---------------- */
function onBoardClick(e) {
  if (state.over) return;
  const card = e.target.closest('.card');
  if (!card) {
    if (e.target.closest('.slot') && !state.busy) {
      if (state.mode !== 'idle') cancelMode(); else clearSelection();
    }
    return;
  }
  if (state.busy) return;
  const side = card.dataset.side;
  const kind = card.dataset.kind;
  const index = +card.dataset.index;

  if (state.mode === 'target') {
    if (side === 'enemy' && kind === 'big') playerAttack({ kind: 'monster', index });
    else if (side === 'player') cancelMode();
    return;
  }

  if (state.mode === 'buff') {
    if (side === 'player' && kind === 'big') {
      const m = state.player.monsters[index];
      if (m && m.alive) {
        const pending = state.pendingRelic;
        state.mode = 'idle';
        state.pendingRelic = null;
        state.sel = null;
        activateRelic('player', pending, index);
      }
    }
    return;
  }

  if (side === 'player' && state.active === 'player' && !state.busy && state.sel &&
      state.sel.side === side && state.sel.kind === kind && state.sel.index === index) {
    clearSelection();
    return;
  }
  selectCard(side, kind, index);
}

function onCommandClick(e) {
  const b = e.target.closest('button[data-action]');
  if (!b || b.disabled) return;
  const action = b.dataset.action;
  if (action === 'rules') { openRules(); return; }
  if (action === 'again') { newDuel(); return; }
  if (action === 'end') { endPlayerTurn(); return; }
  if (action === 'attack') { beginAttack(); return; }
  if (action === 'cancel') { cancelMode(); return; }
  if (action === 'activate') {
    if (state.sel && state.sel.side === 'player' && state.sel.kind === 'tiny') {
      activateRelic('player', state.sel.index);
    }
  }
}

function openRules() {
  if (state.busy || state.active === 'enemy') { toast('THE PRIEST IS MOVING'); return; }
  hideTooltip();
  $('#rules-modal').hidden = false;
  Sound.play('select');
}
function closeRules() {
  $('#rules-modal').hidden = true;
}

/* ---------------- scene decoration ---------------- */
function buildScene() {
  const stars = $('#stars');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 62 + '%';
    const size = Math.random() < .85 ? 1 : 2;
    s.style.width = s.style.height = size + 'px';
    s.style.setProperty('--tw', (2.5 + Math.random() * 5).toFixed(2) + 's');
    s.style.setProperty('--td', (Math.random() * 6).toFixed(2) + 's');
    s.style.opacity = (.2 + Math.random() * .6).toFixed(2);
    frag.appendChild(s);
  }
  stars.appendChild(frag);

  const lanterns = $('#lanterns');
  for (let i = 0; i < 7; i++) {
    const l = document.createElement('i');
    l.className = 'lantern';
    l.style.left = (5 + Math.random() * 90) + '%';
    l.style.bottom = (-5 + Math.random() * 10) + '%';
    l.style.setProperty('--s', (4 + Math.random() * 7).toFixed(1) + 'px');
    l.style.setProperty('--dur', (14 + Math.random() * 16).toFixed(1) + 's');
    l.style.setProperty('--delay', (Math.random() * 18).toFixed(1) + 's');
    l.style.setProperty('--drift', ((Math.random() - .5) * 90).toFixed(0) + 'px');
    lanterns.appendChild(l);
  }
}

/* ---------------- boot ---------------- */
function boot() {
  buildScene();
  FX.init();
  state.duelId = 0;
  newDuel();

  $('#board').addEventListener('click', onBoardClick);
  $('#board').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.card');
    if (!card) return;
    e.preventDefault();
    card.click();
  });
  cmdActions.addEventListener('click', onCommandClick);
  $('#enemy-panel').addEventListener('click', e => {
    if (state.mode === 'target' && state.attacker !== null && !state.enemy.monsters.some(m => m.alive)) {
      playerAttack({ kind: 'lp' });
    }
  });

  const restart = () => { Sound.ensure(); newDuel(); toast('A NEW DUEL BEGINS'); };
  $('#restart-btn').addEventListener('click', restart);
  $('#restart-icon').addEventListener('click', restart);
  $('#again-btn').addEventListener('click', () => { Sound.ensure(); newDuel(); });

  const soundBtn = $('#sound-btn');
  soundBtn.addEventListener('click', () => {
    Sound.muted = !Sound.muted;
    soundBtn.classList.toggle('muted', Sound.muted);
    soundBtn.setAttribute('aria-label', Sound.muted ? 'Unmute sound' : 'Mute sound');
    if (!Sound.muted) { Sound.ensure(); Sound.play('select'); }
  });

  $('#rules-btn').addEventListener('click', openRules);
  $('#help-inline')?.addEventListener('click', openRules);
  $('#rules-close').addEventListener('click', closeRules);
  $('#rules-ok').addEventListener('click', closeRules);
  $('#rules-modal').addEventListener('click', e => { if (e.target.id === 'rules-modal') closeRules(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('#rules-modal').hidden) { closeRules(); return; }
      if (state.mode !== 'idle' || state.sel) cancelMode();
    }
  });

  document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });

  /* hover tilt + tooltip (fine pointers only) */
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  board.addEventListener('pointermove', e => {
    if (!fine.matches) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
    card.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
    if (!card.contains(e.relatedTarget)) {
      const side = card.dataset.side, kind = card.dataset.kind, index = +card.dataset.index;
      const data = kind === 'big' ? state[side].monsters[index] : state[side].relics[index];
      if (data && !(kind === 'big' && !data.alive)) placeTooltip(card, data, kind);
    }
  });
  board.addEventListener('pointerout', e => {
    const card = e.target.closest('.card');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
      hideTooltip();
    }
  });
  board.addEventListener('pointerleave', () => {
    $$('.card').forEach(c => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
    hideTooltip();
  });

  window.addEventListener('blur', hideTooltip);
  window.addEventListener('scroll', hideTooltip, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
