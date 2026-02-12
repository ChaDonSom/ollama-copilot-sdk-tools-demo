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
ollama pull qwen2.5:7b-instruct-q4_0
```

## Run

```bash
export OLLAMA_MODEL='qwen2.5:7b-instruct-q4_0'
# export OLLAMA_BASE_URL='http://localhost:11434/v1'  # default

npm run demo
```

You should see `TOOL ...` lines (from the tool handlers). If you see none, the model likely isn't producing tool calls.

## Troubleshooting

Confirm Ollama's OpenAI-compatible endpoint is reachable:

```bash
curl -s http://localhost:11434/v1/models | head
```

