/*
 * ZERO POINT — card database
 * Original cards. No third-party assets or trademarks.
 */
(function (global) {
  'use strict';

  const CARDS = {
    /* ---------------- MONSTERS ---------------- */
    imp: {
      id: 'imp', kind: 'monster', name: '火花のインプ', en: 'SPARK IMP', level: 3,
      atk: 1000, def: 2000, icon: '🔥', hue: 18, rarity: 'R',
      text: 'リバース：相手に1500ダメージ。',
      flip: { burn: 1500 },
      tag: 'リバース'
    },
    hound: {
      id: 'hound', kind: 'monster', name: '鉄壁の番犬', en: 'IRON HOUND', level: 3,
      atk: 800, def: 2100, icon: '🐺', hue: 205, rarity: 'N',
      text: '硬い守備力で攻撃を止める。',
      tag: '壁'
    },
    piercer: {
      id: 'piercer', kind: 'monster', name: '貫通の槍兵', en: 'PIERCER LANCER', level: 4,
      atk: 1800, def: 1000, icon: '🔱', hue: 45, rarity: 'R',
      text: '守備表示モンスターを攻撃した場合、守備力を超えた分の戦闘ダメージを与える。',
      continuous: { piercing: true },
      tag: '貫通'
    },
    mage: {
      id: 'mage', kind: 'monster', name: '黒炎の魔導士', en: 'BLACKFLAME MAGE', level: 4,
      atk: 1600, def: 1200, icon: '🧙', hue: 280, rarity: 'R',
      text: '召喚時：相手に500ダメージ。',
      onSummon: { burn: 500 },
      tag: '召喚時'
    },
    twin: {
      id: 'twin', kind: 'monster', name: '双子の刃', en: 'TWIN FANG', level: 4,
      atk: 1500, def: 1000, icon: '⚔️', hue: 330, rarity: 'R',
      text: 'このカードは1ターンに2回攻撃できる。',
      continuous: { doubleAttack: true },
      tag: '2回攻撃'
    },
    mirror: {
      id: 'mirror', kind: 'monster', name: '反射鏡の番人', en: 'MIRROR SENTINEL', level: 3,
      atk: 300, def: 2000, icon: '🪞', hue: 190, rarity: 'R',
      text: 'このカードが攻撃された時、相手に800ダメージ。',
      continuous: { attackedBurn: 800 },
      tag: '被攻撃'
    },
    fox: {
      id: 'fox', kind: 'monster', name: '墓守の狐', en: 'GRAVE FOX', level: 2,
      atk: 900, def: 900, icon: '🦊', hue: 25, rarity: 'R',
      text: 'リバース：相手のセットカード1枚を破壊する。',
      flip: { destroySetSpell: true },
      tag: 'リバース'
    },
    falcon: {
      id: 'falcon', kind: 'monster', name: '疾風の隼', en: 'GALE FALCON', level: 3,
      atk: 1100, def: 700, icon: '🦅', hue: 165, rarity: 'R',
      text: '相手モンスターがいても直接攻撃できる。',
      continuous: { direct: true },
      tag: '直接攻撃'
    },
    reaper: {
      id: 'reaper', kind: 'monster', name: '大鎌の死神', en: 'REAPER', level: 5,
      atk: 2400, def: 0, icon: '💀', hue: 260, rarity: 'SR',
      text: '圧倒的な攻撃力。守備表示には貫通しない。',
      tag: '高火力'
    },
    golem: {
      id: 'golem', kind: 'monster', name: '岩石のゴーレム', en: 'STONE GOLEM', level: 4,
      atk: 1200, def: 2000, icon: '🗿', hue: 35, rarity: 'N',
      text: '守備力2000の壁。',
      tag: '壁'
    },
    leech: {
      id: 'leech', kind: 'monster', name: '命喰い蛭', en: 'LIFE LEECH', level: 2,
      atk: 700, def: 1000, icon: '🪱', hue: 100, rarity: 'N',
      text: '戦闘ダメージを与えた時、その数値分ライフを回復する。',
      continuous: { lifesteal: true },
      tag: '吸収'
    },
    witch: {
      id: 'witch', kind: 'monster', name: '時空の魔女', en: 'VOID WITCH', level: 2,
      atk: 800, def: 1000, icon: '🔮', hue: 300, rarity: 'R',
      text: 'リバース：相手に500ダメージ。自分は1枚ドロー。',
      flip: { burn: 500, draw: 1 },
      tag: 'リバース'
    },
    sentinel: {
      id: 'sentinel', kind: 'monster', name: '守護天使', en: 'GUARDIAN ANGEL', level: 4,
      atk: 0, def: 2400, icon: '👼', hue: 50, rarity: 'N',
      text: '攻撃力0、守備力2400の鉄壁。',
      tag: '壁'
    },
    brute: {
      id: 'brute', kind: 'monster', name: '狂戦士', en: 'BERSERKER', level: 3,
      atk: 1500, def: 1000, icon: '🪓', hue: 5, rarity: 'N',
      text: '攻撃的な下級戦士。',
      tag: '攻撃'
    },
    colossus: {
      id: 'colossus', kind: 'monster', name: '巨神兵', en: 'COLOSSUS', level: 6,
      atk: 2800, def: 0, icon: '🗿', hue: 220, rarity: 'UR',
      text: '攻撃力2800の巨神。その一撃は致命的。',
      tag: '巨神'
    },
    wisp: {
      id: 'wisp', kind: 'monster', name: '灯火の精', en: 'WISP', level: 1,
      atk: 600, def: 800, icon: '🕯️', hue: 40, rarity: 'N',
      text: 'リバース：1枚ドロー。',
      flip: { draw: 1 },
      tag: 'リバース'
    },
    bulwark: {
      id: 'bulwark', kind: 'monster', name: '要塞鯨', en: 'BULWARK WHALE', level: 5,
      atk: 1000, def: 2600, icon: '🐋', hue: 200, rarity: 'SR',
      text: '守備力2600。圧倒的な壁。',
      tag: '壁'
    },

    /* ---------------- SPELLS ---------------- */
    fireball: {
      id: 'fireball', kind: 'spell', name: '火球', en: 'FIREBALL', icon: '☄️', hue: 15, rarity: 'N',
      text: '相手に1500ダメージ。',
      spell: { burn: 1500 }
    },
    pitfall: {
      id: 'pitfall', kind: 'spell', name: '落とし穴', en: 'PITFALL', icon: '🕳️', hue: 220, rarity: 'R',
      text: '相手のセットモンスター1体を破壊する。',
      spell: { destroySetMonster: true }
    },
    scan: {
      id: 'scan', kind: 'spell', name: '透視', en: 'SCAN', icon: '👁️', hue: 170, rarity: 'R',
      text: '相手のセット魔法・罠1枚を破壊する。',
      spell: { destroySetSpell: true }
    },
    rebirth: {
      id: 'rebirth', kind: 'spell', name: '蘇生', en: 'REBIRTH', icon: '✨', hue: 55, rarity: 'SR',
      text: '自分の墓地のモンスター1体を攻撃表示で特殊召喚する。',
      spell: { revive: true }
    },
    double: {
      id: 'double', kind: 'spell', name: '二連撃', en: 'DOUBLE STRIKE', icon: '⚡', hue: 45, rarity: 'R',
      text: '自分の攻撃力が最も高いモンスターは、このターンもう1回攻撃できる。',
      spell: { doubleTarget: true }
    },
    ignition: {
      id: 'ignition', kind: 'spell', name: '点火', en: 'IGNITION', icon: '🔥', hue: 20, rarity: 'SR',
      text: '自分の攻撃力が最も高いモンスターの攻撃力を+1000する。',
      spell: { buff: 1000 }
    },
    meteor: {
      id: 'meteor', kind: 'spell', name: '隕石', en: 'METEOR', icon: '🌠', hue: 250, rarity: 'SR',
      text: '相手フィールドにモンスターがいない場合、2500ダメージ。いる場合、800ダメージ。',
      spell: { burnNoMonsters: 2500, burnElse: 800 }
    },
    draw2: {
      id: 'draw2', kind: 'spell', name: '錬金術', en: 'ALCHEMY', icon: '🧪', hue: 140, rarity: 'N',
      text: '2枚ドローする。',
      spell: { draw: 2 }
    },
    offering: {
      id: 'offering', kind: 'spell', name: '生贄', en: 'OFFERING', icon: '🩸', hue: 350, rarity: 'R',
      text: '自分のモンスター1体を破壊し、相手に2000ダメージ。',
      spell: { tributeBurn: 2000 }
    },
    gale: {
      id: 'gale', kind: 'spell', name: '突風', en: 'GALE', icon: '💨', hue: 165, rarity: 'R',
      text: '相手モンスター1体を持ち主の手札に戻す。',
      spell: { bounceMonster: true }
    },

    /* ---------------- TRAPS ---------------- */
    mirrorShield: {
      id: 'mirrorShield', kind: 'trap', name: '鏡の盾', en: 'MIRROR SHIELD', icon: '🪞', hue: 190, rarity: 'R',
      text: '攻撃を無効にし、相手に800ダメージ。',
      trap: { onAttacked: 'negate', burn: 800 }
    },
    escape: {
      id: 'escape', kind: 'trap', name: '強制脱出', en: 'FORCED ESCAPE', icon: '💨', hue: 165, rarity: 'R',
      text: '相手モンスターの攻撃を無効にし、そのモンスターを持ち主の手札に戻す。',
      trap: { onAttacked: 'bounce' }
    },
    pitTrap: {
      id: 'pitTrap', kind: 'trap', name: '落とし穴・罠', en: 'PIT TRAP', icon: '🕳️', hue: 230, rarity: 'R',
      text: '相手モンスターの攻撃を無効にし、そのモンスターを破壊する。',
      trap: { onAttacked: 'destroy' }
    },
    chainBlast: {
      id: 'chainBlast', kind: 'trap', name: '連鎖爆発', en: 'CHAIN BLAST', icon: '💥', hue: 10, rarity: 'R',
      text: 'このカードが破壊された時、相手に1200ダメージ。',
      trap: { onDestroyedBurn: 1200 }
    },
    reflect: {
      id: 'reflect', kind: 'trap', name: '反射の陣', en: 'REFLECT ARRAY', icon: '🌀', hue: 195, rarity: 'SR',
      text: '戦闘ダメージを受ける時、そのダメージを相手に与える。',
      trap: { reflect: true }
    }
  };

  const FLIP_CARDS = new Set(Object.keys(CARDS).filter(id => CARDS[id].flip));

  if (!global.ZP) global.ZP = {};
  global.ZP.CARDS = CARDS;
  global.ZP.FLIP_CARDS = FLIP_CARDS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CARDS, FLIP_CARDS };
  }
})(typeof window !== 'undefined' ? window : globalThis);
