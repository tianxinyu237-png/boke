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

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
}
