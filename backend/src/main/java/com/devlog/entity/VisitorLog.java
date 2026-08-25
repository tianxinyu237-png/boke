package com.devlog.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_logs", indexes = {
        @Index(name = "idx_visitor_ip", columnList = "ip"),
        @Index(name = "idx_visitor_created", columnList = "createdAt")
})
public class VisitorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64)
    private String ip;

    @Column(length = 512)
    private String ua;

    @Column(length = 255)
    private String path;

    @Column(length = 16)
    private String method;

    private int status;

    @Column(length = 512)
    private String referer;

    private LocalDateTime createdAt;

    public VisitorLog() {}

    public VisitorLog(String ip, String ua, String path, String method, int status, String referer) {
        this.ip = ip;
        this.ua = ua;
        this.path = path;
        this.method = method;
        this.status = status;
        this.referer = referer;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getUa() { return ua; }
    public void setUa(String ua) { this.ua = ua; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
    public String getReferer() { return referer; }
    public void setReferer(String referer) { this.referer = referer; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
