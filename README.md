# AI Text Enhancer Pro 🚀

**A professional tool for text editing, code refactoring, and translation using LLM (GPT-4o, Claude 3.5 Sonnet, Mistral).**

Unlike typical chatbots, this tool offers a professional UI (VS Code style), streaming responses, smart syntax highlighting, and a powerful prompt system.

![Main Interface](screen_main.png?v=2)

## ✨ Key Features

- **⚡ Streaming:** Instantly outputs text character by character, with no wait for full generation.
- **🎨 Code Highlighting:** Automatic language detection and syntax highlighting (JetBrains Mono font).
- **📋 Smart Copy:** Intelligent code block and full text copying with visual confirmation.
- **🧠 Prompt Manager:** On-the-fly role switching (Editor, Translator, Code Refactor).
- **📊 Stats:** Real-time token count and request cost estimation.

### 🔍 Diff Mode
Visual comparison of changes: deleted text is highlighted in red, added text in green. Perfect for editing and code review.

![Diff View Mode](screen_diff.png?v=2)

---

## 🛠 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/AlexDustin/AI-Text-Enhancer-Pro.git
cd AI-Text-Enhancer-Pro
```

### 2. Install Dependencies
Ensure you have Python 3.8+ installed.
```bash
pip install -r requirements.txt
```
The httpx library is required for streaming.

### 3. Set Up API Key
The project uses OpenRouter for neural network access.

1. Obtain a key from openrouter.ai.
2. Create a file named openrouter_api_key.txt in the project directory.
3. Insert your key (one line, no spaces).

### 4. Configure Prompts
Make sure you have a prompts/ folder with .txt files. For example:

```
Default.txt
CodeFormatter.txt
TranslatorToEN.txt
```

🚀 Launch

1. Start the server:
```bash
python server.py
```

You'll see a message:
```
Uvicorn running on http://0.0.0.0:8000.
```

2. Open the index.html file in any modern browser (or navigate to the address if you've set up static serving, opening the file will also work).

🖥 Usage
1. Paste your text into the left pane (Input).
2. Select a model (e.g., GPT-4o) and a Prompt.
3. Click Run Processor (or press Ctrl+Enter).
4. View the result in the right pane.
5. Use the Diff button to see precise edits.

License: MIT


