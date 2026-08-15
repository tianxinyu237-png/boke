package com.devlog.controller;

import com.devlog.entity.SiteStat;
import com.devlog.repository.SiteStatRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final SiteStatRepository repo;

    public StatsController(SiteStatRepository repo) {
        this.repo = repo;
    }

    /** GET /api/stats — get all stats */
    @GetMapping
    public Map<String, Long> getStats() {
        rolloverIfNewDay();
        long totalVisits = repo.findByStatKey("total_visits")
                .map(SiteStat::getStatValue).orElse(0L);
        long todayVisits = repo.findByStatKey("today_visits")
                .map(SiteStat::getStatValue).orElse(0L);
        return Map.of("totalVisits", totalVisits, "todayVisits", todayVisits);
    }

    /** POST /api/stats/visit — record a page view */
    @PostMapping("/visit")
    public ResponseEntity<?> recordVisit() {
        rolloverIfNewDay();

        // Increment total
        SiteStat total = repo.findByStatKey("total_visits")
                .orElse(new SiteStat("total_visits", 0L));
        total.setStatValue(total.getStatValue() + 1);
        repo.save(total);

        // Increment today
        SiteStat today = repo.findByStatKey("today_visits")
                .orElse(new SiteStat("today_visits", 0L));
        today.setStatValue(today.getStatValue() + 1);
        repo.save(today);

        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * Reset today_visits when the calendar day changes.
     * Stores the epoch day in a "today_day" stat key; on a new day,
     * zeroes today_visits before the first increment.
     */
    private void rolloverIfNewDay() {
        long todayEpochDay = java.time.LocalDate.now().toEpochDay();
        SiteStat dayKey = repo.findByStatKey("today_day")
                .orElse(new SiteStat("today_day", 0L));
        if (dayKey.getStatValue() != todayEpochDay) {
            SiteStat today = repo.findByStatKey("today_visits")
                    .orElse(new SiteStat("today_visits", 0L));
            today.setStatValue(0L);
            repo.save(today);
            dayKey.setStatValue(todayEpochDay);
            repo.save(dayKey);
        }
    }
}
