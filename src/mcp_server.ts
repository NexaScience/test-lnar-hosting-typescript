/**
 * MCP server that wraps the Notes REST API.
 *
 * Usage:
 *   1. Start the Express server:  npm run start:api
 *   2. Start this MCP server:     npm run start:mcp
 *      or via MCP Inspector:      npx @modelcontextprotocol/inspector tsx src/mcp_server.ts
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

const server = new McpServer({
  name: "notes-mcp-server",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function httpGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function httpPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function httpPut(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function httpDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.tool(
  "list_notes",
  "保存されているすべてのノートの一覧を取得する。",
  {},
  async () => {
    const notes = await httpGet("/notes");
    return {
      content: [{ type: "text", text: JSON.stringify(notes, null, 2) }],
    };
  }
);

server.tool(
  "create_note",
  "新しいノートを作成する。",
  {
    title: z.string().describe("ノートのタイトル"),
    content: z.string().describe("ノートの本文"),
  },
  async ({ title, content }) => {
    const note = await httpPost("/notes", { title, content });
    return {
      content: [{ type: "text", text: JSON.stringify(note, null, 2) }],
    };
  }
);

server.tool(
  "get_note",
  "IDを指定してノートを取得する。",
  {
    note_id: z.string().describe("取得するノートのID"),
  },
  async ({ note_id }) => {
    const note = await httpGet(`/notes/${note_id}`);
    return {
      content: [{ type: "text", text: JSON.stringify(note, null, 2) }],
    };
  }
);

server.tool(
  "update_note",
  "ノートのタイトルまたは本文を更新する。",
  {
    note_id: z.string().describe("更新するノートのID"),
    title: z.string().optional().describe("新しいタイトル（省略可）"),
    content: z.string().optional().describe("新しい本文（省略可）"),
  },
  async ({ note_id, title, content }) => {
    const payload: Record<string, string> = {};
    if (title !== undefined) payload.title = title;
    if (content !== undefined) payload.content = content;
    const note = await httpPut(`/notes/${note_id}`, payload);
    return {
      content: [{ type: "text", text: JSON.stringify(note, null, 2) }],
    };
  }
);

server.tool(
  "delete_note",
  "ノートを削除する。",
  {
    note_id: z.string().describe("削除するノートのID"),
  },
  async ({ note_id }) => {
    await httpDelete(`/notes/${note_id}`);
    return {
      content: [
        { type: "text", text: `Note ${note_id} deleted successfully.` },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
