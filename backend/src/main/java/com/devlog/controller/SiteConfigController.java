package com.devlog.controller;

import com.devlog.entity.SiteConfig;
import com.devlog.repository.SiteConfigRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/site-config")
public class SiteConfigController {

    private final SiteConfigRepository repo;

    public SiteConfigController(SiteConfigRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfig() {
        SiteConfig config = repo.findById(1L).orElse(null);
        Map<String, Object> result = new java.util.HashMap<>();
        String[] fields = {"backgroundConfig","siteConfig","aboutConfig","linksConfig","projectsConfig","musicConfig","themeConfig","resumeConfig"};
        for (String f : fields) {
            result.put(f, config != null ? getField(config, f) : null);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateConfig(@RequestBody Map<String, Object> body) {
        SiteConfig config = repo.findById(1L).orElse(new SiteConfig());
        String[] fields = {"backgroundConfig","siteConfig","aboutConfig","linksConfig","projectsConfig","musicConfig","themeConfig","resumeConfig"};
        for (String f : fields) {
            if (body.containsKey(f)) {
                Object val = body.get(f);
                setField(config, f, val != null ? val.toString() : null);
            }
        }
        repo.save(config);
        return ResponseEntity.ok(Map.of("message", "saved"));
    }

    private String getField(SiteConfig c, String name) {
        switch (name) {
            case "backgroundConfig": return c.getBackgroundConfig();
            case "siteConfig": return c.getSiteConfig();
            case "aboutConfig": return c.getAboutConfig();
            case "linksConfig": return c.getLinksConfig();
            case "projectsConfig": return c.getProjectsConfig();
            case "musicConfig": return c.getMusicConfig();
            case "themeConfig": return c.getThemeConfig();
            case "resumeConfig": return c.getResumeConfig();
        }
        return null;
    }

    private void setField(SiteConfig c, String name, String val) {
        switch (name) {
            case "backgroundConfig": c.setBackgroundConfig(val); break;
            case "siteConfig": c.setSiteConfig(val); break;
            case "aboutConfig": c.setAboutConfig(val); break;
            case "linksConfig": c.setLinksConfig(val); break;
            case "projectsConfig": c.setProjectsConfig(val); break;
            case "musicConfig": c.setMusicConfig(val); break;
            case "themeConfig": c.setThemeConfig(val); break;
            case "resumeConfig": c.setResumeConfig(val); break;
        }
    }
}
