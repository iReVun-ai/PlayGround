'use strict';

/* ------------------------------------------------------------------
   カード定義
   type: monster / spell / trap / extra
   flip: リバース効果  /  onSummon: 特殊召喚時効果
   fieldBoost: フィールド魔法の攻撃力上昇
------------------------------------------------------------------- */
const CARD_DB = {
  // ---------- モンスター ----------
  raikou: {
    name: '迅雷の剣士', type: 'monster', level: 4, atk: 1800, def: 1200,
    art: '雷', a: '#f6cf63', b: '#5d3c08',
    desc: '雷をまとう最速の剣士。先手を取れ。'
  },
  enma: {
    name: '紅蓮の魔導士', type: 'monster', level: 4, atk: 1600, def: 1000,
    art: '炎', a: '#ff8a5b', b: '#6d1608',
    desc: '紅蓮の炎を操る魔導士。'
  },
  guardian: {
    name: '鉄壁のガーディアン', type: 'monster', level: 4, atk: 900, def: 2200,
    art: '盾', a: '#a9c7dd', b: '#26394d',
    desc: '鉄壁の守り。裏側セットで相手を止めろ。'
  },
  ninja: {
    name: '影走りの忍者', type: 'monster', level: 3, atk: 1300, def: 800,
    art: '忍', a: '#b18aff', b: '#241a3f',
    desc: '影から現れる忍。'
  },
  wolf: {
    name: '白銀の狼', type: 'monster', level: 4, atk: 1700, def: 1100,
    art: '狼', a: '#dbe9f5', b: '#334c63',
    desc: '銀色の毛並みを持つ俊足の狼。'
  },
  siren: {
    name: '蒼海のセイレーン', type: 'monster', level: 4, atk: 1500, def: 1600,
    art: '海', a: '#6fe3e8', b: '#0e3a4d',
    desc: '海を統べる歌姫。'
  },
  lancer: {
    name: '電光の槍兵', type: 'monster', level: 4, atk: 1900, def: 900,
    art: '槍', a: '#ffe96e', b: '#4a3a05',
    desc: '雷を槍に変えて放つ。'
  },
  bird: {
    name: '灼熱の鳥', type: 'monster', level: 4, atk: 1500, def: 1200,
    art: '鷹', a: '#ffb15c', b: '#6b2408',
    flip: { burn: 500 },
    desc: 'リバース：相手に500ダメージ。'
  },
  spirit: {
    name: '守護の精霊', type: 'monster', level: 3, atk: 800, def: 2000,
    art: '精', a: '#8af0c2', b: '#123f33',
    flip: { heal: 800 },
    desc: 'リバース：自分は800LP回復。'
  },
  twin: {
    name: '双頭の竜', type: 'monster', level: 6, atk: 2400, def: 2000,
    art: '龍', a: '#e08cff', b: '#3a0b4a',
    desc: '生贄1体。双頭のブレスで攻めろ。'
  },
  knight: {
    name: '天空の騎士', type: 'monster', level: 5, atk: 2100, def: 1800,
    art: '騎', a: '#8fd8ff', b: '#143a5c',
    desc: '生贄1体。空を裂く騎士。'
  },
  golem: {
    name: '岩石の巨人', type: 'monster', level: 5, atk: 2000, def: 2300,
    art: '岩', a: '#c3b08f', b: '#3d3324',
    desc: '生贄1体。守備力2300の岩の巨人。'
  },

  // ---------- 魔法 ----------
  fireball: {
    name: '火球', type: 'spell', art: '火', a: '#ff9a52', b: '#551204',
    desc: '相手に1000ダメージ。'
  },
  greatfire: {
    name: '大火球', type: 'spell', art: '焔', a: '#ff6b4a', b: '#4e0a04',
    desc: '相手に1500ダメージ。'
  },
  lightning: {
    name: '落雷', type: 'spell', art: '落', a: '#9fd8ff', b: '#122b4c',
    desc: '相手モンスター1体を破壊する。', target: 'enemyMonster'
  },
  gale: {
    name: '疾風の剣', type: 'spell', art: '風', a: '#8ff0d2', b: '#0c3a30',
    desc: '自分のモンスター全員の攻撃力＋700（このターン）。'
  },
  wisdom: {
    name: '英知の書', type: 'spell', art: '書', a: '#d6c6ff', b: '#2a1c4e',
    desc: 'カードを2枚ドロー。'
  },
  revive: {
    name: '蘇生の儀', type: 'spell', art: '蘇', a: '#9df0a4', b: '#123c1c',
    desc: '自分の墓地の最強モンスターを守備表示で特殊召喚。'
  },
  evilLight: {
    name: '破邪の光', type: 'spell', art: '光', a: '#fff3a8', b: '#5c4a0c',
    desc: '相手の裏側守備モンスターを全て破壊し、300×枚数ダメージ。'
  },
  fieldwind: {
    name: '疾風の草原', type: 'spell', field: true, fieldBoost: 300,
    art: '草', a: '#8fe08a', b: '#15401f',
    desc: 'フィールド魔法：自分のモンスターの攻撃力＋300。'
  },

  // ---------- 罠 ----------
  ambush: {
    name: '伏兵の罠', type: 'trap', art: '罠', a: '#d8a5ff', b: '#2f1247',
    desc: '相手の攻撃を無効にし、攻撃モンスターを破壊。'
  },
  mirror: {
    name: '鏡の盾', type: 'trap', art: '鏡', a: '#b5e6ff', b: '#163a4f',
    desc: '相手の攻撃を無効にし、800ダメージ。'
  },
  morale: {
    name: '士気高揚', type: 'trap', art: '鼓', a: '#ffd28f', b: '#4a2a08',
    desc: '攻撃されたモンスターの攻撃力・守備力＋1000。'
  },
  pitfall: {
    name: '落とし穴', type: 'trap', art: '穴', a: '#c3a58c', b: '#33241a',
    desc: '相手が攻撃力1800以上のモンスターを召喚した時、それを破壊。'
  },

  // ---------- エクストラ ----------
  linkdragon: {
    name: '双星のリンクドラゴン', type: 'extra', level: 8, atk: 2800, def: 2200,
    art: '星', a: '#ff9ad5', b: '#3c0b47',
    onSummon: { burn: 500 },
    desc: '生贄2体。特殊召喚時、相手に500ダメージ。'
  },
  titan: {
    name: '不滅の巨神', type: 'extra', level: 10, atk: 3200, def: 2600,
    art: '神', a: '#ffe08a', b: '#3a2a06',
    onSummon: { destroyStrongest: true },
    desc: '生贄2体。特殊召喚時、相手の最強モンスターを破壊。'
  }
};

const DECK_LIST = [
  // モンスター 17
  'raikou', 'raikou',
  'enma', 'enma',
  'guardian', 'guardian',
  'ninja', 'ninja',
  'wolf', 'wolf',
  'siren',
  'lancer',
  'bird',
  'spirit',
  'twin',
  'knight',
  'golem',
  // 魔法 11
  'fireball', 'fireball',
  'greatfire', 'greatfire',
  'lightning',
  'gale',
  'wisdom', 'wisdom',
  'revive',
  'evilLight',
  'fieldwind',
  // 罠 6
  'ambush', 'ambush',
  'mirror', 'mirror',
  'morale',
  'pitfall'
];

const EXTRA_LIST = ['linkdragon', 'titan'];
