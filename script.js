document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---
    const distSelector = document.getElementById('dist-selector');
    const parameterControls = document.getElementById('parameter-controls');
    const plotDiv = document.getElementById('plot');
    const infoPanel = document.getElementById('info-panel');

    // --- アプリケーションの状態管理 ---
    let state = {
        distribution: 'normal',
        params: {
            normal: { mean: 0, stddev: 1 },
            binomial: { n: 20, p: 0.5 }
        }
    };

    // --- イベントリスナー ---
    distSelector.addEventListener('change', (e) => {
        state.distribution = e.target.value;
        updateUI();
    });

    // --- UI更新のメイン関数 ---
    function updateUI() {
        // 分布に応じてコントロール、グラフ、情報を更新
        setupParameterControls();
        drawPlot();
        updateInfoPanel();
    }

    // --- パラメータコントロールのセットアップ ---
    function setupParameterControls() {
        parameterControls.innerHTML = ''; // コントロールを初期化
        const dist = state.distribution;
        const params = state.params[dist];

        if (dist === 'normal') {
            // 正規分布のコントロールを作成
            parameterControls.innerHTML = `
                <div class="control-group">
                    <label>平均 (μ): <span class="parameter-value">${params.mean}</span></label>
                    <input type="range" id="mean" min="-5" max="5" value="${params.mean}" step="0.1">
                </div>
                <div class="control-group">
                    <label>標準偏差 (σ): <span class="parameter-value">${params.stddev}</span></label>
                    <input type="range" id="stddev" min="0.1" max="5" value="${params.stddev}" step="0.1">
                </div>
            `;
            // イベントリスナーを設定
            document.getElementById('mean').addEventListener('input', handleParamChange);
            document.getElementById('stddev').addEventListener('input', handleParamChange);
        } else if (dist === 'binomial') {
            // 二項分布のコントロールを作成
            parameterControls.innerHTML = `
                <div class="control-group">
                    <label>試行回数 (n): <span class="parameter-value">${params.n}</span></label>
                    <input type="range" id="n" min="1" max="100" value="${params.n}" step="1">
                </div>
                <div class="control-group">
                    <label>成功確率 (p): <span class="parameter-value">${params.p}</span></label>
                    <input type="range" id="p" min="0" max="1" value="${params.p}" step="0.01">
                </div>
            `;
            // イベントリスナーを設定
            document.getElementById('n').addEventListener('input', handleParamChange);
            document.getElementById('p').addEventListener('input', handleParamChange);
        }
    }

    // --- パラメータ変更時のハンドラ ---
    function handleParamChange(e) {
        const { id, value } = e.target;
        state.params[state.distribution][id] = parseFloat(value);
        // 数値表示を更新
        e.target.previousElementSibling.querySelector('.parameter-value').textContent = value;
        drawPlot();
        updateInfoPanel();
    }

    // --- グラフ描画 ---
    function drawPlot() {
        const dist = state.distribution;
        if (dist === 'normal') {
            drawNormalPlot();
        } else if (dist === 'binomial') {
            drawBinomialPlot();
        }
    }

    function drawNormalPlot() {
        const { mean, stddev } = state.params.normal;
        const xValues = [];
        const yValues = [];
        // 正規分布の確率密度関数 (PDF)
        const pdf = (x) => (1 / (stddev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stddev, 2));
        
        for (let x = -15; x <= 15; x += 0.1) {
            xValues.push(x);
            yValues.push(pdf(x));
        }
        
        Plotly.react(plotDiv, [{ x: xValues, y: yValues, type: 'scatter', mode: 'lines' }], 
        {
            title: '確率密度関数 (PDF)',
            xaxis: { title: 'x', range: [-15, 15] },
            yaxis: { title: '確率密度', range: [0, 1] }
        });
    }

    function drawBinomialPlot() {
        const { n, p } = state.params.binomial;
        const xValues = [];
        const yValues = [];
        // 階乗の計算（メモ化で高速化）
        const memo = [1];
        const factorial = (num) => {
            if (memo[num] !== undefined) return memo[num];
            memo[num] = num * factorial(num - 1);
            return memo[num];
        };
        // 組み合わせの計算 nCk
        const combinations = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
        // 二項分布の確率質量関数 (PMF)
        const pmf = (k) => combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);

        for (let k = 0; k <= n; k++) {
            xValues.push(k);
            yValues.push(pmf(k));
        }

        Plotly.react(plotDiv, [{ x: xValues, y: yValues, type: 'bar' }], 
        {
            title: '確率質量関数 (PMF)',
            xaxis: { title: '成功回数 (k)', range: [-0.5, n + 0.5] },
            yaxis: { title: '確率' }
        });
    }

    // --- 情報パネル更新 ---
    function updateInfoPanel() {
        infoPanel.innerHTML = ''; // パネルを初期化
        const dist = state.distribution;
        const params = state.params[dist];
        let title, description, expectation, variance;

        if (dist === 'normal') {
            title = '正規分布 (Normal Distribution)';
            description = '身長や測定誤差など、世の中の多くの事象が従う、最も代表的な連続型確率分布です。グラフは平均値を中心とした左右対称の釣鐘型になります。';
            expectation = `E[X] = \\mu = ${params.mean.toFixed(2)}`;
            variance = `Var(X) = \\sigma^2 = ${(params.stddev ** 2).toFixed(2)}`;
        } else if (dist === 'binomial') {
            title = '二項分布 (Binomial Distribution)';
            description = 'コイン投げのように結果が2つしかない試行をn回繰り返したとき、一方の結果がk回起こる確率を表す離散型確率分布です。';
            expectation = `E[X] = np = ${(params.n * params.p).toFixed(2)}`;
            variance = `Var(X) = np(1-p) = ${(params.n * params.p * (1 - params.p)).toFixed(2)}`;
        }

        infoPanel.innerHTML = `
            <h3>${title}</h3>
            <p>${description}</p>
            <h4>統計量:</h4>
            <div id="stats"></div>
        `;
        // KaTeXで数式をレンダリング
        katex.render(expectation, document.getElementById('stats'), { displayMode: true });
        katex.render(variance, document.getElementById('stats'), { displayMode: true });
    }

    // --- 初期化 ---
    updateUI();

});
