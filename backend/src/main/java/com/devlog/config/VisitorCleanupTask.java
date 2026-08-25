package com.devlog.config;

import com.devlog.repository.BlockedIpRepository;
import com.devlog.repository.VisitorLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** 每天凌晨清理过期数据:30 天前的访客日志 + 已过期的封禁记录 */
@Component
public class VisitorCleanupTask {

    private final VisitorLogRepository logRepo;
    private final BlockedIpRepository blockedRepo;

    public VisitorCleanupTask(VisitorLogRepository logRepo, BlockedIpRepository blockedRepo) {
        this.logRepo = logRepo;
        this.blockedRepo = blockedRepo;
    }

    @Scheduled(cron = "0 30 4 * * *")
    public void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        logRepo.deleteOlderThan(cutoff);
        blockedRepo.deleteExpired(LocalDateTime.now());
    }
}
