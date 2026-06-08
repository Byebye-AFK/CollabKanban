package com.collabKanban.Kanban.Card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardRepo extends JpaRepository<Card,Long> {

    List<Card> findByColum(Long Colum);
}
