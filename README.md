# Ollama + Copilot SDK (Tools Demo)

This is a tiny starter project that uses the **GitHub Copilot SDK** with **BYOK** pointed at a local **Ollama** server, then checks whether the model can **invoke tools**.

## Prereqs

- Node.js 18+
- GitHub Copilot CLI (`copilot --version`)
- Ollama running locally

## Setup (desktop)

```bash
git clone <this-repo-url>
cd ollama-copilot-sdk-tools-demo
npm install
```

Start Ollama:

```bash
ollama serve
```

Pull a Qwen model (example):

```bash
ollama pull qwen2.5:7b-instruct-q4_K_M
```

## Configuration

Create a `.env` file in the project root (recommended for all platforms):

```bash
cp .env.example .env
```

Then edit `.env` to set your model name:

```
OLLAMA_MODEL=qwen2.5:7b-instruct-q4_K_M
```

**Alternatively**, you can set environment variables directly:

**Linux/macOS (bash/zsh):**
```bash
export OLLAMA_MODEL='qwen2.5:7b-instruct-q4_K_M'
# export OLLAMA_BASE_URL='http://localhost:11434/v1'  # default
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_MODEL = 'qwen2.5:7b-instruct-q4_K_M'
# $env:OLLAMA_BASE_URL = 'http://localhost:11434/v1'  # default
```

**Windows (cmd):**
```cmd
set OLLAMA_MODEL=qwen2.5:7b-instruct-q4_K_M
```

## Run

```bash
npm run demo
```

You should see `TOOL ...` lines (from the tool handlers). If you see none, the model likely isn't producing tool calls.

## Troubleshooting

Confirm Ollama's OpenAI-compatible endpoint is reachable:

```bash
curl -s http://localhost:11434/v1/models | head
```

