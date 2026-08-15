package com.devlog.repository;

import com.devlog.entity.SiteStat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SiteStatRepository extends JpaRepository<SiteStat, Long> {
    Optional<SiteStat> findByStatKey(String statKey);
}
