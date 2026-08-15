package com.devlog.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${app.admin-password}")
    private String adminPassword;

    @Value("${app.admin-token}")
    private String adminToken;

    // 登录限流：IP -> {失败次数, 首次失败时间戳}
    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MS = 15 * 60 * 1000; // 15分钟
    private final ConcurrentHashMap<String, long[]> attemptMap = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password required"));
        }

        String ip = resolveClientIp(request);
        if (isLocked(ip)) {
            return ResponseEntity.status(429)
                    .body(Map.of("error", "Too many failed attempts. Try again in 15 minutes."));
        }

        if (adminPassword.equals(password)) {
            attemptMap.remove(ip); // 成功登录清除记录
            return ResponseEntity.ok(Map.of("token", adminToken));
        }

        recordFailure(ip);
        return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid password"));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean isLocked(String ip) {
        long[] record = attemptMap.get(ip);
        if (record == null) return false;
        if (record[0] >= MAX_ATTEMPTS) {
            long elapsed = System.currentTimeMillis() - record[1];
            if (elapsed < LOCK_DURATION_MS) return true;
            attemptMap.remove(ip); // 锁定期已过，重置
        }
        return false;
    }

    private void recordFailure(String ip) {
        long now = System.currentTimeMillis();
        attemptMap.compute(ip, (k, v) -> {
            if (v == null) return new long[]{1, now};
            if (now - v[1] > LOCK_DURATION_MS) return new long[]{1, now}; // 窗口过期重置
            v[0]++;
            return v;
        });
    }
}
