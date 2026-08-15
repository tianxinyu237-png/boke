package com.devlog.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "site_stats")
public class SiteStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String statKey;

    @Column(nullable = false)
    private Long statValue = 0L;

    public SiteStat() {}

    public SiteStat(String statKey, Long statValue) {
        this.statKey = statKey;
        this.statValue = statValue;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStatKey() { return statKey; }
    public void setStatKey(String statKey) { this.statKey = statKey; }
    public Long getStatValue() { return statValue; }
    public void setStatValue(Long statValue) { this.statValue = statValue; }
}
