const API_BASE = "http://127.0.0.1:8000";

const el = {
    fontSelect: document.getElementById("fontSelect"),
    fontSizeSelect: document.getElementById("fontSizeSelect"),
    modelSelect: document.getElementById("modelSelect"),
    promptSelect: document.getElementById("promptSelect"),
    coWriterBtn: document.getElementById("coWriterBtn"), // New
    sendBtn: document.getElementById("sendBtn"),
    sendBtnText: document.getElementById("sendBtnText"),
    swapBtn: document.getElementById("swapBtn"),
    copyBtn: document.getElementById("copyBtn"),
    managePromptsBtn: document.getElementById("managePromptsBtn"),
    clearBtn: document.getElementById("clearBtn"),
    viewPreviewBtn: document.getElementById("viewPreviewBtn"),
    viewDiffBtn: document.getElementById("viewDiffBtn"),
    inputText: document.getElementById("inputText"),
    outputText: document.getElementById("outputText"),
    richOutput: document.getElementById("richOutput"),
    inputCounter: document.getElementById("inputCounter"),
    outputCounter: document.getElementById("outputCounter"),
    statusBar: document.getElementById("statusBar"),
    statusText: document.getElementById("statusText"),
    statsCurrentModel: document.getElementById("statsCurrentModel"), // New
    statusTime: document.getElementById("statusTime"),
    timeWidget: document.getElementById("timeWidget"), // New
    statsTokens: document.getElementById("statsTokens"),
    statsCost: document.getElementById("statsCost"),
    costLabel: document.getElementById("costLabel"), // New
    // Balance Widget parts
    balanceWidget: document.getElementById("balanceWidget"),
    balanceSlider: document.getElementById("balanceSlider"),
    balanceLabel: document.getElementById("balanceLabel"),
    statsBalance: document.getElementById("statsBalance"),
    statsSession: document.getElementById("statsSession"),
    promptModal: document.getElementById("promptModal"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    promptList: document.getElementById("promptList"),
    promptPreview: document.getElementById("promptPreview"),
    // System Prompt X-Ray
    sysHeader: document.getElementById("sysHeader"),
    sysArrow: document.getElementById("sysArrow"),
    sysBody: document.getElementById("sysBody"),
    sysNameBadge: document.getElementById("sysNameBadge"),
    sysEditor: document.getElementById("sysEditor"),
    sysStatus: document.getElementById("sysStatus"),
    sysResetBtn: document.getElementById("sysResetBtn"),
    // Co-Writer UI
    coWriterBar: document.getElementById("coWriterBar"),
    coHeader: document.getElementById("coHeader"), // New
    coArrow: document.getElementById("coArrow"),   // New
    coWriterEditor: document.getElementById("coWriterEditor"),
    // New Presets UI
    coPresetSelect: document.getElementById("coPresetSelect"),
    coSaveBtn: document.getElementById("coSaveBtn"),
    coLockBtn: document.getElementById("coLockBtn"), // New
    coDelBtn: document.getElementById("coDelBtn")
};


// --- SETTINGS & CURRENCY LOGIC (V2 - Pro UI) ---
const domSettings = {
    modal: document.getElementById("settingsModal"),
    btn: document.getElementById("settingsBtn"),
    closeBtn: document.getElementById("closeSettingsBtn"),
    cancelBtn: document.getElementById("cancelSettingsBtn"), // New
    saveBtn: document.getElementById("saveSettingsBtn"),
    rubRateInput: document.getElementById("rubRateInput"),
    rubRateBlock: document.getElementById("rubRateBlock"),
    radios: document.getElementsByName("currencyGroup"),
    cardUSD: document.getElementById("cardUSD"),
    cardRUB: document.getElementById("cardRUB"),
    cardEUR: document.getElementById("cardEUR"), // New EUR
    // Theme Elements
    cardThemeDark: document.getElementById("cardThemeDark"),
    cardThemeLight: document.getElementById("cardThemeLight"),
    themeRadios: document.getElementsByName("themeGroup"),
    // Language Elements
    cardLangEN: document.getElementById("cardLangEN"),
    cardLangRU: document.getElementById("cardLangRU"),
    cardLangDE: document.getElementById("cardLangDE"),
    langRadios: document.getElementsByName("langGroup"),
    
    eurRateBlock: document.getElementById("eurRateBlock"), // New EUR
    eurRateInput: document.getElementById("eurRateInput"), // New EUR
    rateHeader: document.getElementById("rateHeader"), // Shared Header
    fetchCbrBtn: document.getElementById("fetchCbrBtn")
};

// Default Settings (Updated with EUR + Theme + Lang)
let appSettings = JSON.parse(localStorage.getItem('app_settings')) || { currency: 'USD', rubRate: 100, eurRate: 0.92, theme: 'dark', lang: 'en' };

// Apply theme immediately
document.documentElement.setAttribute('data-theme', appSettings.theme || 'dark');

function formatCurrency(usdValue) {
    if (usdValue === null || usdValue === undefined) return "...";
    
    // Если 0 - возвращаем красиво сразу для всех валют
    if (usdValue === 0) {
        if (appSettings.currency === 'RUB') return '₽0.00';
        if (appSettings.currency === 'EUR') return '€0.000';
        return '$0.000';
    }

    if (appSettings.currency === 'RUB') {
        const rubVal = usdValue * parseFloat(appSettings.rubRate);
        if (rubVal > 0 && rubVal < 0.01) return `₽${rubVal.toFixed(4)}`;
        return `₽${rubVal.toFixed(2)}`;
    }

    if (appSettings.currency === 'EUR') {
        const eurVal = usdValue * parseFloat(appSettings.eurRate);
        if (eurVal > 0 && eurVal < 0.01) return `€${eurVal.toFixed(4)}`;
        return `€${eurVal.toFixed(3)}`;
    }
    
    // USD
    if (usdValue < 0.01 && usdValue > 0) return `$${usdValue.toFixed(5)}`;
    return `$${usdValue.toFixed(3)}`;
}

function applyTranslations() {
    const lang = appSettings.lang || 'en';
    // Устанавливаем атрибут lang для CSS-селекторов
    document.documentElement.setAttribute('lang', lang);

    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Рекурсивный поиск ключа (например, toolbar.model)
        const val = key.split('.').reduce((o, i) => (o ? o[i] : null), t);
        
        if (val) {
            // Инпуты и текстарии (placeholder вместо textContent)
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = val;
            } 
            // Все остальные элементы
            else {
                // Используем innerHTML, так как в словаре могут быть теги <strong> или <code>
                el.innerHTML = val;
            }
        }
    });

    // Динамические лейблы статус бара
    el.costLabel.textContent = t.status.est_cost; // Default to est_cost on lang switch
    el.balanceLabel.textContent = t.status.balance;
    el.sendBtnText.textContent = t.toolbar.run; // Возвращаем текст кнопки

    // Update Co-Writer Badge
    const outTitle = document.getElementById("outputTitle");
    if(outTitle) outTitle.setAttribute("data-badge", t.output.badge);

// Обновляем глобальные переменные текста (для динамики)
window.TEXT_READY = t.status.ready;
window.TEXT_STOPPED = t.status.stopped;
window.TEXT_ERROR = t.status.error;
window.TEXT_THINKING = t.status.thinking;

// Обновляем статус X-Ray (Original/Modified) на лету
if (currentPromptText !== originalPromptText) {
    el.sysStatus.textContent = t.input.sys_modified;
} else {
    el.sysStatus.textContent = t.input.sys_original;
}

// Сбрасываем статус, чтобы обновился текст
setStatus(window.TEXT_READY);

// Перерисовываем списки, контент и счетчики
renderModelList();
renderContent(); 
updateCounters();

}

function updateSettingsUI() {
    // 1. Reset Classes & Hides
    domSettings.cardUSD.classList.remove('active');
    domSettings.cardRUB.classList.remove('active');
    domSettings.cardEUR.classList.remove('active');
    domSettings.cardThemeDark.classList.remove('active');
    domSettings.cardThemeLight.classList.remove('active');
    domSettings.cardLangEN.classList.remove('active');
    domSettings.cardLangRU.classList.remove('active');
    domSettings.cardLangDE.classList.remove('active');
    
    domSettings.rubRateBlock.style.display = 'none';
    domSettings.eurRateBlock.style.display = 'none';
    domSettings.rateHeader.style.display = 'none';

    // 2. Set Active State
    if (appSettings.currency === 'RUB') {
        domSettings.cardRUB.classList.add('active');
        domSettings.rateHeader.style.display = 'flex';
        domSettings.rubRateBlock.style.display = 'block';
    } else if (appSettings.currency === 'EUR') {
        domSettings.cardEUR.classList.add('active');
        domSettings.rateHeader.style.display = 'flex';
        domSettings.eurRateBlock.style.display = 'block';
    } else {
        domSettings.cardUSD.classList.add('active');
    }

    // Theme UI Logic
    if (appSettings.theme === 'light') {
        domSettings.cardThemeLight.classList.add('active');
        domSettings.themeRadios[1].checked = true;
    } else {
        domSettings.cardThemeDark.classList.add('active');
        domSettings.themeRadios[0].checked = true;
    }

    // Language UI Logic
    if (appSettings.lang === 'ru') {
        domSettings.cardLangRU.classList.add('active');
        domSettings.langRadios[1].checked = true;
    } else if (appSettings.lang === 'de') {
        domSettings.cardLangDE.classList.add('active');
        domSettings.langRadios[2].checked = true;
    } else {
        domSettings.cardLangEN.classList.add('active');
        domSettings.langRadios[0].checked = true;
    }

    // 3. Sync Radio & Inputs
    Array.from(domSettings.radios).forEach(r => r.checked = (r.value === appSettings.currency));
    domSettings.rubRateInput.value = appSettings.rubRate;
    domSettings.eurRateInput.value = appSettings.eurRate;
}

// Logic for clicking cards to select radio
domSettings.cardUSD.addEventListener('click', () => {
    domSettings.cardUSD.classList.add('active');
    domSettings.cardRUB.classList.remove('active');
    domSettings.rubRateBlock.style.display = 'none';
    domSettings.radios[0].checked = true; // USD is first
});

domSettings.cardRUB.addEventListener('click', () => {
    appSettings.currency = 'RUB'; // Temporary switch for visual
    updateSettingsUI();
});

domSettings.cardEUR.addEventListener('click', () => {
    appSettings.currency = 'EUR'; // Temporary switch for visual
    updateSettingsUI();
});

// Fix logic for USD too
domSettings.cardUSD.addEventListener('click', () => {
    appSettings.currency = 'USD';
    updateSettingsUI();
});

// Theme Click Logic (Visual only until saved, or instant apply? Let's do instant preview)
domSettings.cardThemeDark.addEventListener('click', () => {
    appSettings.theme = 'dark';
    document.documentElement.setAttribute('data-theme', 'dark');
    updateSettingsUI();
});

domSettings.cardThemeLight.addEventListener('click', () => {
    appSettings.theme = 'light';
    document.documentElement.setAttribute('data-theme', 'light');
    updateSettingsUI();
});

// Language Click Logic
domSettings.cardLangEN.addEventListener('click', () => { appSettings.lang = 'en'; updateSettingsUI(); });
domSettings.cardLangRU.addEventListener('click', () => { appSettings.lang = 'ru'; updateSettingsUI(); });
domSettings.cardLangDE.addEventListener('click', () => { appSettings.lang = 'de'; updateSettingsUI(); });

domSettings.btn.addEventListener('click', () => {
    updateSettingsUI(); // Reset UI to saved state
    domSettings.modal.classList.add('active');
});

const closeLogic = () => domSettings.modal.classList.remove('active');
domSettings.closeBtn.addEventListener('click', closeLogic);
domSettings.cancelBtn.addEventListener('click', closeLogic);
domSettings.modal.addEventListener('click', (e) => { if(e.target === domSettings.modal) closeLogic(); });

async function fetchAndApplyRate(manualClick = false) {
    if (manualClick) {
        const originalText = domSettings.fetchCbrBtn.textContent;
        domSettings.fetchCbrBtn.textContent = "...";
        try {
            const res = await fetch(`${API_BASE}/exchange_rate`);
            const data = await res.json();
            
            if (data.rub_rate) domSettings.rubRateInput.value = data.rub_rate.toFixed(2);
            if (data.eur_rate) domSettings.eurRateInput.value = data.eur_rate.toFixed(3);
            
        } catch(e) { console.error(e); }
        domSettings.fetchCbrBtn.textContent = originalText;
    } else {
        // Auto-load silently
        try {
            const res = await fetch(`${API_BASE}/exchange_rate`);
            const data = await res.json();
            
            if (data.rub_rate && data.eur_rate) {
                // Update Memory
                appSettings.rubRate = parseFloat(data.rub_rate.toFixed(2));
                appSettings.eurRate = parseFloat(data.eur_rate.toFixed(3));
                localStorage.setItem('app_settings', JSON.stringify(appSettings));
                
                // Update UI Inputs
                domSettings.rubRateInput.value = appSettings.rubRate;
                domSettings.eurRateInput.value = appSettings.eurRate;
                
                // Refresh UI counters
                updateCounters(); 
                updateBalanceDisplay();
                el.statsSession.textContent = formatCurrency(sessionTotalCost);
            }
        } catch(e) { console.error("Auto-update rate failed", e); }
    }
}

// Button Listener
domSettings.fetchCbrBtn.addEventListener('click', () => fetchAndApplyRate(true));

// SAVE Logic
domSettings.saveBtn.addEventListener('click', () => {
    const selectedCurrency = Array.from(domSettings.radios).find(r => r.checked)?.value || 'USD';
    const rubRate = parseFloat(domSettings.rubRateInput.value) || 100;
    const eurRate = parseFloat(domSettings.eurRateInput.value) || 0.92;
    const selectedTheme = Array.from(domSettings.themeRadios).find(r => r.checked)?.value || 'dark';
    const selectedLang = Array.from(domSettings.langRadios).find(r => r.checked)?.value || 'en';

    appSettings = { 
        currency: selectedCurrency, 
        rubRate: rubRate, 
        eurRate: eurRate, 
        theme: selectedTheme, 
        lang: selectedLang 
    };
    
    localStorage.setItem('app_settings', JSON.stringify(appSettings));
    
    document.documentElement.setAttribute('data-theme', selectedTheme);
    
    // --- UPDATES ---
    applyTranslations(); // Применяем язык
    updateCounters(); 
    updateBalanceDisplay();
    
    el.statsSession.textContent = formatCurrency(sessionTotalCost);
    
    closeLogic();
});

// Initial update of Spent on load (Fix for fresh refresh)
setTimeout(() => {
    el.statsSession.textContent = formatCurrency(sessionTotalCost);
}, 100);



let currentPromptText = "";
let promptsData = [];
// Session Logic
let sessionTotalCost = 0.000;
let lastEstimatedCost = 0.000; // Хранит стоимость последнего расчета
let currentView = 'preview'; // 'preview' or 'diff'
let modelsPricing = {}; // Хранилище цен: { 'model-id': { prompt: 0.0...1, completion: 0.0...2 } }

marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });

// --- X-Ray Logic ---
let originalPromptText = ""; // Хранит "чистую" версию из файла

function toggleSysPrompt() {
    const isOpen = el.sysBody.classList.contains('open');
    if (isOpen) {
        el.sysBody.classList.remove('open');
        el.sysArrow.classList.remove('rotated');
    } else {
        el.sysBody.classList.add('open');
        el.sysArrow.classList.add('rotated');
    }
}

function handleSysEdit() {
currentPromptText = el.sysEditor.value;
// Localization
const lang = appSettings.lang || 'en';
const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

if (currentPromptText !== originalPromptText) {
    el.sysStatus.textContent = t.input.sys_modified;
    el.sysStatus.classList.add("status-modified"); // Новый класс
    el.sysResetBtn.classList.add("active");
} else {
    el.sysStatus.textContent = t.input.sys_original;
    el.sysStatus.classList.remove("status-modified"); // Убираем новый класс
    el.sysResetBtn.classList.remove("active");
}

updateCounters();
}

function revertSysPrompt(e) {
    if(e) e.stopPropagation(); // Чтобы не сработал клик по хедеру
    el.sysEditor.value = originalPromptText;
    handleSysEdit(); // Сбросит статусы
}

// Listeners for X-Ray
el.sysHeader.addEventListener('click', toggleSysPrompt);
el.sysEditor.addEventListener('input', handleSysEdit);
el.sysResetBtn.addEventListener('click', revertSysPrompt);

// --- Model Management Logic ---

const DEFAULT_MODELS = [
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview" },
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude 4.5 Sonnet" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "mistralai/mistral-large-2411", name: "Mistral Large 2411" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "openai/gpt-5.1-chat", name: "GPT-5.1 Chat" }
];

// Загружаем список и дефолтную модель
let appModels = JSON.parse(localStorage.getItem('app_models')) || DEFAULT_MODELS;
let defaultModelId = localStorage.getItem('app_default_model') || appModels[0].id;

const domModels = {
    modal: document.getElementById("modelsModal"),
    list: document.getElementById("modelsList"),
    inputId: document.getElementById("newModelId"),
    inputName: document.getElementById("newModelName"),
    addBtn: document.getElementById("addModelBtn"),
    openBtn: document.getElementById("manageModelsBtn"),
    closeBtn: document.getElementById("closeModelsBtn"),
    resetBtn: document.getElementById("resetModelsBtn"),
    statsDefault: document.getElementById("statsDefault"),
    statsDefaultPrompt: document.getElementById("statsDefaultPrompt")
};

// Добавляем чтение из памяти
let defaultPromptName = localStorage.getItem('app_default_prompt') || null;

function saveModels() {
    localStorage.setItem('app_models', JSON.stringify(appModels));
    localStorage.setItem('app_default_model', defaultModelId);
    
    renderModelSelect();
    renderModelList();
    updateDefaultStatus();
}

function updateDefaultStatus() {
    const model = appModels.find(m => m.id === defaultModelId) || appModels[0];
    if (model) {
        domModels.statsDefault.textContent = model.name;
    }
}

function updateDefaultPromptStatus() {
    if (defaultPromptName) {
        domModels.statsDefaultPrompt.textContent = defaultPromptName;
    } else {
        domModels.statsDefaultPrompt.textContent = "None";
    }
}

function renderModelSelect() {
    const currentVal = el.modelSelect.value;
    el.modelSelect.innerHTML = '';
    
    appModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        el.modelSelect.appendChild(opt);
    });

    // Если текущий выбор валиден - оставляем, иначе ставим дефолтный
    if (appModels.some(m => m.id === currentVal)) {
        el.modelSelect.value = currentVal;
    } else {
        el.modelSelect.value = defaultModelId;
    }
    // Обновляем индикатор внизу сразу после рендера
    setTimeout(updateCurrentModelLabel, 0);
}

function renderModelList() {
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    domModels.list.innerHTML = '';
    appModels.forEach((m, index) => {
        const isDefault = m.id === defaultModelId;
        const div = document.createElement('div');
        div.className = 'model-item';
        div.innerHTML = `
            <div class="model-info">
                <span class="model-name">${m.name} ${isDefault ? `<span style="color:#e3b341; font-size:10px; margin-left:4px;">${t.models.default_tag}</span>` : ''}</span>
                <span class="model-id">${m.id}</span>
            </div>
            <div style="display:flex; align-items:center;">
                <button class="btn-fav-model ${isDefault ? 'active' : ''}" 
                        title="${isDefault ? t.models.curr_def_tip : t.models.set_def_tip}"
                        onclick="setDefaultModel('${m.id}')">
                    ${isDefault ? '★' : '☆'}
                </button>
                <button class="btn-del-model" onclick="deleteModel(${index})" title="Remove">✕</button>
            </div>
        `;
        domModels.list.appendChild(div);
    });
}

function addModel() {
    const id = domModels.inputId.value.trim();
    const name = domModels.inputName.value.trim();
    if (!id || !name) return alert("Enter both ID and Name");
    
    appModels.push({ id, name });
    domModels.inputId.value = '';
    domModels.inputName.value = '';
    saveModels();
}

// Глобальные функции для HTML-событий
window.setDefaultModel = function(id) {
    defaultModelId = id;
    saveModels();
    el.modelSelect.value = id; 
};

window.setDefaultPrompt = function(name, event) {
    if(event) event.stopPropagation();
    defaultPromptName = name;
    localStorage.setItem('app_default_prompt', defaultPromptName);
    renderPromptList();
    updateDefaultPromptStatus();
};

window.deleteModel = function(index) {
    if(confirm('Remove this model?')) {
        const deletedId = appModels[index].id;
        appModels.splice(index, 1);
        if (deletedId === defaultModelId && appModels.length > 0) {
            defaultModelId = appModels[0].id;
        }
        saveModels();
    }
};

// Listeners
domModels.openBtn.addEventListener('click', () => {
    domModels.modal.classList.add('active');
    renderModelList();
});
domModels.closeBtn.addEventListener('click', () => domModels.modal.classList.remove('active'));
domModels.modal.addEventListener('click', (e) => { if(e.target === domModels.modal) domModels.modal.classList.remove('active'); });
domModels.addBtn.addEventListener('click', addModel);

domModels.resetBtn.addEventListener('click', () => {
    if(confirm('Reset models to default list?')) {
        appModels = [...DEFAULT_MODELS];
        defaultModelId = DEFAULT_MODELS[0].id;
        saveModels();
    }
});

// Initial Boot
renderModelSelect();
el.modelSelect.value = defaultModelId; 
updateDefaultStatus();

// --- Core Logic ---

function updateCounters() {
    // Localization fix
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    if (el.costLabel) el.costLabel.textContent = t.status.est_cost; // Use localized string
    // 1. Считаем длину текста (Input + System Prompt + Co-Writer)
    const userTextLen = el.inputText.value.length;
    let systemPromptLen = currentPromptText ? currentPromptText.length : 0;
    
    // Если включен Co-Writer, добавляем его длину
    if (isCoWriterMode) {
        systemPromptLen += el.coWriterEditor.value.length;
    }

    const outputLen = el.outputText.value.length;

    // Берем слово из словаря (lang и t мы определили в начале функции в прошлом шаге)
    el.inputCounter.textContent = `${userTextLen} ${t.input.chars}`;
    el.outputCounter.textContent = `${outputLen} ${t.input.chars}`;
    
    // 2. Оценка токенов (1 токен ~ 4 символа для англ, для кириллицы чуть больше, берем усредненно 3.5)
    // Input Tokens = (User Text + System Prompt + Co-Writer)
    const inputTokens = Math.ceil((userTextLen + systemPromptLen) / 3.5);
    const outputTokens = Math.ceil(outputLen / 3.5);
    const totalTokens = inputTokens + outputTokens;

    el.statsTokens.textContent = `~ ${totalTokens}`;
    
    // 3. Расчет стоимости
    const currentModelId = el.modelSelect.value;
    const pricing = modelsPricing[currentModelId];

    let cost = 0;
    if (pricing) {
        // Цена за Input (Промпт + Текст) + Цена за Output (То, что уже сгенерировано)
        // Если Output еще нет, мы не можем его угадать точно, но показываем стоимость "на данный момент"
        cost = (inputTokens * pricing.prompt) + (outputTokens * pricing.completion);
        
        // Если генерация еще не шла (output=0), можно добавить эвристику для "Прогноза":
        // Предположим, что output будет равен input (частый кейс для рерайта)
        if (outputTokens === 0 && inputTokens > 0) {
             // Раскомментируйте строку ниже, если хотите видеть цену "с учетом ожидаемого ответа"
             // cost += (inputTokens * pricing.completion); 
        }
    } else {
        // Fallback, если цены не подгрузились (как было раньше, но помечаем звездочкой)
        cost = totalTokens * 0.00001; 
    }

    // Форматирование: через новую функцию
    el.statsCost.textContent = formatCurrency(cost);
    lastEstimatedCost = cost; // Сохраняем для истории сессии
}

function renderContent() {
    if (currentView === 'diff') {
        renderDiff();
    } else {
        renderRichText();
    }
}

function renderRichText() {
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    const rawText = el.outputText.value;
    if (!rawText && !el.inputText.value) {
            el.richOutput.innerHTML = `<div style="color: var(--text-muted); display: flex; height: 100%; align-items: center; justify-content: center; flex-direction: column; gap: 10px;"><div style="font-size: 40px; opacity: 0.2;">⌨️</div><div>${t.output.empty}</div></div>`;
            return;
    }
    if (!rawText) { el.richOutput.innerHTML = ''; return; }

    let html = marked.parse(rawText);
    html = DOMPurify.sanitize(html);
    el.richOutput.innerHTML = html;

    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
        enhanceCodeBlock(block);
    });
    applyStyles();
}

function renderDiff() {
    const oldText = el.inputText.value;
    const newText = el.outputText.value;
    
    // Localization
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    if (!oldText || !newText) {
        el.richOutput.innerHTML = `<div style="padding:20px; color:var(--text-muted)">${t.output.diff_error}</div>`;
        return;
    }

    const diff = Diff.diffWords(oldText, newText);
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    div.className = 'diff-view';

    diff.forEach((part) => {
        const span = document.createElement('span');
        span.style.whiteSpace = 'pre-wrap';
        if (part.added) {
            span.className = 'diff-add';
            span.textContent = part.value;
        } else if (part.removed) {
            span.className = 'diff-del';
            span.textContent = part.value;
        } else {
            span.textContent = part.value;
        }
        div.appendChild(span);
    });
    
    el.richOutput.innerHTML = '';
    el.richOutput.appendChild(div);
    applyStyles();
}

function enhanceCodeBlock(codeElement) {
    const pre = codeElement.parentElement;
    const langClass = Array.from(codeElement.classList).find(c => c.startsWith('language-'));
    const langName = langClass ? langClass.replace('language-', '') : 'text';
    
    const header = document.createElement('div');
    header.className = 'code-header';
    
    const langSpan = document.createElement('span');
    langSpan.textContent = langName.toUpperCase();
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<span>📋</span> Copy';
    
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(codeElement.innerText);
            copyBtn.innerHTML = '<span>✓</span> Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = '<span>📋</span> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {}
    });

    header.appendChild(langSpan);
    header.appendChild(copyBtn);
    pre.insertBefore(header, codeElement);
}

function applyStyles() {
    const font = el.fontSelect.value;
    const size = el.fontSizeSelect.value + 'px';
    el.inputText.style.fontFamily = font === 'Inter' ? "'Inter', sans-serif" : font;
    el.inputText.style.fontSize = size;
    el.richOutput.style.fontFamily = font;
    el.richOutput.style.fontSize = size;
}

function setStatus(msg, type = 'ready', time = '') {
    el.statusText.textContent = msg;
    el.statusBar.className = `status-bar ${type}`;
    
    if (time) {
        el.statusTime.textContent = time;
        el.timeWidget.style.display = 'inline'; // Показываем секцию
    } else {
        el.timeWidget.style.display = 'none';   // Прячем секцию
    }
}

// --- API Key Management ---
const domKey = {
    modal: document.getElementById("apiKeyModal"),
    btn: document.getElementById("apiKeyBtn"),
    closeBtn: document.getElementById("closeKeyModalBtn"),
    input: document.getElementById("apiKeyInput"),
    saveBtn: document.getElementById("saveKeyBtn"),
    delBtn: document.getElementById("deleteKeyBtn"),
    toggleVisBtn: document.getElementById("toggleKeyVisBtn"),
    copyKeyBtn: document.getElementById("copyKeyBtn"),
    statusMsg: document.getElementById("keyStatusMsg")
};

async function checkApiKeyStatus() {
    try {
        const res = await fetch(`${API_BASE}/api_key`);
        const data = await res.json();
        
        domKey.input.value = data.key;

        // Localization
        const lang = appSettings.lang || 'en';
        const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
        
        if (!data.is_valid) {
            domKey.btn.classList.add('needs-attention');
            
            if (data.is_placeholder) {
                showKeyMsg(t.key.status_placeholder, "warning");
                if (!sessionStorage.getItem('onboarding_shown')) {
                    domKey.modal.classList.add('active');
                    domKey.input.setAttribute('type', 'text');
                    domKey.toggleVisBtn.style.opacity = '1';
                    sessionStorage.setItem('onboarding_shown', 'true');
                }

             } else if (!data.key) {
                showKeyMsg(t.key.status_missing, "warning");
            }
            el.statsBalance.textContent = "No Key";
            el.statsBalance.style.color = "var(--text-muted)";
        } else {
            domKey.btn.classList.remove('needs-attention');
            showKeyMsg(t.key.status_valid, "valid");
            updateBalanceDisplay(); // Call balance update
        }
    } catch(e) { console.error("Key check failed", e); }
}

// Добавляем новую функцию
async function updateBalanceDisplay() {
    try {
        el.statsBalance.textContent = "...";
        const res = await fetch(`${API_BASE}/balance`);
        const data = await res.json();
        
        if (data.balance !== null) {
            // Форматируем (Рубли или Доллары)
            el.statsBalance.textContent = formatCurrency(data.balance);
            
            // Threshold logic
            // FIX: Сравниваем реальный долларовый баланс с порогом в $1.00
            // Это работает корректно для любой валюты отображения.
            const safeThresholdUSD = 1.0;

            if (data.balance > safeThresholdUSD) el.statsBalance.style.color = "#7ee787"; // Green
            else if (data.balance > 0) el.statsBalance.style.color = "#e3b341"; // Yellow
            else el.statsBalance.style.color = "#da3633"; // Red
        } else {
            el.statsBalance.textContent = "N/A";
            el.statsBalance.style.color = "var(--text-muted)";
        }
    } catch (e) {
        el.statsBalance.textContent = "Err";
    }
}

function showKeyMsg(text, type) {
    domKey.statusMsg.textContent = text;
    domKey.statusMsg.className = `key-status-msg ${type}`;
    domKey.statusMsg.style.display = 'block';
}

domKey.btn.addEventListener('click', () => {
    domKey.input.setAttribute('type', 'password');
    domKey.toggleVisBtn.style.opacity = '0.5';
    checkApiKeyStatus();
    domKey.modal.classList.add('active');
});
domKey.closeBtn.addEventListener('click', () => domKey.modal.classList.remove('active'));
domKey.modal.addEventListener('click', (e) => { if(e.target === domKey.modal) domKey.modal.classList.remove('active'); });

domKey.toggleVisBtn.addEventListener('click', () => {
    const type = domKey.input.getAttribute('type') === 'password' ? 'text' : 'password';
    domKey.input.setAttribute('type', type);
    domKey.toggleVisBtn.style.opacity = type === 'text' ? '1' : '0.5';
});

domKey.copyKeyBtn.addEventListener('click', async () => {
    const key = domKey.input.value;
    if(!key) return;
    await navigator.clipboard.writeText(key);
    const originalHtml = domKey.copyKeyBtn.innerHTML;
    domKey.copyKeyBtn.innerHTML = '<span style="color:#3fb950">✓</span>';
    setTimeout(() => {
        domKey.copyKeyBtn.innerHTML = originalHtml;
    }, 1500);
});

domKey.saveBtn.addEventListener('click', async () => {
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    const newKey = domKey.input.value.trim();
    if(!newKey) return alert(t.key.alert_empty);
    
    try {
        const res = await fetch(`${API_BASE}/api_key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: newKey })
        });
        const data = await res.json();
         if(data.is_valid) {
            domKey.btn.classList.remove('needs-attention');
            showKeyMsg(t.key.status_saved, "valid");
            updateBalanceDisplay(); 
            setTimeout(() => domKey.modal.classList.remove('active'), 1000);
        } else {
            showKeyMsg(t.key.status_invalid, "warning");
        }
    } catch(e) { alert("Error saving key"); }
});

domKey.delBtn.addEventListener('click', async () => {
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    if(confirm(t.key.confirm_remove)) {
        await fetch(`${API_BASE}/api_key`, { method: 'DELETE' });
        domKey.input.value = "";
        domKey.btn.classList.add('needs-attention');
        showKeyMsg(t.key.status_removed, "warning");
    }
});

checkApiKeyStatus();




// --- Co-Writer Logic & Presets ---

// 1. Дефолтные пресеты (с защитой)
const DEFAULT_CO_PRESETS = [
    {
        name: "🧠 Universal Flow",
        text: `[SYSTEM: ADAPTIVE CHAMELEON ENGINE]
Your goal is to merge with the user's thought process so seamlessly that the transition is invisible. You are an extension of their mind.

### PHASE 1: GRAMMAR GUARD (CRITICAL)
Check the **LAST CHARACTER** of the input:
1. **NO Punctuation** (e.g., "...fried eggs") -> You MUST start with a **lowercase** letter (e.g., "...or maybe just coffee.").
2. **Comma (,)** -> You MUST start with a **lowercase** letter.
3. **Period/Exclamation/Question (. ? !)** -> You MUST start with an **UPPERCASE** letter.

### PHASE 2: CONTEXT & GENRE
1. **Narrative:** Focus on atmosphere and sensory details.
2. **Technical:** Focus on logic and data.
3. **Casual:** Focus on natural flow and emotion.

### PHASE 3: EXECUTION RULES
- **Tone Matching:** Mimic the user's vocabulary complexity exactly.
- **Value Add:** Advance the story, complete the argument, or close the logic loop. Don't just spin in circles.
- **No Repetition:** Do NOT repeat the user's last words.

### CONSTRAINT:
- Output **ONLY** the added text.
- Language: Strict adherence to the input language.
- Length: Adaptive (1-3 sentences).`,
        locked: true,
        isSystem: true 
    },
    {
        name: "🔄 Rewrite",
        text: `[SYSTEM: ADAPTIVE PARAPHRASER]
TASK: Rewrite the input text using different words ("Paraphrasing"), but **KEEP THE VIBE**.

### TONE RULES (CRITICAL):
1. **Detect Tone:** 
   - If input is **Casual/Slang** -> Keep it casual (Don't make it sound corporate).
   - If input is **Formal** -> Keep it formal.
   - If input is **Neutral** -> Keep it natural and human.
2. **No "Bureaucratspeak":** Avoid overly complex or dry words unless the source text uses them.

### EXECUTION RULES:
1. **Fresh Vocabulary:** Use synonyms but keep the original meaning 100% intact.
2. **Language:** Output in the SAME language as input.

### CONSTRAINT:
Output **ONLY** the rewritten text.`,
        locked: true,
        isSystem: true
    },
    {
        name: "⏩ Next Step",
        text: `[SYSTEM: NARRATIVE VELOCITY ENGINE]
TASK: The user has completed a thought. Your job is to generate the **IMMEDIATE CONSEQUENCE**, **REACTION**, or **LOGICAL CONCLUSION**.

### RULES:
1. **LANGUAGE LOCK (CRITICAL):** Detect the language of the input (Russian, English, German, etc.). Your output **MUST** be in the SAME language.
2. **Logic Forward:** 
   - If Input is Action ("He jumped") -> Output Result ("He landed...").
   - If Input is Question ("Why?") -> Output Answer ("Because...").
   - If Input is Argument -> Output Conclusion.
3. **Tone Sync:** Match the user's vibe (Formal vs. Casual).

### CONSTRAINT:
- Start with a **Capital Letter** (Assume a new sentence).
- Keep it punchy (2-3 sentences max).
- NO repetition of old info. Move the story/logic FORWARD.`,
        locked: true,
        isSystem: true
    },
    {
        name: "🎨 Add Detail",
        text: `[SYSTEM: CONTEXTUAL ENRICHER]
TASK: The user wants to "Zoom In" on the last concept mentioned. You must add a specific, rational, or vivid detail that enhances the current thought without breaking the flow.

### RULES:
1. **LANGUAGE LOCK (CRITICAL):** Output in the SAME language as input.
2. **Context Adaptation:**
   - **IF Narrative:** Add sensory details (light, texture, sound, emotion). Make it immersive.
   - **IF Technical/Business:** Add precision, specific examples, or data clarification. Make it concrete.
   - **IF Abstract:** Add a grounding metaphor.
3. **Rationality:** Do not add "fluff". The detail must serve a purpose (clarify or immerse).

### CONSTRAINT:
- Output **ONLY** the expansion (1-2 sentences).
- Start naturally, as if continuing the description.`,
        locked: true,
        isSystem: true
    }
];

// 2. Загрузка из LocalStorage
let loadedPresets = JSON.parse(localStorage.getItem('cowriter_presets')) || [];

// --- AUTO-UPDATE SYSTEM PRESETS ---
// 1. Сохраняем только пользовательские (Custom) пресеты из памяти
const userCustomPresets = loadedPresets.filter(p => !p.isSystem);

// 2. Объединяем: Свежие системные (из кода) + Сохраненные пользовательские
let coPresets = [...DEFAULT_CO_PRESETS, ...userCustomPresets];

// 3. Обновляем память, чтобы там всегда была актуальная версия
localStorage.setItem('cowriter_presets', JSON.stringify(coPresets));
// ----------------------------------

let isCoWriterMode = false;

// Рендер списка
function renderCoPresets() {
    const currentVal = el.coPresetSelect.value;
    el.coPresetSelect.innerHTML = '';
    
    // Опция "Custom"
    const customOpt = document.createElement('option');
    customOpt.value = "_custom";
    customOpt.textContent = "-- Custom / Edited --";
    el.coPresetSelect.appendChild(customOpt);

    coPresets.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = p.name;
        el.coPresetSelect.appendChild(opt);
    });

    // Восстановление выбора
    if (currentVal && currentVal !== "_custom") {
        el.coPresetSelect.value = currentVal;
    } else {
        el.coPresetSelect.value = "0"; 
    }
}

// Функция управления состоянием кнопок (Замок и Удаление)
function updateControlsState() {
    const val = el.coPresetSelect.value;
    
    // Сценарий: Custom (пишем руками)
    if (val === "_custom") {
        el.coLockBtn.textContent = "🔓";
        el.coLockBtn.disabled = true;
        el.coLockBtn.style.opacity = "0.3";
        
        // Скрываем кнопку удаления для несохраненного
        el.coDelBtn.style.display = "none"; 
        return;
    }

    const preset = coPresets[val];
    if (!preset) return;

    // 1. Кнопка ЗАМКА
    if (preset.locked) {
        el.coLockBtn.textContent = "🔒";
    } else {
        el.coLockBtn.textContent = "🔓";
    }

    if (preset.isSystem) {
        // СИСТЕМНЫЙ ПРЕСЕТ
        el.coLockBtn.disabled = true;
        el.coLockBtn.style.opacity = "0.5";
        el.coLockBtn.title = "System preset (Always locked)";

        // Прячем кнопку удаления совсем
        el.coDelBtn.style.display = "none"; 
    } else {
        // ПОЛЬЗОВАТЕЛЬСКИЙ ПРЕСЕТ
        el.coLockBtn.disabled = false;
        el.coLockBtn.style.opacity = "1";
        el.coLockBtn.title = preset.locked ? "Click to Unlock" : "Click to Lock";

        // Показываем кнопку удаления
        el.coDelBtn.style.display = "flex"; 

        // Но блокируем её, если замок закрыт
        if (preset.locked) {
            el.coDelBtn.disabled = true;
            el.coDelBtn.style.opacity = "0.3";
        } else {
            el.coDelBtn.disabled = false;
            el.coDelBtn.style.opacity = "1";
        }
    }
}

// --- СЛУШАТЕЛИ СОБЫТИЙ ---

// 1. Клик по ЗАМКУ
el.coLockBtn.addEventListener('click', () => {
    const val = el.coPresetSelect.value;
    if (val === "_custom") return;

    const preset = coPresets[val];
    preset.locked = !preset.locked; // Переключаем
    
    localStorage.setItem('cowriter_presets', JSON.stringify(coPresets));
    updateControlsState(); // Обновляем вид
});

// 2. Выбор пресета в списке
el.coPresetSelect.addEventListener('change', () => {
    const val = el.coPresetSelect.value;
    if (val === "_custom") return;
    
    const preset = coPresets[val];
    if (preset) {
        el.coWriterEditor.value = preset.text;
    }
    updateControlsState(); // Обновляем кнопки
});

// 3. Редактирование текста вручную -> переход в Custom
el.coWriterEditor.addEventListener('input', () => {
    el.coPresetSelect.value = "_custom";
    updateControlsState(); // Блокируем кнопки
    updateCounters(); // Пересчитываем токены
});

// 4. Сохранение (Save)
el.coSaveBtn.addEventListener('click', () => {
    const text = el.coWriterEditor.value.trim();
    if (!text) return alert("Instruction is empty!");
    
    const name = prompt("Name for this Co-Writer preset:", "My New Preset");
    if (!name) return;

    // Создаем новый (всегда открытый, не системный)
    coPresets.push({ 
        name, 
        text, 
        locked: false, 
        isSystem: false 
    });
    
    localStorage.setItem('cowriter_presets', JSON.stringify(coPresets));
    
    renderCoPresets();
    el.coPresetSelect.value = coPresets.length - 1; // Выбираем его
    updateControlsState(); // Обновляем кнопки
    setStatus(`Saved preset: ${name}`);
});

// 5. Удаление (Delete)
el.coDelBtn.addEventListener('click', () => {
    const val = el.coPresetSelect.value;
    if (val === "_custom") return alert("Cannot delete 'Custom' state.");
    
    // Защита (хотя кнопка и так отключена)
    if (coPresets[val].locked) return alert("Unlock this preset first!");

    if (confirm(`Delete preset "${coPresets[val].name}"?`)) {
        coPresets.splice(val, 1);
        
        localStorage.setItem('cowriter_presets', JSON.stringify(coPresets));
        renderCoPresets();
        
        // Выбираем первый доступный
        if (coPresets.length > 0) {
            el.coPresetSelect.value = "0";
            el.coWriterEditor.value = coPresets[0].text;
        } else {
            el.coWriterEditor.value = "";
        }
        updateControlsState();
    }
});

// 6. Тумблер (Toggle Main Button)
el.coWriterBtn.addEventListener('click', () => {
    isCoWriterMode = !isCoWriterMode;
    
    // Находим панель Output (родитель элемента outputText)
    const outputPanel = el.outputText.closest('.panel');

    if (isCoWriterMode) {
        el.coWriterBtn.classList.add('active');
        el.coWriterBar.style.display = 'flex';
        
        // --- VISUAL FX ---
        if(outputPanel) outputPanel.classList.add('cowriter-active');
        // -----------------

        // Если список пуст - рендерим
        if (el.coPresetSelect.options.length === 0) {
            renderCoPresets();
            el.coWriterEditor.value = coPresets[0].text; 
        }
        updateControlsState(); // Проверяем состояние кнопок
        
        setStatus("Co-Writer Mode: ON");
    } else {
        el.coWriterBtn.classList.remove('active');
        el.coWriterBar.style.display = 'none';
        
        // --- VISUAL FX OFF ---
        if(outputPanel) outputPanel.classList.remove('cowriter-active');
        // ---------------------

        setStatus("Co-Writer Mode: OFF");
        // FIX: Возвращаем статус в Ready через 1.5 секунды
        setTimeout(() => setStatus("Ready"), 1500);
    }
    updateCounters(); // Обновляем стоимость сразу при переключении
});

// 7. Сворачивание панели (Collapse)
el.coHeader.addEventListener('click', (e) => {
    // Игнорируем клик, если нажали на select или кнопки внутри хедера
    if (e.target.closest('button') || e.target.closest('select')) return;
    
    const isCollapsed = el.coWriterBar.classList.contains('collapsed');
    if (isCollapsed) {
        el.coWriterBar.classList.remove('collapsed');
    } else {
        el.coWriterBar.classList.add('collapsed');
    }
});





// --- Streaming Request ---
async function sendRequest() {
    const text = el.inputText.value.trim();
    if (!text) return setStatus("Please enter text", "error");
    if (!currentPromptText) return setStatus("Select a prompt", "error");

    // Co-Writer Injection
    let finalSystemPrompt = currentPromptText;
    
    if (isCoWriterMode) {
        // В режиме Co-Writer мы ИГНОРИРУЕМ стандартный промпт для рефакторинга.
        // Мы используем специальный базовый промпт для генерации/продолжения.
        const coInstruction = el.coWriterEditor.value.trim();
        
        finalSystemPrompt = `[ROLE: AI CO-WRITER]\nYou are an expert writing assistant. The user will provide a text (Context).\nYour job is NOT to fix it, but to FOLLOW the instruction below based on that context.\n\n[USER INSTRUCTION]\n${coInstruction}\n\n[CRITICAL RULES]\n1. Do NOT output the <text_to_edit> tags.\n2. Do NOT repeat the user's provided text.\n3. Output ONLY the new generated content.`;
    }

    const currentModelName = el.modelSelect.options[el.modelSelect.selectedIndex]?.text || el.modelSelect.value;

    // FIX: Кнопка должна быть активна, чтобы нажать Stop
    el.sendBtn.disabled = false; 
    el.sendBtn.classList.add('btn-stop'); // (Опционально можно добавить стиль, но главное функционал)
    el.sendBtnText.textContent = "Stop"; 
    
    if (currentView === 'diff') {
        currentView = 'preview';
        updateViewButtons();
    }

    el.outputText.value = ""; 
    renderRichText();
    setStatus("Thinking...", "processing");
    
    // --- MAGICAL FX START ---
    const outputPanel = el.outputText.closest('.panel');
    if (isCoWriterMode && outputPanel) {
        outputPanel.classList.add('streaming-fx');
    }
    // ------------------------
    
    const start = performance.now();
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    const stopHandler = () => {
        controller.abort();
        el.sendBtn.removeEventListener('click', stopHandler);
        finishRequest(start, "Stopped");
    };
    el.sendBtn.onclick = stopHandler;

    try {
        const response = await fetch(`${API_BASE}/edit_stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text,
                system: finalSystemPrompt, // Используем переменную с инъекцией
                model: el.modelSelect.value
            }),
            signal: signal
        });

        if (!response.ok) throw new Error(await response.text());

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (signal.aborted) break; // Мгновенный выход при нажатии Stop

            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split("\n");
            buffer = lines.pop(); 

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    
                    // ПЕРЕХВАТ ОШИБКИ
                    if (data.error) {
                        // Если есть детали (текст от OpenRouter), добавляем их
                        let errorMsg = data.error;
                        if (data.details) {
                            try {
                                const detailsJson = JSON.parse(data.details);
                                // Пытаемся достать красивое сообщение от OpenRouter
                                if (detailsJson.error && detailsJson.error.message) {
                                    errorMsg += `: ${detailsJson.error.message}`;
                                } else {
                                    errorMsg += `: ${data.details}`;
                                }
                            } catch (e2) {
                                errorMsg += `: ${data.details}`; 
                            }
                        }
                        throw new Error(errorMsg);
                    }

                    if (data.token) {
                        el.outputText.value += data.token;
                        renderRichText();
                        updateCounters();
                    }

                    // ЛАЗЕРНАЯ ТОЧНОСТЬ: Пришел официальный чек
                    if (data.usage) {
                        console.log("🎯 Official Receipt (Usage):", data.usage); // <--- СМОТРИ В КОНСОЛЬ (F12)
                        
                        const u = data.usage; 
                        const pricing = modelsPricing[el.modelSelect.value];
                        
                        if (pricing) {
                            const preciseCost = (u.prompt_tokens * pricing.prompt) + (u.completion_tokens * pricing.completion);
                            
                            el.statsTokens.textContent = u.total_tokens;
                            el.statsCost.textContent = formatCurrency(preciseCost);
                            
                            // ВИЗУАЛЬНОЕ ПОДТВЕРЖДЕНИЕ:
                            const lang = appSettings.lang || 'en';
                            const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
                            el.costLabel.textContent = "✓ " + t.status.final_cost; 
                            el.costLabel.title = "Verified by OpenRouter API";
                            
                            lastEstimatedCost = preciseCost;
                        }
                    }
                } catch (e) { 
                    // Если мы поймали нашу же ошибку API (с текстом), пробрасываем её дальше
                    if (e.message && e.message.includes("API Error") || e.message.includes("Key missing")) {
                        throw e;
                    }
                    console.error("Parse error", e); 
                }
            }
        }
        
        finishRequest(start, "Completed", currentModelName);

    } catch (e) {
        if (e.name === 'AbortError') {
            return; // Остановка уже обработана в stopHandler, не перезаписываем статус на Error
        } 
        
        console.error(e);
        let msg = e.message || "Error processing";
        if (msg.length > 60) msg = msg.substring(0, 57) + "...";
        setStatus(msg, "error");
        
        if (!el.outputText.value) {
            el.richOutput.innerHTML = `<div style="color:#da3633; padding:20px;"><strong>Error:</strong><br>${e.message}</div>`;
        }
        finishRequest(start, "Error");
    }
}

function finishRequest(startTime, statusMsg, modelName = "") {
    // --- MAGICAL FX STOP ---
    const outputPanel = el.outputText.closest('.panel');
    if (outputPanel) {
        outputPanel.classList.remove('streaming-fx');
    }
    // -----------------------

    const seconds = ((performance.now() - startTime) / 1000).toFixed(2);
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    if (statusMsg === "Completed") {
        // Меняем на "Cost", только если там еще нет галочки подтверждения
        if (!el.costLabel.textContent.includes("✓")) {
            el.costLabel.textContent = t.status.final_cost;
        }
    }

    // Убираем дублирование имени модели
    let displayMsg = statusMsg;  

    // Определяем тип статуса для цвета
    let type = 'ready';
    if (statusMsg === "Error") type = 'error';
    if (statusMsg === "Stopped") type = 'stopped';

    setStatus(displayMsg, type, `${seconds}s`);
    el.sendBtn.disabled = false;
    el.sendBtn.classList.remove('btn-stop');
    el.sendBtnText.textContent = "Run Processor";
    el.sendBtn.onclick = sendRequest; 
    
    // Обновляем баланс и сессию после завершения запроса
    if (type !== 'error') {
        sessionTotalCost += lastEstimatedCost;
        el.statsSession.textContent = formatCurrency(sessionTotalCost);
        setTimeout(updateBalanceDisplay, 1000);
    } 
}

function updateViewButtons() {
    if (currentView === 'preview') {
        el.viewPreviewBtn.classList.add('active');
        el.viewDiffBtn.classList.remove('active');
    } else {
        el.viewPreviewBtn.classList.remove('active');
        el.viewDiffBtn.classList.add('active');
    }
    renderContent();
}

el.viewPreviewBtn.addEventListener('click', () => { currentView = 'preview'; updateViewButtons(); });
el.viewDiffBtn.addEventListener('click', () => { currentView = 'diff'; updateViewButtons(); });

async function loadModelsPricing() {
    try {
        const res = await fetch(`${API_BASE}/openrouter_models`);
        if (res.ok) {
            modelsPricing = await res.json();
            updateCounters(); // Пересчитать сразу после загрузки
        }
    } catch (e) { console.error("Failed to load pricing", e); }
}

// --- Standard Listeners ---
async function loadPrompts() {
    try {
        const res = await fetch(`${API_BASE}/prompts`);
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        promptsData = data.prompts;
        
        el.promptSelect.innerHTML = "";
        promptsData.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name; opt.textContent = name;
            el.promptSelect.appendChild(opt);
        });

        if (promptsData.length > 0) {
            if (defaultPromptName && promptsData.includes(defaultPromptName)) {
                await loadPrompt(defaultPromptName); // Добавил await для гарантии
            } else {
                await loadPrompt(promptsData[0]);    // Добавил await для гарантии
                if (!defaultPromptName) {
                    defaultPromptName = promptsData[0];
                    localStorage.setItem('app_default_prompt', defaultPromptName);
                }
            }
        }
        updateDefaultPromptStatus();
        setStatus("Ready"); // <--- ФИНАЛЬНЫЙ ШТРИХ: Чистый статус при старте

    } catch (e) { setStatus("Failed prompts", "error"); }
}

async function loadPrompt(name) {
    try {
        const res = await fetch(`${API_BASE}/prompt?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        
        // Сохраняем и в текущую, и в "оригинальную" переменную
        originalPromptText = data.text;
        currentPromptText = data.text;
        
        // Заполняем визуальный редактор
        el.sysEditor.value = currentPromptText;
        
        // Localization
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    // Заполняем имя в первый бейдж
    el.sysNameBadge.textContent = name;

    // Сбрасываем статус во втором бейдже
    el.sysStatus.textContent = t.input.sys_original;
    el.sysStatus.classList.remove("status-modified");
    el.sysResetBtn.classList.remove("active");

        el.promptSelect.value = name;
        updateCounters(); 
        setStatus(`Loaded: ${name}`);
        
        // Возвращаем "Ready" через 1.5 сек, если статус всё еще "Loaded..."
        setTimeout(() => {
            if (el.statusText.textContent.startsWith("Loaded:")) {
                setStatus("Ready");
            }
        }, 1500);

    } catch (e) {}
}

el.inputText.addEventListener('input', updateCounters);

el.clearBtn.addEventListener('click', () => {
    if(confirm('Clear entire workspace?')) { 
        el.inputText.value = ''; 
        el.outputText.value = '';
        renderRichText(); 
        updateCounters(); 
        
        setStatus("Workspace cleared", "ready");
        setTimeout(() => {
            setStatus("Ready", "ready");
        }, 2000);
    }
});

el.copyBtn.addEventListener('click', async () => {
    const text = el.outputText.value;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        // Сохраняем исходный HTML не жестко, а просто восстанавливаем нужный
        el.copyBtn.innerHTML = '<span style="color: var(--success);">✓</span> Copied';
        el.copyBtn.style.color = 'var(--text-main)';
        
        setStatus("Copied to clipboard");
        
        setTimeout(() => {
            el.copyBtn.innerHTML = '<span>📋</span> Copy Text';
            el.copyBtn.style.color = ''; // Сброс inline стиля
        }, 2000);
    } catch (e) { setStatus("Copy failed", "error"); }
});

el.swapBtn.addEventListener('click', () => {
    const temp = el.inputText.value;
    el.inputText.value = el.outputText.value;
    el.outputText.value = "";
    renderRichText();
    updateCounters();
    setStatus("Swapped");
});

el.fontSelect.addEventListener('change', applyStyles);
el.fontSizeSelect.addEventListener('change', applyStyles);
el.promptSelect.addEventListener('change', (e) => loadPrompt(e.target.value));

function updateCurrentModelLabel() {
    const text = el.modelSelect.options[el.modelSelect.selectedIndex]?.text || el.modelSelect.value;
    el.statsCurrentModel.textContent = text;
}

// Обновляем цену и лейбл при смене модели
el.modelSelect.addEventListener('change', () => {
    updateCounters();
    updateCurrentModelLabel();
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendRequest();
});

el.managePromptsBtn.addEventListener('click', () => { el.promptModal.classList.add('active'); renderPromptList(); });
el.closeModalBtn.addEventListener('click', () => el.promptModal.classList.remove('active'));
el.promptModal.addEventListener('click', (e) => { if (e.target === el.promptModal) el.promptModal.classList.remove('active'); });

function renderPromptList() {
    el.promptList.innerHTML = '';
    promptsData.forEach(name => {
        const div = document.createElement('div');
        div.className = `prompt-item ${name === el.promptSelect.value ? 'active' : ''}`;
        
        const isDefault = name === defaultPromptName;

        div.innerHTML = `
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${name}</span>
            <button class="btn-fav-prompt ${isDefault ? 'is-default' : ''}" 
                    onclick="setDefaultPrompt('${name}', event)"
                    title="${isDefault ? 'Default Prompt' : 'Set as Default'}">
                ${isDefault ? '★' : '☆'}
            </button>
        `;

        div.onclick = async (e) => {
            if (e.target.closest('.btn-fav-prompt')) return;

            document.querySelectorAll('.prompt-item').forEach(i => i.classList.remove('active'));
            div.classList.add('active');
            await loadPrompt(name);
            el.promptPreview.value = currentPromptText;
        };
        
        el.promptList.appendChild(div);
    });
    el.promptPreview.value = currentPromptText;
}

el.sendBtn.onclick = sendRequest;

// --- About Modal Logic ---
const aboutModal = document.getElementById("aboutModal");
const aboutBtn = document.getElementById("aboutBtn");
const closeAboutBtn = document.getElementById("closeAboutBtn");

aboutBtn.addEventListener('click', () => aboutModal.classList.add('active'));
closeAboutBtn.addEventListener('click', () => aboutModal.classList.remove('active'));
aboutModal.addEventListener('click', (e) => { if(e.target === aboutModal) aboutModal.classList.remove('active'); });

// Global Shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + S for Swap
    if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        el.swapBtn.click();
    }
});


// Toggle Balance / Session View
el.balanceWidget.addEventListener('click', () => {
    const isSessionView = el.balanceSlider.classList.contains('show-session');
    const lang = appSettings.lang || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    if (isSessionView) {
        // Возвращаем на Баланс
        el.balanceSlider.classList.remove('show-session');
        // Ждем пока анимация пройдет, потом меняем лейбл
        setTimeout(() => el.balanceLabel.textContent = t.status.balance, 100);
    } else {
        // Показываем Сессию
        el.balanceSlider.classList.add('show-session');
        setTimeout(() => el.balanceLabel.textContent = t.status.spent, 100);
    }
});


loadPrompts();
loadModelsPricing();
applyStyles();
applyTranslations(); // <--- Apply Lang
updateCounters();
updateDefaultPromptStatus();
fetchAndApplyRate(false); // <--- Auto-start on load