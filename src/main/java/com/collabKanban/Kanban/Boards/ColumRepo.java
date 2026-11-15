package com.collabKanban.Kanban.Boards;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ColumRepo extends JpaRepository<Colum,Long> {


    List<Colum> findByboard(Board id);


    // Highest-positioned column of a board. Null positions are skipped because
    // Postgres sorts NULL first under DESC, which would hide the real maximum.
    @Query("SELECT c FROM Colum c WHERE c.board=:boardId AND c.position IS NOT NULL "
            + "ORDER BY c.position DESC LIMIT 1")
    Colum findTop(Board boardId);
}
