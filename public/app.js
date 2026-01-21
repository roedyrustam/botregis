const socket = io();

// DOM Elements
const logContent = document.getElementById('log-content');
const startBtn = document.getElementById('start-btn');
const statusBadge = document.getElementById('status-badge');
const accountsBody = document.getElementById('accounts-body');
const exportBtn = document.getElementById('export-btn');

// Inputs
const targetUrlInput = document.getElementById('targetUrl');
const selNameInput = document.getElementById('sel-name');
const selEmailInput = document.getElementById('sel-email');
const selPassInput = document.getElementById('sel-pass');
const selSubmitInput = document.getElementById('sel-submit');
const selCodeInput = document.getElementById('sel-code');
const selVerifyInput = document.getElementById('sel-verify');
const accountCountInput = document.getElementById('accountCount');
const selWhatsappInput = document.getElementById('sel-whatsapp');
const selTermsInput = document.getElementById('sel-terms');
const proxyServerInput = document.getElementById('proxy-server');
const proxyUserInput = document.getElementById('proxy-user');
const proxyPassInput = document.getElementById('proxy-pass');
const concurrencyInput = document.getElementById('concurrency');
const stopBtn = document.getElementById('stop-btn');
const patternInput = document.getElementById('sel-pattern');
const captchaKeyInput = document.getElementById('captcha-key');
const statSuccess = document.getElementById('stat-success');
const statFailed = document.getElementById('stat-failed');
const presetSelect = document.getElementById('preset-select');
const savePresetBtn = document.getElementById('save-preset-btn');
const headlessToggle = document.getElementById('headless-toggle');
const autoDetectToggle = document.getElementById('auto-detect-toggle');
const testBtn = document.getElementById('test-btn');
const templateSelect = document.getElementById('template-select');
const maxRetriesInput = document.getElementById('max-retries');

let currentPresets = [];
let currentTemplates = [];

// Socket Events
socket.on('log', (data) => {
    addLog(data.message, data.type);
});

socket.on('status', (data) => {
    updateUIStatus(data.running);
});

socket.on('stats', (data) => {
    updateStats(data);
});

// Functions
function addLog(message, type = '') {
    const p = document.createElement('p');
    p.className = type;
    p.textContent = `> ${message}`;
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
}

function updateUIStatus(running) {
    if (running) {
        statusBadge.textContent = 'Running';
        statusBadge.classList.add('running');
        startBtn.disabled = true;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
    } else {
        statusBadge.textContent = 'Idle';
        statusBadge.classList.remove('running');
        startBtn.disabled = false;
        startBtn.style.display = 'inline-block';
        startBtn.textContent = 'Mulai Registrasi';
        stopBtn.style.display = 'none';
        loadAccounts(); // Refresh accounts when finished
    }
}

function updateStats(data) {
    statSuccess.textContent = data.success || 0;
    statFailed.textContent = data.failed || 0;
}

async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const accounts = await response.json();

        accountsBody.innerHTML = '';
        accounts.reverse().forEach(acc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${acc.email}</td>
                <td><code>${acc.password}</code></td>
                <td>${new Date(acc.timestamp).toLocaleString('id-ID')}</td>
            `;
            accountsBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load accounts:', error);
    }
}

async function loadPresets() {
    try {
        const response = await fetch('/api/presets');
        currentPresets = await response.json();

        presetSelect.innerHTML = '<option value="">-- Load Preset --</option>';
        currentPresets.forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.name;
            opt.textContent = preset.name;
            presetSelect.appendChild(opt);
        });
    } catch (error) {
        console.error('Failed to load presets:', error);
    }
}

async function savePreset() {
    const name = prompt('Masukkan nama preset:');
    if (!name) return;

    const config = {
        targetUrl: targetUrlInput.value,
        selectors: {
            name: selNameInput.value,
            email: selEmailInput.value,
            password: selPassInput.value,
            submit: selSubmitInput.value,
            verificationCode: selCodeInput.value,
            verificationSubmit: selVerifyInput.value
        }
    };

    try {
        const response = await fetch('/api/presets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, config })
        });
        if (response.ok) {
            alert('Preset berhasil disimpan!');
            loadPresets();
        }
    } catch (error) {
        console.error('Failed to save preset:', error);
    }
}

function handlePresetSelection() {
    const name = presetSelect.value;
    if (!name) return;

    const preset = currentPresets.find(p => p.name === name);
    if (preset && preset.config) {
        const c = preset.config;
        targetUrlInput.value = c.targetUrl || '';
        selNameInput.value = c.selectors?.name || '';
        selEmailInput.value = c.selectors?.email || '';
        selPassInput.value = c.selectors?.password || '';
        selSubmitInput.value = c.selectors?.submit || '';
        selCodeInput.value = c.selectors?.verificationCode || '';
        selVerifyInput.value = c.selectors?.verificationSubmit || '';
    }
}

async function startRegistration() {
    const config = {
        targetUrl: targetUrlInput.value,
        selectors: {
            name: selNameInput.value,
            email: selEmailInput.value,
            password: selPassInput.value,
            submit: selSubmitInput.value,
            verificationCode: selCodeInput.value,
            verificationSubmit: selVerifyInput.value,
            whatsapp: selWhatsappInput.value,
            terms: selTermsInput.value
        },
        verificationPattern: patternInput.value,
        captchaConfig: {
            apiKey: captchaKeyInput.value
        },
        proxy: proxyServerInput.value ? {
            server: proxyServerInput.value,
            username: proxyUserInput.value,
            password: proxyPassInput.value
        } : null,
        headless: headlessToggle.checked,
        autoDetect: autoDetectToggle.checked,
        maxRetries: parseInt(maxRetriesInput.value) || 2
    };

    const count = parseInt(accountCountInput.value) || 1;
    const concurrency = parseInt(concurrencyInput.value) || 1;

    try {
        logContent.innerHTML = ''; // Clear logs
        addLog(`Memulai request registrasi untuk ${count} akun (Concurrency: ${concurrency})...`, 'info');

        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config, count, concurrency })
        });

        const result = await response.json();
        if (response.ok) {
            updateUIStatus(true);
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Gagal menghubungkan ke server: ${error.message}`, 'error');
    }
}

async function exportAccounts() {
    try {
        window.location.href = '/api/export';
    } catch (error) {
        console.error('Export failed:', error);
        alert('Gagal mengekspor data');
    }
}

async function stopRegistration() {
    try {
        addLog('Mengirim permintaan stop...', 'info');
        const response = await fetch('/api/stop', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Gagal menghentikan bot: ${error.message}`, 'error');
    }
}

// Event Listeners
startBtn.addEventListener('click', startRegistration);
stopBtn.addEventListener('click', stopRegistration);
exportBtn.addEventListener('click', exportAccounts);
savePresetBtn.addEventListener('click', savePreset);
presetSelect.addEventListener('change', handlePresetSelection);

// Test Selectors Function
async function testSelectors() {
    const selectors = {
        name: selNameInput.value,
        email: selEmailInput.value,
        password: selPassInput.value,
        submit: selSubmitInput.value
    };

    addLog('Testing selectors...', 'info');
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';

    try {
        const response = await fetch('/api/test-selectors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUrl: targetUrlInput.value,
                selectors
            })
        });

        const result = await response.json();

        if (response.ok) {
            addLog('=== Selector Test Results ===', 'success');
            for (const [key, val] of Object.entries(result.results)) {
                const status = val.valid ? '✓ VALID' : '✗ NOT FOUND';
                addLog(`${key}: ${status}`, val.valid ? 'success' : 'error');
            }
            addLog('=== Auto-Detected Fields ===', 'info');
            for (const [key, val] of Object.entries(result.autoDetected)) {
                if (val) addLog(`${key}: ${val}`, 'process');
            }
        } else {
            addLog(`Test failed: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Test error: ${error.message}`, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Selectors';
    }
}

testBtn.addEventListener('click', testSelectors);

// Template Functions
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        currentTemplates = await response.json();

        templateSelect.innerHTML = '<option value="">-- Select Template --</option>';
        currentTemplates.forEach((template, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = template.name;
            templateSelect.appendChild(opt);
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

function handleTemplateSelection() {
    const index = templateSelect.value;
    if (index === '') return;

    const template = currentTemplates[index];
    if (template) {
        if (template.targetUrl) targetUrlInput.value = template.targetUrl;
        if (template.selectors) {
            selNameInput.value = template.selectors.name || template.selectors.username || '';
            selEmailInput.value = template.selectors.email || '';
            selPassInput.value = template.selectors.password || '';
            selSubmitInput.value = template.selectors.submit || '';
            selCodeInput.value = template.selectors.verificationCode || '';
            selVerifyInput.value = template.selectors.verificationSubmit || '';
        }
        if (template.verificationPattern) patternInput.value = template.verificationPattern;

        addLog(`Template "${template.name}" loaded successfully!`, 'success');
    }
}

templateSelect.addEventListener('change', handleTemplateSelection);

// Init
loadAccounts();
loadPresets();
loadTemplates();

// Initial stats load
fetch('/api/stats').then(r => r.json()).then(updateStats);
