const cards = require('../js/cards.js');
const engine = require('../js/engine.js');
const puzzles = require('../js/puzzles.js');

let failures = 0;
for (const puzzle of puzzles.PUZZLES) {
  const state = engine.createState(puzzle);
  const result = engine.applySolution(state, puzzle.solution, puzzle);
  const ok = result.ok && state.winner === 'player' && state.actions === puzzle.par;
  console.log(`\n#${puzzle.no} ${puzzle.name} — ${ok ? 'OK' : 'FAIL'} actions=${state.actions}/${puzzle.par} winner=${state.winner}`);
  if (!ok) {
    failures++;
    if (!result.ok) console.log('  illegal step', result.index, result.step, 'action', result.action);
    console.log('  playerLP', state.player.lp, 'enemyLP', state.enemy.lp);
    console.log('  log tail:', state.log.slice(-8).map(l => l.text).join(' / '));
  }
}

if (failures) {
  console.error(`\n${failures} puzzle(s) failed.`);
  process.exit(1);
}
console.log('\nAll authored lines win at par.');
