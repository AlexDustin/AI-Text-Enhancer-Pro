# ============================================================
#  server.py — v2.0 (Async Streaming + Token Stats)
# ============================================================

from typing import Optional, List
import os
import json
import httpx # pip install httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# === КОНФИГ ===

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o"
API_KEY_FILE = "openrouter_api_key.txt"
PROMPTS_DIR = "prompts"

# === ЗАГРУЗКА API KEY ===

def load_api_key() -> Optional[str]:
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        key_path = os.path.join(base_dir, API_KEY_FILE)
        with open(key_path, "r", encoding="utf-8") as f:
            key = f.read().strip()
            return key if key else None
    except:
        return None

OPENROUTER_API_KEY = load_api_key()

# === FASTAPI ===

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === MODELS ===

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

# === STREAMING LOGIC ===

async def stream_generator(text: str, system: str, model: str):
    """
    Генератор, который читает поток от OpenRouter и отдает его клиенту
    """
    if not OPENROUTER_API_KEY:
        yield json.dumps({"error": "API Key missing"}) + "\n"
        return

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "TextEnchancerWeb",
        "Content-Type": "application/json",
    }

    payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                # ВАЖНО: Оборачиваем ввод в теги, чтобы изолировать инъекции
                {"role": "user", "content": f"<text_to_edit>\n{text}\n</text_to_edit>"},
            ],
            "stream": True,
        }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", OPENROUTER_URL, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_text = await response.aread()
                    yield json.dumps({"error": f"Upstream error: {response.status_code}", "details": err_text.decode()}) + "\n"
                    return

                # Читаем поток SSE (Server-Sent Events)
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:] # Убираем "data: "
                        if data_str.strip() == "[DONE]":
                            break
                        
                        try:
                            data_json = json.loads(data_str)
                            # Извлекаем кусочек текста
                            delta = data_json.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                # Отправляем клиенту JSON с полем token
                                yield json.dumps({"token": content}) + "\n"
                        except json.JSONDecodeError:
                            pass
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

# === ENDPOINTS ===

@app.get("/prompts")
def get_prompts():
    return {"prompts": load_prompt_list()}

@app.get("/prompt")
def get_prompt(name: str):
    return {"name": name, "text": load_prompt(name)}

@app.post("/edit_stream")
async def edit_stream(req: EditRequest):
    """
    Эндпоинт для стриминга. Возвращает StreamingResponse.
    """
    model = req.model or DEFAULT_MODEL
    return StreamingResponse(
        stream_generator(req.text, req.system, model),
        media_type="application/x-ndjson"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)