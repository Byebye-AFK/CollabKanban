package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Colum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CardRepo extends JpaRepository<Card,Long> {

    List<Card> findByColum(Long Colum);

    @Query("SELECT c FROM Card c WHERE "+"c.colum=:columnId "+"ORDER BY c.position DESC LIMIT 1")
    Card findTop(Colum columnId);


}
