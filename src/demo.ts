import { CopilotClient, defineTool } from "@github/copilot-sdk";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const repoRoot = process.cwd();
const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const model = process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct";
const streaming = process.env.DEMO_STREAMING === "1";

const toolCounts: Record<string, number> = Object.create(null);
const noteToolCall = (name: string, payload: unknown) => {
  toolCounts[name] = (toolCounts[name] ?? 0) + 1;
  // Keep tool logs visually distinct from assistant output.
  console.error(`TOOL ${name}: ${JSON.stringify(payload)}`);
};

const add = defineTool("add", {
  description: "Add two numbers and return the sum",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
    additionalProperties: false,
  },
  handler: async (args: { a: number; b: number }) => {
    const result = args.a + args.b;
    noteToolCall("add", { ...args, result });
    return { result };
  },
});

const getTime = defineTool("get_time", {
  description: "Get the current time as an ISO string",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  handler: async () => {
    const now = new Date().toISOString();
    noteToolCall("get_time", { now });
    return { now };
  },
});

const listRepoFiles = defineTool("list_repo_files", {
  description: "List the repository's top-level files/directories (excluding node_modules and .git)",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  handler: async () => {
    const entries = await fs.readdir(repoRoot, { withFileTypes: true });
    const filtered = entries
      .filter((e) => !["node_modules", ".git"].includes(e.name))
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort();
    noteToolCall("list_repo_files", { count: filtered.length });
    return { entries: filtered };
  },
});

const readTextFile = defineTool("read_text_file", {
  description:
    "Read a UTF-8 text file from this repo. The path must be relative to the repo root.",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "Relative path like README.md" },
    },
    required: ["filePath"],
    additionalProperties: false,
  },
  handler: async (args: { filePath: string }) => {
    const resolved = path.resolve(repoRoot, args.filePath);
    if (!resolved.startsWith(repoRoot + path.sep)) {
      throw new Error("filePath must stay within the repo root");
    }
    const data = await fs.readFile(resolved, "utf8");
    const content = data.length > 20_000 ? data.slice(0, 20_000) : data;
    noteToolCall("read_text_file", { filePath: args.filePath, chars: content.length });
    return { filePath: args.filePath, content };
  },
});

const prompt =
  process.env.DEMO_PROMPT ??
  [
    "You have access to these tools: get_time, add, list_repo_files, read_text_file.",
    "Do the following steps, in order, and use tools whenever applicable:",
    "1) Call get_time and include the returned ISO time in your response.",
    "2) Call add with a=21 and b=21 and include the numeric result.",
    "3) Call list_repo_files and tell me whether README.md exists.",
    "4) Call read_text_file with filePath='README.md' and quote ONLY the first line.",
    "If any tool fails, explain what happened and continue with the remaining steps.",
  ].join("\n");

const client = new CopilotClient({
  // For BYOK, avoid accidentally using cached GitHub auth on machines where it's configured.
  useLoggedInUser: false,
});

const session = await client.createSession({
  model,
  provider: {
    type: "openai",
    baseUrl,
  },
  tools: [getTime, add, listRepoFiles, readTextFile],
  streaming,
});

if (streaming) {
  session.on("assistant.message_delta", (event) => {
    process.stdout.write(event.data.deltaContent ?? "");
  });
  session.on("session.idle", () => process.stdout.write("\n"));
}

const response = await session.sendAndWait({ prompt });
if (!streaming) console.log(response?.data.content ?? "");

await client.stop();

const totalToolCalls = Object.values(toolCounts).reduce((a, b) => a + b, 0);
console.error(`TOOL_SUMMARY ${JSON.stringify(toolCounts)}`);
if (totalToolCalls === 0) {
  console.error("No tool calls detected (model may not support / be using tool calls).");
  process.exitCode = 2;
}

