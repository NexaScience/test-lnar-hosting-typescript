import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

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

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Notes API listening on http://localhost:${PORT}`);
});
