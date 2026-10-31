/* ============================================================
   LPto0 — card database
   24-zone set-summon duel
   ============================================================ */

window.CARDS = {
  /* ---------------- MONSTERS ---------------- */
  drake: {
    name: "NEON DRAKE", jp: "ネオン・ドレイク", type: "monster",
    atk: 1800, def: 1200, level: 4, element: "FIRE", glyph: "龍",
    colors: ["#ff8a3d", "#ff2e63"], glow: "#ff7a45",
    effect: "burn300",
    desc: "On Summon: deal 300 damage to your opponent."
  },
  hound: {
    name: "BLAST HOUND", jp: "ブラスト・ハウンド", type: "monster",
    atk: 1500, def: 800, level: 3, element: "FIRE", glyph: "牙",
    colors: ["#ff5e3a", "#8a1cff"], glow: "#ff5e3a",
    effect: "burn400ifMonster",
    desc: "On Summon: if your opponent controls a monster, deal 400 damage."
  },
  oracle: {
    name: "CIRCUIT ORACLE", jp: "サーキット・オラクル", type: "monster",
    atk: 1000, def: 1400, level: 3, element: "ARC", glyph: "眼",
    colors: ["#39e6ff", "#1a4dff"], glow: "#39e6ff",
    effect: "flipDraw",
    desc: "FLIP: Draw 1 card."
  },
  golem: {
    name: "BASTION GOLEM", jp: "バスティオン・ゴーレム", type: "monster",
    atk: 900, def: 2200, level: 4, element: "EARTH", glyph: "岩",
    colors: ["#9ca3af", "#3b4a6b"], glow: "#aab4cc",
    effect: "battleShield",
    desc: "Once per turn, this card cannot be destroyed by battle."
  },
  ronin: {
    name: "IRON RONIN", jp: "アイアン・ローニン", type: "monster",
    atk: 1600, def: 1800, level: 4, element: "STEEL", glyph: "侍",
    colors: ["#d8dee9", "#697586"], glow: "#c7d2e3",
    effect: "setDef400",
    desc: "While face-down, this card gains 400 DEF."
  },
  kitsune: {
    name: "CHRONO KITSUNE", jp: "クロノ・キツネ", type: "monster",
    atk: 1200, def: 1200, level: 3, element: "TIME", glyph: "狐",
    colors: ["#c084fc", "#f472b6"], glow: "#d18aff",
    effect: "flipBuff500",
    desc: "FLIP: This card gains 500 ATK permanently."
  },
  healer: {
    name: "PULSE MEDIC", jp: "パルス・メディック", type: "monster",
    atk: 800, def: 1600, level: 3, element: "LIGHT", glyph: "癒",
    colors: ["#7cf7c4", "#0ea5e9"], glow: "#6ff7c4",
    effect: "heal600",
    desc: "On Summon: gain 600 LP."
  },
  assassin: {
    name: "VOID ASSASSIN", jp: "ヴォイド・アサシン", type: "monster",
    atk: 1700, def: 700, level: 4, element: "DARK", glyph: "影",
    colors: ["#8b5cf6", "#111827"], glow: "#9f7aea",
    effect: "pierce",
    desc: "Piercing: battle damage is dealt when attacking Defense Position monsters."
  },
  wyrm: {
    name: "OVERDRIVE WYRM", jp: "オーバードライブ・ワーム", type: "monster",
    atk: 2400, def: 1000, level: 4, element: "FIRE", glyph: "竜",
    colors: ["#ffb703", "#fb5607"], glow: "#ffb703",
    effect: "selfBurn500",
    desc: "On Summon: take 500 damage. Raw power at a price."
  },
  paladin: {
    name: "AEGIS PALADIN", jp: "イージス・パラディン", type: "monster",
    atk: 1500, def: 1700, level: 4, element: "LIGHT", glyph: "盾",
    colors: ["#fde68a", "#f59e0b"], glow: "#fde68a",
    effect: "damageCut300",
    desc: "While face-up, battle damage you take is reduced by 300."
  },
  serpent: {
    name: "DATA SERPENT", jp: "データ・サーペント", type: "monster",
    atk: 1300, def: 1100, level: 3, element: "WATER", glyph: "蛇",
    colors: ["#67e8f9", "#2563eb"], glow: "#67e8f9",
    effect: "onDestroyDraw",
    desc: "If this card is destroyed by battle: draw 1 card."
  },

  /* ---------------- SPELLS ---------------- */
  nova: {
    name: "NOVA LANCE", jp: "ノヴァ・ランス", type: "spell",
    glyph: "光", colors: ["#ffd166", "#ff5e3a"], glow: "#ffd166",
    target: null, effect: "nova",
    desc: "Deal 1200 damage to your opponent."
  },
  patch: {
    name: "PATCH KIT", jp: "パッチ・キット", type: "spell",
    glyph: "＋", colors: ["#6ee7b7", "#0ea5e9"], glow: "#6ee7b7",
    target: null, effect: "patch",
    desc: "Gain 1000 LP."
  },
  overclock: {
    name: "OVERCLOCK", jp: "オーバークロック", type: "spell",
    glyph: "雷", colors: ["#facc15", "#f43f5e"], glow: "#facc15",
    target: "ownMonster", effect: "overclock",
    desc: "Target 1 face-up monster you control. It gains 800 ATK until the end of the turn."
  },
  shatter: {
    name: "SHATTER CODE", jp: "シャッター・コード", type: "spell",
    glyph: "砕", colors: ["#f472b6", "#7c3aed"], glow: "#f472b6",
    target: "enemyMonster", effect: "shatter",
    desc: "Destroy 1 monster your opponent controls."
  },
  draw2: {
    name: "DATA DRAW", jp: "データ・ドロー", type: "spell",
    glyph: "引", colors: ["#60a5fa", "#34d399"], glow: "#60a5fa",
    target: null, effect: "draw2",
    desc: "Draw 2 cards."
  },
  emp: {
    name: "EMP FIELD", jp: "EMPフィールド", type: "spell",
    glyph: "波", colors: ["#a78bfa", "#22d3ee"], glow: "#a78bfa",
    target: null, effect: "emp",
    desc: "All monsters your opponent controls lose 500 ATK until the end of the turn."
  },

  /* ---------------- TRAPS ---------------- */
  mirror: {
    name: "MIRROR VEIL", jp: "ミラー・ヴェール", type: "trap",
    glyph: "鏡", colors: ["#93c5fd", "#c084fc"], glow: "#93c5fd",
    effect: "mirror",
    desc: "When your opponent declares an attack: negate the attack and destroy the attacking monster."
  },
  spike: {
    name: "SPIKE GRID", jp: "スパイク・グリッド", type: "trap",
    glyph: "棘", colors: ["#fb7185", "#7f1d1d"], glow: "#fb7185",
    effect: "spike",
    desc: "When your opponent declares an attack: deal 700 damage to them, then the attack continues."
  },
  snare: {
    name: "SIGNAL SNARE", jp: "シグナル・スネア", type: "trap",
    glyph: "罠", colors: ["#fbbf24", "#b45309"], glow: "#fbbf24",
    effect: "snare",
    desc: "When your opponent declares an attack: the attacking monster loses 1000 ATK until the end of the turn."
  },
  ambush: {
    name: "AMBUSH PROTOCOL", jp: "アンブッシュ・プロトコル", type: "trap",
    glyph: "伏", colors: ["#34d399", "#065f46"], glow: "#34d399",
    effect: "ambush",
    desc: "When a face-down monster you control is attacked: flip it face-up and it gains 1000 ATK/DEF for that battle."
  },
  ward: {
    name: "RECOVERY WARD", jp: "リカバリー・ウォード", type: "trap",
    glyph: "救", colors: ["#86efac", "#0891b2"], glow: "#86efac",
    effect: "ward",
    desc: "When you take battle damage: gain 700 LP."
  }
};

/* 20-card decks. Monster : Spell : Trap = 12 : 5 : 3 */
window.DECKS = {
  player: [
    "drake", "drake",
    "hound", "hound",
    "oracle", "oracle",
    "golem", "golem",
    "ronin",
    "kitsune",
    "healer",
    "assassin",
    "nova", "nova",
    "patch",
    "overclock",
    "shatter",
    "mirror",
    "ambush",
    "spike"
  ],
  opponent: [
    "wyrm", "wyrm",
    "drake", "drake",
    "hound", "hound",
    "golem", "golem",
    "oracle",
    "ronin",
    "kitsune",
    "healer",
    "nova", "nova",
    "patch",
    "emp",
    "shatter",
    "mirror",
    "snare",
    "spike"
  ]
};
