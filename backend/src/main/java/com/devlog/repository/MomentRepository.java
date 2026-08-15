package com.devlog.repository;

import com.devlog.entity.Moment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MomentRepository extends JpaRepository<Moment, Long> {
    List<Moment> findAllByOrderByCreatedAtDesc();
}
