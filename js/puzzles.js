/*
 * ZERO POINT — puzzle stages.
 * Solutions are authored in card-id form and verified by tools/verify.cjs.
 */
(function (global) {
  'use strict';

  const ZP = global.ZP = global.ZP || {};

  const PUZZLES = [
    {
      id: 'p01', no: 1, name: '初撃', en: 'FIRST CONTACT', difficulty: 1,
      enemyName: '亡霊剣士', enemyTitle: 'WRAITH BLADE',
      playerLp: 4000, enemyLp: 2000, turnLimit: 2, par: 3,
      objective: '相手LPを0にせよ。',
      brief: '召喚 → 攻撃 → 魔法。LPを削る基本の三道。',
      tip: '召喚したモンスターは、そのターンに攻撃できる。',
      hand: ['imp', 'fireball'],
      deck: [],
      enemySetup: { monsters: [], spells: [] },
      solution: [
        { type: 'summon', card: 'imp', zone: 2 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'fireball' }
      ]
    },
    {
      id: 'p02', no: 2, name: '鉄壁', en: 'IRON WALL', difficulty: 2,
      enemyName: '鉄壁の番人', enemyTitle: 'IRON WARDEN',
      playerLp: 4000, enemyLp: 3200, turnLimit: 2, par: 4,
      objective: 'セットモンスターを突破してLPを0にせよ。',
      brief: '裏側守備表示は直接攻撃を遮る。除去してから殴れ。',
      tip: '裏側のまま破壊すれば、リバース効果は発動しない。',
      hand: ['piercer', 'fireball', 'pitfall'],
      deck: [],
      enemySetup: {
        monsters: [{ id: 'hound', zone: 2, pos: 'set' }],
        spells: []
      },
      enemyPlans: [[], [{ op: 'burn', amount: 500 }]],
      solution: [
        { type: 'activate', card: 'pitfall' },
        { type: 'summon', card: 'piercer', zone: 2 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'fireball' }
      ]
    },
    {
      id: 'p03', no: 3, name: '貫通', en: 'PIERCE THE WALL', difficulty: 2,
      enemyName: '岩石の巨人', enemyTitle: 'STONE TITAN',
      playerLp: 4000, enemyLp: 4500, turnLimit: 2, par: 6,
      objective: '守備力2000の壁を越え、LPを0にせよ。',
      brief: '攻撃力を上げ、貫通で壁を砕き、もう一撃を叩き込め。',
      tip: '「点火」は攻撃力が最も高いモンスターを強化する。',
      hand: ['piercer', 'ignition', 'double', 'fireball', 'pitfall'],
      deck: [],
      enemySetup: {
        monsters: [{ id: 'golem', zone: 2, pos: 'defense' }],
        spells: []
      },
      enemyPlans: [[{ op: 'burn', amount: 500 }]],
      solution: [
        { type: 'summon', card: 'piercer', zone: 2 },
        { type: 'activate', card: 'ignition' },
        { type: 'activate', card: 'double' },
        { type: 'attack', zone: 2, target: 2 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'fireball' }
      ]
    },
    {
      id: 'p04', no: 4, name: '伏兵', en: 'AMBUSH', difficulty: 3,
      enemyName: '墓守の狐', enemyTitle: 'GRAVE KEEPER',
      playerLp: 4000, enemyLp: 3600, turnLimit: 2, par: 4,
      objective: '危険なリバースモンスターを踏まずにLPを0にせよ。',
      brief: '攻撃すれば1500の逆襲。裏側のまま葬る手段を選べ。',
      tip: '「落とし穴」はセットモンスターを裏側のまま破壊する。',
      hand: ['pitfall', 'mage', 'fireball', 'scan'],
      deck: [],
      enemySetup: {
        monsters: [{ id: 'imp', zone: 0, pos: 'set' }],
        spells: [{ id: 'chainBlast', zone: 0 }]
      },
      enemyPlans: [[{ op: 'burn', amount: 400 }]],
      solution: [
        { type: 'activate', card: 'pitfall' },
        { type: 'summon', card: 'mage', zone: 2 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'fireball' }
      ]
    },
    {
      id: 'p05', no: 5, name: '反転', en: 'FLIP LINE', difficulty: 3,
      enemyName: '狂戦士', enemyTitle: 'BERSERKER',
      playerLp: 4000, enemyLp: 6500, turnLimit: 3, par: 6,
      objective: 'セットしたモンスターのリバース効果で流れを変えろ。',
      brief: '裏側守備で迎え撃ち、反転の業火で相手を焼け。',
      tip: 'セットしたモンスターは相手に攻撃されるとリバースする。',
      hand: ['imp', 'hound', 'fireball', 'meteor', 'pitfall'],
      deck: [],
      enemySetup: {
        monsters: [{ id: 'brute', zone: 0, pos: 'attack' }],
        spells: []
      },
      solution: [
        { type: 'setMonster', card: 'imp', zone: 2 },
        { type: 'endTurn' },
        { type: 'changePosition', zone: 2 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'fireball' },
        { type: 'activate', card: 'meteor' }
      ]
    },
    {
      id: 'p06', no: 6, name: '反射', en: 'MIRROR EDGE', difficulty: 3,
      enemyName: '巨神兵', enemyTitle: 'COLOSSUS',
      playerLp: 3000, enemyLp: 4000, turnLimit: 2, par: 3,
      objective: '3000の一撃を反射し、LPを0にせよ。',
      brief: 'セットした罠は相手ターンから使える。受ける前に仕込め。',
      tip: '「反射の陣」は戦闘ダメージをそのまま相手に返す。',
      hand: ['reflect', 'sentinel', 'fireball', 'meteor', 'hound'],
      deck: [],
      enemySetup: {
        monsters: [{ id: 'colossus', zone: 0, pos: 'attack' }],
        spells: []
      },
      solution: [
        { type: 'setSpell', card: 'reflect', zone: 0 },
        { type: 'endTurn' },
        { type: 'activate', card: 'fireball' }
      ]
    },
    {
      id: 'p07', no: 7, name: '連鎖', en: 'CHAIN REACTION', difficulty: 4,
      enemyName: '守護天使', enemyTitle: 'GUARDIAN ANGEL',
      playerLp: 4000, enemyLp: 7000, turnLimit: 3, par: 8,
      objective: '二枚の壁を処理し、8手以内にLPを0にせよ。',
      brief: '除去、召喚、強化、二連撃、追撃。全てを繋げ。',
      tip: '「二連撃」は攻撃前に使う。1体で壁とLPを同時に削れる。',
      hand: ['pitfall', 'reaper', 'ignition', 'double', 'meteor', 'fireball', 'scan', 'mirrorShield'],
      deck: [],
      enemySetup: {
        monsters: [
          { id: 'hound', zone: 0, pos: 'set' },
          { id: 'sentinel', zone: 2, pos: 'defense' }
        ],
        spells: [{ id: 'chainBlast', zone: 0 }]
      },
      enemyPlans: [[{ op: 'burn', amount: 400 }], [{ op: 'burn', amount: 600 }]],
      solution: [
        { type: 'activate', card: 'pitfall' },
        { type: 'summon', card: 'reaper', zone: 2 },
        { type: 'activate', card: 'ignition' },
        { type: 'activate', card: 'double' },
        { type: 'attack', zone: 2, target: 2 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'meteor' },
        { type: 'activate', card: 'fireball' }
      ]
    },
    {
      id: 'p08', no: 8, name: '零', en: 'ZERO POINT', difficulty: 5,
      enemyName: '巨神兵・零式', enemyTitle: 'COLOSSUS ZERO',
      playerLp: 3000, enemyLp: 8000, turnLimit: 3, par: 10,
      objective: '伏兵、巨神、罠。すべてを越えてLPを0にせよ。',
      brief: '最後の盤面。セットされた罠とリバースを読み切り、最短で零へ。',
      tip: '巨神は「突風」で退かせ。リバース持ちは裏側のまま消せ。',
      hand: ['reflect', 'pitfall', 'gale', 'reaper', 'ignition', 'double', 'meteor', 'fireball', 'scan', 'mirrorShield'],
      deck: [],
      enemySetup: {
        monsters: [
          { id: 'imp', zone: 0, pos: 'set' },
          { id: 'witch', zone: 1, pos: 'set' },
          { id: 'colossus', zone: 2, pos: 'attack' }
        ],
        spells: [{ id: 'chainBlast', zone: 0 }]
      },
      enemyPlans: [null, [{ op: 'burn', amount: 700 }]],
      solution: [
        { type: 'setSpell', card: 'reflect', zone: 0 },
        { type: 'endTurn' },
        { type: 'activate', card: 'pitfall' },
        { type: 'activate', card: 'gale' },
        { type: 'summon', card: 'reaper', zone: 2 },
        { type: 'activate', card: 'ignition' },
        { type: 'activate', card: 'double' },
        { type: 'attack', zone: 2, target: 1 },
        { type: 'attack', zone: 2, target: 'direct' },
        { type: 'activate', card: 'meteor' }
      ]
    }
  ];

  ZP.PUZZLES = PUZZLES;
  ZP.getPuzzle = id => PUZZLES.find(p => p.id === id) || PUZZLES[0];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PUZZLES, getPuzzle: ZP.getPuzzle };
  }
})(typeof window !== 'undefined' ? window : globalThis);
