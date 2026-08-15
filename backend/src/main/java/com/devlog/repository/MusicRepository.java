package com.devlog.repository;

import com.devlog.entity.Music;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MusicRepository extends JpaRepository<Music, Long> {
    List<Music> findAllByOrderBySortOrderAsc();
}
