package com.devlog.controller;

import com.devlog.entity.Photo;
import com.devlog.repository.PhotoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {

    private final PhotoRepository repo;

    public PhotoController(PhotoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Photo> getAll() {
        return repo.findAllByOrderBySortOrderAscCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<Photo> create(@RequestBody Photo photo) {
        return ResponseEntity.ok(repo.save(photo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Photo updates) {
        return repo.findById(id).map(existing -> {
            if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
            if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
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
