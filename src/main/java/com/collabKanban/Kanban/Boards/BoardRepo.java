package com.collabKanban.Kanban.Boards;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardRepo extends JpaRepository<Board,Long> {

    List<Board> findByworkspace(Long id);
}
