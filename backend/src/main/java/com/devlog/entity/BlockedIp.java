package com.devlog.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_ips")
public class BlockedIp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64, unique = true)
    private String ip;

    @Column(length = 255)
    private String reason;

    private LocalDateTime blockedAt;

    private LocalDateTime expiresAt;

    public BlockedIp() {}

    public BlockedIp(String ip, String reason, int hours) {
        this.ip = ip;
        this.reason = reason;
        this.blockedAt = LocalDateTime.now();
        this.expiresAt = this.blockedAt.plusHours(hours);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getBlockedAt() { return blockedAt; }
    public void setBlockedAt(LocalDateTime blockedAt) { this.blockedAt = blockedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
