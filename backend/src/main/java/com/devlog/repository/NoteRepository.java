package com.devlog.repository;

import com.devlog.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findAllByOrderByUpdatedAtDesc();

    List<Note> findByFolderOrderByUpdatedAtDesc(String folder);

    List<Note> findByNoteTypeOrderByUpdatedAtDesc(String noteType);

    List<Note> findByFolderAndNoteTypeOrderByUpdatedAtDesc(String folder, String noteType);

    Optional<Note> findBySlug(String slug);

    @Query("SELECT DISTINCT n.folder FROM Note n WHERE n.folder IS NOT NULL AND n.folder <> '' ORDER BY n.folder")
    List<String> findAllFolders();
}
