"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

// Toolbar buttons
const tools = [
  { label: "H2", insert: "## ", prefix: true },
  { label: "H3", insert: "### ", prefix: true },
  { label: "B", insert: "****", wrap: 2 },
  { label: "I", insert: "**", wrap: 1 },
  { label: "`", insert: "``", wrap: 1 },
  { label: "```", insert: "```\n\n```", wrap: 4 },
  { label: ">", insert: "> ", prefix: true },
  { label: "-", insert: "- ", prefix: true },
  { label: "1.", insert: "1. ", prefix: true },
  { label: "[ ]", insert: "- [ ] ", prefix: true },
  { label: "链接", insert: "[text](url)", wrap: -1 },
  { label: "图片", insert: "![alt](url)", wrap: -1 },
];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "开始写作...",
  height = 500,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce value for preview rendering (300ms)
  useEffect(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => setDebouncedValue(value), 300);
    return () => { if (renderTimerRef.current) clearTimeout(renderTimerRef.current); };
  }, [value]);

  // Render markdown to HTML (runs on debounced value)
  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { renderMarkdown } = await import("@/lib/highlight");
        const html = await renderMarkdown(debouncedValue || "");
        if (!cancelled) setPreviewHtml(html);
      } catch {
        if (!cancelled) setPreviewHtml("<p>预览加载中...</p>");
      }
    }
    render();
    return () => { cancelled = true; };
  }, [debouncedValue]);

  // Sync scroll
  const handleScroll = useCallback((source: "editor" | "preview") => {
    if (syncing) return;
    setSyncing(true);
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) { setSyncing(false); return; }

    if (source === "editor") {
      const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    } else {
      const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    }
    setTimeout(() => setSyncing(false), 100);
  }, [syncing]);

  // Insert toolbar text
  function insertTool(tool: typeof tools[0]) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);

    let newText: string;
    let cursorPos: number;

    if (tool.prefix) {
      // Insert at line start
      const lineStart = before.lastIndexOf("\n", start - 1) + 1;
      const linePrefix = before.substring(lineStart, start);
      const insert = linePrefix ? "\n" + tool.insert : tool.insert;
      newText = before + insert + selected + after;
      cursorPos = start + insert.length;
    } else if (tool.wrap && tool.wrap > 0) {
      const wrapChar = tool.insert.substring(0, tool.wrap);
      if (selected) {
        newText = before + wrapChar + selected + wrapChar + after;
        cursorPos = start + wrapChar.length + selected.length + wrapChar.length;
      } else {
        newText = before + tool.insert + after;
        cursorPos = start + tool.wrap;
      }
    } else if (tool.wrap && tool.wrap < 0) {
      // Placeholder text
      newText = before + tool.insert + after;
      cursorPos = start + tool.insert.indexOf("(") + 1;
    } else {
      newText = before + tool.insert + after;
      cursorPos = start + tool.insert.length;
    }

    onChange(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }

  // Tab key inserts spaces
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newText = value.substring(0, start) + "  " + value.substring(end);
      onChange(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  }

  const lineCount = (value || "").split("\n").length;
  const charCount = (value || "").length;

  return (
    <div className="border border-border rounded-xl overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-bg-soft border-b border-border flex-wrap">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => insertTool(tool)}
            className="px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-mute transition-colors"
            title={tool.label}
          >
            {tool.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            showPreview ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-primary"
          }`}
        >
          {showPreview ? "隐藏预览" : "显示预览"}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} border-r border-border`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={() => handleScroll("editor")}
            placeholder={placeholder}
            className="w-full h-full bg-bg p-4 text-sm font-mono text-text-primary placeholder:text-text-muted resize-none outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div
            ref={previewRef}
            onScroll={() => handleScroll("preview")}
            className="w-1/2 overflow-auto p-4 prose max-w-none bg-bg-soft"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-bg-soft border-t border-border text-[10px] text-text-muted">
        <span>{lineCount} 行</span>
        <span>{(value || "").replace(/[^\u4e00-\u9fff]/g, "").length} 中文字</span>
        <span>{charCount} 字符</span>
        <span className="flex-1 text-right">Markdown</span>
      </div>
    </div>
  );
}
