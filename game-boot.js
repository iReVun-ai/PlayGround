'use strict';

/* ============================================================
   最速LP0デュエル — boot & input wiring
============================================================ */

function bindUI() {
  $('#rulesBtn').addEventListener('click', showRules);
  $('#soundBtn').addEventListener('click', toggleSound);
  $('#restartBtn').addEventListener('click', askRestart);
  $('#extraBtn').addEventListener('click', openExtraModal);
  $('#endTurnBtn').addEventListener('click', () => {
    if (state.active === 'player' && !state.busy && !state.over) {
      sfx('click');
      endPlayerTurn();
    }
  });
  $('#cancelBtn').addEventListener('click', clearModes);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const hasModal = !!$('#modalRoot').firstElementChild;
      if (hasModal) {
        if (state.started) closeModal();
        else showStartModal();
        return;
      }
      if (state.mode !== 'idle' || state.selection) clearModes();
    }
    if ((event.key === 'e' || event.key === 'E') && !event.ctrlKey && !event.metaKey) {
      if (state.started && state.active === 'player' && !state.busy && !state.over) {
        endPlayerTurn();
      }
    }
  });
}

function init() {
  state.players = {
    player: newSide('player'),
    opponent: newSide('opponent')
  };
  buildBoard();
  bindUI();
  updateBestDisplays();
  addLog('sys', '24ゾーン・8000LP。最速で兄のLPを0にしろ。');
  render();
  showStartModal();
  setInterval(tickTimer, 100);
}

init();
