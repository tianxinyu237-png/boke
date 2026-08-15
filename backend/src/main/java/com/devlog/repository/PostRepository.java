package com.devlog.repository;

import com.devlog.entity.Post;
import com.devlog.entity.PostSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlug(String slug);

    // ── Projection queries (exclude heavy content field) ──

    Page<PostSummary> findAllProjectedBy(Pageable pageable);

    @Query("SELECT p FROM Post p JOIN p.tags t WHERE t = :tag")
    Page<PostSummary> findProjectedByTag(@Param("tag") String tag, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.excerpt) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<PostSummary> searchProjectedByTitle(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.category.id = :categoryId")
    Page<PostSummary> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    // ── Tag queries ──

    @Query("SELECT DISTINCT t FROM Post p JOIN p.tags t ORDER BY t")
    List<String> findAllTags();

    // Full Post queries (with category eager-loaded)
    @Query("SELECT DISTINCT p FROM Post p LEFT JOIN FETCH p.category ORDER BY p.pinned DESC, p.date DESC")
    Page<Post> findAllByOrderByPinnedDescDateDesc(Pageable pageable);

    @Query("SELECT DISTINCT p FROM Post p LEFT JOIN FETCH p.category WHERE p.category.id = :categoryId ORDER BY p.pinned DESC, p.date DESC")
    Page<Post> findFullByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);
}
