package com.collabKanban.Kanban.Boards;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepo extends JpaRepository<Board,Long> {
}
