(() => {
  const C = 21;
  const B_MAX = C / 2;   // 10.5
  const A_MAX = 8.7;     // 必要なら変更
  const EPS = 1e-6;

  const inputA = document.getElementById('input-a');
  const inputB = document.getElementById('input-b');
  const inputV = document.getElementById('input-v');

  const btnNone = document.getElementById('btn-fixed-none');
  const btnV = document.getElementById('btn-fixed-v');
  const btnA = document.getElementById('btn-fixed-a');
  const btnB = document.getElementById('btn-fixed-b');
  const btnGraph = document.getElementById('btn-graph');
  const btnSave = document.getElementById('btn-save');

  const fixedInfo = document.getElementById('fixed-info');
  const message = document.getElementById('message');
  const jsAlive = document.getElementById('js-alive');
  const savedTableBody = document.querySelector('#saved-table tbody');

  let fixedMode = null; // null | 'V' | 'a' | 'b'
  let saveCount = 0;

  const setMessage = (t) => { message.textContent = t || ''; };
  const isFiniteNum = (x) => Number.isFinite(x);
  const readNum = (el) => {
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : NaN;
  };
  const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : '');

  const calcV = (a, b) => a * (C - 2 * b) * b;

  function solveBFromAV(a, V) {
    if (!isFiniteNum(a) || a <= 0) return null;
    if (!isFiniteNum(V) || V < 0) return null;
    const D = (C * a) * (C * a) - 8 * a * V;
    if (D < 0) return null;
    const sqrtD = Math.sqrt(D);
    const b1 = (C * a + sqrtD) / (4 * a);
    const b2 = (C * a - sqrtD) / (4 * a);
    const cand = [b1, b2].filter(b => isFiniteNum(b) && b > 0 + EPS && b < B_MAX - EPS);
    if (!cand.length) return null;
    return Math.min(...cand);
  }

  function solveAFromBV(b, V) {
    if (!isFiniteNum(b) || b <= 0 || b >= B_MAX) return null;
    if (!isFiniteNum(V) || V < 0) return null;
    const denom = (C - 2 * b) * b;
    if (!(denom > 0)) return null;
    const a = V / denom;
    if (!isFiniteNum(a) || a <= 0) return null;
    return a;
  }

  function validateAB(a, b) {
    if (!isFiniteNum(a) || a <= 0) return 'a を正の数で入力してください。';
    if (!isFiniteNum(b) || b <= 0) return 'b を正の数で入力してください。';
    if (!(b < B_MAX)) return `b は ${B_MAX.toFixed(3)} 未満にしてください。`;
    if (a > A_MAX) return `a が上限（${A_MAX}）を超えています。`;
    return '';
  }

  function updateFixedDisplay() {
    const vOn = fixedMode === 'V';
    const aOn = fixedMode === 'a';
    const bOn = fixedMode === 'b';

    btnNone.classList.toggle('fixed', fixedMode === null);
    btnV.classList.toggle('fixed', vOn);
    btnA.classList.toggle('fixed', aOn);
    btnB.classList.toggle('fixed', bOn);

    btnV.textContent = `V 固定：${vOn ? 'ON' : 'OFF'}`;
    btnA.textContent = `a 固定：${aOn ? 'ON' : 'OFF'}`;
    btnB.textContent = `b 固定：${bOn ? 'ON' : 'OFF'}`;

    fixedInfo.textContent =
      fixedMode === null ? '現在：a,bの値からVを計算しています。' :
      fixedMode === 'V'  ? '現在：Vを定数とし、a,bを変数としています' :
      fixedMode === 'a'  ? '現在：aを定数とし、b,Vを変数としています' :
                           '現在：bを定数とし、a,Vを変数としています';

    inputA.readOnly = (fixedMode === 'a');
    inputB.readOnly = (fixedMode === 'b');
    inputV.readOnly = (fixedMode === null); // 固定なしではVは結果表示
  }

  function setFixedNone() {
    fixedMode = null;
    updateFixedDisplay();
    setMessage('');
    reconcileAfterModeChange();
  }

  function toggleFixed(mode) {
    setMessage('');
    fixedMode = (fixedMode === mode) ? null : mode; // ON/OFFトグル（同時ON不可は単一状態で保証）
    updateFixedDisplay();
    reconcileAfterModeChange();
  }

  function reconcileAfterModeChange() {
    const a = readNum(inputA);
    const b = readNum(inputB);
    const V = readNum(inputV);

    try {
      if (fixedMode === null) {
        if (isFiniteNum(a) && isFiniteNum(b)) {
          const err = validateAB(a, b);
          if (err) throw new Error(err);
          inputV.value = fmt(calcV(a, b));
        } else {
          inputV.value = '';
        }
        return;
      }

      if (fixedMode === 'V') {
        if (!isFiniteNum(V)) {
          if (isFiniteNum(a) && isFiniteNum(b)) {
            const err = validateAB(a, b);
            if (err) throw new Error(err);
            inputV.value = fmt(calcV(a, b));
          } else {
            throw new Error('V固定をONにするには、V か a,b を入力してください。');
          }
        } else {
          if (isFiniteNum(b)) {
            const a2 = solveAFromBV(b, V);
            if (a2 === null) throw new Error('その b と V の組では a が求まりません。');
            if (a2 > A_MAX) throw new Error(`計算された a が上限（${A_MAX}）を超えます。`);
            inputA.value = fmt(a2);
          } else if (isFiniteNum(a)) {
            const b2 = solveBFromAV(a, V);
            if (b2 === null) throw new Error('その a と V の組では b が求まりません。');
            inputB.value = fmt(b2);
          }
        }
        return;
      }

      if (fixedMode === 'a') {
        if (!isFiniteNum(a) || a <= 0) throw new Error('a固定をONにするには a を入力してください。');
        if (a > A_MAX) throw new Error(`a が上限（${A_MAX}）を超えています。`);
        if (isFiniteNum(b)) {
          const err = validateAB(a, b);
          if (err) throw new Error(err);
          inputV.value = fmt(calcV(a, b));
        } else if (isFiniteNum(V)) {
          const b2 = solveBFromAV(a, V);
          if (b2 === null) throw new Error('その a と V の組では b が求まりません。');
          inputB.value = fmt(b2);
        }
        return;
      }

      if (fixedMode === 'b') {
        if (!isFiniteNum(b) || b <= 0) throw new Error('b固定をONにするには b を入力してください。');
        if (!(b < B_MAX)) throw new Error(`b は ${B_MAX.toFixed(3)} 未満にしてください。`);
        if (isFiniteNum(a)) {
          const err = validateAB(a, b);
          if (err) throw new Error(err);
          inputV.value = fmt(calcV(a, b));
        } else if (isFiniteNum(V)) {
          const a2 = solveAFromBV(b, V);
          if (a2 === null) throw new Error('その b と V の組では a が求まりません。');
          if (a2 > A_MAX) throw new Error(`計算された a が上限（${A_MAX}）を超えます。`);
          inputA.value = fmt(a2);
        }
      }
    } catch (e) {
      setMessage(e.message || String(e));
    }
  }

  function handleInput(changed) {
    setMessage('');
    const a = readNum(inputA);
    const b = readNum(inputB);
    const V = readNum(inputV);

    try {
      if (fixedMode === null) {
        if (changed === 'a' || changed === 'b') {
          if (isFiniteNum(a) && isFiniteNum(b)) {
            const err = validateAB(a, b);
            if (err) throw new Error(err);
            inputV.value = fmt(calcV(a, b));
          } else {
            inputV.value = '';
          }
        }
        return;
      }

      if (fixedMode === 'V') {
        if (!isFiniteNum(V)) throw new Error('V を入力してください（V固定ON）。');

        if (changed === 'a') {
          if (!isFiniteNum(a) || a <= 0) throw new Error('a を正の数で入力してください。');
          if (a > A_MAX) throw new Error(`a が上限（${A_MAX}）を超えています。`);
          const b2 = solveBFromAV(a, V);
          if (b2 === null) throw new Error('その a と V の組では b が求まりません。');
          inputB.value = fmt(b2);
          return;
        }
        if (changed === 'b') {
          if (!isFiniteNum(b) || b <= 0) throw new Error('b を正の数で入力してください。');
          if (!(b < B_MAX)) throw new Error(`b は ${B_MAX.toFixed(3)} 未満にしてください。`);
          const a2 = solveAFromBV(b, V);
          if (a2 === null) throw new Error('その b と V の組では a が求まりません。');
          if (a2 > A_MAX) throw new Error(`計算された a が上限（${A_MAX}）を超えます。`);
          inputA.value = fmt(a2);
          return;
        }
        if (changed === 'V') {
          if (isFiniteNum(b)) {
            const a2 = solveAFromBV(b, V);
            if (a2 === null) throw new Error('その b と V の組では a が求まりません。');
            if (a2 > A_MAX) throw new Error(`計算された a が上限（${A_MAX}）を超えます。`);
            inputA.value = fmt(a2);
          } else if (isFiniteNum(a)) {
            const b2 = solveBFromAV(a, V);
            if (b2 === null) throw new Error('その a と V の組では b が求まりません。');
            inputB.value = fmt(b2);
          } else {
            throw new Error('V固定ONでVを変えるときは a または b も入力してください。');
          }
        }
        return;
      }

      if (fixedMode === 'a') {
        if (!isFiniteNum(a) || a <= 0) throw new Error('a を正の数で入力してください（a固定ON）。');
        if (a > A_MAX) throw new Error(`a が上限（${A_MAX}）を超えています。`);
        if (changed === 'b') {
          if (!isFiniteNum(b) || b <= 0) throw new Error('b を正の数で入力してください。');
          if (!(b < B_MAX)) throw new Error(`b は ${B_MAX.toFixed(3)} 未満にしてください。`);
          inputV.value = fmt(calcV(a, b));
        } else if (changed === 'V') {
          if (!isFiniteNum(V)) throw new Error('V を入力してください。');
          const b2 = solveBFromAV(a, V);
          if (b2 === null) throw new Error('その a と V の組では b が求まりません。');
          inputB.value = fmt(b2);
        }
        return;
      }

      if (fixedMode === 'b') {
        if (!isFiniteNum(b) || b <= 0) throw new Error('b を正の数で入力してください（b固定ON）。');
        if (!(b < B_MAX)) throw new Error(`b は ${B_MAX.toFixed(3)} 未満にしてください。`);
        if (changed === 'a') {
          if (!isFiniteNum(a) || a <= 0) throw new Error('a を正の数で入力してください。');
          if (a > A_MAX) throw new Error(`a が上限（${A_MAX}）を超えています。`);
          inputV.value = fmt(calcV(a, b));
        } else if (changed === 'V') {
          if (!isFiniteNum(V)) throw new Error('V を入力してください。');
          const a2 = solveAFromBV(b, V);
          if (a2 === null) throw new Error('その b と V の組では a が求まりません。');
          if (a2 > A_MAX) throw new Error(`計算された a が上限（${A_MAX}）を超えます。`);
          inputA.value = fmt(a2);
        }
      }
    } catch (e) {
      setMessage(e.message || String(e));
    }
  }

  function saveCurrent() {
    const a = readNum(inputA);
    const b = readNum(inputB);
    const V = readNum(inputV);
    if (![a, b, V].every(isFiniteNum)) {
      setMessage('a, b, V の数値が揃っていません。');
      return;
    }
    saveCount += 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${saveCount}</td><td>${fmt(a)}</td><td>${fmt(b)}</td><td>${fmt(V)}</td>`;
    savedTableBody.appendChild(tr);
    setMessage('');
  }

  function openGraph() {
    setMessage('');

    const a = readNum(inputA);
    const b = readNum(inputB);
    const V = readNum(inputV);

    const w = window.open('', '_blank');
    if (!w) { setMessage('ポップアップがブロックされました。'); return; }

    const html = `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>グラフ</title>
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
<style>
  html, body { height: 100%; }
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    margin:0;
    overflow:hidden; //ホイール↓がページスクロールに奪われるのを防ぐ
  }
  #top{padding:12px 14px;border-bottom:1px solid #ddd}
  #plot{
    width:100vw;height:calc(100vh - 80px);
    touch-action:none;           
    overscroll-behavior:none;    
  }
  code{background:#f2f2f2;padding:2px 4px;border-radius:4px}
  .small{margin-top:6px;color:#444;font-size:13px}
</style></head><body>
<div id="top"><div id="desc"></div>
<div class="small">操作：ホイールで拡大・縮小、ドラッグで移動／回転。ダブルクリックでリセット。</div>
</div>
<div id="plot"></div>
<script>
const C=${C}, B_MAX=${B_MAX}, A_MAX=${A_MAX}, EPS=${EPS};
function calcV(a,b){return a*(C-2*b)*b;}
</script>
</body></html>`;
    w.document.open(); w.document.write(html); w.document.close();

    const inject = (js) => {
      const s = w.document.createElement('script');
      s.type = 'text/javascript';
      s.text = js;
      w.document.body.appendChild(s);
    };

    // ★Plotlyの設定：scrollZoomを明示（拡大・縮小の両方を安定させる）
    const plotlyConfigLiteral = `{responsive:true, scrollZoom:true, displayModeBar:true}`;

    // 固定あり→2D、固定なし→3D
    if (fixedMode === 'V') {
      if (!isFiniteNum(V)) { w.close(); setMessage('グラフ：V固定ONでは V が必要です。'); return; }
      inject(`
        const V0=${V};
        document.getElementById('desc').innerHTML =
          '2次元：<code>V='+V0.toFixed(3)+'</code> 固定（横軸：b、縦軸：a）';
        const xs=[], ys=[], N=1200;
        for(let i=0;i<N;i++){
          const b=(B_MAX-2*EPS)*(i/(N-1))+EPS;
          const denom=(C-2*b)*b;
          if(!(denom>0)) continue;
          const a=V0/denom;
          if(a>EPS && a<=A_MAX+1e-9){ xs.push(b); ys.push(a); }
        }
        Plotly.newPlot('plot',[{x:xs,y:ys,mode:'lines'}],
          {margin:{l:70,r:20,t:10,b:60},xaxis:{title:'b（高さ）'},yaxis:{title:'a（底面の横）'},
           annotations:[{xref:'paper',yref:'paper',x:0,y:1.12,showarrow:false,text:'軸対応：x=b、y=a'}]},
          ${plotlyConfigLiteral});
      `);
      return;
    }
    if (fixedMode === 'a') {
      if (!isFiniteNum(a)) { w.close(); setMessage('グラフ：a固定ONでは a が必要です。'); return; }
      inject(`
        const a0=${a};
        document.getElementById('desc').innerHTML =
          '2次元：<code>a='+a0.toFixed(3)+'</code> 固定（横軸：b、縦軸：V）';
        const xs=[], ys=[], N=900;
        for(let i=0;i<N;i++){
          const b=(B_MAX-2*EPS)*(i/(N-1))+EPS;
          xs.push(b); ys.push(calcV(a0,b));
        }
        Plotly.newPlot('plot',[{x:xs,y:ys,mode:'lines'}],
          {margin:{l:70,r:20,t:10,b:60},xaxis:{title:'b（高さ）'},yaxis:{title:'V（体積）'},
           annotations:[{xref:'paper',yref:'paper',x:0,y:1.12,showarrow:false,text:'軸対応：x=b、y=V'}]},
          ${plotlyConfigLiteral});
      `);
      return;
    }
    if (fixedMode === 'b') {
      if (!isFiniteNum(b)) { w.close(); setMessage('グラフ：b固定ONでは b が必要です。'); return; }
      inject(`
        const b0=${b};
        document.getElementById('desc').innerHTML =
          '2次元：<code>b='+b0.toFixed(3)+'</code> 固定（横軸：a、縦軸：V）';
        const xs=[], ys=[], N=700;
        for(let i=0;i<N;i++){
          const a=(A_MAX-2*EPS)*(i/(N-1))+EPS;
          xs.push(a); ys.push(calcV(a,b0));
        }
        Plotly.newPlot('plot',[{x:xs,y:ys,mode:'lines'}],
          {margin:{l:70,r:20,t:10,b:60},xaxis:{title:'a（底面の横）'},yaxis:{title:'V（体積）'},
           annotations:[{xref:'paper',yref:'paper',x:0,y:1.12,showarrow:false,text:'軸対応：x=a、y=V'}]},
          ${plotlyConfigLiteral});
      `);
      return;
    }

    // 固定なし→3D（x=b, y=a, z=V）
    inject(`
      document.getElementById('desc').innerHTML =
        '3次元：固定なし（軸：x=b、y=a、z=V）';
      const nA=60,nB=60,x=[],y=[],z=[];
      for(let i=0;i<nB;i++) x.push((B_MAX-2*EPS)*(i/(nB-1))+EPS);
      for(let j=0;j<nA;j++) y.push((A_MAX-2*EPS)*(j/(nA-1))+EPS);
      for(let j=0;j<nA;j++){
        const row=[];
        for(let i=0;i<nB;i++) row.push(calcV(y[j],x[i]));
        z.push(row);
      }
      Plotly.newPlot('plot',[{type:'surface',x:x,y:y,z:z}],
        {margin:{l:0,r:0,t:0,b:0},
         scene:{xaxis:{title:'b（高さ）'},yaxis:{title:'a（底面の横）'},zaxis:{title:'V（体積）'}}},
        ${plotlyConfigLiteral});
    `);
  }

  inputA.addEventListener('input', () => handleInput('a'));
  inputB.addEventListener('input', () => handleInput('b'));
  inputV.addEventListener('input', () => handleInput('V'));

  btnNone.addEventListener('click', setFixedNone);
  btnV.addEventListener('click', () => toggleFixed('V'));
  btnA.addEventListener('click', () => toggleFixed('a'));
  btnB.addEventListener('click', () => toggleFixed('b'));

  btnGraph.addEventListener('click', openGraph);
  btnSave.addEventListener('click', saveCurrent);

  // init
  inputA.value = fmt(4.0);
  inputB.value = fmt(5.0);
  updateFixedDisplay();
  handleInput('a');
})();
