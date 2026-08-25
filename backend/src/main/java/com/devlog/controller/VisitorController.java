package com.devlog.controller;

import com.devlog.entity.BlockedIp;
import com.devlog.entity.VisitorLog;
import com.devlog.repository.BlockedIpRepository;
import com.devlog.repository.VisitorLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    private final VisitorLogRepository repo;
    private final BlockedIpRepository blockedRepo;

    @Value("${app.admin-token}")
    private String adminToken;

    public VisitorController(VisitorLogRepository repo, BlockedIpRepository blockedRepo) {
        this.repo = repo;
        this.blockedRepo = blockedRepo;
    }

    // ── 公开:记录访客(由 frontend middleware 调用) ──
    @PostMapping("/record")
    public Map<String, Object> record(@RequestBody Map<String, String> body) {
        String ip = cut(body.getOrDefault("ip", "unknown"), 64);
        boolean blocked = blockedRepo.existsByIpAndExpiresAtAfter(ip, LocalDateTime.now());
        int status;
        try {
            status = Integer.parseInt(body.getOrDefault("status", "0"));
        } catch (NumberFormatException e) {
            status = 0;
        }
        repo.save(new VisitorLog(
                ip,
                cut(body.get("ua"), 512),
                cut(body.getOrDefault("path", "/"), 255),
                cut(body.getOrDefault("method", "GET"), 16),
                status,
                cut(body.get("referer"), 512)
        ));
        // 返回 blocked 状态,让 middleware 决定是否 403
        return Map.of("ok", true, "blocked", blocked);
    }

    // ── 公开:middleware 快速查封禁状态 ──
    @GetMapping("/check")
    public Map<String, Object> check(@RequestParam String ip) {
        boolean blocked = blockedRepo.existsByIpAndExpiresAtAfter(cut(ip, 64), LocalDateTime.now());
        return Map.of("blocked", blocked);
    }

    // ── 以下为管理接口,需 X-Api-Key ──
    @GetMapping("/overview")
    public ResponseEntity<?> overview(HttpServletRequest req) {
        if (!authed(req)) return unauthorized();
        LocalDateTime since30d = LocalDateTime.now().minusDays(30);
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long total = repo.countByCreatedAtAfter(since30d);
        long today = repo.countByCreatedAtAfter(todayStart);
        long activeIps = repo.countDistinctIpSince(since30d);
        long suspiciousIps = countSuspiciousIps(since30d);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("total", total);
        map.put("today", today);
        map.put("activeIps", activeIps);
        map.put("suspiciousIps", suspiciousIps);
        return ResponseEntity.ok(map);
    }

    @GetMapping("/rank")
    public ResponseEntity<?> rank(HttpServletRequest req) {
        if (!authed(req)) return unauthorized();
        LocalDateTime since30d = LocalDateTime.now().minusDays(30);
        List<Object[]> rows = repo.aggregateByIp(since30d, PageRequest.of(0, 200));
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ip", r[0]);
            m.put("count", r[1]);
            m.put("firstAt", r[2]);
            m.put("lastAt", r[3]);
            m.put("notFound", r[4]);
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/recent")
    public ResponseEntity<?> recent(@RequestParam(required = false) String ip, HttpServletRequest req) {
        if (!authed(req)) return unauthorized();
        List<VisitorLog> logs = (ip == null || ip.isBlank())
                ? repo.findTop100ByOrderByCreatedAtDesc()
                : repo.findTop100ByIpOrderByCreatedAtDesc(cut(ip, 64));
        List<Map<String, Object>> list = new ArrayList<>();
        for (VisitorLog v : logs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", v.getId());
            m.put("ip", v.getIp());
            m.put("ua", v.getUa());
            m.put("path", v.getPath());
            m.put("method", v.getMethod());
            m.put("status", v.getStatus());
            m.put("referer", v.getReferer());
            m.put("createdAt", v.getCreatedAt());
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/block")
    public ResponseEntity<?> block(@RequestBody Map<String, String> body, HttpServletRequest req) {
        if (!authed(req)) return unauthorized();
        String ip = cut(body.getOrDefault("ip", "").trim(), 64);
        if (ip.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "ip required"));
        String reason = cut(body.get("reason"), 255);
        int hours = 24;
        try {
            hours = Integer.parseInt(body.getOrDefault("hours", "24"));
        } catch (NumberFormatException ignored) {}
        if (hours < 1) hours = 24;
        blockedRepo.findByIp(ip).ifPresent(blockedRepo::delete);
        blockedRepo.save(new BlockedIp(ip, reason, hours));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/unblock")
    public ResponseEntity<?> unblock(@RequestBody Map<String, String> body, HttpServletRequest req) {
        if (!authed(req)) return unauthorized();
        String ip = cut(body.getOrDefault("ip", "").trim(), 64);
        if (ip.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "ip required"));
        blockedRepo.deleteByIp(ip);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/blocked")
    public ResponseEntity<?> blockedList(HttpServletRequest req) {
        if (!authed(req)) return unauthorized();
        List<Map<String, Object>> list = new ArrayList<>();
        for (BlockedIp b : blockedRepo.findByExpiresAtAfterOrderByBlockedAtDesc(LocalDateTime.now())) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ip", b.getIp());
            m.put("reason", b.getReason());
            m.put("blockedAt", b.getBlockedAt());
            m.put("expiresAt", b.getExpiresAt());
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    // ── helpers ──
    private boolean authed(HttpServletRequest req) {
        String key = req.getHeader("X-Api-Key");
        return adminToken != null && adminToken.equals(key);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }

    private long countSuspiciousIps(LocalDateTime since) {
        // 可疑判定:30 天内访问次数 >= 100 视为高频
        List<Object[]> rows = repo.aggregateByIp(since, PageRequest.of(0, 10000));
        long n = 0;
        for (Object[] r : rows) {
            long count = ((Number) r[1]).longValue();
            if (count >= 100) n++;
        }
        return n;
    }

    private String cut(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) : s;
    }
}
