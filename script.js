// ===== 確率分布ビューア - メインアプリケーション =====
class ProbabilityDistributionViewer {
    constructor() {
        this.state = {
            distribution: 'normal',
            currentTab: 'pdf',
            params: {
                normal: { mean: 0, stddev: 1 },
                binomial: { n: 20, p: 0.5 },
                'chi-squared': { df: 5 },
                poisson: { lambda: 4 },
                exponential: { lambda: 1 },
                uniform: { a: 0, b: 1 },
                gamma: { alpha: 2, beta: 1 }
            }
        };
        
        this.elements = {};
        this.isLoading = false;
        
        this.init();
    }

    // ===== 初期化 =====
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateUI();
        this.showToast('アプリケーションが読み込まれました', 'success');
    }

    // ===== DOM要素のキャッシュ =====
    cacheElements() {
        this.elements = {
            distSelector: document.getElementById('dist-selector'),
            parameterControls: document.getElementById('parameter-controls'),
            plotDiv: document.getElementById('plot'),
            infoPanel: document.getElementById('info-panel'),
            plotTitle: document.getElementById('plot-title'),
            statsPanel: document.getElementById('stats-panel'),
            detailedStats: document.getElementById('detailed-stats'),
            loadingOverlay: document.getElementById('loading-overlay'),
            toastContainer: document.getElementById('toast-container'),
            tabButtons: document.querySelectorAll('.tab-button'),
            resetBtn: document.getElementById('reset-btn'),
            exportBtn: document.getElementById('export-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn')
        };
    }

    // ===== イベントリスナーの設定 =====
    bindEvents() {
        // 分布選択
        this.elements.distSelector.addEventListener('change', (e) => {
            this.state.distribution = e.target.value;
            this.updateUI();
        });

        // タブ切り替え
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // アクションボタン
        this.elements.resetBtn.addEventListener('click', () => this.resetParameters());
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // キーボードショートカット
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ===== タブ切り替え =====
    switchTab(tabName) {
        this.state.currentTab = tabName;
        
        // タブボタンの状態更新
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // パネルの表示切り替え
        if (tabName === 'stats') {
            this.elements.statsPanel.style.display = 'block';
            this.updateDetailedStats();
        } else {
            this.elements.statsPanel.style.display = 'none';
        }

        // プロットタイトルの更新
        const titles = {
            'pdf': '確率密度関数 (PDF)',
            'cdf': '累積分布関数 (CDF)',
            'stats': '統計量'
        };
        this.elements.plotTitle.textContent = titles[tabName] || '';

        this.updatePlot();
    }

    // ===== UI更新のメイン関数 =====
    async updateUI() {
        try {
            this.showLoading();
            await this.setupParameterControls();
            await this.updatePlot();
            await this.updateInfoPanel();
            this.hideLoading();
        } catch (error) {
            this.handleError(error);
        }
    }

    // ===== パラメータコントロールのセットアップ =====
    async setupParameterControls() {
        const dist = this.state.distribution;
        const params = this.state.params[dist];
        
        let controlsHTML = '';
        
        switch (dist) {
            case 'normal':
                controlsHTML = this.createNormalControls(params);
                break;
            case 'binomial':
                controlsHTML = this.createBinomialControls(params);
                break;
            case 'chi-squared':
                controlsHTML = this.createChiSquaredControls(params);
                break;
            case 'poisson':
                controlsHTML = this.createPoissonControls(params);
                break;
            case 'exponential':
                controlsHTML = this.createExponentialControls(params);
                break;
            case 'uniform':
                controlsHTML = this.createUniformControls(params);
                break;
            case 'gamma':
                controlsHTML = this.createGammaControls(params);
                break;
        }
        
        this.elements.parameterControls.innerHTML = controlsHTML;
        this.bindParameterEvents();
    }

    // ===== 各分布のコントロール作成 =====
    createNormalControls(params) {
        return `
            <div class="control-group">
                <label>平均 (μ): <span class="parameter-value">${params.mean}</span></label>
                <input type="range" id="mean" class="parameter-slider" min="-5" max="5" value="${params.mean}" step="0.1">
            </div>
            <div class="control-group">
                <label>標準偏差 (σ): <span class="parameter-value">${params.stddev}</span></label>
                <input type="range" id="stddev" class="parameter-slider" min="0.1" max="5" value="${params.stddev}" step="0.1">
            </div>
        `;
    }

    createBinomialControls(params) {
        return `
            <div class="control-group">
                <label>試行回数 (n): <span class="parameter-value">${params.n}</span></label>
                <input type="range" id="n" class="parameter-slider" min="1" max="100" value="${params.n}" step="1">
            </div>
            <div class="control-group">
                <label>成功確率 (p): <span class="parameter-value">${params.p}</span></label>
                <input type="range" id="p" class="parameter-slider" min="0" max="1" value="${params.p}" step="0.01">
            </div>
        `;
    }

    createChiSquaredControls(params) {
        return `
            <div class="control-group">
                <label>自由度 (k): <span class="parameter-value">${params.df}</span></label>
                <input type="range" id="df" class="parameter-slider" min="1" max="50" value="${params.df}" step="1">
            </div>
        `;
    }

    createPoissonControls(params) {
        return `
            <div class="control-group">
                <label>平均 (λ): <span class="parameter-value">${params.lambda}</span></label>
                <input type="range" id="lambda" class="parameter-slider" min="0.1" max="20" value="${params.lambda}" step="0.1">
            </div>
        `;
    }

    createExponentialControls(params) {
        return `
            <div class="control-group">
                <label>率 (λ): <span class="parameter-value">${params.lambda}</span></label>
                <input type="range" id="lambda" class="parameter-slider" min="0.1" max="5" value="${params.lambda}" step="0.1">
            </div>
        `;
    }

    createUniformControls(params) {
        return `
            <div class="control-group">
                <label>下限 (a): <span class="parameter-value">${params.a}</span></label>
                <input type="range" id="a" class="parameter-slider" min="-5" max="5" value="${params.a}" step="0.1">
            </div>
            <div class="control-group">
                <label>上限 (b): <span class="parameter-value">${params.b}</span></label>
                <input type="range" id="b" class="parameter-slider" min="-5" max="5" value="${params.b}" step="0.1">
            </div>
        `;
    }

    createGammaControls(params) {
        return `
            <div class="control-group">
                <label>形状パラメータ (α): <span class="parameter-value">${params.alpha}</span></label>
                <input type="range" id="alpha" class="parameter-slider" min="0.1" max="10" value="${params.alpha}" step="0.1">
            </div>
            <div class="control-group">
                <label>尺度パラメータ (β): <span class="parameter-value">${params.beta}</span></label>
                <input type="range" id="beta" class="parameter-slider" min="0.1" max="5" value="${params.beta}" step="0.1">
            </div>
        `;
    }

    // ===== パラメータイベントのバインド =====
    bindParameterEvents() {
        const sliders = this.elements.parameterControls.querySelectorAll('.parameter-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => this.handleParamChange(e));
        });
    }

    // ===== パラメータ変更ハンドラ =====
    handleParamChange(e) {
        const { id, value } = e.target;
        const dist = this.state.distribution;
        
        // パラメータの更新
        this.state.params[dist][id] = parseFloat(value);
        
        // 数値表示の更新
        const valueSpan = e.target.previousElementSibling.querySelector('.parameter-value');
        if (valueSpan) {
            valueSpan.textContent = parseFloat(value).toFixed(2);
        }
        
        // 特殊な制約の処理
        this.handleParameterConstraints(dist, id, value);
        
        // UI更新
        this.debounce(() => {
            this.updatePlot();
            this.updateInfoPanel();
        }, 100)();
    }

    // ===== パラメータ制約の処理 =====
    handleParameterConstraints(dist, paramId, value) {
        if (dist === 'uniform' && paramId === 'a') {
            const bSlider = document.getElementById('b');
            if (bSlider && parseFloat(value) >= parseFloat(bSlider.value)) {
                bSlider.value = parseFloat(value) + 0.1;
                this.state.params.uniform.b = parseFloat(bSlider.value);
                bSlider.previousElementSibling.querySelector('.parameter-value').textContent = 
                    parseFloat(bSlider.value).toFixed(2);
            }
        } else if (dist === 'uniform' && paramId === 'b') {
            const aSlider = document.getElementById('a');
            if (aSlider && parseFloat(value) <= parseFloat(aSlider.value)) {
                aSlider.value = parseFloat(value) - 0.1;
                this.state.params.uniform.a = parseFloat(aSlider.value);
                aSlider.previousElementSibling.querySelector('.parameter-value').textContent = 
                    parseFloat(aSlider.value).toFixed(2);
            }
        }
    }

    // ===== デバウンス関数 =====
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== ローディング状態の管理 =====
    showLoading() {
        this.isLoading = true;
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.isLoading = false;
        this.elements.loadingOverlay.classList.remove('active');
    }

    // ===== エラーハンドリング =====
    handleError(error) {
        console.error('Error:', error);
        this.hideLoading();
        this.showToast(`エラーが発生しました: ${error.message}`, 'error');
    }

    // ===== トースト通知 =====
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // アニメーション
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 自動削除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // ===== キーボードショートカット =====
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    this.resetParameters();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportData();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        }
    }

    // ===== リセット機能 =====
    resetParameters() {
        const dist = this.state.distribution;
        const defaultParams = {
            normal: { mean: 0, stddev: 1 },
            binomial: { n: 20, p: 0.5 },
            'chi-squared': { df: 5 },
            poisson: { lambda: 4 },
            exponential: { lambda: 1 },
            uniform: { a: 0, b: 1 },
            gamma: { alpha: 2, beta: 1 }
        };
        
        this.state.params[dist] = { ...defaultParams[dist] };
        this.updateUI();
        this.showToast('パラメータがリセットされました', 'success');
    }

    // ===== エクスポート機能 =====
    exportData() {
        const dist = this.state.distribution;
        const params = this.state.params[dist];
        
        const data = {
            distribution: dist,
            parameters: params,
            timestamp: new Date().toISOString(),
            statistics: this.calculateStatistics(dist, params)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `distribution_${dist}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('データがエクスポートされました', 'success');
    }

    // ===== 全画面表示切り替え =====
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.elements.plotDiv.requestFullscreen();
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    // ===== 統計量計算 =====
    calculateStatistics(dist, params) {
        const stats = {};
        
        switch (dist) {
            case 'normal':
                stats.expectation = params.mean;
                stats.variance = params.stddev ** 2;
                stats.standardDeviation = params.stddev;
                break;
            case 'binomial':
                stats.expectation = params.n * params.p;
                stats.variance = params.n * params.p * (1 - params.p);
                stats.standardDeviation = Math.sqrt(stats.variance);
                break;
            case 'chi-squared':
                stats.expectation = params.df;
                stats.variance = 2 * params.df;
                stats.standardDeviation = Math.sqrt(2 * params.df);
                break;
            case 'poisson':
                stats.expectation = params.lambda;
                stats.variance = params.lambda;
                stats.standardDeviation = Math.sqrt(params.lambda);
                break;
            case 'exponential':
                stats.expectation = 1 / params.lambda;
                stats.variance = 1 / (params.lambda ** 2);
                stats.standardDeviation = 1 / params.lambda;
                break;
            case 'uniform':
                stats.expectation = (params.a + params.b) / 2;
                stats.variance = ((params.b - params.a) ** 2) / 12;
                stats.standardDeviation = Math.sqrt(stats.variance);
                break;
            case 'gamma':
                stats.expectation = params.alpha / params.beta;
                stats.variance = params.alpha / (params.beta ** 2);
                stats.standardDeviation = Math.sqrt(stats.variance);
                break;
        }
        
        return stats;
    }

    // ===== 詳細統計量の更新 =====
    updateDetailedStats() {
        const dist = this.state.distribution;
        const params = this.state.params[dist];
        const stats = this.calculateStatistics(dist, params);
        
        const statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.expectation.toFixed(4)}</div>
                    <div class="stat-label">期待値 E[X]</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.variance.toFixed(4)}</div>
                    <div class="stat-label">分散 Var(X)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.standardDeviation.toFixed(4)}</div>
                    <div class="stat-label">標準偏差 σ</div>
                </div>
            </div>
        `;
        
        this.elements.detailedStats.innerHTML = statsHTML;
    }

    // ===== プロット更新 =====
    async updatePlot() {
        const dist = this.state.distribution;
        const tab = this.state.currentTab;
        
        try {
            if (tab === 'pdf' || tab === 'cdf') {
                await this.drawDistributionPlot(dist, tab);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    // ===== 分布プロット描画 =====
    async drawDistributionPlot(dist, type) {
        const params = this.state.params[dist];
        let data, layout;
        
        switch (dist) {
            case 'normal':
                ({ data, layout } = this.createNormalPlot(params, type));
                break;
            case 'binomial':
                ({ data, layout } = this.createBinomialPlot(params, type));
                break;
            case 'chi-squared':
                ({ data, layout } = this.createChiSquaredPlot(params, type));
                break;
            case 'poisson':
                ({ data, layout } = this.createPoissonPlot(params, type));
                break;
            case 'exponential':
                ({ data, layout } = this.createExponentialPlot(params, type));
                break;
            case 'uniform':
                ({ data, layout } = this.createUniformPlot(params, type));
                break;
            case 'gamma':
                ({ data, layout } = this.createGammaPlot(params, type));
                break;
        }
        
        await Plotly.react(this.elements.plotDiv, data, layout, {
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            responsive: true
        });
    }

    // ===== 各分布のプロット作成 =====
    createNormalPlot(params, type) {
        const { mean, stddev } = params;
        const xValues = [];
        const yValues = [];
        
        const pdf = (x) => (1 / (stddev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stddev, 2));
        const cdf = (x) => 0.5 * (1 + this.erf((x - mean) / (stddev * Math.sqrt(2))));
        
        for (let x = mean - 4 * stddev; x <= mean + 4 * stddev; x += 0.1) {
            xValues.push(x);
            yValues.push(type === 'pdf' ? pdf(x) : cdf(x));
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#2563eb', width: 3 },
                name: type === 'pdf' ? 'PDF' : 'CDF',
                fill: type === 'cdf' ? 'tonexty' : 'none'
            }],
            layout: {
                title: type === 'pdf' ? '正規分布の確率密度関数' : '正規分布の累積分布関数',
                xaxis: { title: 'x', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率密度' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    // ===== エラー関数（正規分布のCDF用） =====
    erf(x) {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }

    // ===== ガンマ関数（既存のものを使用） =====
    gamma(z) {
        const g = 7;
        const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
        z -= 1;
        let x = p[0];
        for (let i = 1; i < g + 2; i++) {
            x += p[i] / (z + i);
        }
        const t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }

    // ===== 他の分布のプロット作成（既存のものを拡張） =====
    createBinomialPlot(params, type) {
        const { n, p } = params;
        const xValues = [];
        const yValues = [];
        
        const factorial = (num) => {
            if (num <= 1) return 1;
            return num * factorial(num - 1);
        };
        
        const combinations = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
        const pmf = (k) => combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        
        let cdfSum = 0;
        for (let k = 0; k <= n; k++) {
            xValues.push(k);
            const pmfValue = pmf(k);
            cdfSum += pmfValue;
            yValues.push(type === 'pdf' ? pmfValue : cdfSum);
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: type === 'pdf' ? 'bar' : 'scatter',
                mode: type === 'pdf' ? undefined : 'lines+markers',
                marker: type === 'pdf' ? { color: '#2563eb' } : { color: '#2563eb', size: 6 },
                line: type === 'pdf' ? undefined : { color: '#2563eb', width: 2 },
                name: type === 'pdf' ? 'PMF' : 'CDF'
            }],
            layout: {
                title: type === 'pdf' ? '二項分布の確率質量関数' : '二項分布の累積分布関数',
                xaxis: { title: '成功回数 (k)', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    // ===== 残りの分布プロット作成（簡略化） =====
    createChiSquaredPlot(params, type) {
        const { df } = params;
        const xValues = [];
        const yValues = [];
        
        const pdf = (x) => {
            if (x <= 0) return 0;
            const k = df;
            const numerator = Math.pow(x, k / 2 - 1) * Math.exp(-x / 2);
            const denominator = Math.pow(2, k / 2) * this.gamma(k / 2);
            return numerator / denominator;
        };
        
        let cdfSum = 0;
        for (let x = 0.01; x <= Math.max(60, df * 3); x += 0.1) {
            xValues.push(x);
            const pdfValue = pdf(x);
            cdfSum += pdfValue * 0.1; // 簡易的な積分
            yValues.push(type === 'pdf' ? pdfValue : Math.min(cdfSum, 1));
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#2563eb', width: 3 },
                name: type === 'pdf' ? 'PDF' : 'CDF'
            }],
            layout: {
                title: type === 'pdf' ? 'カイ二乗分布の確率密度関数' : 'カイ二乗分布の累積分布関数',
                xaxis: { title: 'x', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率密度' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    createPoissonPlot(params, type) {
        const { lambda } = params;
        const xValues = [];
        const yValues = [];
        
        const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
        const pmf = (k) => (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
        
        let cdfSum = 0;
        const maxK = Math.max(30, lambda * 2 + 10);
        for (let k = 0; k <= maxK; k++) {
            xValues.push(k);
            const pmfValue = pmf(k);
            cdfSum += pmfValue;
            yValues.push(type === 'pdf' ? pmfValue : cdfSum);
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: type === 'pdf' ? 'bar' : 'scatter',
                mode: type === 'pdf' ? undefined : 'lines+markers',
                marker: type === 'pdf' ? { color: '#2563eb' } : { color: '#2563eb', size: 6 },
                line: type === 'pdf' ? undefined : { color: '#2563eb', width: 2 },
                name: type === 'pdf' ? 'PMF' : 'CDF'
            }],
            layout: {
                title: type === 'pdf' ? 'ポアソン分布の確率質量関数' : 'ポアソン分布の累積分布関数',
                xaxis: { title: '発生回数 (k)', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    createExponentialPlot(params, type) {
        const { lambda } = params;
        const xValues = [];
        const yValues = [];
        
        const pdf = (x) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x));
        const cdf = (x) => (x < 0 ? 0 : 1 - Math.exp(-lambda * x));
        
        for (let x = 0; x <= 10; x += 0.05) {
            xValues.push(x);
            yValues.push(type === 'pdf' ? pdf(x) : cdf(x));
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#2563eb', width: 3 },
                name: type === 'pdf' ? 'PDF' : 'CDF'
            }],
            layout: {
                title: type === 'pdf' ? '指数分布の確率密度関数' : '指数分布の累積分布関数',
                xaxis: { title: 'x', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率密度' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    createUniformPlot(params, type) {
        const { a, b } = params;
        const xValues = [];
        const yValues = [];
        
        const pdf = (x) => (x >= a && x <= b ? 1 / (b - a) : 0);
        const cdf = (x) => {
            if (x < a) return 0;
            if (x > b) return 1;
            return (x - a) / (b - a);
        };
        
        for (let x = a - 1; x <= b + 1; x += 0.01) {
            xValues.push(x);
            yValues.push(type === 'pdf' ? pdf(x) : cdf(x));
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#2563eb', width: 3 },
                name: type === 'pdf' ? 'PDF' : 'CDF'
            }],
            layout: {
                title: type === 'pdf' ? '一様分布の確率密度関数' : '一様分布の累積分布関数',
                xaxis: { title: 'x', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率密度' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    createGammaPlot(params, type) {
        const { alpha, beta } = params;
        const xValues = [];
        const yValues = [];
        
        const pdf = (x) => {
            if (x <= 0) return 0;
            const numerator = Math.pow(x, alpha - 1) * Math.exp(-beta * x);
            const denominator = Math.pow(beta, alpha) * this.gamma(alpha);
            return numerator / denominator;
        };
        
        let cdfSum = 0;
        for (let x = 0.01; x <= 20; x += 0.1) {
            xValues.push(x);
            const pdfValue = pdf(x);
            cdfSum += pdfValue * 0.1; // 簡易的な積分
            yValues.push(type === 'pdf' ? pdfValue : Math.min(cdfSum, 1));
        }
        
        return {
            data: [{
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#2563eb', width: 3 },
                name: type === 'pdf' ? 'PDF' : 'CDF'
            }],
            layout: {
                title: type === 'pdf' ? 'ガンマ分布の確率密度関数' : 'ガンマ分布の累積分布関数',
                xaxis: { title: 'x', gridcolor: '#e2e8f0' },
                yaxis: { title: type === 'pdf' ? '確率密度' : '累積確率', gridcolor: '#e2e8f0' },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#1e293b' },
                margin: { l: 60, r: 40, t: 60, b: 60 }
            }
        };
    }

    // ===== 情報パネル更新 =====
    async updateInfoPanel() {
        const dist = this.state.distribution;
        const params = this.state.params[dist];
        const stats = this.calculateStatistics(dist, params);
        
        let title, description, expectation, variance;
        
        switch (dist) {
            case 'normal':
                title = '正規分布 (Normal Distribution)';
                description = '身長や測定誤差など、世の中の多くの事象が従う、最も代表的な連続型確率分布です。グラフは平均値を中心とした左右対称の釣鐘型になります。';
                expectation = `E[X] = \\mu = ${params.mean.toFixed(2)}`;
                variance = `Var(X) = \\sigma^2 = ${(params.stddev ** 2).toFixed(2)}`;
                break;
            case 'binomial':
                title = '二項分布 (Binomial Distribution)';
                description = 'コイン投げのように結果が2つしかない試行をn回繰り返したとき、一方の結果がk回起こる確率を表す離散型確率分布です。';
                expectation = `E[X] = np = ${(params.n * params.p).toFixed(2)}`;
                variance = `Var(X) = np(1-p) = ${(params.n * params.p * (1 - params.p)).toFixed(2)}`;
                break;
            case 'chi-squared':
                title = 'カイ二乗分布 (Chi-squared Distribution)';
                description = '複数の正規分布の二乗和が従う分布。仮説検定（適合度検定や独立性の検定）で広く利用される、非常に重要な連続型確率分布です。';
                expectation = `E[X] = k = ${params.df}`;
                variance = `Var(X) = 2k = ${2 * params.df}`;
                break;
            case 'poisson':
                title = 'ポアソン分布 (Poisson Distribution)';
                description = '単位時間あたりに平均λ回起こる事象が、実際にk回起こる確率を表す離散型確率分布。「稀な事象」のモデル化によく使われます。';
                expectation = `E[X] = \\lambda = ${params.lambda.toFixed(2)}`;
                variance = `Var(X) = \\lambda = ${params.lambda.toFixed(2)}`;
                break;
            case 'exponential':
                title = '指数分布 (Exponential Distribution)';
                description = 'ある事象が起きてから、次に同じ事象が起きるまでの時間（待ち時間）が従う連続型確率分布。製品の寿命予測などに応用されます。';
                expectation = `E[X] = 1/\\lambda = ${(1 / params.lambda).toFixed(2)}`;
                variance = `Var(X) = 1/\\lambda^2 = ${(1 / (params.lambda ** 2)).toFixed(2)}`;
                break;
            case 'uniform':
                title = '一様分布 (Uniform Distribution)';
                description = 'ある区間内のすべての値が等しい確率で現れる連続型確率分布。乱数生成やシミュレーションの基礎として重要です。';
                expectation = `E[X] = (a+b)/2 = ${((params.a + params.b) / 2).toFixed(2)}`;
                variance = `Var(X) = (b-a)^2/12 = ${(((params.b - params.a) ** 2) / 12).toFixed(2)}`;
                break;
            case 'gamma':
                title = 'ガンマ分布 (Gamma Distribution)';
                description = '指数分布の一般化で、複数の独立な指数分布の和が従う分布。待ち時間のモデル化や信頼性工学で使用されます。';
                expectation = `E[X] = \\alpha/\\beta = ${(params.alpha / params.beta).toFixed(2)}`;
                variance = `Var(X) = \\alpha/\\beta^2 = ${(params.alpha / (params.beta ** 2)).toFixed(2)}`;
                break;
        }
        
        this.elements.infoPanel.innerHTML = `
            <h3>${title}</h3>
            <p>${description}</p>
            <h4>統計量:</h4>
            <div id="stats"></div>
        `;
        
        // KaTeXで数式をレンダリング
        try {
            katex.render(expectation, document.getElementById('stats'), { displayMode: true });
            katex.render(variance, document.getElementById('stats'), { displayMode: true });
        } catch (error) {
            console.warn('KaTeX rendering error:', error);
        }
    }
}

// ===== アプリケーションの初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new ProbabilityDistributionViewer();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #ef4444;">
                <h2>エラーが発生しました</h2>
                <p>アプリケーションの初期化に失敗しました。</p>
                <p>ページを再読み込みしてください。</p>
            </div>
        `;
    }
});

