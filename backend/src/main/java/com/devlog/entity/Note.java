package com.devlog.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "note_type", length = 20)
    private String noteType = "markdown";

    @Column(name = "html_content", columnDefinition = "TEXT")
    private String htmlContent;

    @Column(length = 200, unique = true)
    private String slug;

    @Column(name = "folder", length = 200)
    private String folder;

    /* ── 展示控制字段（2026-10-28）──
       同步脚本只写 title/content/folder，从不碰下面这四个，
       而 NoteController.updateNote 是「传了才覆盖」的部分更新，
       所以后台在这里做的设置不会被 30 分钟一次的 Obsidian 同步冲掉。

       visible 允许为 NULL 是有意的：加列时已有的老数据全是 NULL，
       而前台只查 visible = TRUE，NULL 天然被排除 ——
       等于「历史笔记默认全部草稿」，正好符合先审后发的预期。 */
    @Column(name = "visible")
    private Boolean visible = false;

    /** 博客上的展示标题，不改 Obsidian 里的文件名 */
    @Column(name = "display_title", length = 200)
    private String displayTitle;

    /** 归到哪个栏目（嵌入式 / 复习 / 项目 …） */
    @Column(name = "collection", length = 100)
    private String collection;

    /** 栏目内排序，越小越靠前 */
    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = createdAt;
        if (slug == null || slug.isBlank()) {
            slug = title != null ? pinyinSlug(title) + "-" + System.currentTimeMillis() % 100000 : "note-" + System.currentTimeMillis() % 100000;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }

    private String pinyinSlug(String s) {
        return s.toLowerCase()
            .replaceAll("[^a-z0-9\\u4e00-\\u9fff]+", "-")
            .replaceAll("^[-]+|[-]+$", "")
            .replaceAll("[-]{2,}", "-");
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getNoteType() { return noteType; }
    public void setNoteType(String noteType) { this.noteType = noteType; }

    public String getHtmlContent() { return htmlContent; }
    public void setHtmlContent(String htmlContent) { this.htmlContent = htmlContent; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Boolean getVisible() { return visible; }
    public void setVisible(Boolean visible) { this.visible = visible; }

    public String getDisplayTitle() { return displayTitle; }
    public void setDisplayTitle(String displayTitle) { this.displayTitle = displayTitle; }

    public String getCollection() { return collection; }
    public void setCollection(String collection) { this.collection = collection; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
}
