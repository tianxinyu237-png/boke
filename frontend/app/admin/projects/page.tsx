"use client";

import { useState, useEffect } from "react";
import { loadProjectsConfig, saveProjectsConfig, type Project } from "@/lib/projects";
import { AdminButton, showToast } from "@/components/admin/ui";
import ProjectsEditor from "@/components/admin/projects-editor";

export default function AdminProjectsPage() {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjectsConfig().then((c) => {
      setProjectsList(c.projects);
      setLoaded(true);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveProjectsConfig({ projects: projectsList });
      showToast("项目已保存", "success");
    } catch {
      showToast("保存失败,请重试", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">项目管理</h2>
          <p className="text-text-muted text-xs mt-1">管理项目展示卡片,支持增删改排序,保存后前台立即生效</p>
        </div>
        <AdminButton onClick={handleSave} disabled={saving || !loaded}>
          {saving ? "保存中..." : "保存设置"}
        </AdminButton>
      </div>
      {loaded ? (
        <ProjectsEditor projects={projectsList} onChange={setProjectsList} />
      ) : (
        <div className="bg-bg-soft border border-border rounded-xl py-10 text-center text-xs text-text-muted">
          加载中...
        </div>
      )}
    </div>
  );
}
