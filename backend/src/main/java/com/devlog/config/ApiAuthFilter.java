package com.devlog.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Simple API key filter for write operations.
 * GET requests are public; POST/PUT/DELETE require X-Api-Key header.
 */
@Component
public class ApiAuthFilter extends OncePerRequestFilter {

    @Value("${app.admin-token}")
    private String adminToken;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String method = request.getMethod();
        String path = request.getRequestURI();

        // Public endpoints — no auth required
        if ("GET".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        // Login endpoint — no auth required
        if (path.equals("/api/auth/login")) {
            chain.doFilter(request, response);
            return;
        }

        // Stats visit — public endpoint (no auth)
        if (path.equals("/api/stats/visit")) {
            chain.doFilter(request, response);
            return;
        }

        // Write operations require X-Api-Key
        String apiKey = request.getHeader("X-Api-Key");
        if (adminToken != null && adminToken.equals(apiKey)) {
            chain.doFilter(request, response);
            return;
        }

        response.setStatus(401);
        response.setContentType("application/json; charset=utf-8");
        response.getWriter().write("{\"error\":\"Unauthorized — valid X-Api-Key required\"}");
    }
}
