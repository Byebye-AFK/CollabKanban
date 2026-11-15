package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Boards.Colum;
import com.collabKanban.Kanban.Boards.ColumRepo;
import com.collabKanban.Kanban.DTO.CreateCardReq;
import com.collabKanban.Kanban.DTO.MoveCardReq;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

/**
 * Cards: create, move, read, delete.
 *
 * Every failure is a ResponseStatusException (400 / 403 / 404 / 409), so the
 * controller can always answer 200 with the body. Permission checks go
 * through WorkspaceAccess, which also covers boards that have no team.
 */
@Service
public class CardService {

    /** Gap between neighbouring card positions, so a move can land between two cards. */
    static final long POSITION_STEP = 1000L;

    static final String STALE_CARD_MESSAGE = "Someone else changed this card first. Reload and try again.";

    private final CardRepo cardRepo;
    private final ColumRepo columRepo;
    private final UserRepo userRepo;
    private final WorkspaceAccess access;
    private final ApplicationEventPublisher events;

    public CardService(CardRepo cardRepo, ColumRepo columRepo, UserRepo userRepo,
                       WorkspaceAccess access, ApplicationEventPublisher events) {
        this.cardRepo = cardRepo;
        this.columRepo = columRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.events = events;
    }

    // ── Create ───────────────────────────────────────────────
    @Transactional
    public CardResponse createCard(CreateCardReq req) {
        if (req == null || req.getTitle() == null || req.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Give the card a title");
        }
        if (req.getColumnId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a column for the card");
        }

        // Locking the column row (not the top card) serialises creates in the
        // same column, including the very first one, when there is no card to lock.
        Colum column = cardRepo.lockColumn(req.getColumnId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found"));
        access.requireBoardEditor(column.getBoard());

        Card card = new Card();
        card.setTitle(req.getTitle().trim());
        card.setDescription(req.getDescription());
        card.setAssignedTo(findAssignee(req.getAssignedTo()));
        card.setColum(column);
        card.setPosition(req.getPosition() != null ? req.getPosition() : nextPosition(column));

        return toResponse(cardRepo.save(card));
    }

    private Long nextPosition(Colum column) {
        Card top = cardRepo.findTop(column);
        if (top == null || top.getPosition() == null) {
            return POSITION_STEP;
        }
        return top.getPosition() + POSITION_STEP;
    }

    private Users findAssignee(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned user not found"));
    }

    // ── Move ─────────────────────────────────────────────────
    @Transactional
    public CardResponse moveCard(Long cardId, MoveCardReq req) {
        if (req == null || req.getTargetColumnId() == null || req.getPosition() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A move needs a target column and a position");
        }

        Card card = requireCard(cardId);
        Board board = card.getColum().getBoard();
        access.requireBoardEditor(board);

        // The client echoes the version it last saw; a different one means its copy is stale.
        if (req.getVersion() != null && !Objects.equals(req.getVersion(), card.getVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, STALE_CARD_MESSAGE);
        }

        Colum target = columRepo.findById(req.getTargetColumnId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found"));
        if (target.getBoard() == null || !Objects.equals(target.getBoard().getBoardId(), board.getBoardId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cards can only move within their board");
        }

        card.setColum(target);
        card.setPosition(req.getPosition());
        // Flush now so the response carries the incremented @Version.
        CardResponse res = toResponse(cardRepo.saveAndFlush(card));

        events.publishEvent(new CardMovedEvent(board.getBoardId(), res));
        return res;
    }

    // ── Read ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public CardResponse getCard(Long id) {
        Card card = requireCard(id);
        access.requireBoardReader(card.getColum().getBoard());
        return toResponse(card);
    }

    // ── Delete ───────────────────────────────────────────────
    @Transactional
    public CardResponse deleteCard(Long id) {
        Card card = requireCard(id);
        access.requireBoardEditor(card.getColum().getBoard());
        CardResponse res = toResponse(card);
        cardRepo.delete(card);
        return res;
    }

    // ── Helpers ──────────────────────────────────────────────
    private Card requireCard(Long cardId) {
        Card card = cardId == null ? null : cardRepo.findByCardId(cardId);
        if (card == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found");
        }
        return card;
    }

    /** The one Card → CardResponse mapping, used by every response and broadcast. */
    private static CardResponse toResponse(Card card) {
        CardResponse res = new CardResponse();
        res.setCardId(card.getCardId());
        res.setTitle(card.getTitle());
        res.setDescription(card.getDescription());
        res.setPosition(card.getPosition());
        res.setAssignedTo(card.getAssignedTo() != null ? card.getAssignedTo().getUserId() : null);
        res.setVersion(card.getVersion());
        return res;
    }
}
