package com.devlog.controller;

import com.devlog.entity.Post;
import com.devlog.entity.PostSummary;
import com.devlog.repository.PostRepository;
import com.devlog.repository.CategoryRepository;
import com.devlog.entity.Category;
import com.devlog.util.Sanitizer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;

    public PostController(PostRepository postRepository, CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
        this.postRepository = postRepository;
    }

    // ── Read ──────────────────────────────────────────

    /** GET /api/posts - Paginated list (sorted by date desc, excludes content) */
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long categoryId
    ) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "pinned").and(Sort.by(Sort.Direction.DESC, "date")));
        final Long catId = categoryId;

        // Search and tag use projections (no category info needed)
        if (search != null && !search.isBlank()) {
            Page<PostSummary> r = postRepository.searchProjectedByTitle(search, pr);
            return ResponseEntity.ok(Map.of(
                "posts", r.getContent(), "totalPages", r.getTotalPages(),
                "totalElements", r.getTotalElements(), "page", r.getNumber(), "size", r.getSize()
            ));
        }
        if (tag != null && !tag.isBlank()) {
            Page<PostSummary> r = postRepository.findProjectedByTag(tag, pr);
            return ResponseEntity.ok(Map.of(
                "posts", r.getContent(), "totalPages", r.getTotalPages(),
                "totalElements", r.getTotalElements(), "page", r.getNumber(), "size", r.getSize()
            ));
        }

        // Normal list needs category info → use full Post query
        Page<Post> result = (catId != null)
            ? postRepository.findFullByCategoryId(catId, pr)
            : postRepository.findAllByOrderByPinnedDescDateDesc(pr);

        List<Map<String, Object>> posts = result.getContent().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("slug", p.getSlug());
            m.put("title", p.getTitle());
            m.put("excerpt", p.getExcerpt());
            m.put("date", p.getDate());
            m.put("readTime", p.getReadTime());
            m.put("coverImage", p.getCoverImage());
            m.put("pinned", p.isPinned());
            m.put("tags", p.getTags());
            m.put("createdAt", p.getCreatedAt());
            m.put("updatedAt", p.getUpdatedAt());
            if (p.getCategory() != null) {
                Map<String, Object> cat = new LinkedHashMap<>();
                cat.put("id", p.getCategory().getId());
                cat.put("name", p.getCategory().getName());
                cat.put("slug", p.getCategory().getSlug());
                m.put("category", cat);
            }
            return m;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "posts", posts,
            "totalPages", result.getTotalPages(),
            "totalElements", result.getTotalElements(),
            "page", result.getNumber(),
            "size", result.getSize()
        ));
    }

    /** GET /api/posts/{slug} - Single post by slug */
    @GetMapping("/posts/{slug}")
    public ResponseEntity<Post> getPostBySlug(@PathVariable String slug) {
        return postRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/tags - All distinct tags */
    @GetMapping("/tags")
    public List<String> getAllTags() {
        return postRepository.findAllTags();
    }

    // ── Create ────────────────────────────────────────

    /** POST /api/posts - Create a new post */
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@Valid @RequestBody Post post) {
        if (postRepository.findBySlug(post.getSlug()).isPresent()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Slug '" + post.getSlug() + "' already exists"));
        }
        // Sanitize user input
        post.setTitle(Sanitizer.plainText(post.getTitle()));
        post.setExcerpt(Sanitizer.plainText(post.getExcerpt()));
        // NOTE: do NOT run Jsoup.clean on the markdown body. Jsoup parses markdown
        // as HTML, which collapses all newlines to spaces (breaking headings, code
        // fences, tables, lists) and strips <...> sequences like `#include <stdio.h>`.
        // Markdown is not HTML — store it raw; the frontend renders it to HTML.
        post.setContent(post.getContent());
        if (post.getCategory() != null && post.getCategory().getId() != null) {
            categoryRepository.findById(post.getCategory().getId()).ifPresent(post::setCategory);
        }
        Post saved = postRepository.save(post);
        return ResponseEntity.ok(saved);
    }

    // ── Update ────────────────────────────────────────

    /** PUT /api/posts/{slug} - Update an existing post */
    @PutMapping("/posts/{slug}")
    public ResponseEntity<?> updatePost(
            @PathVariable String slug,
            @RequestBody Post updates
    ) {
        return postRepository.findBySlug(slug)
            .map(existing -> {
                if (updates.getTitle() != null) existing.setTitle(Sanitizer.plainText(updates.getTitle()));
                if (updates.getExcerpt() != null) existing.setExcerpt(Sanitizer.plainText(updates.getExcerpt()));
                // Store markdown raw (see createPost note — Jsoup.clean corrupts markdown)
                if (updates.getContent() != null) existing.setContent(updates.getContent());
                if (updates.getDate() != null) existing.setDate(updates.getDate());
                if (updates.getReadTime() != null) existing.setReadTime(updates.getReadTime());
                if (updates.getTags() != null) existing.setTags(updates.getTags());
                if (updates.isPinned() != existing.isPinned()) existing.setPinned(updates.isPinned());
                if (updates.getCategory() != null && updates.getCategory().getId() != null) {
                    categoryRepository.findById(updates.getCategory().getId()).ifPresent(existing::setCategory);
                }
                if (updates.getCoverImage() != null) existing.setCoverImage(updates.getCoverImage());
                // Allow slug rename only if new slug is unique
                if (updates.getSlug() != null && !updates.getSlug().equals(slug)) {
                    if (postRepository.findBySlug(updates.getSlug()).isPresent()) {
                        return ResponseEntity.badRequest()
                            .body((Object) Map.of("error", "Slug '" + updates.getSlug() + "' already exists"));
                    }
                    existing.setSlug(updates.getSlug());
                }
                return ResponseEntity.ok(postRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ── Delete ────────────────────────────────────────

    /** DELETE /api/posts/{slug} - Delete a post */
    @DeleteMapping("/posts/{slug}")
    public ResponseEntity<?> deletePost(@PathVariable String slug) {
        return postRepository.findBySlug(slug)
            .map(post -> {
                postRepository.delete(post);
                return ResponseEntity.ok(Map.of("deleted", slug));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/posts/id/{id} - Delete post by ID */
    @DeleteMapping("/posts/id/{id}")
    public ResponseEntity<?> deletePostById(@PathVariable Long id) {
        return postRepository.findById(id)
            .map(post -> {
                postRepository.delete(post);
                return ResponseEntity.ok(Map.of("deleted", post.getSlug()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/health - Health check */
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
