package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateColumReq;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.Response.ColumResponse;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static com.collabKanban.Kanban.Boards.BoardFixtures.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ColumServiceTest {

    @Mock ColumRepo columRepo;
    @Mock BoardRepo boardRepo;
    @Mock WorkspaceAccess access;

    ColumService service;
    Board board;

    @BeforeEach
    void setUp() {
        service = new ColumService(columRepo, boardRepo, access);
        board = board(1L, workspace(5L));
    }

    private static CreateColumReq columReq(String name, Long boardId, Long position) {
        CreateColumReq req = new CreateColumReq();
        req.setName(name);
        req.setBoardId(boardId);
        req.setPosition(position);
        return req;
    }

    private void saveAssignsId(long id) {
        when(columRepo.save(any(Colum.class))).thenAnswer(inv -> {
            Colum saved = inv.getArgument(0);
            saved.setColumnId(id);
            return saved;
        });
    }

    private Colum savedColumn() {
        ArgumentCaptor<Colum> captor = ArgumentCaptor.forClass(Colum.class);
        verify(columRepo).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void createColumReturnsTheSavedId() {
        when(boardRepo.findById(1L)).thenReturn(Optional.of(board));
        when(columRepo.findTop(board)).thenReturn(column(9L, 3000L, board));
        saveAssignsId(77L);

        ColumResponse response = service.createColum(columReq("Todo", 1L, null));

        verify(access).requireBoardEditor(board);
        assertEquals(77L, response.getColumnId());
        assertEquals("Todo", response.getName());
        assertEquals(4000L, response.getPosition());
        assertTrue(response.getCards().isEmpty());
    }

    @Test
    void createColumHonorsClientPosition() {
        when(boardRepo.findById(1L)).thenReturn(Optional.of(board));
        saveAssignsId(78L);

        ColumResponse response = service.createColum(columReq("Doing", 1L, 1500L));

        assertEquals(1500L, response.getPosition());
        assertEquals(1500L, savedColumn().getPosition());
        verify(columRepo, never()).findTop(any());
    }

    @Test
    void createColumUses1000ForAnEmptyBoard() {
        when(boardRepo.findById(1L)).thenReturn(Optional.of(board));
        when(columRepo.findTop(board)).thenReturn(null);
        saveAssignsId(79L);

        ColumResponse response = service.createColum(columReq("Backlog", 1L, null));

        assertEquals(1000L, response.getPosition());
        assertSame(board, savedColumn().getBoard());
    }

    @Test
    void createColumReturns404ForUnknownBoard() {
        when(boardRepo.findById(1L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createColum(columReq("Todo", 1L, null)));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(columRepo, never()).save(any());
    }

    @Test
    void createColumRejectsBlankName() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createColum(columReq(" ", 1L, null)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(boardRepo, columRepo);
    }

    @Test
    void createColumPropagatesEditorDenial() {
        when(boardRepo.findById(1L)).thenReturn(Optional.of(board));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(access).requireBoardEditor(board);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createColum(columReq("Todo", 1L, null)));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(columRepo, never()).save(any());
    }

    @Test
    void getColumChecksReadAccessAndSortsCards() {
        Colum column = column(10L, 1000L, board,
                card(3L, 300L, null), card(1L, 100L, user(4L)), card(2L, 100L, null));
        when(columRepo.findById(10L)).thenReturn(Optional.of(column));

        ColumResponse response = service.getColum(10L);

        verify(access).requireBoardReader(board);
        assertEquals(List.of(1L, 2L, 3L), response.getCards().stream().map(CardResponse::getCardId).toList());
        assertEquals(4L, response.getCards().get(0).getAssignedTo());
        assertNull(response.getCards().get(1).getAssignedTo());
    }

    @Test
    void getColumReturns404ForUnknownColumn() {
        when(columRepo.findById(10L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getColum(10L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void deleteColumRequiresEditorAndDeletes() {
        Colum column = column(10L, 1000L, board);
        when(columRepo.findById(10L)).thenReturn(Optional.of(column));

        ColumResponse response = service.deleteColum(10L);

        verify(access).requireBoardEditor(board);
        verify(columRepo).delete(column);
        assertEquals(10L, response.getColumnId());
    }

    @Test
    void deleteColumReturns404ForUnknownColumn() {
        when(columRepo.findById(10L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.deleteColum(10L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(columRepo, never()).delete(any());
    }
}
