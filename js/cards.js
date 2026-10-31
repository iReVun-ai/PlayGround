/* LP→0 — card database
 * Five attributes, five duelists' worth of monsters, and a tight spell/trap suite.
 */

export const ATTRIBUTES = {
  ember: {
    label: 'EMBER',
    jp: '焔',
    a: '#ffb15c',
    b: '#ff3d4f',
    deep: '#2a0709',
    glow: '#ff7a3d',
  },
  tide: {
    label: 'TIDE',
    jp: '潮',
    a: '#7bf0ff',
    b: '#2d6bff',
    deep: '#04162c',
    glow: '#46d8ff',
  },
  verdant: {
    label: 'VERDANT',
    jp: '翠',
    a: '#a6ff9c',
    b: '#11b978',
    deep: '#041d15',
    glow: '#62ffab',
  },
  lumen: {
    label: 'LUMEN',
    jp: '光',
    a: '#fff2a8',
    b: '#ffb01f',
    deep: '#2a1a04',
    glow: '#ffd35e',
  },
  void: {
    label: 'VOID',
    jp: '虚',
    a: '#e2b6ff',
    b: '#7b3dff',
    deep: '#17082c',
    glow: '#bb76ff',
  },
};

/** Monster cards. `art` selects the procedural illustration. */
export const CARDS = {
  /* ── SOLAR COVENANT · player ─────────────────────────────── */
  ember_drake: {
    id: 'ember_drake', name: 'Ember Drake', jp: 'エンバー・ドレイク',
    type: 'monster', attribute: 'ember', level: 4, atk: 1800, def: 1200,
    rarity: 2, art: 'dragon',
    text: '召喚時：相手に300ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 300 }],
  },
  lumen_acolyte: {
    id: 'lumen_acolyte', name: 'Lumen Acolyte', jp: 'ルーメン・アコライト',
    type: 'monster', attribute: 'lumen', level: 3, atk: 900, def: 1800,
    rarity: 1, art: 'mage',
    text: '召喚時：LPを500回復。',
    effects: [{ on: 'summon', kind: 'heal', value: 500 }],
  },
  solar_guard: {
    id: 'solar_guard', name: 'Solar Guard', jp: 'ソーラー・ガード',
    type: 'monster', attribute: 'lumen', level: 4, atk: 1500, def: 1600,
    rarity: 1, art: 'sentinel',
    text: 'シールド：このカードが関わる戦闘で自分は戦闘ダメージを受けない。',
    passive: { shielded: true },
  },
  cinder_hound: {
    id: 'cinder_hound', name: 'Cinder Hound', jp: 'シンダー・ハウンド',
    type: 'monster', attribute: 'ember', level: 3, atk: 1400, def: 900,
    rarity: 2, art: 'beast',
    text: '召喚時：自分のモンスター全てのATKを300アップ。',
    effects: [{ on: 'summon', kind: 'buff_all', value: 300 }],
  },
  dawn_falcon: {
    id: 'dawn_falcon', name: 'Dawn Falcon', jp: 'ドーン・ファルコン',
    type: 'monster', attribute: 'lumen', level: 4, atk: 1700, def: 1000,
    rarity: 2, art: 'falcon',
    text: '貫通：守備モンスターを攻撃した時、超過ダメージを与える。',
    passive: { pierce: true },
  },
  ember_colossus: {
    id: 'ember_colossus', name: 'Ember Colossus', jp: 'エンバー・コロッサス',
    type: 'monster', attribute: 'ember', level: 6, atk: 2400, def: 2000,
    rarity: 3, art: 'golem',
    text: '召喚時：相手に600ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 600 }],
  },
  radiant_seraph: {
    id: 'radiant_seraph', name: 'Radiant Seraph', jp: 'レディアント・セラフ',
    type: 'monster', attribute: 'lumen', level: 6, atk: 2300, def: 2100,
    rarity: 3, art: 'seraph',
    text: '召喚時：LPを1000回復。',
    effects: [{ on: 'summon', kind: 'heal', value: 1000 }],
  },
  sunscale_wyrm: {
    id: 'sunscale_wyrm', name: 'Sunscale Wyrm', jp: 'サンスケイル・ワイアーム',
    type: 'monster', attribute: 'lumen', level: 5, atk: 2100, def: 1700,
    rarity: 2, art: 'wyrm',
    text: '召喚時：カードを1枚ドロー。',
    effects: [{ on: 'summon', kind: 'draw', value: 1 }],
  },
  flame_dancer: {
    id: 'flame_dancer', name: 'Flame Dancer', jp: 'フレイム・ダンサー',
    type: 'monster', attribute: 'ember', level: 3, atk: 1200, def: 1000,
    rarity: 1, art: 'dancer',
    text: '召喚時：相手に300ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 300 }],
  },
  aegis_bearer: {
    id: 'aegis_bearer', name: 'Aegis Bearer', jp: 'イージス・ベアラー',
    type: 'monster', attribute: 'lumen', level: 4, atk: 800, def: 2400,
    rarity: 2, art: 'warden',
    text: '挑発：相手は可能な限りこのモンスターを攻撃しなければならない。',
    passive: { taunt: true },
  },
  phoenix_chick: {
    id: 'phoenix_chick', name: 'Phoenix Chick', jp: 'フェニックス・チック',
    type: 'monster', attribute: 'ember', level: 2, atk: 700, def: 700,
    rarity: 1, art: 'phoenix',
    text: '破壊された時：相手に400ダメージ。',
    effects: [{ on: 'destroyed', kind: 'burn', value: 400 }],
  },
  prism_mage: {
    id: 'prism_mage', name: 'Prism Mage', jp: 'プリズム・メイジ',
    type: 'monster', attribute: 'lumen', level: 4, atk: 1600, def: 1400,
    rarity: 2, art: 'mage',
    text: '召喚時：カードを1枚ドロー。',
    effects: [{ on: 'summon', kind: 'draw', value: 1 }],
  },
  ember_knight: {
    id: 'ember_knight', name: 'Ember Knight', jp: 'エンバー・ナイト',
    type: 'monster', attribute: 'ember', level: 4, atk: 1900, def: 1000,
    rarity: 1, art: 'knight',
    text: '焔で鍛えられた前衛。攻め手として頼れる一枚。',
  },
  solar_paladin: {
    id: 'solar_paladin', name: 'Solar Paladin', jp: 'ソーラー・パラディン',
    type: 'monster', attribute: 'lumen', level: 5, atk: 2000, def: 2000,
    rarity: 3, art: 'paladin',
    text: 'ドレイン：このカードが与えた戦闘ダメージ分、LPを回復。',
    passive: { lifesteal: true },
  },
  ash_shade: {
    id: 'ash_shade', name: 'Ash Shade', jp: 'アッシュ・シェイド',
    type: 'monster', attribute: 'ember', level: 3, atk: 1300, def: 1200,
    rarity: 1, art: 'phantom',
    text: '召喚時：相手に200ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 200 }],
  },
  zenith_dragon: {
    id: 'zenith_dragon', name: 'Zenith Dragon', jp: 'ゼニス・ドラゴン',
    type: 'monster', attribute: 'lumen', level: 8, atk: 3000, def: 2500,
    rarity: 4, art: 'dragon',
    text: '召喚時：相手の最も強いモンスター1体を破壊。',
    effects: [{ on: 'summon', kind: 'destroy_strongest' }],
  },
  halo_guardian: {
    id: 'halo_guardian', name: 'Halo Guardian', jp: 'ヘイロー・ガーディアン',
    type: 'monster', attribute: 'lumen', level: 4, atk: 1000, def: 2100,
    rarity: 2, art: 'sentinel',
    text: 'シールド：このカードが関わる戦闘で自分は戦闘ダメージを受けない。',
    passive: { shielded: true },
  },
  flamewing: {
    id: 'flamewing', name: 'Flamewing', jp: 'フレイムウィング',
    type: 'monster', attribute: 'ember', level: 4, atk: 1800, def: 800,
    rarity: 2, art: 'phoenix',
    text: '貫通：守備モンスターを攻撃した時、超過ダメージを与える。',
    passive: { pierce: true },
  },

  /* ── ABYSSAL REQUIEM · rival ─────────────────────────────── */
  void_stalker: {
    id: 'void_stalker', name: 'Void Stalker', jp: 'ヴォイド・ストーカー',
    type: 'monster', attribute: 'void', level: 4, atk: 1500, def: 1000,
    rarity: 2, art: 'phantom',
    text: '召喚時：相手に300ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 300 }],
  },
  abyss_serpent: {
    id: 'abyss_serpent', name: 'Abyss Serpent', jp: 'アビス・サーペント',
    type: 'monster', attribute: 'tide', level: 4, atk: 1600, def: 1400,
    rarity: 2, art: 'serpent',
    text: '召喚時：カードを1枚ドロー。',
    effects: [{ on: 'summon', kind: 'draw', value: 1 }],
  },
  drowned_golem: {
    id: 'drowned_golem', name: 'Drowned Golem', jp: 'ドラウンド・ゴーレム',
    type: 'monster', attribute: 'tide', level: 4, atk: 1200, def: 2200,
    rarity: 2, art: 'golem',
    text: 'シールド：このカードが関わる戦闘で自分は戦闘ダメージを受けない。',
    passive: { shielded: true },
  },
  nightmare_acolyte: {
    id: 'nightmare_acolyte', name: 'Nightmare Acolyte', jp: 'ナイトメア・アコライト',
    type: 'monster', attribute: 'void', level: 3, atk: 900, def: 1800,
    rarity: 1, art: 'mage',
    text: '召喚時：LPを500回復。',
    effects: [{ on: 'summon', kind: 'heal', value: 500 }],
  },
  deep_warden: {
    id: 'deep_warden', name: 'Deep Warden', jp: 'ディープ・ウォーデン',
    type: 'monster', attribute: 'tide', level: 4, atk: 1000, def: 2000,
    rarity: 1, art: 'warden',
    text: '挑発：相手は可能な限りこのモンスターを攻撃しなければならない。',
    passive: { taunt: true },
  },
  abyss_leviathan: {
    id: 'abyss_leviathan', name: 'Abyss Leviathan', jp: 'アビス・リヴァイアサン',
    type: 'monster', attribute: 'tide', level: 6, atk: 2600, def: 2200,
    rarity: 3, art: 'leviathan',
    text: '召喚時：相手の最も強いモンスター1体を破壊。',
    effects: [{ on: 'summon', kind: 'destroy_strongest' }],
  },
  void_dragon: {
    id: 'void_dragon', name: 'Void Dragon', jp: 'ヴォイド・ドラゴン',
    type: 'monster', attribute: 'void', level: 8, atk: 3000, def: 2500,
    rarity: 4, art: 'dragon',
    text: '召喚時：相手に800ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 800 }],
  },
  tidal_wyrm: {
    id: 'tidal_wyrm', name: 'Tidal Wyrm', jp: 'タイダル・ワイアーム',
    type: 'monster', attribute: 'tide', level: 5, atk: 2100, def: 1700,
    rarity: 2, art: 'wyrm',
    text: '召喚時：カードを1枚ドロー。',
    effects: [{ on: 'summon', kind: 'draw', value: 1 }],
  },
  rift_stalker: {
    id: 'rift_stalker', name: 'Rift Stalker', jp: 'リフト・ストーカー',
    type: 'monster', attribute: 'void', level: 4, atk: 1900, def: 900,
    rarity: 2, art: 'phantom',
    text: '貫通：守備モンスターを攻撃した時、超過ダメージを与える。',
    passive: { pierce: true },
  },
  ink_phantom: {
    id: 'ink_phantom', name: 'Ink Phantom', jp: 'インク・ファントム',
    type: 'monster', attribute: 'void', level: 3, atk: 1200, def: 1100,
    rarity: 1, art: 'phantom',
    text: '破壊された時：相手に400ダメージ。',
    effects: [{ on: 'destroyed', kind: 'burn', value: 400 }],
  },
  coral_mage: {
    id: 'coral_mage', name: 'Coral Mage', jp: 'コーラル・メイジ',
    type: 'monster', attribute: 'tide', level: 4, atk: 1600, def: 1400,
    rarity: 2, art: 'mage',
    text: '召喚時：LPを400回復。',
    effects: [{ on: 'summon', kind: 'heal', value: 400 }],
  },
  abyss_knight: {
    id: 'abyss_knight', name: 'Abyss Knight', jp: 'アビス・ナイト',
    type: 'monster', attribute: 'tide', level: 4, atk: 1800, def: 1200,
    rarity: 1, art: 'knight',
    text: '深淵の前衛。安定した攻撃力を持つ。',
  },
  void_prophet: {
    id: 'void_prophet', name: 'Void Prophet', jp: 'ヴォイド・プロフェット',
    type: 'monster', attribute: 'void', level: 4, atk: 1400, def: 1600,
    rarity: 2, art: 'mage',
    text: '召喚時：相手に300ダメージ。',
    effects: [{ on: 'summon', kind: 'burn', value: 300 }],
  },
  dusk_guardian: {
    id: 'dusk_guardian', name: 'Dusk Guardian', jp: 'ダスク・ガーディアン',
    type: 'monster', attribute: 'void', level: 4, atk: 900, def: 2100,
    rarity: 2, art: 'sentinel',
    text: 'シールド：このカードが関わる戦闘で自分は戦闘ダメージを受けない。',
    passive: { shielded: true },
  },
  nightmare_seraph: {
    id: 'nightmare_seraph', name: 'Nightmare Seraph', jp: 'ナイトメア・セラフ',
    type: 'monster', attribute: 'void', level: 6, atk: 2300, def: 2100,
    rarity: 3, art: 'seraph',
    text: 'ドレイン：このカードが与えた戦闘ダメージ分、LPを回復。',
    passive: { lifesteal: true },
  },
  shadow_falcon: {
    id: 'shadow_falcon', name: 'Shadow Falcon', jp: 'シャドウ・ファルコン',
    type: 'monster', attribute: 'void', level: 4, atk: 1700, def: 900,
    rarity: 2, art: 'falcon',
    text: '貫通：守備モンスターを攻撃した時、超過ダメージを与える。',
    passive: { pierce: true },
  },
  trench_colossus: {
    id: 'trench_colossus', name: 'Trench Colossus', jp: 'トレンチ・コロッサス',
    type: 'monster', attribute: 'tide', level: 5, atk: 2200, def: 1800,
    rarity: 2, art: 'golem',
    text: '貫通：守備モンスターを攻撃した時、超過ダメージを与える。',
    passive: { pierce: true },
  },
  deep_echo: {
    id: 'deep_echo', name: 'Echo of the Deep', jp: 'ディープ・エコー',
    type: 'monster', attribute: 'tide', level: 3, atk: 1300, def: 1300,
    rarity: 1, art: 'serpent',
    text: '召喚時：カードを1枚ドロー。',
    effects: [{ on: 'summon', kind: 'draw', value: 1 }],
  },

  /* ── SPELLS ──────────────────────────────────────────────── */
  nova_strike: {
    id: 'nova_strike', name: 'Nova Strike', jp: 'ノヴァ・ストライク',
    type: 'spell', attribute: 'lumen', rarity: 2, art: 'spell_buff',
    spellKey: 'buff', value: 800, target: 'own',
    text: '自分のモンスター1体のATKを800アップ。',
  },
  rejuvenate: {
    id: 'rejuvenate', name: 'Rejuvenate', jp: 'リジュヴェネイト',
    type: 'spell', attribute: 'verdant', rarity: 1, art: 'spell_heal',
    spellKey: 'heal', value: 1200,
    text: 'LPを1200回復。',
  },
  insight: {
    id: 'insight', name: 'Insight', jp: 'インサイト',
    type: 'spell', attribute: 'tide', rarity: 1, art: 'spell_draw',
    spellKey: 'draw', value: 2,
    text: 'カードを2枚ドロー。',
  },
  purge: {
    id: 'purge', name: 'Purge', jp: 'パージ',
    type: 'spell', attribute: 'ember', rarity: 3, art: 'spell_destroy',
    spellKey: 'destroy', target: 'enemy',
    text: '相手のモンスター1体を破壊。',
  },
  rebirth: {
    id: 'rebirth', name: 'Rebirth', jp: 'リバース',
    type: 'spell', attribute: 'void', rarity: 3, art: 'spell_revive',
    spellKey: 'revive',
    text: '自分の墓地の最も強いモンスター1体を守備表示で特殊召喚。',
  },
  abyssal_surge: {
    id: 'abyssal_surge', name: 'Abyssal Surge', jp: 'アビサル・サージ',
    type: 'spell', attribute: 'void', rarity: 2, art: 'spell_buff',
    spellKey: 'buff', value: 800, target: 'own',
    text: '自分のモンスター1体のATKを800アップ。',
  },
  dark_communion: {
    id: 'dark_communion', name: 'Dark Communion', jp: 'ダーク・コミュニオン',
    type: 'spell', attribute: 'tide', rarity: 1, art: 'spell_heal',
    spellKey: 'heal', value: 1200,
    text: 'LPを1200回復。',
  },
  forbidden_insight: {
    id: 'forbidden_insight', name: 'Forbidden Insight', jp: '禁断のインサイト',
    type: 'spell', attribute: 'void', rarity: 1, art: 'spell_draw',
    spellKey: 'draw', value: 2,
    text: 'カードを2枚ドロー。',
  },
  devour: {
    id: 'devour', name: 'Devour', jp: 'デヴァウアー',
    type: 'spell', attribute: 'void', rarity: 3, art: 'spell_destroy',
    spellKey: 'destroy', target: 'enemy',
    text: '相手のモンスター1体を破壊。',
  },
  dark_rebirth: {
    id: 'dark_rebirth', name: 'Dark Rebirth', jp: 'ダーク・リバース',
    type: 'spell', attribute: 'void', rarity: 3, art: 'spell_revive',
    spellKey: 'revive',
    text: '自分の墓地の最も強いモンスター1体を守備表示で特殊召喚。',
  },

  /* ── TRAPS ───────────────────────────────────────────────── */
  mirror_ward: {
    id: 'mirror_ward', name: 'Mirror Ward', jp: 'ミラー・ウォード',
    type: 'trap', attribute: 'tide', rarity: 2, art: 'trap_mirror',
    trapKey: 'negate_attack',
    text: '相手の攻撃を無効にし、攻撃モンスターを破壊。',
  },
  pitfall: {
    id: 'pitfall', name: 'Pitfall', jp: 'ピットフォール',
    type: 'trap', attribute: 'verdant', rarity: 2, art: 'trap_pit',
    trapKey: 'pitfall',
    text: '相手がATK1500以上のモンスターを召喚した時、それを破壊。',
  },
  life_barrier: {
    id: 'life_barrier', name: 'Life Barrier', jp: 'ライフ・バリア',
    type: 'trap', attribute: 'lumen', rarity: 2, art: 'trap_barrier',
    trapKey: 'life_barrier',
    text: '戦闘ダメージを受ける時、そのダメージを0にし、LPを300回復。',
  },
};

export const DECK_RECIPES = {
  player: {
    name: 'SOLAR COVENANT',
    jp: '太陽の誓約',
    monster: [
      'ember_drake', 'lumen_acolyte', 'solar_guard', 'cinder_hound',
      'dawn_falcon', 'ember_colossus', 'radiant_seraph', 'sunscale_wyrm',
      'flame_dancer', 'aegis_bearer', 'phoenix_chick', 'prism_mage',
      'ember_knight', 'solar_paladin', 'ash_shade', 'zenith_dragon',
      'halo_guardian', 'flamewing',
    ],
    spells: [
      'nova_strike', 'nova_strike', 'rejuvenate', 'rejuvenate',
      'insight', 'insight', 'purge', 'rebirth',
    ],
    traps: ['mirror_ward', 'mirror_ward', 'pitfall', 'life_barrier'],
  },
  ai: {
    name: 'ABYSSAL REQUIEM',
    jp: '深淵の鎮魂歌',
    monster: [
      'void_stalker', 'abyss_serpent', 'drowned_golem', 'nightmare_acolyte',
      'deep_warden', 'abyss_leviathan', 'void_dragon', 'tidal_wyrm',
      'rift_stalker', 'ink_phantom', 'coral_mage', 'abyss_knight',
      'void_prophet', 'dusk_guardian', 'nightmare_seraph', 'shadow_falcon',
      'trench_colossus', 'deep_echo',
    ],
    spells: [
      'abyssal_surge', 'abyssal_surge', 'dark_communion', 'dark_communion',
      'forbidden_insight', 'forbidden_insight', 'devour', 'dark_rebirth',
    ],
    traps: ['mirror_ward', 'mirror_ward', 'pitfall', 'life_barrier'],
  },
};

export const ATTRIBUTE_ORDER = ['ember', 'tide', 'verdant', 'lumen', 'void'];

export function getCard(id) {
  const card = CARDS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return card;
}

export function buildDeck(side) {
  const recipe = DECK_RECIPES[side] || DECK_RECIPES.player;
  return [...recipe.monster, ...recipe.spells, ...recipe.traps];
}
