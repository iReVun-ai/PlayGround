/* Random-play robustness check for the duel engine. */
require('../js/cards.js');
const engine = require('../js/engine.js');
const { PUZZLES } = require('../js/puzzles.js');

let seed = 123456789;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

let games = 0, wins = 0, losses = 0, draws = 0;
for (const p of PUZZLES) {
  for (let g = 0; g < 250; g++) {
    let s = engine.createState(p);
    let steps = 0;
    try {
      while (!s.winner && steps < 160) {
        const legal = engine.legalActions(s);
        if (!legal.length) throw new Error('no legal actions');
        const action = legal[Math.floor(rnd() * legal.length)];
        engine.applyActionMut(s, action, p);
        steps++;
        if (s.player.lp < 0 || s.enemy.lp < 0) throw new Error('negative LP');
        if (s.player.lp > s.player.maxLp || s.enemy.lp > s.enemy.maxLp) throw new Error('LP above max');
        if (s.actions < 0 || s.actions > steps) throw new Error('bad action count');
      }
      if (s.winner === 'player') wins++;
      else if (s.winner === 'enemy') losses++;
      else draws++;
      games++;
    } catch (err) {
      console.error(`FAIL ${p.id} game ${g} step ${steps}: ${err.stack}`);
      process.exit(1);
    }
  }
}
console.log({ games, wins, losses, draws });
