// ZONE XII — card definitions.
// Every deck card implements a working ACT through the G (game) API.

export const CARD_DEFS = {
  /* ─────────────── BIG ZONE / MONSTERS ─────────────── */
  flarewolf: {
    name: '焔狼フレアウルフ',
    kind: 'monster',
    glyph: '🐺',
    kanji: '狼',
    atk: 1400,
    guard: 900,
    palette: ['#ffc27a', '#ff6a3d', '#2a0d08'],
    actName: '灼熱の遠吠え',
    actText: '相手に400ダメージを与える。',
    flavor: '灰燼の平原を駆ける、燃え盛る牙。',
    canAct: () => null,
    act: (G, card) => {
      G.damage(G.other(card.owner), 400, 'act');
    },
  },

  golem: {
    name: '鉄壁ゴーレム',
    kind: 'monster',
    glyph: '🗿',
    kanji: '壁',
    atk: 900,
    guard: 2100,
    palette: ['#e8d3a2', '#a8844c', '#2a2114'],
    actName: '絶対防壁',
    actText: '次の自分のターンまで、攻撃対象を自身に固定し、戦闘で破壊されない。',
    flavor: '十二界の門を千年守り続ける石の番人。',
    canAct: () => null,
    act: (G, card) => {
      G.mod(card, { kind: 'taunt', duration: 'nextOwner' });
      G.mod(card, { kind: 'battleShield', duration: 'nextOwner' });
      G.log('攻撃対象をゴーレムに固定した', card.owner, 'act');
    },
  },

  twinblade: {
    name: '双刃のアサシン',
    kind: 'monster',
    glyph: '🗡️',
    kanji: '刃',
    atk: 1500,
    guard: 700,
    palette: ['#b7c8ff', '#6d79c9', '#11142a'],
    actName: '影走り',
    actText: 'このターン、相手モンスターを無視して直接攻撃できる。',
    flavor: '影から影へ。刃が届くまで、姿は見えない。',
    canAct: () => null,
    act: (G, card) => {
      G.mod(card, { kind: 'direct', duration: 'end' });
      G.log('このターンの直接攻撃を許可した', card.owner, 'act');
    },
  },

  witch: {
    name: '星詠みのウィッチ',
    kind: 'monster',
    glyph: '🔮',
    kanji: '星',
    atk: 800,
    guard: 1200,
    palette: ['#c7a6ff', '#7b5ad6', '#1b1236'],
    actName: '星読み',
    actText: '1枚ドローし、自分は300ダメージを受ける。',
    flavor: '星の並びは、すでに敗北を知っている。',
    canAct: (G, card) => (G.player(card.owner).lp > 300 ? null : 'LPが足りません'),
    act: (G, card) => {
      G.draw(card.owner, 1);
      G.damage(card.owner, 300, 'self');
    },
  },

  varga: {
    name: '獄炎竜ヴァルガ',
    kind: 'monster',
    glyph: '🐉',
    kanji: '竜',
    atk: 2300,
    guard: 1600,
    palette: ['#ff8d7a', '#e02f4f', '#320812'],
    actName: '獄炎の息吹',
    actText: '700LPを払い、相手の攻撃力が最も高いモンスターを破壊する。',
    flavor: 'その咆哮は、世界の底を焦がす。',
    canAct: (G, card) => {
      if (!G.monsters(G.other(card.owner)).length) return '相手モンスターがいません';
      if (G.player(card.owner).lp <= 700) return 'LPが足りません';
      return null;
    },
    act: (G, card) => {
      G.damage(card.owner, 700, 'cost');
      const target = G.highestAtk(G.other(card.owner));
      if (target) G.destroy(target);
    },
  },

  seraph: {
    name: '守護天使セラフィム',
    kind: 'monster',
    glyph: '😇',
    kanji: '天',
    atk: 1100,
    guard: 1700,
    palette: ['#fff2b0', '#e7c65a', '#3b3112'],
    actName: '聖なる光',
    actText: '自分は500LP回復する。',
    flavor: '十二界に降る、最後の慈悲。',
    canAct: (G, card) => (G.player(card.owner).lp < G.player(card.owner).maxLp ? null : 'LPが満タンです'),
    act: (G, card) => {
      G.heal(card.owner, 500);
    },
  },

  hayate: {
    name: '疾風のハヤテ',
    kind: 'monster',
    glyph: '🌀',
    kanji: '風',
    atk: 1200,
    guard: 800,
    palette: ['#b6ffe4', '#31c9a0', '#082a23'],
    actName: '神風',
    actText: 'このカードを手札に戻し、このターン追加で1体召喚できる。',
    flavor: '風は、掴もうとした者を置き去りにする。',
    canAct: () => null,
    act: (G, card) => {
      G.extraSummon(card.owner);
      G.bounce(card);
    },
  },

  leviathan: {
    name: '深淵のリヴァイア',
    kind: 'monster',
    glyph: '🐙',
    kanji: '淵',
    atk: 1900,
    guard: 1400,
    palette: ['#8fb7ff', '#3355b5', '#08132e'],
    actName: '深淵の潮流',
    actText: '相手のリリック1枚を破壊し、自分は300ダメージを受ける。',
    flavor: '底のない海には、底のない渇きがある。',
    canAct: (G, card) => {
      if (!G.relics(G.other(card.owner)).length) return '相手のリリックがありません';
      if (G.player(card.owner).lp <= 300) return 'LPが足りません';
      return null;
    },
    act: (G, card) => {
      G.damage(card.owner, 300, 'self');
      const target = G.relics(G.other(card.owner))[0];
      if (target) G.destroy(target);
    },
  },

  magnet: {
    name: '磁力のマグネ',
    kind: 'monster',
    glyph: '🧲',
    kanji: '磁',
    atk: 700,
    guard: 1900,
    palette: ['#ffb4e6', '#d6439d', '#2d0a21'],
    actName: '磁気拘束',
    actText: '相手の攻撃力が最も高いモンスターは次のターン行動できない。',
    flavor: '北も南も、この引力からは逃げられない。',
    canAct: (G, card) => (G.monsters(G.other(card.owner)).length ? null : '相手モンスターがいません'),
    act: (G, card) => {
      const target = G.highestAtk(G.other(card.owner));
      if (target) G.stun(target);
      G.log('最も強いモンスターを拘束した', card.owner, 'act');
    },
  },

  chrono: {
    name: '時空騎士クロノ',
    kind: 'monster',
    glyph: '⏳',
    kanji: '時',
    atk: 1700,
    guard: 1300,
    palette: ['#d9e4ff', '#7b8dcc', '#181d3a'],
    actName: '時空停止',
    actText: '600LPを払い、相手の次のドローをスキップする。',
    flavor: '彼の一振りは、一秒を永遠に変える。',
    canAct: (G, card) => {
      if (G.player(card.owner).lp <= 600) return 'LPが足りません';
      if (G.player(G.other(card.owner)).skipDraw) return 'すでに時は止まっています';
      return null;
    },
    act: (G, card) => {
      G.damage(card.owner, 600, 'cost');
      G.skipDraw(G.other(card.owner));
    },
  },

  sprout: {
    name: '花咲の精霊',
    kind: 'monster',
    glyph: '🌱',
    kanji: '芽',
    atk: 600,
    guard: 900,
    palette: ['#c6ffa8', '#4cbf58', '#0d2910'],
    actName: '開花',
    actText: '空きBIGゾーンに「花の精霊トークン」（600/600）を特殊召喚する。',
    flavor: '戦場の隅で、小さな花が咲く。',
    canAct: (G, card) => (G.emptyBig(card.owner) >= 0 ? null : 'BIGゾーンが埋まっています'),
    act: (G, card) => {
      G.summonToken(card.owner);
    },
  },

  bloomtoken: {
    name: '花の精霊トークン',
    kind: 'monster',
    glyph: '🌸',
    kanji: '花',
    atk: 600,
    guard: 600,
    palette: ['#ffd1e8', '#e86aa6', '#331024'],
    actName: '—',
    actText: 'トークンはアクトを持たない。',
    flavor: '戦場に咲いた、ひとひらの命。',
    token: true,
    noAct: true,
    canAct: () => 'トークンはアクトを持ちません',
    act: () => {},
  },

  /* ─────────────── SMALL ZONE / RELICS ─────────────── */
  blade: {
    name: '灼熱の刃',
    kind: 'relic',
    glyph: '🔥',
    kanji: '炎',
    palette: ['#ffcc8a', '#ff6b35', '#2e0e05'],
    actName: '炎刃',
    actText: '自分の攻撃力が最も高いモンスターはこのターンATK+700。',
    flavor: '振るうたび、刃は熱を帯びる。',
    canAct: (G, card) => (G.monsters(card.owner).length ? null : '自分のモンスターがいません'),
    act: (G, card) => {
      const target = G.highestAtk(card.owner);
      if (target) {
        G.mod(target, { kind: 'atk', value: 700, duration: 'end' });
        G.log('ATK+700（このターン）', card.owner, 'act');
      }
    },
  },

  shield: {
    name: '鉄壁の盾',
    kind: 'relic',
    glyph: '🛡️',
    kanji: '盾',
    palette: ['#d9e6ff', '#7f9dd6', '#151f36'],
    actName: '要塞化',
    actText: '自分の守備力が最も高いモンスターは次の自分のターンまでDEF+1000、戦闘で破壊されない。',
    flavor: '守るべきものがある限り、盾は砕けない。',
    canAct: (G, card) => (G.monsters(card.owner).length ? null : '自分のモンスターがいません'),
    act: (G, card) => {
      const target = G.highestGuard(card.owner);
      if (target) {
        G.mod(target, { kind: 'guard', value: 1000, duration: 'nextOwner' });
        G.mod(target, { kind: 'battleShield', duration: 'nextOwner' });
        G.log('DEF+1000・戦闘破壊耐性を付与', card.owner, 'act');
      }
    },
  },

  bolt: {
    name: '落雷の護符',
    kind: 'relic',
    glyph: '⚡',
    kanji: '雷',
    palette: ['#fff3a3', '#59c8ff', '#101b3c'],
    actName: '雷撃',
    actText: '相手に600ダメージを与える。',
    flavor: '空を裂く一閃は、大地の怒り。',
    canAct: () => null,
    act: (G, card) => {
      G.damage(G.other(card.owner), 600, 'act');
    },
  },

  fountain: {
    name: '生命の泉',
    kind: 'relic',
    glyph: '⛲',
    kanji: '泉',
    palette: ['#b9ffe9', '#3fc7b0', '#082a27'],
    actName: '恵みの水',
    actText: '自分は700LP回復する。',
    flavor: '枯れた戦場に、ひと筋の清流。',
    canAct: (G, card) => (G.player(card.owner).lp < G.player(card.owner).maxLp ? null : 'LPが満タンです'),
    act: (G, card) => {
      G.heal(card.owner, 700);
    },
  },

  archive: {
    name: '貪欲の書庫',
    kind: 'relic',
    glyph: '📚',
    kanji: '書',
    palette: ['#ffe0a6', '#c98a45', '#2a1a0b'],
    actName: '禁断の知識',
    actText: '2枚ドローし、自分は500ダメージを受ける。',
    flavor: '知識には、必ず対価がつく。',
    canAct: (G, card) => (G.player(card.owner).lp > 500 ? null : 'LPが足りません'),
    act: (G, card) => {
      G.draw(card.owner, 2);
      G.damage(card.owner, 500, 'self');
    },
  },

  revival: {
    name: '蘇生の儀',
    kind: 'relic',
    glyph: '⚰️',
    kanji: '還',
    palette: ['#d5b8ff', '#7c52c9', '#1b1033'],
    actName: '冥還',
    actText: '500LPを払い、墓地の攻撃力が最も高いモンスターを空きBIGゾーンに特殊召喚する。',
    flavor: '死は終わりではない。ただ、借りがあるだけだ。',
    canAct: (G, card) => {
      const p = G.player(card.owner);
      if (p.lp <= 500) return 'LPが足りません';
      if (G.emptyBig(card.owner) < 0) return 'BIGゾーンが埋まっています';
      if (!G.graveMonsters(card.owner).length) return '墓地にモンスターがいません';
      return null;
    },
    act: (G, card) => {
      G.damage(card.owner, 500, 'cost');
      G.revive(card.owner);
    },
  },

  ring: {
    name: '魔力の環',
    kind: 'relic',
    glyph: '💠',
    kanji: '環',
    palette: ['#b8f4ff', '#4aa8d8', '#0a2333'],
    actName: '循環',
    actText: '自分のアクト済みモンスターのうち攻撃力が最も高い1体をアクト可能にする。',
    flavor: '円環は終わらない。終わるのは、こちら側だけ。',
    canAct: (G, card) => (G.actedMonsters(card.owner).length ? null : '行動済みモンスターがいません'),
    act: (G, card) => {
      const target = G.actedMonsters(card.owner).sort((a, b) => G.effAtk(b) - G.effAtk(a))[0];
      if (target) G.refresh(target);
    },
  },

  vortex: {
    name: '混沌の渦',
    kind: 'relic',
    glyph: '🕳️',
    kanji: '渦',
    palette: ['#ffb1d7', '#8b3bd1', '#1a0828'],
    actName: '虚無',
    actText: 'お互いのSMALLゾーンのカードをすべて破壊する（このカードも破壊される）。',
    flavor: '十二界の狭間には、何も残らない。',
    canAct: () => null,
    act: (G) => {
      G.destroyAllRelics();
    },
  },

  crystal: {
    name: '未来視の水晶',
    kind: 'relic',
    glyph: '🔯',
    kanji: '視',
    palette: ['#c8c2ff', '#6d5bd0', '#171332'],
    actName: '予知',
    actText: '相手の次のアクトを無効化する結界を張る。',
    flavor: '未来を見た者は、未来に嫌われる。',
    canAct: () => null,
    act: (G, card) => {
      G.ward(G.other(card.owner));
      G.log('相手の次のアクトを封じる結界を張った', card.owner, 'act');
    },
  },

  altar: {
    name: '共鳴の祭壇',
    kind: 'relic',
    glyph: '🕯️',
    kanji: '祭',
    palette: ['#ffe6b8', '#d29a4c', '#2b1b0b'],
    actName: '共鳴',
    actText: 'お互いは1枚ドローする。',
    flavor: '二つの魂が、同じ周波数で震える。',
    canAct: () => null,
    act: (G, card) => {
      G.draw(card.owner, 1);
      G.draw(G.other(card.owner), 1);
    },
  },

  bounce: {
    name: '強制送還',
    kind: 'relic',
    glyph: '🌪️',
    kanji: '還',
    palette: ['#c9fff4', '#45b5c9', '#08252b'],
    actName: '次元追放',
    actText: '相手の攻撃力が最も高いモンスターを手札に戻す。',
    flavor: '帰る場所があるだけ、破壊より優しい。',
    canAct: (G, card) => (G.monsters(G.other(card.owner)).length ? null : '相手モンスターがいません'),
    act: (G, card) => {
      const target = G.highestAtk(G.other(card.owner));
      if (target) G.bounce(target);
    },
  },
};

// 30-card deck: 15 monsters / 15 relics. Every card type appears.
export const DECK_LIST = [
  'flarewolf', 'flarewolf',
  'golem', 'golem',
  'twinblade', 'twinblade',
  'witch',
  'varga',
  'seraph', 'seraph',
  'hayate',
  'leviathan',
  'magnet',
  'chrono',
  'sprout',
  'blade', 'blade',
  'shield', 'shield',
  'bolt', 'bolt',
  'fountain', 'fountain',
  'archive',
  'revival',
  'ring',
  'vortex',
  'crystal',
  'altar',
  'bounce',
];
