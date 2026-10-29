package com.devlog.controller;

import com.devlog.entity.Note;
import com.devlog.repository.NoteRepository;
import com.devlog.util.Sanitizer;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;

    /** 和 ApiAuthFilter 用同一个 token。GET 是公开的，所以只能在这里判身份 */
    @Value("${app.admin-token}")
    private String adminToken;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    private boolean isAdmin(String apiKey) {
        return adminToken != null && !adminToken.isBlank() && adminToken.equals(apiKey);
    }

    /** GET /api/notes
     *  light=true 时只返回列表所需的元数据(content 截断成预览),
     *  避免知识库列表把几十篇全文一次性塞给前端。
     */
    @GetMapping
    public List<Note> getAllNotes(@RequestParam(required = false) String folder,
                                   @RequestParam(required = false) String noteType,
                                   @RequestParam(required = false, defaultValue = "false") boolean light,
                                   @RequestHeader(value = "X-Api-Key", required = false) String apiKey) {
        List<Note> notes;

        // 关键：匿名请求只拿得到后台勾选公开的笔记。
        // 光在前端过滤不算数 —— 这个 GET 是公开接口，别人直接 curl 一样能拿到草稿。
        if (!isAdmin(apiKey)) {
            notes = (folder != null && !folder.isBlank())
                ? noteRepository.findByVisibleTrueAndFolderOrderBySortOrderAscUpdatedAtDesc(folder)
                : noteRepository.findByVisibleTrueOrderBySortOrderAscUpdatedAtDesc();
            if (light) {
                for (Note n : notes) {
                    String c = n.getContent();
                    if (c != null && c.length() > 200) n.setContent(c.substring(0, 200));
                    n.setHtmlContent(null);
                }
            }
            return notes;
        }

        if (folder != null && !folder.isBlank()) {
            if (noteType != null && !noteType.isBlank()) {
                notes = noteRepository.findByFolderAndNoteTypeOrderByUpdatedAtDesc(folder, noteType);
            } else {
                notes = noteRepository.findByFolderOrderByUpdatedAtDesc(folder);
            }
        } else if (noteType != null && !noteType.isBlank()) {
            notes = noteRepository.findByNoteTypeOrderByUpdatedAtDesc(noteType);
        } else {
            notes = noteRepository.findAllByOrderByUpdatedAtDesc();
        }

        if (light) {
            for (Note n : notes) {
                String c = n.getContent();
                if (c != null && c.length() > 200) {
                    n.setContent(c.substring(0, 200));
                }
                n.setHtmlContent(null);
            }
        }
        return notes;
    }

    /** GET /api/notes/folders */
    @GetMapping("/folders")
    public List<String> getFolders() {
        return noteRepository.findAllFolders();
    }

    /** GET /api/notes/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNote(@PathVariable Long id,
                                        @RequestHeader(value = "X-Api-Key", required = false) String apiKey) {
        return noteRepository.findById(id)
                .filter(n -> isAdmin(apiKey) || Boolean.TRUE.equals(n.getVisible()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/notes/slug/{slug} */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<Note> getNoteBySlug(@PathVariable String slug,
                                              @RequestHeader(value = "X-Api-Key", required = false) String apiKey) {
        return noteRepository.findBySlug(slug)
                .filter(n -> isAdmin(apiKey) || Boolean.TRUE.equals(n.getVisible()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/notes/mindmap/{id} — serve HTML directly */
    @GetMapping(value = "/mindmap/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getMindMapHtml(@PathVariable Long id,
                                                 @RequestHeader(value = "X-Api-Key", required = false) String apiKey) {
        return noteRepository.findById(id)
                .filter(n -> isAdmin(apiKey) || Boolean.TRUE.equals(n.getVisible()))
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
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody Note updates) {
        // 这里不能加 @Valid：Note.title 带 @NotBlank，而本接口是「传了才覆盖」的部分更新。
        // 后台只想改 visible 时发的 body 是 {"visible":true}，title 为 null，
        // 加了 @Valid 会被校验拦成 400 —— 表现就是「点开关没反应」。
        // 全量校验留给 createNote，更新走下面的逐字段判空。
        return noteRepository.findById(id)
            .map(existing -> {
                if (updates.getTitle() != null) existing.setTitle(Sanitizer.plainText(updates.getTitle()));
                if (updates.getContent() != null) existing.setContent(updates.getContent());
                if (updates.getNoteType() != null) existing.setNoteType(updates.getNoteType());
                if (updates.getHtmlContent() != null) existing.setHtmlContent(updates.getHtmlContent());
                if (updates.getFolder() != null) existing.setFolder(updates.getFolder());
                if (updates.getSlug() != null) existing.setSlug(updates.getSlug());
                // 以下四个只有显式传了才改。同步脚本永不传它们，
                // 所以后台勾的公开状态、栏目、排序不会被 30 分钟一次的同步覆盖。
                if (updates.getVisible() != null) existing.setVisible(updates.getVisible());
                if (updates.getDisplayTitle() != null) existing.setDisplayTitle(updates.getDisplayTitle());
                if (updates.getCollection() != null) existing.setCollection(updates.getCollection());
                if (updates.getSortOrder() != null) existing.setSortOrder(updates.getSortOrder());
                return ResponseEntity.ok(noteRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/notes/batch-visibility —— 批量公开 / 转草稿 */
    @PutMapping("/batch-visibility")
    public ResponseEntity<Map<String, Object>> batchVisibility(@RequestBody Map<String, Object> body) {
        Object idsObj = body.get("ids");
        boolean visible = Boolean.TRUE.equals(body.get("visible"));
        if (!(idsObj instanceof List<?> rawIds) || rawIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ids 不能为空"));
        }
        int changed = 0;
        for (Object o : rawIds) {
            try {
                Long id = (o instanceof Number n) ? n.longValue() : Long.parseLong(String.valueOf(o));
                var opt = noteRepository.findById(id);
                if (opt.isPresent()) {
                    Note n = opt.get();
                    n.setVisible(visible);
                    noteRepository.save(n);
                    changed++;
                }
            } catch (NumberFormatException ignored) {
                // 跳过脏 id，不因为一条坏数据整批失败
            }
        }
        return ResponseEntity.ok(Map.of("updated", changed, "visible", visible));
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
