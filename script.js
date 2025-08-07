// 初期値
let currentMean = 0;
let currentStdDev = 1;

// HTML要素を取得
const plotDiv = document.getElementById('plot');
const meanSlider = document.getElementById('mean');
const stddevSlider = document.getElementById('stddev');
const meanValueSpan = document.getElementById('mean-value');
const stddevValueSpan = document.getElementById('stddev-value');

// 正規分布の確率密度関数 (PDF)
function normalPDF(x, mean, stdDev) {
    const variance = stdDev ** 2;
    const exponent = -((x - mean) ** 2) / (2 * variance);
    return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(exponent);
}

// グラフを描画・更新する関数
function updatePlot() {
    // グラフ描画用のデータ点を生成
    const xValues = [];
    const yValues = [];
    for (let x = -10; x <= 10; x += 0.1) {
        xValues.push(x);
        yValues.push(normalPDF(x, currentMean, currentStdDev));
    }

    const data = [{
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#1f77b4', width: 3 }
    }];

    const layout = {
        title: `正規分布 (μ = ${currentMean.toFixed(1)}, σ = ${currentStdDev.toFixed(1)})`,
        xaxis: { title: 'x', range: [-10, 10] },
        yaxis: { title: '確率密度', range: [0, 0.5] }
    };

    Plotly.react(plotDiv, data, layout);
}

// スライダーが動いたときの処理
meanSlider.addEventListener('input', (e) => {
    currentMean = parseFloat(e.target.value);
    meanValueSpan.textContent = currentMean.toFixed(1);
    updatePlot();
});

stddevSlider.addEventListener('input', (e) => {
    currentStdDev = parseFloat(e.target.value);
    stddevValueSpan.textContent = currentStdDev.toFixed(1);
    updatePlot();
});

// 初期グラフを描画
updatePlot();