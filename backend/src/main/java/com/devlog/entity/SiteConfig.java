package com.devlog.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "site_config")
public class SiteConfig {

    @Id
    private Long id = 1L;

    @Column(name = "background_config", columnDefinition = "TEXT")
    private String backgroundConfig;

    @Column(name = "site_config", columnDefinition = "TEXT")
    private String siteConfig;

    @Column(name = "about_config", columnDefinition = "TEXT")
    private String aboutConfig;

    @Column(name = "links_config", columnDefinition = "TEXT")
    private String linksConfig;

    @Column(name = "projects_config", columnDefinition = "TEXT")
    private String projectsConfig;

    @Column(name = "music_config", columnDefinition = "TEXT")
    private String musicConfig;

    @Column(name = "theme_config", columnDefinition = "TEXT")
    private String themeConfig;

    @Column(name = "resume_config", columnDefinition = "TEXT")
    private String resumeConfig;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBackgroundConfig() { return backgroundConfig; }
    public void setBackgroundConfig(String backgroundConfig) { this.backgroundConfig = backgroundConfig; }
    public String getSiteConfig() { return siteConfig; }
    public void setSiteConfig(String siteConfig) { this.siteConfig = siteConfig; }
    public String getAboutConfig() { return aboutConfig; }
    public void setAboutConfig(String aboutConfig) { this.aboutConfig = aboutConfig; }
    public String getLinksConfig() { return linksConfig; }
    public void setLinksConfig(String linksConfig) { this.linksConfig = linksConfig; }
    public String getProjectsConfig() { return projectsConfig; }
    public void setProjectsConfig(String projectsConfig) { this.projectsConfig = projectsConfig; }
    public String getMusicConfig() { return musicConfig; }
    public void setMusicConfig(String musicConfig) { this.musicConfig = musicConfig; }
    public String getThemeConfig() { return themeConfig; }
    public void setThemeConfig(String themeConfig) { this.themeConfig = themeConfig; }
    public String getResumeConfig() { return resumeConfig; }
    public void setResumeConfig(String resumeConfig) { this.resumeConfig = resumeConfig; }

    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
}
