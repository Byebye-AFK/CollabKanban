package com.collabKanban.Kanban.Boards;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ColumRepo extends JpaRepository<Colum,Long> {

    List<Colum> findByboard(Long id);
}
