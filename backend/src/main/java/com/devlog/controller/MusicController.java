package com.devlog.controller;

import com.devlog.entity.Music;
import com.devlog.repository.MusicRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/music")
public class MusicController {

    private final MusicRepository repo;

    public MusicController(MusicRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Music> getAll() { return repo.findAllByOrderBySortOrderAsc(); }

    @PostMapping
    public ResponseEntity<Music> create(@RequestBody Music music) {
        return ResponseEntity.ok(repo.save(music));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Music updates) {
        return repo.findById(id).map(existing -> {
            if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
            if (updates.getArtist() != null) existing.setArtist(updates.getArtist());
            if (updates.getUrl() != null) existing.setUrl(updates.getUrl());
            if (updates.getSortOrder() != existing.getSortOrder()) existing.setSortOrder(updates.getSortOrder());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }
}
