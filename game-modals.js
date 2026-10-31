'use strict';

/* ============================================================
   最速LP0デュエル — modals
============================================================ */

function openModal(html, dismissible = true) {
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal-backdrop">${html}</div>`;
  document.body.classList.add('modal-open');
  const backdrop = root.firstElementChild;
  if (dismissible) {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal();
    });
  }
}

function closeModal() {
  $('#modalRoot').innerHTML = '';
  document.body.classList.remove('modal-open');
}

function showStartModal() {
  const bestText = state.best
    ? `自己ベスト ${formatTime(state.best.time)} / ${state.best.turns}ターン`
    : '自己ベスト記録なし';
  openModal(`
    <div class="modal start-modal">
      <div class="modal-kicker">24 ZONES · 8000 LP · FASTEST CLEAR</div>
      <h1 class="modal-title">最速LP0デュエル</h1>
      <p class="modal-lead">兄「複雑だろうが、最速でLPを0にすれば勝ちだ」<br />24の正方形ゾーンで、兄を最速で沈めろ。</p>
      <div class="chip-row">
        <span class="chip">8000 → 0</span>
        <span class="chip">24 正方形ゾーン</span>
        <span class="chip">裏側守備セット</span>
        <span class="chip">生贄・罠・EX</span>
      </div>
      <ul class="mini-rules">
        <li><b>勝利条件</b>相手のLP 8000を先に0にした方が勝ち</li>
        <li><b>裏側セット</b>攻撃されるとリバース。読み合いが鍵</li>
        <li><b>最速測定</b>決闘開始から勝利までのタイムを記録</li>
      </ul>
      <div class="modal-actions">
        <button class="big-btn gold" id="startBtn" type="button">決闘開始</button>
        <button class="big-btn ghost" id="modalRulesBtn" type="button">詳しいルール</button>
      </div>
      <div class="modal-foot">兄の記録 1:35.0 / 5ターン ／ ${bestText}</div>
    </div>
  `, false);
  $('#startBtn').addEventListener('click', startGame);
  $('#modalRulesBtn').addEventListener('click', showRules);
}

function showRules() {
  const wasStarted = state.started;
  openModal(`
    <div class="modal wide">
      <div class="modal-kicker">RULE BOOK</div>
      <h2 class="modal-title" style="font-size:clamp(24px,5vw,34px)">複雑ルール解説</h2>
      <div class="rules-body">
        <div class="rule-block">
          <h3>盤面 — 24の正方形ゾーン</h3>
          <p>お互いにモンスターゾーン5・魔法罠ゾーン5・フィールドゾーン1。さらに2つのEXゾーンを共有し、合計24ゾーン。</p>
        </div>
        <div class="rule-block">
          <h3>勝利条件とターン</h3>
          <p>相手のLP8000を0にすれば勝ち。自分のターンはドロー→召喚・セット・魔法・罠→攻撃→ターン終了。</p>
          <p>デッキが尽きた場合は1000ダメージを受ける。</p>
        </div>
        <div class="rule-block">
          <h3>召喚・セット・生贄</h3>
          <p>モンスターの召喚・セットは1ターンに1体。レベル5以上は自分のモンスター1体を生贄に捧げる。</p>
          <p>裏側守備表示でセットしたモンスターは、攻撃された時にリバースして正体が判明する。</p>
        </div>
        <div class="rule-block">
          <h3>攻撃とリバース</h3>
          <p>攻撃表示のモンスターで相手モンスターかプレイヤーを攻撃。攻撃力が高い方が戦闘に勝ち、差がダメージになる。守備表示を攻撃した場合は守備力を参照。</p>
          <p>セットモンスターにはリバース効果がある。灼熱の鳥は500ダメージ、守護の精霊は800LP回復。</p>
        </div>
        <div class="rule-block">
          <h3>魔法・罠・EX</h3>
          <p>魔法は手札から発動して墓地へ。罠は裏側でセットし、攻撃時などに自動発動する。</p>
          <p>EXデッキのモンスターは自分のモンスター2体を生贄に、空きEXゾーンへ特殊召喚。召喚権は消費しない。</p>
        </div>
        <div class="rule-block">
          <h3>最速クリア</h3>
          <p>タイマーは決闘開始から決着まで。兄の記録1:35.0 / 5ターンを超えろ。自己ベストはこの端末に保存される。</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="big-btn gold" id="closeRulesBtn" type="button">戻る</button>
      </div>
    </div>
  `, wasStarted);
  $('#closeRulesBtn').addEventListener('click', () => {
    if (wasStarted) closeModal();
    else showStartModal();
  });
}

function openExtraModal() {
  if (!state.started || state.over || state.busy || state.active !== 'player' || state.mode !== 'idle') return;
  const p = state.players.player;
  const own = allMonsters('player');
  const emptyEmz = state.emz.some((x) => !x);
  const ready = own.length >= 2 && emptyEmz;

  const items = p.extra.map((id, index) => {
    const c = CARD_DB[id];
    const disabled = !ready;
    return `<div class="extra-item">
      <div class="extra-visual" style="--art-a:${c.a};--art-b:${c.b}">${c.art}</div>
      <div class="extra-meta">
        <span class="extra-name">${escapeHTML(c.name)}</span>
        <span class="extra-stats">ATK ${c.atk} / DEF ${c.def}</span>
        <span class="extra-desc">${escapeHTML(c.desc)}</span>
      </div>
      <button class="big-btn ${disabled ? 'ghost' : 'gold'}" data-extra-index="${index}" type="button" ${disabled ? 'disabled' : ''}>特殊召喚</button>
    </div>`;
  }).join('');

  openModal(`
    <div class="modal wide">
      <div class="modal-kicker">EXTRA DECK</div>
      <h2 class="modal-title" style="font-size:clamp(24px,5vw,34px)">エクストラデッキ</h2>
      <p class="modal-lead" style="margin-bottom:0">生贄2体と空きEXゾーンが必要。特殊召喚は召喚権を消費しない。</p>
      <div class="extra-grid">
        ${items || '<div class="extra-empty">EXデッキは空です</div>'}
      </div>
      <div class="modal-actions">
        <button class="big-btn ghost" id="closeExtraBtn" type="button">閉じる</button>
      </div>
      <div class="modal-foot">${ready ? '特殊召喚できる状態だ' : own.length < 2 ? `生贄が足りない（現在${own.length}体）` : 'EXゾーンが埋まっている'}</div>
    </div>
  `);

  $$('[data-extra-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.extraIndex);
      const id = p.extra[index];
      closeModal();
      beginSummon('extra', id, 'attack', true, index);
    });
  });
  $('#closeExtraBtn').addEventListener('click', closeModal);
}

function askRestart() {
  if (!state.started) {
    showStartModal();
    return;
  }
  openModal(`
    <div class="modal">
      <div class="modal-kicker">RESTART</div>
      <h2 class="modal-title" style="font-size:clamp(24px,5vw,32px)">再戦する？</h2>
      <p class="confirm-text">現在の決闘とタイムは破棄されます。<br />兄との再戦を始めますか？</p>
      <div class="modal-actions">
        <button class="big-btn gold" id="confirmRestartBtn" type="button">最初からやり直す</button>
        <button class="big-btn ghost" id="cancelRestartBtn" type="button">決闘に戻る</button>
      </div>
    </div>
  `);
  $('#confirmRestartBtn').addEventListener('click', startGame);
  $('#cancelRestartBtn').addEventListener('click', closeModal);
}

function showResult(win, newRecord) {
  const rank = resultRank(state.elapsed, state.turn);
  const dealt = Math.max(0, 8000 - state.players.opponent.lp);
  const bestLine = win
    ? newRecord
      ? '自己ベスト更新！'
      : `自己ベスト ${formatTime(state.best.time)} / ${state.best.turns}ターン`
    : 'もう一度、最速で挑め。';
  const bestClass = newRecord ? '' : 'muted';
  const broLine = win && state.elapsed < 95000 ? '兄の記録 1:35.0 を突破！' : '';
  const winQuotes = [
    '兄「……最速、か。認めてやる」',
    '兄「この速さは読めなかった。お前の勝ちだ」',
    '兄「複雑なルールを、ここまで単純に破るとはな」'
  ];
  const loseQuotes = [
    '兄「まだまだだな。出直してこい」',
    '兄「速さだけでは勝てない。読みを磨け」',
    '兄「その程度か。次はもっと最速で来い」'
  ];

  openModal(`
    <div class="modal result">
      <div class="result-emblem">${win ? 'DUEL WON' : 'DUEL LOST'}</div>
      <h2 class="result-title ${win ? '' : 'lose'}">${win ? 'WIN' : 'LOSE'}</h2>
      <div class="result-time">${formatTime(state.elapsed)}</div>
      <div class="result-meta">TURN ${state.turn} · ${win ? '兄のLPを0にした' : 'あなたのLPが0になった'}</div>
      ${win ? `<div class="result-rank"><b>${rank.grade}</b>RANK ${rank.label}</div>` : ''}
      <div class="result-best ${bestClass}">${bestLine}</div>
      ${broLine ? `<div class="result-best">${broLine}</div>` : ''}
      <div class="result-stats">
        <div class="result-stat"><span>FINISH TIME</span><b>${formatTime(state.elapsed)}</b></div>
        <div class="result-stat"><span>TURNS</span><b>${state.turn}</b></div>
        <div class="result-stat"><span>DAMAGE DEALT</span><b>${dealt}</b></div>
        <div class="result-stat"><span>ZONES</span><b>24</b></div>
      </div>
      <p class="result-quote">${win ? pick(winQuotes) : pick(loseQuotes)}</p>
      <div class="modal-actions">
        <button class="big-btn gold" id="retryBtn" type="button">もう一度決闘</button>
        <button class="big-btn ghost" id="closeResultBtn" type="button">盤面を見る</button>
      </div>
    </div>
  `);
  $('#retryBtn').addEventListener('click', startGame);
  $('#closeResultBtn').addEventListener('click', closeModal);
}
