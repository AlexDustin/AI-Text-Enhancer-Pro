const API_BASE = "http://127.0.0.1:8000";

const el = {
    fontSelect: document.getElementById("fontSelect"),
    fontSizeSelect: document.getElementById("fontSizeSelect"),
    modelSelect: document.getElementById("modelSelect"),
    promptSelect: document.getElementById("promptSelect"),
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
    statusTime: document.getElementById("statusTime"),
    statsTokens: document.getElementById("statsTokens"),
    statsCost: document.getElementById("statsCost"),
    promptModal: document.getElementById("promptModal"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    promptList: document.getElementById("promptList"),
    promptPreview: document.getElementById("promptPreview")
};

let currentPromptText = "";
let promptsData = [];
let currentView = 'preview'; // 'preview' or 'diff'

marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });

// --- Model Management Logic ---

const DEFAULT_MODELS = [
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude 4.5 Sonnet" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "mistralai/mistral-large-2411", name: "Mistral Large" },
    { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" }
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
}

function renderModelList() {
    domModels.list.innerHTML = '';
    appModels.forEach((m, index) => {
        const isDefault = m.id === defaultModelId;
        const div = document.createElement('div');
        div.className = 'model-item';
        div.innerHTML = `
            <div class="model-info">
                <span class="model-name">${m.name} ${isDefault ? '<span style="color:#e3b341; font-size:10px; margin-left:4px;">(Default)</span>' : ''}</span>
                <span class="model-id">${m.id}</span>
            </div>
            <div style="display:flex; align-items:center;">
                <button class="btn-fav-model ${isDefault ? 'active' : ''}" 
                        title="${isDefault ? 'Currently Default' : 'Set as Default'}"
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
    const inLen = el.inputText.value.length;
    const outLen = el.outputText.value.length;
    el.inputCounter.textContent = `${inLen} chars`;
    el.outputCounter.textContent = `${outLen} chars`;
    
    const estimatedTokens = Math.ceil((inLen + outLen) / 3.5);
    el.statsTokens.textContent = `~ ${estimatedTokens}`;
    
    const estCost = (estimatedTokens * 0.00001).toFixed(4);
    el.statsCost.textContent = `$${estCost}`;
}

function renderContent() {
    if (currentView === 'diff') {
        renderDiff();
    } else {
        renderRichText();
    }
}

function renderRichText() {
    const rawText = el.outputText.value;
    if (!rawText && !el.inputText.value) {
            el.richOutput.innerHTML = '<div style="color: var(--text-muted); display: flex; height: 100%; align-items: center; justify-content: center; flex-direction: column; gap: 10px;"><div style="font-size: 40px; opacity: 0.2;">⌨️</div><div>Ready to process</div></div>';
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
    
    if (!oldText || !newText) {
        el.richOutput.innerHTML = '<div style="padding:20px; color:var(--text-muted)">Need both Input and Output text to show Diff.</div>';
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
    el.statusTime.textContent = time;
    el.statusBar.className = `status-bar ${type}`;
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
        
        if (!data.is_valid) {
            domKey.btn.classList.add('needs-attention');
            
            if (data.is_placeholder) {
                showKeyMsg("⚠️ Project setup required. Please replace the default placeholder with your actual API Key.", "warning");
                if (!sessionStorage.getItem('onboarding_shown')) {
                    domKey.modal.classList.add('active');
                    domKey.input.setAttribute('type', 'text');
                    domKey.toggleVisBtn.style.opacity = '1';
                    sessionStorage.setItem('onboarding_shown', 'true');
                }

            } else if (!data.key) {
                showKeyMsg("API Key is missing. Please enter it to start.", "warning");
            }
        } else {
            domKey.btn.classList.remove('needs-attention');
            showKeyMsg("✅ Secured Storage Active. Key is valid.", "valid");
        }
    } catch(e) { console.error("Key check failed", e); }
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
    const newKey = domKey.input.value.trim();
    if(!newKey) return alert("Key cannot be empty");
    
    try {
        const res = await fetch(`${API_BASE}/api_key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: newKey })
        });
        const data = await res.json();
        if(data.is_valid) {
            domKey.btn.classList.remove('needs-attention');
            showKeyMsg("Key saved successfully!", "valid");
            setTimeout(() => domKey.modal.classList.remove('active'), 1000);
        } else {
            showKeyMsg("Key saved, but looks invalid (too short or placeholder).", "warning");
        }
    } catch(e) { alert("Error saving key"); }
});

domKey.delBtn.addEventListener('click', async () => {
    if(confirm("Are you sure you want to remove the API Key? The app will stop working.")) {
        await fetch(`${API_BASE}/api_key`, { method: 'DELETE' });
        domKey.input.value = "";
        domKey.btn.classList.add('needs-attention');
        showKeyMsg("Key removed.", "warning");
    }
});

checkApiKeyStatus();

// --- Streaming Request ---
async function sendRequest() {
    const text = el.inputText.value.trim();
    if (!text) return setStatus("Please enter text", "error");
    if (!currentPromptText) return setStatus("Select a prompt", "error");

    const currentModelName = el.modelSelect.options[el.modelSelect.selectedIndex]?.text || el.modelSelect.value;

    el.sendBtn.disabled = true;
    el.sendBtnText.textContent = "Stop"; 
    
    if (currentView === 'diff') {
        currentView = 'preview';
        updateViewButtons();
    }

    el.outputText.value = ""; 
    renderRichText();
    setStatus("Thinking...", "processing");
    
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
                system: currentPromptText,
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

            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split("\n");
            buffer = lines.pop(); 

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    if (data.token) {
                        el.outputText.value += data.token;
                        renderRichText();
                        updateCounters();
                    }
                } catch (e) { console.error("Parse error", e); }
            }
        }
        
        finishRequest(start, "Completed", currentModelName);

    } catch (e) {
        if (e.name === 'AbortError') {
            // Handled in stopHandler
        } else {
            console.error(e);
            setStatus("Error processing", "error");
        }
        finishRequest(start, "Error");
    }
}

function finishRequest(startTime, statusMsg, modelName = "") {
    const seconds = ((performance.now() - startTime) / 1000).toFixed(2);
    
    let displayMsg = statusMsg;
    if (statusMsg === "Completed" && modelName) {
        displayMsg = `Completed (${modelName})`;
    }

    setStatus(displayMsg, statusMsg === "Error" ? "error" : "ready", `${seconds}s`);
    el.sendBtn.disabled = false;
    el.sendBtnText.textContent = "Run Processor";
    el.sendBtn.onclick = sendRequest; 
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
                loadPrompt(defaultPromptName);
            } else {
                loadPrompt(promptsData[0]);
                if (!defaultPromptName) {
                    defaultPromptName = promptsData[0];
                    localStorage.setItem('app_default_prompt', defaultPromptName);
                }
            }
        }
        updateDefaultPromptStatus();

    } catch (e) { setStatus("Failed prompts", "error"); }
}

async function loadPrompt(name) {
    try {
        const res = await fetch(`${API_BASE}/prompt?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        currentPromptText = data.text;
        el.promptSelect.value = name;
        setStatus(`Loaded: ${name}`);
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
        const originalHtml = '<span>📋</span> Копировать';
        el.copyBtn.innerHTML = '<span>✓</span> Скопировано';
        el.copyBtn.classList.add('success');
        setStatus("Copied to clipboard");
        setTimeout(() => {
            el.copyBtn.innerHTML = originalHtml;
            el.copyBtn.classList.remove('success');
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
loadPrompts();
applyStyles();
updateCounters();
updateDefaultPromptStatus();