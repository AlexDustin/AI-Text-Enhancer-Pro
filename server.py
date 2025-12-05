# ============================================================
#  server.py — v3.0 (Clean, Async, Encrypted)
# ============================================================

from typing import Optional, List
import os
import json
import httpx # pip install httpx
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse # <--- Добавили FileResponse
from pydantic import BaseModel
from cryptography.fernet import Fernet # pip install cryptography

# === КОНФИГ ===

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o"
PROMPTS_DIR = "prompts"

# Настройки безопасности
SECRET_FILE = ".secret.key"            # Мастер-ключ шифрования (генерируется сам)
ENCRYPTED_KEY_FILE = "api_key.bin"     # Хранилище API ключа
DEFAULT_PLACEHOLDER_MARKER = "YOUR OPEN ROUTER KEY" # Маркер заглушки

# === KEY MANAGEMENT CLASS ===

class ApiKeyData(BaseModel):
    key: str

class KeyManager:
    def __init__(self):
        # При старте сразу загружаем или создаем мастер-ключ
        self.fernet = self._load_or_create_secret()

    def _load_or_create_secret(self) -> Fernet:
        """Управляет файлом .secret.key для шифрования"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        secret_path = os.path.join(base_dir, SECRET_FILE)
        
        if not os.path.exists(secret_path):
            key = Fernet.generate_key()
            with open(secret_path, "wb") as key_file:
                key_file.write(key)
        else:
            with open(secret_path, "rb") as key_file:
                key = key_file.read()
        
        return Fernet(key)

    def get_key(self) -> str:
        """Читает и расшифровывает ключ из .bin файла"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        bin_path = os.path.join(base_dir, ENCRYPTED_KEY_FILE)
        
        if not os.path.exists(bin_path):
            return ""
        
        try:
            with open(bin_path, "rb") as f:
                encrypted_data = f.read()
            return self.fernet.decrypt(encrypted_data).decode()
        except Exception:
            return "" # Если файл битый или ключ не подходит

    def save_key(self, api_key: str):
        """Шифрует и сохраняет ключ"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        bin_path = os.path.join(base_dir, ENCRYPTED_KEY_FILE)
        
        encrypted_data = self.fernet.encrypt(api_key.encode())
        with open(bin_path, "wb") as f:
            f.write(encrypted_data)

    def delete_key(self):
        """Физически удаляет файл ключа"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        bin_path = os.path.join(base_dir, ENCRYPTED_KEY_FILE)
        if os.path.exists(bin_path):
            os.remove(bin_path)

# Инициализация
key_manager = KeyManager()
OPENROUTER_API_KEY = key_manager.get_key()

def is_key_valid(key: str) -> bool:
    if not key: return False
    if DEFAULT_PLACEHOLDER_MARKER in key: return False
    if len(key) < 10: return False
    return True

# === FASTAPI SETUP ===

app = FastAPI()

# Подключаем папку static (с абсолютным путем, чтобы не было ошибок)
script_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(script_dir, "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ГЛАВНАЯ СТРАНИЦА ===
@app.get("/")
async def read_index():
    # Сервер сам отдаст файл index.html
    return FileResponse('index.html')

class EditRequest(BaseModel):
    text: str
    system: str
    model: Optional[str] = None

# === HELPERS ===

def load_prompt_list() -> List[str]:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    prompts_dir = os.path.join(base_dir, PROMPTS_DIR)
    if not os.path.isdir(prompts_dir):
        return []
    result = []
    for f in os.listdir(prompts_dir):
        if f.endswith(".txt"):
            result.append(f[:-4])
    return result

def load_prompt(name: str) -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, PROMPTS_DIR, f"{name}.txt")
    if not os.path.exists(file_path):
        raise HTTPException(404, f"Prompt '{name}' not found.")
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

# === STREAMING ENDPOINT ===

async def stream_generator(text: str, system: str, model: str):
    global OPENROUTER_API_KEY 
    
    if not OPENROUTER_API_KEY or not is_key_valid(OPENROUTER_API_KEY):
        yield json.dumps({"error": "API Key missing. Please add it via Settings."}) + "\n"
        return

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "TextEnhancerPro",
        "Content-Type": "application/json",
    }

    payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                # SECURITY: Isolation Tag
                {"role": "user", "content": f"<text_to_edit>\n{text}\n</text_to_edit>"},
            ],
            "stream": True,
        }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", OPENROUTER_URL, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_text = await response.aread()
                    yield json.dumps({"error": f"API Error {response.status_code}", "details": err_text.decode()}) + "\n"
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:] 
                        if data_str.strip() == "[DONE]": break
                        try:
                            data_json = json.loads(data_str)
                            content = data_json.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                yield json.dumps({"token": content}) + "\n"
                        except: pass
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

# === ROUTES ===

@app.get("/prompts")
def get_prompts():
    return {"prompts": load_prompt_list()}

@app.get("/prompt")
def get_prompt(name: str):
    return {"name": name, "text": load_prompt(name)}

@app.post("/edit_stream")
async def edit_stream(req: EditRequest):
    model = req.model or DEFAULT_MODEL
    return StreamingResponse(
        stream_generator(req.text, req.system, model),
        media_type="application/x-ndjson"
    )

# --- SECURE KEY MANAGEMENT ---

@app.get("/api_key")
def get_api_key():
    key = key_manager.get_key()
    return {
        "key": key,
        "is_valid": is_key_valid(key),
        "is_placeholder": (key and DEFAULT_PLACEHOLDER_MARKER in key)
    }

@app.post("/api_key")
def set_api_key(data: ApiKeyData):
    global OPENROUTER_API_KEY
    try:
        new_key = data.key.strip()
        key_manager.save_key(new_key)
        OPENROUTER_API_KEY = new_key
        return {"status": "updated", "is_valid": is_key_valid(new_key)}
    except Exception as e:
        raise HTTPException(500, f"Save failed: {str(e)}")

@app.delete("/api_key")
def delete_api_key():
    global OPENROUTER_API_KEY
    try:
        key_manager.delete_key()
        OPENROUTER_API_KEY = ""
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(500, f"Delete failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)