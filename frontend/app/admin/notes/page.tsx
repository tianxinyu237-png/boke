"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AdminConfirmDialog, showToast } from "@/components/admin/ui";
import dynamic from "next/dynamic";
const MarkdownEditor = dynamic(() => import("@/components/admin/markdown-editor"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface NoteData {
  id?: number;
  title: string;
  content: string;
  noteType?: string;
  htmlContent?: string;
  slug?: string;
  folder: string;
  updatedAt?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Api-Key"] = token;
  return headers;
}

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  if (!res.ok) throw new Error("请求失败");
  return res.json();
}

function extractHeadings(md: string): { level: number; text: string }[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const result: { level: number; text: string }[] = [];
  let m;
  while ((m = headingRegex.exec(md)) !== null) {
    result.push({ level: m[1].length, text: m[2].trim() });
  }
  return result;
}

function countStats(md: string) {
  const text = md.replace(/[#*`~>\[\]()!_\-=|{}:;'",.<>/?\\\n\r]/g, " ").trim();
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
  const chars = md.length;
  const lines = md.split("\n").length;
  return { chars, lines, words: words + chinese };
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("markdown");
  const [htmlContent, setHtmlContent] = useState("");
  const [folder, setFolder] = useState("");
  const [filterFolder, setFilterFolder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [folderNewName, setFolderNewName] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFolder, setImportFolder] = useState("");
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState({ title: "", message: "", action: "" });
  const contentRef = useRef<HTMLDivElement>(null);

  const loadNotes = useCallback(async () => {
    try {
      const q = filterFolder ? `?folder=${encodeURIComponent(filterFolder)}` : "";
      const data = await apiCall(`/notes${q}`);
      setNotes(data);
    } catch {}
  }, [filterFolder]);

  const loadFolders = useCallback(async () => {
    try {
      const data = await apiCall("/notes/folders");
      setFolders(data);
    } catch {}
  }, []);

  useEffect(() => { loadNotes(); loadFolders(); }, [loadNotes, loadFolders]);

  const saveNote = useCallback(async () => {
    if (!title.trim()) { showToast("请先填写笔记标题", "error"); return; }
    setSaving(true);
    try {
      const body: any = { title: title.trim(), content, folder: folder.trim() || null, noteType };
      if (noteType === "mindmap") body.htmlContent = htmlContent;
      let saved: NoteData;
      if (activeId) {
        saved = await apiCall(`/notes/${activeId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        saved = await apiCall("/notes", { method: "POST", body: JSON.stringify(body) });
        setActiveId(saved.id ?? null);
      }
      setNotes((prev) => {
        const rest = prev.filter((n) => n.id !== saved.id);
        return [saved, ...rest];
      });
      setDirty(false);
      loadFolders();
    } catch {} finally { setSaving(false); }
  }, [activeId, title, content, folder, loadFolders]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNote(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveNote]);

  // Auto-save (also works for brand-new notes once a title is set)
  useEffect(() => {
    if (!dirty || !title.trim()) return;
    const t = setTimeout(() => saveNote(), 2000);
    return () => clearTimeout(t);
  }, [dirty, title, saveNote]);

  function selectNote(note: NoteData) {
    setActiveId(note.id!);
    setTitle(note.title);
    setContent(note.content || "");
    setNoteType(note.noteType || "markdown");
    setHtmlContent(note.htmlContent || "");
    setFolder(note.folder || "");
    setDirty(false);
  }

  function newNote() {
    setActiveId(null); setTitle(""); setContent(""); setNoteType("markdown"); setHtmlContent(""); setFolder(""); setDirty(false);
  }

  function handleDeleteClick(id: number, noteTitle: string) {
    setConfirmMsg({ title: "确认删除", message: `确定删除「${noteTitle}」？`, action: "deleteNote" });
    setConfirmOpen(true);
    setConfirmNoteTarget({ id, noteTitle });
  }

  const [confirmNoteTarget, setConfirmNoteTarget] = useState<{ id: number; noteTitle: string } | null>(null);

  async function handleDeleteNoteConfirm() {
    if (!confirmNoteTarget) return;
    setConfirmOpen(false);
    const { id, noteTitle } = confirmNoteTarget;
    await apiCall(`/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) newNote();
    loadFolders();
    showToast(`已删除「${noteTitle}」`, "success");
    setConfirmNoteTarget(null);
  }

  async function renameFolder(oldName: string) {
    if (!folderNewName.trim() || folderNewName === oldName) { setEditingFolder(null); return; }
    await apiCall("/notes/folders/rename", {
      method: "PUT",
      body: JSON.stringify({ oldName, newName: folderNewName.trim() }),
    });
    loadFolders(); loadNotes();
    if (folder === oldName) setFolder(folderNewName.trim());
    setEditingFolder(null); setFolderNewName("");
  }

  function handleDeleteFolderClick(name: string) {
    setConfirmMsg({ title: "移除文件夹", message: `移除文件夹「${name}」？笔记不会被删除。`, action: "deleteFolder" });
    setConfirmOpen(true);
    setConfirmFolderTarget(name);
  }

  const [confirmFolderTarget, setConfirmFolderTarget] = useState<string | null>(null);

  async function handleDeleteFolderConfirm() {
    if (!confirmFolderTarget) return;
    setConfirmOpen(false);
    const name = confirmFolderTarget;
    await apiCall(`/notes/folders/${encodeURIComponent(name)}`, { method: "DELETE" });
    loadFolders(); loadNotes();
    showToast(`已移除文件夹「${name}」`, "success");
    setConfirmFolderTarget(null);
  }

  async function handleImport() {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      // Split by ## or ### headings to detect individual notes
      const blocks = importText.split(/\n(?=#{1,3}\s)/);
      const targetFolder = importFolder.trim() || null;
      let count = 0;

      for (const block of blocks) {
        const trimmed = block.trim();
        if (!trimmed) continue;
        // Extract title from first heading
        const titleMatch = trimmed.match(/^#{1,3}\s+(.+)$/m);
        const noteTitle = titleMatch ? titleMatch[1].trim() : "导入笔记";
        await apiCall("/notes", {
          method: "POST",
          body: JSON.stringify({ title: noteTitle, content: trimmed, folder: targetFolder }),
        });
        count++;
      }

      showToast(`成功导入 ${count} 篇笔记`, "success");
      setImportText("");
      setShowImport(false);
      loadNotes();
      loadFolders();
    } catch (e: any) {
      showToast("导入失败: " + e.message, "error");
    } finally {
      setImporting(false);
    }
  }

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const groupedNotes: Record<string, NoteData[]> = {};
  for (const n of filteredNotes) {
    const key = n.folder || "未分类";
    if (!groupedNotes[key]) groupedNotes[key] = [];
    groupedNotes[key].push(n);
  }

  const headings = useMemo(() => extractHeadings(content), [content]);
  const stats = useMemo(() => countStats(content), [content]);

  function exportNote(format: "md" | "html") {
    const blob = new Blob(
      [format === "md" ? content : (contentRef.current?.innerHTML || content)],
      { type: format === "md" ? "text/markdown" : "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "note"}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -my-8">
      {/* LEFT: sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-bg-soft flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">笔记</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowImport(true)} className="text-xs text-accent hover:text-accent-muted transition-colors" title="导入">导入</button>
            <button onClick={newNote} className="text-accent hover:text-accent-muted text-lg leading-none transition-colors" title="新建">+</button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-border/50">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {folders.length > 0 && (
          <div className="px-3 py-2 border-b border-border/50 space-y-1">
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-accent"
            >
              <option value="">全部文件夹</option>
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedNotes).map(([group, items]) => (
            <div key={group}>
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">{group}</div>
              {items.map((note) => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    activeId === note.id
                      ? "bg-accent/10 text-accent border-r-2 border-accent"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-mute"
                  }`}
                >
                  <div className="truncate flex items-center gap-1">
                    <span className="text-[10px] opacity-60">{note.noteType === "mindmap" ? "🧠" : "📝"}</span>
                    {note.title || "无标题"}
                  </div>
                  {note.updatedAt && (
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <p className="px-3 py-6 text-xs text-text-muted text-center">
              {searchQuery ? "无匹配结果" : "暂无笔记"}
            </p>
          )}
        </div>
      </aside>

      {/* CENTER: editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-bg-soft/50 shrink-0">
          <input
            type="text" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            placeholder="笔记标题..."
            className="flex-1 bg-transparent text-text-primary text-base font-semibold placeholder:text-text-muted focus:outline-none"
          />
          <select
            value={noteType} onChange={(e) => { setNoteType(e.target.value); setDirty(true); }}
            className="bg-bg border border-border rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="markdown">Markdown</option>
            <option value="mindmap">脑图</option>
          </select>
          <input
            type="text" value={folder} onChange={(e) => { setFolder(e.target.value); setDirty(true); }}
            placeholder="文件夹"
            className="w-20 bg-bg border border-border rounded-lg px-2 py-1 text-xs text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <span className="text-[10px] text-text-muted hidden sm:inline whitespace-nowrap">
            {stats.words} 词 · {stats.lines} 行
          </span>
          {saving && <span className="text-xs text-text-muted">保存中...</span>}
          {!saving && dirty && <span className="text-xs text-amber-400">未保存</span>}
          <div className="flex items-center gap-1">
            <button onClick={() => exportNote("md")} className="text-[10px] text-text-muted hover:text-text-secondary border border-border rounded-lg px-1.5 py-0.5 transition-colors">.md</button>
            <button onClick={() => exportNote("html")} className="text-[10px] text-text-muted hover:text-text-secondary border border-border rounded-lg px-1.5 py-0.5 transition-colors">.html</button>
          </div>
          <button
            onClick={saveNote}
            disabled={saving}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/80 disabled:opacity-40 transition-colors shrink-0"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          {activeId && (
            <button onClick={() => handleDeleteClick(activeId, title)} className="text-xs text-text-muted hover:text-red-400 transition-colors shrink-0">删除</button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {noteType === "markdown" ? (
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="写笔记..."
              
            />
          ) : (
            <div className="h-full flex flex-col p-4 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted whitespace-nowrap">HTML脑图：</label>
                <label className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs cursor-pointer hover:bg-accent/20 transition-colors">
                  上传文件
                  <input type="file" accept=".html,.htm" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => { setHtmlContent(reader.result as string); setDirty(true); };
                      reader.readAsText(file);
                    }} />
                </label>
                <span className="text-[10px] text-text-muted">或直接粘贴 HTML 到下方</span>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => { setHtmlContent(e.target.value); setDirty(true); }}
                placeholder="<html>...</html>"
                className="flex-1 bg-bg border border-border rounded-xl p-3 text-xs font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none"
                spellCheck={false}
              />
              {htmlContent && (
                <div className="border border-border rounded-xl overflow-hidden" style={{ height: "300px" }}>
                  <iframe srcDoc={htmlContent} className="w-full h-full border-0" title="预览" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowImport(false)}>
          <div className="bg-bg-soft border border-border rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary mb-4">导入笔记</h2>
            <p className="text-xs text-text-muted mb-4">
              从有道云笔记导出 Markdown 文件，将内容粘贴到下方。以 ## 或 ### 标题自动分割为多篇笔记。
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">目标文件夹</label>
              <input
                type="text" value={importFolder} onChange={(e) => setImportFolder(e.target.value)}
                placeholder="可选，留空则归类为「未分类」"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="## 笔记标题&#10;&#10;笔记内容..."
              rows={12}
              className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-y font-mono mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary bg-bg-mute hover:bg-bg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importText.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent/80 text-white disabled:opacity-40 transition-colors"
              >
                {importing ? "导入中..." : "开始导入"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title={confirmMsg.title}
        message={confirmMsg.message}
        confirmLabel="确认"
        variant="danger"
        onConfirm={() => {
          if (confirmMsg.action === "deleteNote") handleDeleteNoteConfirm();
          else if (confirmMsg.action === "deleteFolder") handleDeleteFolderConfirm();
        }}
        onCancel={() => { setConfirmOpen(false); setConfirmNoteTarget(null); setConfirmFolderTarget(null); }}
      />
    </div>
  );
}
