package com.devlog.entity;

import java.time.LocalDate;
import java.util.List;

public interface PostSummary {
    Long getId();
    String getSlug();
    String getTitle();
    String getExcerpt();
    LocalDate getDate();
    String getReadTime();
    String getCoverImage();
    boolean isPinned();
    List<String> getTags();
    java.time.LocalDateTime getCreatedAt();
    java.time.LocalDateTime getUpdatedAt();
    
    // Category flat fields (set manually in controller)
    default Long getCategoryId() { return null; }
    default String getCategoryName() { return null; }
    default String getCategorySlug() { return null; }
}
