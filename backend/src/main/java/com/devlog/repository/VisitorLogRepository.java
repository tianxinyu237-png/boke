package com.devlog.repository;

import com.devlog.entity.VisitorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {

    long countByCreatedAtAfter(LocalDateTime after);

    @Query("SELECT COUNT(DISTINCT v.ip) FROM VisitorLog v WHERE v.createdAt >= :since")
    long countDistinctIpSince(@Param("since") LocalDateTime since);

    /** 按 IP 聚合:[ip, 次数, 首次访问, 最后访问, 404次数] */
    @Query("SELECT v.ip, COUNT(v), MIN(v.createdAt), MAX(v.createdAt), " +
            "SUM(CASE WHEN v.status = 404 THEN 1 ELSE 0 END) " +
            "FROM VisitorLog v WHERE v.createdAt >= :since " +
            "GROUP BY v.ip ORDER BY COUNT(v) DESC")
    List<Object[]> aggregateByIp(@Param("since") LocalDateTime since, org.springframework.data.domain.Pageable pageable);

    List<VisitorLog> findTop100ByOrderByCreatedAtDesc();

    List<VisitorLog> findTop100ByIpOrderByCreatedAtDesc(String ip);

    @Modifying
    @Transactional
    @Query("DELETE FROM VisitorLog v WHERE v.createdAt < :cutoff")
    void deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
