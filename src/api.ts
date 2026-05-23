import { randomUUID } from "node:crypto";

import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { createMcpServer } from "./mcp_server.js";

const app = express();
app.use(express.json());

// In-memory storage
interface Note {
  id: string;
  title: string;
  content: string;
}

const notes: Map<string, Note> = new Map();

// GET /notes - ノートの一覧を返す
app.get("/notes", (_req: Request, res: Response) => {
  res.json(Array.from(notes.values()));
});

// POST /notes - 新しいノートを作成する
app.post("/notes", (req: Request, res: Response) => {
  const { title, content } = req.body as { title: string; content: string };
  if (!title || !content) {
    res.status(400).json({ detail: "title and content are required" });
    return;
  }
  const id = uuidv4();
  const note: Note = { id, title, content };
  notes.set(id, note);
  res.status(201).json(note);
});

// GET /notes/:id - IDでノートを取得する
app.get("/notes/:id", (req: Request, res: Response) => {
  const note = notes.get(req.params.id);
  if (!note) {
    res.status(404).json({ detail: "Note not found" });
    return;
  }
  res.json(note);
});

// PUT /notes/:id - ノートのタイトルまたは内容を更新する
app.put("/notes/:id", (req: Request, res: Response) => {
  const note = notes.get(req.params.id);
  if (!note) {
    res.status(404).json({ detail: "Note not found" });
    return;
  }
  const { title, content } = req.body as { title?: string; content?: string };
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  res.json(note);
});

// DELETE /notes/:id - ノートを削除する
app.delete("/notes/:id", (req: Request, res: Response) => {
  if (!notes.has(req.params.id)) {
    res.status(404).json({ detail: "Note not found" });
    return;
  }
  notes.delete(req.params.id);
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// MCP Streamable HTTP endpoint
//
// クライアントは初期化 POST で `Mcp-Session-Id` を発行され、以降のリクエスト
// （tool 呼び出しの POST、SSE 通知用の GET、終了通知の DELETE）で同じ ID を
// 使ってセッションを再利用する。MCP SDK の `Server` は同時に複数の transport
// に connect できないため、セッションごとに新しい `McpServer` を生成する。
// ---------------------------------------------------------------------------

const transports = new Map<string, StreamableHTTPServerTransport>();

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sessionId = req.header("mcp-session-id");
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    if (req.method !== "POST" || !isInitializeRequest(req.body)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: no valid session ID provided",
        },
        id: null,
      });
      return;
    }

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport!);
      },
    });
    transport.onclose = () => {
      if (transport!.sessionId) transports.delete(transport!.sessionId);
    };
    const server = createMcpServer();
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
}

app.post("/mcp", handleMcpRequest);
app.get("/mcp", handleMcpRequest);
app.delete("/mcp", handleMcpRequest);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Notes API listening on http://localhost:${PORT}`);
  console.log(`MCP endpoint:     http://localhost:${PORT}/mcp`);
});
