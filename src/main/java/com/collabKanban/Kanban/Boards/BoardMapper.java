package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.Card.Card;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.Response.ColumResponse;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * The one place that turns board entities into responses, so BoardService and
 * ColumService map columns and cards the same way.
 *
 * Columns and cards are always sorted by position (nulls last, then id), so the
 * client sees a stable order no matter how the collection was loaded. Pure
 * mapping: no queries, no access checks.
 */
final class BoardMapper {

    static final Comparator<Colum> COLUMN_ORDER =
            Comparator.comparing(Colum::getPosition, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(Colum::getColumnId, Comparator.nullsLast(Comparator.naturalOrder()));

    static final Comparator<Card> CARD_ORDER =
            Comparator.comparing(Card::getPosition, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(Card::getCardId, Comparator.nullsLast(Comparator.naturalOrder()));

    private BoardMapper() {
    }

    static BoardResponse toBoardResponse(Board board) {
        BoardResponse response = new BoardResponse();
        response.setBoardId(board.getBoardId());
        response.setName(board.getName());
        response.setPosition(board.getPosition());
        Team team = board.getTeam();
        response.setTeamId(team == null ? null : team.getTeamId());
        response.setColumns(toColumResponses(board.getColumns()));
        return response;
    }

    static List<ColumResponse> toColumResponses(List<Colum> columns) {
        if (columns == null) {
            return List.of();
        }
        return columns.stream().sorted(COLUMN_ORDER).map(BoardMapper::toColumResponse).toList();
    }

    static ColumResponse toColumResponse(Colum column) {
        ColumResponse response = new ColumResponse();
        response.setColumnId(column.getColumnId());
        response.setName(column.getName());
        response.setPosition(column.getPosition());
        response.setCards(toCardResponses(column.getCards()));
        return response;
    }

    static List<CardResponse> toCardResponses(List<Card> cards) {
        if (cards == null) {
            return List.of();
        }
        return cards.stream().sorted(CARD_ORDER).map(BoardMapper::toCardResponse).toList();
    }

    static CardResponse toCardResponse(Card card) {
        CardResponse response = new CardResponse();
        response.setCardId(card.getCardId());
        response.setTitle(card.getTitle());
        response.setDescription(card.getDescription());
        response.setPosition(card.getPosition());
        Users assignee = card.getAssignedTo();
        response.setAssignedTo(assignee == null ? null : assignee.getUserId());
        response.setVersion(card.getVersion());
        return response;
    }

    /** Trimmed name, or 400 when it is missing or blank. */
    static String requireName(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }
}
