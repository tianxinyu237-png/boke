"use client";

import { useState, useEffect } from "react";
import {
  showToast,
  AdminSkeleton,
  AdminTextarea,
  AdminConfirmDialog,
} from "@/components/admin/ui";
import {
  loadPetConfig,
  savePetConfig,
  savePetConfigToServer,
  loadPetConfigFromServer,
  normalizeConfig,
  resetPetState,
  PET_MODELS,
  POSITIONS,
  PERSONALITIES,
  type PetConfig,
} from "@/lib/pet";

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
        on ? "bg-accent" : "bg-bg-mute"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

const inputCls =
  "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";
const labelCls = "block text-xs text-text-muted mb-1.5";

export default function PetSettings() {
  const [config, setConfig] = useState<PetConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [personalityIdx, setPersonalityIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPetConfigFromServer().then((remote) => {
      if (cancelled) return;
      if (remote) {
        savePetConfig(remote);
        setConfig(remote);
      } else {
        setConfig(loadPetConfig());
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof PetConfig>(key: K, value: PetConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(preview = false) {
    if (!config) return;
    setSaving(true);
    const normalized = normalizeConfig(config);
    savePetConfig(normalized);
    window.dispatchEvent(new CustomEvent("pet-config-change"));
    const ok = await savePetConfigToServer(normalized);
    setSaving(false);
    showToast(
      ok ? "看板猫设置已保存并同步到服务器" : "已保存到本机，服务器同步失败",
      ok ? "success" : "error"
    );
    if (preview) window.open("/", "_blank");
  }

  function handleResetFeelings() {
    resetPetState();
    setResetOpen(false);
    showToast("好感度已重置(仅当前浏览器生效)", "success");
  }

  function handleApplyPersonality() {
    if (personalityIdx === null) return;
    const p = PERSONALITIES[personalityIdx];
    if (!p) return;
    setConfig((prev) => (prev ? { ...prev, ...p.lines } : prev));
    setPersonalityIdx(null);
    showToast(`已套用「${p.name}」语库，别忘了点保存设置生效`, "info");
  }

  if (!config) return <AdminSkeleton variant="form" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">看板猫设置</h2>
          <p className="text-text-muted text-xs mt-1">
            左下角 Live2D 小猫的互动、对话与外观配置。保存后同步到服务器（所有设备生效）
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="bg-accent hover:bg-accent/80 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-bg-soft border border-border hover:border-accent text-text-primary font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            保存并预览
          </button>
        </div>
      </div>

      {/* ① 显示与开关 */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">显示与互动开关</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">启用看板猫</span>
            <Switch on={config.enabled} onClick={() => update("enabled", !config.enabled)} />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">移动端显示</span>
            <Switch
              on={config.showOnMobile}
              onClick={() => update("showOnMobile", !config.showOnMobile)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">进站欢迎语</span>
            <Switch
              on={config.welcomeEnabled}
              onClick={() => update("welcomeEnabled", !config.welcomeEnabled)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">空闲随机冒泡</span>
            <Switch
              on={config.idleEnabled}
              onClick={() => update("idleEnabled", !config.idleEnabled)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">好感度养成（喂+2 摸+1 点+0.2）</span>
            <Switch
              on={config.feelingsEnabled}
              onClick={() => update("feelingsEnabled", !config.feelingsEnabled)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">允许拖拽（桌面）</span>
            <Switch
              on={config.dragEnabled}
              onClick={() => update("dragEnabled", !config.dragEnabled)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">划词夸赞（选中文字时冒泡）</span>
            <Switch
              on={config.selectEnabled}
              onClick={() => update("selectEnabled", !config.selectEnabled)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-primary">读到文末冒泡</span>
            <Switch
              on={config.scrollEnabled}
              onClick={() => update("scrollEnabled", !config.scrollEnabled)}
            />
          </label>
        </div>
      </div>

      {/* ② 外观与位置 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">外观</h3>
          <div>
            <label className={labelCls}>宠物名字（气泡文案 {`{name}`} 会被替换）</label>
            <input
              className={inputCls}
              value={config.petName}
              maxLength={12}
              onChange={(e) => update("petName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>位置</label>
              <select
                className={inputCls}
                value={config.position}
                onChange={(e) => update("position", e.target.value as PetConfig["position"])}
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>底部偏移 px</label>
              <input
                type="number"
                className={inputCls}
                value={config.bottomOffset}
                onChange={(e) => update("bottomOffset", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={labelCls}>桌面宽度 px（高自动 2:1）</label>
              <input
                type="number"
                min={60}
                max={320}
                className={inputCls}
                value={config.width}
                onChange={(e) => update("width", Number(e.target.value) || 140)}
              />
            </div>
            <div>
              <label className={labelCls}>移动端缩放</label>
              <input
                type="number"
                min={0.2}
                max={1}
                step={0.05}
                className={inputCls}
                value={config.mobileScale}
                onChange={(e) => update("mobileScale", Number(e.target.value) || 0.5)}
              />
            </div>
            <div>
              <label className={labelCls}>常态透明度</label>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={config.opacityDefault}
                onChange={(e) => update("opacityDefault", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.opacityDefault.toFixed(2)}</span>
            </div>
            <div>
              <label className={labelCls}>悬停透明度</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={config.opacityOnHover}
                onChange={(e) => update("opacityOnHover", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.opacityOnHover.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">模型</h3>
          <div>
            <label className={labelCls}>模型</label>
            <select
              className={inputCls}
              value={
                PET_MODELS.some((m) => m.value === config.modelPath)
                  ? config.modelPath
                  : "__custom__"
              }
              onChange={(e) => {
                if (e.target.value === "__custom__") return;
                update("modelPath", e.target.value);
              }}
            >
              {PET_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value="__custom__">
                {PET_MODELS.some((m) => m.value === config.modelPath)
                  ? "自定义…"
                  : `自定义: ${config.modelPath}`}
              </option>
            </select>
          </div>
          <div>
            <label className={labelCls}>
              自定义模型路径（相对 /live2d/models/，如 mycat/mycat.model.json；需自行上传文件到服务器 public/live2d/models/）
            </label>
            <input
              className={inputCls}
              value={config.modelPath}
              placeholder="hijiki/hijiki.model.json"
              onChange={(e) => update("modelPath", e.target.value)}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            提示：模型与内置动画需放在 <code className="text-accent">frontend/public/live2d/models/&lt;名字&gt;/</code>
            ，部署时随代码一起同步。
          </p>
        </div>
      </div>

      {/* ③ 页面范围 */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">显示页面范围</h3>
        <div className="flex gap-4">
          {[
            { v: "all" as const, label: "全部页面" },
            { v: "include" as const, label: "仅以下页面" },
            { v: "exclude" as const, label: "排除以下页面" },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                className="accent-accent"
                checked={config.pageMode === o.v}
                onChange={() => update("pageMode", o.v)}
              />
              {o.label}
            </label>
          ))}
        </div>
        {config.pageMode !== "all" && (
          <div>
            <label className={labelCls}>每行一条路径，支持 * 通配（如 /about 或 /blog/*；后台页面自动排除）</label>
            <AdminTextarea
              label=""
              id="pet-page-paths"
              rows={3}
              placeholder={config.pageMode === "include" ? "/blog/*\n/about" : "/admin/*"}
              value={config.pageMode === "include" ? config.includePaths : config.excludePaths}
              onChange={(e) =>
                update(config.pageMode === "include" ? "includePaths" : "excludePaths", e.target.value)
              }
            />
          </div>
        )}
      </div>

      {/* ④ 对话语库 */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">对话语库（每行一条，留空则该场景不说话）</h3>
        {/* 性格模板一键套用 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted mr-1">性格模板(覆盖下方全部语库)：</span>
          {PERSONALITIES.map((p, i) => (
            <button
              key={p.name}
              title={p.desc}
              onClick={() => setPersonalityIdx(i)}
              className="px-2.5 py-1 rounded-lg text-xs border border-border bg-bg hover:border-accent hover:text-accent transition-colors"
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminTextarea
            label="🖐 欢迎语（进站首次）"
            rows={4}
            value={config.welcomeLines}
            onChange={(e) => update("welcomeLines", e.target.value)}
          />
          <AdminTextarea
            label="👆 点击语"
            rows={4}
            value={config.clickLines}
            onChange={(e) => update("clickLines", e.target.value)}
          />
          <AdminTextarea
            label="♥ 抚摸语（长按/摸按钮）"
            rows={4}
            value={config.petLines}
            onChange={(e) => update("petLines", e.target.value)}
          />
          <AdminTextarea
            label="🐟 喂食语"
            rows={4}
            value={config.feedLines}
            onChange={(e) => update("feedLines", e.target.value)}
          />
          <AdminTextarea
            label="💤 空闲冒泡语"
            rows={4}
            value={config.idleLines}
            onChange={(e) => update("idleLines", e.target.value)}
          />
          <AdminTextarea
            label="😾 连点生气语"
            rows={4}
            value={config.angryLines}
            onChange={(e) => update("angryLines", e.target.value)}
          />
          <AdminTextarea
            label="🎉 升级语（%s 替换为等级名，如「家人」）"
            rows={4}
            value={config.levelUpLines}
            onChange={(e) => update("levelUpLines", e.target.value)}
          />
          <AdminTextarea
            label="✂️ 划词夸赞语（选中文字后冒泡）"
            rows={3}
            value={config.selectLines}
            onChange={(e) => update("selectLines", e.target.value)}
          />
          <AdminTextarea
            label="📖 读到文末语（滚动到底部冒泡，每页一次）"
            rows={3}
            value={config.scrollLines}
            onChange={(e) => update("scrollLines", e.target.value)}
          />
          <div className="space-y-3">
            <p className="text-[11px] text-text-muted">
              好感等级：0 陌生 → 20 眼熟 → 60 朋友 → 120 亲密 → 200 家人。
              <br />
              喂食 +2 / 抚摸 +1 / 点击 +0.2，受每日上限约束，防刷分。
            </p>
            <p className="text-[11px] text-text-muted">
              语库支持 {`{name}`} 占位符（替换为宠物名字）；升级语支持 %s（替换为等级名）。
            </p>
          </div>
        </div>
      </div>

      {/* ⑤ 互动参数 */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">互动参数与数据</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>空闲冒泡间隔（秒，≥10）</label>
            <input
              type="number"
              min={10}
              max={600}
              className={inputCls}
              value={config.idleInterval}
              onChange={(e) => update("idleInterval", Number(e.target.value) || 45)}
            />
          </div>
          <div>
            <label className={labelCls}>气泡停留（秒）</label>
            <input
              type="number"
              min={2}
              max={30}
              className={inputCls}
              value={config.bubbleSeconds}
              onChange={(e) => update("bubbleSeconds", Number(e.target.value) || 6)}
            />
          </div>
          <div>
            <label className={labelCls}>每日好感上限</label>
            <input
              type="number"
              min={1}
              max={200}
              className={inputCls}
              value={config.dailyMax}
              onChange={(e) => update("dailyMax", Number(e.target.value) || 20)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setResetOpen(true)}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium rounded-lg px-3.5 py-2 text-sm transition-colors"
          >
            重置好感度
          </button>
          <span className="text-xs text-text-muted">
            好感度存储在访客浏览器 localStorage（喂食/抚摸/点击累积），重置只清当前浏览器
          </span>
        </div>
      </div>

      <AdminConfirmDialog
        open={resetOpen}
        title="重置好感度"
        message="确定清空当前浏览器的小猫好感度与互动记录吗？"
        confirmLabel="重置"
        variant="danger"
        onConfirm={handleResetFeelings}
        onCancel={() => setResetOpen(false)}
      />
      <AdminConfirmDialog
        open={personalityIdx !== null}
        title={`套用「${personalityIdx !== null ? PERSONALITIES[personalityIdx]?.name : ""}」性格模板`}
        message={`将覆盖下方全部语库内容（欢迎/点击/抚摸/喂食/空闲/生气/升级/划词/文末共 ${personalityIdx !== null ? Object.keys(PERSONALITIES[personalityIdx]?.lines ?? {}).length : 0} 组）。确定套用吗？`}
        confirmLabel="套用"
        onConfirm={handleApplyPersonality}
        onCancel={() => setPersonalityIdx(null)}
      />
    </div>
  );
}
