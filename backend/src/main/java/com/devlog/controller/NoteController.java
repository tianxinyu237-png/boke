package com.devlog.controller;

import com.devlog.entity.Note;
import com.devlog.repository.NoteRepository;
import com.devlog.util.Sanitizer;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    /** GET /api/notes */
    @GetMapping
    public List<Note> getAllNotes(@RequestParam(required = false) String folder,
                                   @RequestParam(required = false) String noteType) {
        if (folder != null && !folder.isBlank()) {
            if (noteType != null && !noteType.isBlank()) {
                return noteRepository.findByFolderAndNoteTypeOrderByUpdatedAtDesc(folder, noteType);
            }
            return noteRepository.findByFolderOrderByUpdatedAtDesc(folder);
        }
        if (noteType != null && !noteType.isBlank()) {
            return noteRepository.findByNoteTypeOrderByUpdatedAtDesc(noteType);
        }
        return noteRepository.findAllByOrderByUpdatedAtDesc();
    }

    /** GET /api/notes/folders */
    @GetMapping("/folders")
    public List<String> getFolders() {
        return noteRepository.findAllFolders();
    }

    /** GET /api/notes/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNote(@PathVariable Long id) {
        return noteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/notes/slug/{slug} */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<Note> getNoteBySlug(@PathVariable String slug) {
        return noteRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/notes/mindmap/{id} — serve HTML directly */
    @GetMapping(value = "/mindmap/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getMindMapHtml(@PathVariable Long id) {
        return noteRepository.findById(id)
                .filter(n -> "mindmap".equals(n.getNoteType()) && n.getHtmlContent() != null)
                .map(n -> ResponseEntity.ok(n.getHtmlContent()))
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/notes */
    @PostMapping
    public ResponseEntity<Note> createNote(@Valid @RequestBody Note note) {
        sanitize(note);
        Note saved = noteRepository.save(note);
        return ResponseEntity.ok(saved);
    }

    /** PUT /api/notes/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @Valid @RequestBody Note updates) {
        return noteRepository.findById(id)
            .map(existing -> {
                if (updates.getTitle() != null) existing.setTitle(Sanitizer.plainText(updates.getTitle()));
                if (updates.getContent() != null) existing.setContent(updates.getContent());
                if (updates.getNoteType() != null) existing.setNoteType(updates.getNoteType());
                if (updates.getHtmlContent() != null) existing.setHtmlContent(updates.getHtmlContent());
                if (updates.getFolder() != null) existing.setFolder(updates.getFolder());
                if (updates.getSlug() != null) existing.setSlug(updates.getSlug());
                return ResponseEntity.ok(noteRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/notes/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNote(@PathVariable Long id) {
        if (!noteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        noteRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }

    private void sanitize(Note note) {
        note.setTitle(Sanitizer.plainText(note.getTitle()));
    }
}
