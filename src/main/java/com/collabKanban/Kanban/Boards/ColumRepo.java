package com.collabKanban.Kanban.Boards;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ColumRepo extends JpaRepository<Colum,Long> {

    List<Colum> findByboard(Long id);
    @Query("SELECT c FROM Colum c WHERE "+"c.board=:boardId "+"ORDER BY c.position DESC LIMIT 1")
    Colum findTop(Board boardId);
}
