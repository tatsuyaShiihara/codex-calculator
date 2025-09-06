// シンプルな電卓ロジック（標準動作を意識）
(() => {
  const exprEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');

  let current = '0';
  let previous = null; // string
  let op = null;       // '+', '-', '*', '/'
  let justEvaluated = false;

  const MAX_LEN = 16; // 表示桁数の上限（視認性優先）

  function format(nStr) {
    // 数値の文字列を安全に整形（オーバーフローや浮動小数の丸めを軽減）
    if (!isFinite(Number(nStr))) return 'エラー';
    // 大きすぎる数は指数表記
    if (Math.abs(Number(nStr)) >= 1e12 || (Math.abs(Number(nStr)) > 0 && Math.abs(Number(nStr)) < 1e-9)) {
      return Number(nStr).toExponential(8).replace(/\+?0*(?=\d)/, '');
    }
    // 通常は桁数制限（末尾の0は調整）
    let s = String(Number(nStr.toString()));
    if (s.includes('e') || s.includes('E')) return s;
    if (s.length > MAX_LEN) {
      const num = Number(s);
      s = num.toPrecision(12).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }
    return s;
  }

  function updateExpression() {
    const opSymbol = { '+': '＋', '-': '−', '*': '×', '/': '÷' }[op] || '';
    if (previous !== null && op) {
      exprEl.textContent = `${format(previous)} ${opSymbol}`.trim();
    } else {
      exprEl.textContent = '';
    }
  }

  function updateResult() {
    resultEl.textContent = format(current);
  }

  function clearAll() {
    current = '0';
    previous = null;
    op = null;
    justEvaluated = false;
    updateExpression();
    updateResult();
  }

  function inputDigit(d) {
    if (justEvaluated) {
      // 直前に=を押した後の数字入力はリセット
      current = (d === '.') ? '0.' : d;
      justEvaluated = false;
      updateResult();
      return;
    }
    if (d === '.') {
      if (!current.includes('.')) current += '.';
      updateResult();
      return;
    }
    if (current === '0') current = d; else current += d;
    if (current.length > 32) return; // 入力暴走を制限
    updateResult();
  }

  function chooseOperation(nextOp) {
    if (op && previous !== null && !justEvaluated) {
      // 演算子連打時は都度計算
      compute();
    }
    previous = current;
    op = nextOp;
    justEvaluated = false;
    current = '0';
    updateExpression();
    updateResult();
  }

  function compute() {
    if (previous === null || op === null) return;
    const a = Number(previous);
    const b = Number(current);
    let out = 0;
    switch (op) {
      case '+': out = a + b; break;
      case '-': out = a - b; break;
      case '*': out = a * b; break;
      case '/': out = b === 0 ? Infinity : a / b; break;
    }
    current = String(out);
    previous = null;
    op = null;
    justEvaluated = true;
    updateExpression();
    updateResult();
  }

  function toggleSign() {
    if (current === '0') return;
    if (current.startsWith('-')) current = current.slice(1);
    else current = '-' + current;
    updateResult();
  }

  function percent() {
    // iOS風：単独なら現在値/100。二項演算中は previous * (current/100)
    if (op && previous !== null) {
      const base = Number(previous);
      const p = Number(current) / 100;
      current = String(base * p);
    } else {
      current = String(Number(current) / 100);
    }
    updateResult();
  }

  // イベントバインド（クリック）
  document.querySelectorAll('[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => inputDigit(btn.dataset.digit));
  });

  const opMap = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/',
  };

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a in opMap) {
        chooseOperation(opMap[a]);
      } else if (a === 'equals') {
        compute();
      } else if (a === 'clear') {
        clearAll();
      } else if (a === 'sign') {
        toggleSign();
      } else if (a === 'percent') {
        percent();
      }
    });
  });

  // キーボード操作対応
  window.addEventListener('keydown', (e) => {
    const { key } = e;
    if (/^[0-9]$/.test(key)) { inputDigit(key); return; }
    if (key === '.') { inputDigit('.'); return; }
    if (key === 'Enter' || key === '=') { e.preventDefault(); compute(); return; }
    if (key === 'Escape') { clearAll(); return; }
    if (key === '%') { percent(); return; }
    if (key === '_') { toggleSign(); return; }
    if (['+', '-', '*', '/'].includes(key)) { chooseOperation(key); return; }
  });

  // 初期化
  clearAll();
})();

