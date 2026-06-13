package com.collabKanban.Kanban.Boards;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BoardRepo extends JpaRepository<Board,Long> {

    List<Board> findByworkspace(Long id);

    @Query("SELECT b FROM Board b WHERE "+"b.boardId=:id")
    Board findBoard(Long id);
}
