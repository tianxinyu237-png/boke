"use client";

import { useState, useRef, useEffect } from "react";
import { AdminInput, AdminTextarea, AdminButton, showToast, AdminConfirmDialog } from "./ui";
import { saveLinksConfig, type LinksConfig, type Friend } from "@/lib/links";
import { handleSaveFailure } from "@/lib/config-save";

/* ══════════════════════════════════════════════════════════════
   友链编辑器（2026-10-28 新建）

   原来「内容管理 → 友链」是个手写 JSON 的文本框，
   加一条友链要自己拼 {"name":"...","url":"..."}，少个逗号就存不进去。

   现在改成表单：三个分区
     ① 页面文案   —— 友链页大标题 / 副标题
     ② 友链列表   —— 逐条 添加 / 编辑 / 排序 / 删除
     ③ 本站信息   —— 给别人抄的站点名/地址/描述/交换说明

   结构和 components/admin/projects-editor.tsx 保持一致，
   编辑态用「草稿」暂存，点保存才写回上层，避免每敲一个字就重渲染列表。
   ══════════════════════════════════════════════════════════════ */

interface Props {
  config: LinksConfig;
  onChange: (next: LinksConfig) => void;
}

export default function LinksEditor({ config, onChange }: Props) {
  const [editing, setEditing] = useState<{ index: number; draft: Friend } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const friends = config.friends || [];

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* ── 立即保存：添加 / 编辑 / 删除 / 排序这类离散操作 ──
     原实现只把改动塞进父组件的 state，必须再点右上角「保存设置」才入库，
     用户点完「添加友链」看到列表变了就去刷新，改动自然全丢。
     现在这些操作直接落库，不需要任何额外点击。 */
  async function persistNow(next: LinksConfig, successMsg: string) {
    onChange(next);
    setSaving(true);
    try {
      const res = await saveLinksConfig(next);
      if (res.ok) {
        showToast(successMsg, "success");
        setDirty(false);
      } else {
        handleSaveFailure(res, showToast);
        setDirty(true);
      }
    } finally {
      setSaving(false);
    }
  }

  /* ── 防抖保存：文案输入框每敲一个字都会触发，攒 900ms 再写 ── */
  function persistSoon(next: LinksConfig) {
    onChange(next);
    setDirty(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await saveLinksConfig(next);
        if (res.ok) setDirty(false);
        else handleSaveFailure(res, showToast);
      } finally {
        setSaving(false);
      }
    }, 900);
  }

  function startAdd() {
    setEditing({ index: -1, draft: { name: "", url: "", desc: "", avatar: "" } });
  }

  function startEdit(index: number) {
    setEditing({ index, draft: { ...friends[index] } });
  }

  function updateDraft(patch: Partial<Friend>) {
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));
  }

  async function commit() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.name.trim()) {
      showToast("站点名称不能为空", "error");
      return;
    }
    if (!d.url.trim()) {
      showToast("站点地址不能为空", "error");
      return;
    }
    // 地址没写协议时自动补 https://
    let url = d.url.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const clean: Friend = {
      name: d.name.trim(),
      url,
      desc: (d.desc || "").trim(),
      avatar: (d.avatar || "").trim(),
    };
    const list = [...friends];
    const isNew = editing.index === -1;
    if (isNew) list.push(clean);
    else list[editing.index] = clean;
    setEditing(null);
    await persistNow({ ...config, friends: list }, isNew ? "友链已添加并保存" : "友链已更新并保存");
  }

  async function doRemove() {
    if (removing === null) return;
    const target = friends[removing];
    const list = friends.filter((_, i) => i !== removing);
    setRemoving(null);
    await persistNow({ ...config, friends: list }, `已删除「${target?.name || ""}」`);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= friends.length) return;
    const list = [...friends];
    [list[index], list[target]] = [list[target], list[index]];
    await persistNow({ ...config, friends: list }, "顺序已保存");
  }

  function renderForm() {
    if (!editing) return null;
    return (
      <div className="space-y-3 border-t border-border bg-bg-mute/30 p-4">
        <AdminInput
          label="站点名称"
          value={editing.draft.name}
          onChange={(e) => updateDraft({ name: e.target.value })}
          placeholder="如：Wangxinyang"
        />
        <AdminInput
          label="站点地址"
          value={editing.draft.url}
          onChange={(e) => updateDraft({ url: e.target.value })}
          placeholder="wangxinyang.top（不写 https:// 会自动补）"
        />
        <AdminTextarea
          label="一句话描述（卡片上显示）"
          value={editing.draft.desc}
          onChange={(e) => updateDraft({ desc: e.target.value })}
          placeholder="智能制造 / AI学习 / LaTeX写作"
          rows={2}
        />
        <AdminInput
          label="头像 URL（留空则显示名称首字）"
          value={editing.draft.avatar || ""}
          onChange={(e) => updateDraft({ avatar: e.target.value })}
          placeholder="https://example.com/avatar.png"
        />
        <div className="flex items-center gap-2 pt-1">
          <AdminButton onClick={commit}>
            {editing.index === -1 ? "添加友链" : "保存修改"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => setEditing(null)}>
            取消
          </AdminButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* 自动保存状态：这三行的存在是因为之前「改动只在内存、要另点保存设置」把人坑过 */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft/50 px-3 py-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            saving ? "bg-accent animate-pulse" : dirty ? "bg-amber-400" : "bg-green-400"
          }`}
        />
        <span className="text-[11.5px] text-text-muted">
          {saving ? "保存中…" : dirty ? "有改动未保存" : "已自动保存，无需手动点保存"}
        </span>
      </div>

      {/* ───── ① 页面文案 ───── */}
      <section>
        <h3 className="mb-1 text-[13px] font-semibold text-text-primary">页面文案</h3>
        <p className="mb-3 text-[11px] text-text-muted">友链页顶部的大标题和一行说明（输入后自动保存）</p>
        <div className="space-y-3">
          <AdminInput
            label="大标题"
            value={config.pageTitle || ""}
            onChange={(e) => persistSoon({ ...config, pageTitle: e.target.value })}
            placeholder="从一扇窗，走到另一扇窗"
          />
          <AdminInput
            label="副标题"
            value={config.pageSubtitle || ""}
            onChange={(e) => persistSoon({ ...config, pageSubtitle: e.target.value })}
            placeholder="常去的技术博客和朋友们的小站"
          />
        </div>
      </section>

      {/* ───── ② 友链列表 ───── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-text-primary">
              友链列表
              <span className="ml-1.5 font-mono text-[11px] font-normal text-text-muted">
                {friends.length}
              </span>
            </h3>
            <p className="mt-0.5 text-[11px] text-text-muted">
              顺序即页面上的显示顺序，可用 ↑↓ 调整 · 增删改自动保存
            </p>
          </div>
          {!editing && <AdminButton onClick={startAdd}>+ 添加友链</AdminButton>}
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          {friends.length === 0 && !editing ? (
            <p className="px-4 py-8 text-center text-[12px] text-text-muted">
              还没有友链，点右上角「+ 添加友链」加第一条
            </p>
          ) : (
            <ul>
              {friends.map((f, i) => (
                <li
                  key={`${f.url}-${i}`}
                  className={`flex items-center gap-3 border-b border-border/50 px-3.5 py-2.5 last:border-b-0 ${
                    editing?.index === i ? "bg-accent/10" : "hover:bg-bg-soft/50"
                  }`}
                >
                  {/* 头像 */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-bg-mute text-[11px] font-semibold text-text-muted ring-1 ring-border/60">
                    {f.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (f.name || "?").slice(0, 1)
                    )}
                  </span>

                  {/* 名称 + 描述 + 地址 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-text-primary">{f.name}</p>
                    <p className="truncate font-mono text-[10px] text-text-muted">
                      {f.url.replace(/^https?:\/\//, "")}
                      {f.desc ? ` · ${f.desc}` : ""}
                    </p>
                  </div>

                  {/* 操作 */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      title="上移"
                      className="px-1 text-[11px] text-text-muted transition-colors hover:text-accent disabled:opacity-25"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === friends.length - 1}
                      title="下移"
                      className="px-1 text-[11px] text-text-muted transition-colors hover:text-accent disabled:opacity-25"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => startEdit(i)}
                      className="px-1.5 text-[11px] text-text-secondary transition-colors hover:text-accent"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setRemoving(i)}
                      className="px-1.5 text-[11px] text-text-muted transition-colors hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {editing ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-accent/30">
            {renderForm()}
          </div>
        ) : null}
      </section>

      {/* ───── ③ 本站信息 ───── */}
      <section>
        <h3 className="mb-1 text-[13px] font-semibold text-text-primary">本站信息</h3>
        <p className="mb-3 text-[11px] text-text-muted">
          友链页底部展示，方便别人复制去加你的链接
        </p>
        <div className="space-y-3">
          <AdminInput
            label="本站名称"
            value={config.exchangeName || ""}
            onChange={(e) => persistSoon({ ...config, exchangeName: e.target.value })}
            placeholder="田"
          />
          <AdminInput
            label="本站地址（留空则自动用当前域名）"
            value={config.exchangeUrl || ""}
            onChange={(e) => persistSoon({ ...config, exchangeUrl: e.target.value })}
            placeholder="https://tianxinyv.top"
          />
          <AdminInput
            label="本站描述"
            value={config.exchangeDesc || ""}
            onChange={(e) => persistSoon({ ...config, exchangeDesc: e.target.value })}
            placeholder="关于代码、系统和工程的深度思考"
          />
          <AdminInput
            label="本站头像 URL"
            value={config.exchangeAvatar || ""}
            onChange={(e) => persistSoon({ ...config, exchangeAvatar: e.target.value })}
            placeholder="https://example.com/avatar.png"
          />
          <AdminTextarea
            label="交换说明"
            value={config.exchangeNote || ""}
            onChange={(e) => persistSoon({ ...config, exchangeNote: e.target.value })}
            placeholder="欢迎交换友链。请先在您的博客添加本站链接…"
            rows={3}
          />
        </div>
      </section>

      <AdminConfirmDialog
        open={removing !== null}
        title="删除友链"
        message={
          removing !== null
            ? `确定删除「${friends[removing]?.name || ""}」？保存后生效。`
            : ""
        }
        onConfirm={doRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
