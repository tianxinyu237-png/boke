package com.devlog.controller;

import com.devlog.entity.Moment;
import com.devlog.repository.MomentRepository;
import com.devlog.util.Sanitizer;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moments")
public class MomentController {

    private final MomentRepository repo;

    public MomentController(MomentRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Moment> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<Moment> create(@Valid @RequestBody Moment moment) {
        moment.setContent(Sanitizer.richContent(moment.getContent()));
        return ResponseEntity.ok(repo.save(moment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return repo.findById(id)
            .map(m -> { repo.delete(m); return ResponseEntity.ok(Map.of("deleted", id)); })
            .orElse(ResponseEntity.notFound().build());
    }
}
