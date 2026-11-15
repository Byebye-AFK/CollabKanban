package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Colum;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CardRepo extends JpaRepository<Card,Long> {

    /**
     * Locks the column row for the rest of the transaction. createCard takes
     * this lock before reading the top position, so two creates in the same
     * column (even an empty one) cannot both pick the same position.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Colum c WHERE c.columnId = :columnId")
    Optional<Colum> lockColumn(@Param("columnId") Long columnId);

    /** The card with the highest position in the column, or null if it is empty. */
    @Query("SELECT c FROM Card c WHERE c.colum = :columnId ORDER BY c.position DESC LIMIT 1")
    Card findTop(@Param("columnId") Colum columnId);

    Card findByCardId(Long cardId);

}
