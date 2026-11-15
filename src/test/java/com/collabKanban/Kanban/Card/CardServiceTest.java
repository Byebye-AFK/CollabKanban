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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock private CardRepo cardRepo;
    @Mock private ColumRepo columRepo;
    @Mock private UserRepo userRepo;
    @Mock private WorkspaceAccess access;
    @Mock private ApplicationEventPublisher events;

    private CardService service;

    @BeforeEach
    void setUp() {
        service = new CardService(cardRepo, columRepo, userRepo, access, events);
    }

    // ── Fixtures ─────────────────────────────────────────────
    private static Board board(long id) {
        Board board = new Board();
        board.setBoardId(id);
        return board; // no team: the case that used to fail (#6)
    }

    private static Colum column(long id, Board board) {
        Colum column = new Colum();
        column.setColumnId(id);
        column.setBoard(board);
        return column;
    }

    private static Card card(long id, Colum column, long version) {
        Card card = new Card();
        card.setCardId(id);
        card.setTitle("Card " + id);
        card.setDescription("Details");
        card.setPosition(1000L);
        card.setColum(column);
        card.setVersion(version);
        return card;
    }

    private static MoveCardReq move(long targetColumnId, long position, Long version) {
        MoveCardReq req = new MoveCardReq();
        req.setTargetColumnId(targetColumnId);
        req.setPosition(position);
        req.setVersion(version);
        return req;
    }

    private static CreateCardReq create(String title, Long columnId, Long position) {
        CreateCardReq req = new CreateCardReq();
        req.setTitle(title);
        req.setColumnId(columnId);
        req.setPosition(position);
        return req;
    }

    private static HttpStatus statusOf(ResponseStatusException ex) {
        return HttpStatus.valueOf(ex.getStatusCode().value());
    }

    // ── Move ─────────────────────────────────────────────────
    @Test
    void moveOfMissingCardIs404NotNullPointer() {
        when(cardRepo.findByCardId(99L)).thenReturn(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.moveCard(99L, move(20L, 2000L, null)));

        assertEquals(HttpStatus.NOT_FOUND, statusOf(ex));
        verify(cardRepo, never()).saveAndFlush(any());
    }

    @Test
    void moveWithStaleVersionIs409() {
        Board board = board(1L);
        when(cardRepo.findByCardId(100L)).thenReturn(card(100L, column(10L, board), 3L));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.moveCard(100L, move(20L, 2000L, 2L)));

        assertEquals(HttpStatus.CONFLICT, statusOf(ex));
        verify(cardRepo, never()).saveAndFlush(any());
        verify(events, never()).publishEvent(any());
    }

    @Test
    void moveToAnotherBoardsColumnIs400() {
        when(cardRepo.findByCardId(100L)).thenReturn(card(100L, column(10L, board(1L)), 0L));
        when(columRepo.findById(50L)).thenReturn(Optional.of(column(50L, board(2L))));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.moveCard(100L, move(50L, 2000L, null)));

        assertEquals(HttpStatus.BAD_REQUEST, statusOf(ex));
        verify(cardRepo, never()).saveAndFlush(any());
    }

    @Test
    void moveToMissingColumnIs404() {
        when(cardRepo.findByCardId(100L)).thenReturn(card(100L, column(10L, board(1L)), 0L));
        when(columRepo.findById(77L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.moveCard(100L, move(77L, 2000L, null)));

        assertEquals(HttpStatus.NOT_FOUND, statusOf(ex));
    }

    @Test
    void moveIsForbiddenWhenAccessCheckFails() {
        Board board = board(1L);
        when(cardRepo.findByCardId(100L)).thenReturn(card(100L, column(10L, board), 0L));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "no"))
                .when(access).requireBoardEditor(board);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.moveCard(100L, move(20L, 2000L, null)));

        assertEquals(HttpStatus.FORBIDDEN, statusOf(ex));
        verify(cardRepo, never()).saveAndFlush(any());
    }

    @Test
    void moveOnTeamlessBoardSucceedsAndBroadcastsFullCard() {
        Board board = board(1L);
        Colum target = column(20L, board);
        when(cardRepo.findByCardId(100L)).thenReturn(card(100L, column(10L, board), 3L));
        when(columRepo.findById(20L)).thenReturn(Optional.of(target));
        when(cardRepo.saveAndFlush(any(Card.class))).thenAnswer(inv -> {
            Card saved = inv.getArgument(0);
            saved.setVersion(saved.getVersion() + 1); // what the flush does
            return saved;
        });

        CardResponse res = service.moveCard(100L, move(20L, 2500L, 3L));

        verify(access).requireBoardEditor(board);
        assertEquals(2500L, res.getPosition());
        assertEquals(4L, res.getVersion());
        assertEquals("Details", res.getDescription());
        assertNull(res.getAssignedTo());

        ArgumentCaptor<CardMovedEvent> event = ArgumentCaptor.forClass(CardMovedEvent.class);
        verify(events).publishEvent(event.capture());
        assertEquals(1L, event.getValue().boardId());
        assertEquals(res, event.getValue().res());
    }

    // ── Read ─────────────────────────────────────────────────
    @Test
    void unassignedCardCanBeRead() {
        Board board = board(1L);
        when(cardRepo.findByCardId(100L)).thenReturn(card(100L, column(10L, board), 5L));

        CardResponse res = service.getCard(100L);

        verify(access).requireBoardReader(board);
        assertNull(res.getAssignedTo());
        assertEquals(5L, res.getVersion());
        assertEquals("Card 100", res.getTitle());
    }

    @Test
    void assignedCardReportsAssigneeId() {
        Card card = card(100L, column(10L, board(1L)), 0L);
        Users user = new Users();
        user.setUserId(7L);
        card.setAssignedTo(user);
        when(cardRepo.findByCardId(100L)).thenReturn(card);

        assertEquals(7L, service.getCard(100L).getAssignedTo());
    }

    @Test
    void readingMissingCardIs404() {
        when(cardRepo.findByCardId(1L)).thenReturn(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getCard(1L));

        assertEquals(HttpStatus.NOT_FOUND, statusOf(ex));
    }

    // ── Create ───────────────────────────────────────────────
    @Test
    void createHonoursClientPosition() {
        Colum column = column(10L, board(1L));
        when(cardRepo.lockColumn(10L)).thenReturn(Optional.of(column));
        when(cardRepo.save(any(Card.class))).thenAnswer(inv -> inv.getArgument(0));

        CardResponse res = service.createCard(create("Write tests", 10L, 4242L));

        assertEquals(4242L, res.getPosition());
        verify(access).requireBoardEditor(column.getBoard());
        verify(cardRepo, never()).findTop(any());
    }

    @Test
    void createInEmptyColumnUses1000() {
        Colum column = column(10L, board(1L));
        when(cardRepo.lockColumn(10L)).thenReturn(Optional.of(column));
        when(cardRepo.findTop(column)).thenReturn(null);
        when(cardRepo.save(any(Card.class))).thenAnswer(inv -> inv.getArgument(0));

        CardResponse res = service.createCard(create("First", 10L, null));

        assertEquals(1000L, res.getPosition());
    }

    @Test
    void createAfterExistingCardAddsStep() {
        Colum column = column(10L, board(1L));
        when(cardRepo.lockColumn(10L)).thenReturn(Optional.of(column));
        when(cardRepo.findTop(column)).thenReturn(card(5L, column, 0L)); // position 1000
        when(cardRepo.save(any(Card.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals(2000L, service.createCard(create("Second", 10L, null)).getPosition());
    }

    @Test
    void createWithBlankTitleIs400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createCard(create("  ", 10L, null)));

        assertEquals(HttpStatus.BAD_REQUEST, statusOf(ex));
        verify(cardRepo, never()).save(any());
    }

    @Test
    void createWithoutColumnIs400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createCard(create("Title", null, null)));

        assertEquals(HttpStatus.BAD_REQUEST, statusOf(ex));
    }

    @Test
    void createInMissingColumnIs404() {
        when(cardRepo.lockColumn(10L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createCard(create("Title", 10L, null)));

        assertEquals(HttpStatus.NOT_FOUND, statusOf(ex));
    }

    // ── Delete ───────────────────────────────────────────────
    @Test
    void deleteChecksEditorAndRemovesCard() {
        Board board = board(1L);
        Card card = card(100L, column(10L, board), 0L);
        when(cardRepo.findByCardId(100L)).thenReturn(card);

        CardResponse res = service.deleteCard(100L);

        verify(access).requireBoardEditor(board);
        verify(cardRepo).delete(card);
        assertEquals(100L, res.getCardId());
    }
}
