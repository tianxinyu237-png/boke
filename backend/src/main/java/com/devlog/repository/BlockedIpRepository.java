package com.devlog.repository;

import com.devlog.entity.BlockedIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BlockedIpRepository extends JpaRepository<BlockedIp, Long> {

    Optional<BlockedIp> findByIp(String ip);

    List<BlockedIp> findByExpiresAtAfterOrderByBlockedAtDesc(LocalDateTime now);

    boolean existsByIpAndExpiresAtAfter(String ip, LocalDateTime now);

    @Modifying
    @Transactional
    @Query("DELETE FROM BlockedIp b WHERE b.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    void deleteByIp(String ip);
}
