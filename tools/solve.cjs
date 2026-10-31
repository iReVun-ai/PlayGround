/* Shortest-line search (IDDFS). Verifies authored par is minimal where feasible. */
const cards = require('../js/cards.js');
const engine = require('../js/engine.js');
const puzzles = require('../js/puzzles.js');

const TYPE_ORDER = { activate: 0, attack: 1, summon: 2, setMonster: 3, activateSet: 2, flipSummon: 3, setSpell: 4, changePosition: 5, endTurn: 6 };

function firstEmpty(zones) {
  for (let i = 0; i < zones.length; i++) if (!zones[i]) return i;
  return -1;
}

function candidates(state) {
  let actions = engine.legalActions(state);
  const mEmpty = firstEmpty(state.player.monsters);
  const sEmpty = firstEmpty(state.player.spells);
  actions = actions.filter(a => {
    if (a.type === 'summon' || a.type === 'setMonster') return a.zone === mEmpty;
    if (a.type === 'setSpell') return a.zone === sEmpty;
    return true;
  });
  actions.sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9));
  return actions;
}

function search(puzzle, maxDepth, budgetMs) {
  const start = Date.now();
  const seen = new Set();
  let nodes = 0;
  let timedOut = false;

  function dfs(state, depth) {
    if (Date.now() - start > budgetMs) { timedOut = true; return null; }
    if (state.winner === 'player') return depth === 0 ? [] : [];
    if (depth === 0) return null;
    const key = depth + '|' + engine.stateKey(state);
    if (seen.has(key)) return null;
    seen.add(key);
    nodes++;
    for (const action of candidates(state)) {
      const next = engine.cloneState(state);
      engine.applyActionMut(next, action, puzzle);
      if (next.winner === 'player') {
        if (depth === 1) return [{ action, before: state, after: next }];
      }
      if (depth > 1) {
        const rest = dfs(next, depth - 1);
        if (rest) return [{ action, before: state, after: next }].concat(rest);
      }
      if (timedOut) return null;
    }
    return null;
  }

  for (let d = 1; d <= maxDepth; d++) {
    seen.clear();
    const line = dfs(engine.createState(puzzle), d);
    if (line) return { line, nodes, timedOut, depth: d };
    if (timedOut) break;
  }
  return { line: null, nodes, timedOut };
}

const only = process.argv[2];
for (const puzzle of puzzles.PUZZLES) {
  if (only && puzzle.id !== only) continue;
  const res = search(puzzle, puzzle.par - 1, Number(process.argv[3] || 25000));
  const found = res.line ? `SHORTER (${res.depth} < ${puzzle.par})` : (res.timedOut ? 'timeout' : `no shorter line (<${puzzle.par})`);
  console.log(`#${puzzle.no} ${puzzle.name}: ${found}; nodes=${res.nodes}`);
  if (res.line) {
    for (const step of res.line) {
      console.log('   ', engine.describeAction(step.before, step.action), '→', step.after.player.lp, '/', step.after.enemy.lp);
    }
  }
}
