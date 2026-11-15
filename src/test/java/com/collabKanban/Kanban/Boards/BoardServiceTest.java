package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.Response.ColumResponse;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.Team.TeamRepo;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.collabKanban.Kanban.Boards.BoardFixtures.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

    @Mock WorkspaceRepo workspaceRepo;
    @Mock BoardRepo boardRepo;
    @Mock TeamRepo teamRepo;
    @Mock WorkspaceAccess access;

    BoardService service;

    @BeforeEach
    void setUp() {
        service = new BoardService(workspaceRepo, boardRepo, teamRepo, access);
    }

    private static CreateBoardReq boardReq(String name, Long workspaceId, Long teamId) {
        CreateBoardReq req = new CreateBoardReq();
        req.setName(name);
        req.setWorkspaceId(workspaceId);
        req.setTeamId(teamId);
        req.setPosition(3L);
        return req;
    }

    @Test
    void findBoardsReturns404ForUnknownBoard() {
        when(boardRepo.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.findBoards(99L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("Board not found", ex.getReason());
        verifyNoInteractions(access);
    }

    @Test
    void findBoardsChecksReadAccessAndSortsColumnsAndCardsByPosition() {
        Board board = board(1L, workspace(5L));
        board.setPosition(2L);
        Colum second = column(11L, 2000L, board,
                card(103L, null, null), card(101L, 200L, null), card(102L, 100L, null));
        Colum unpositioned = column(10L, null, board);
        Colum first = column(12L, 1000L, board);
        board.setColumns(new ArrayList<>(List.of(second, unpositioned, first)));
        when(boardRepo.findById(1L)).thenReturn(Optional.of(board));

        BoardResponse response = service.findBoards(1L);

        verify(access).requireBoardReader(board);
        assertEquals(List.of(12L, 11L, 10L), response.getColumns().stream().map(ColumResponse::getColumnId).toList());
        assertEquals(List.of(1000L, 2000L), response.getColumns().subList(0, 2).stream().map(ColumResponse::getPosition).toList());
        assertEquals(List.of(102L, 101L, 103L),
                response.getColumns().get(1).getCards().stream().map(CardResponse::getCardId).toList());
        assertEquals(2L, response.getPosition());
    }

    @Test
    void findBoardsPropagatesAccessDenial() {
        Board board = board(1L, workspace(5L));
        when(boardRepo.findById(1L)).thenReturn(Optional.of(board));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(access).requireBoardReader(board);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.findBoards(1L));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void toResponseHandlesBoardWithoutTeamAndUnassignedCard() {
        Board board = board(1L, workspace(5L));
        Colum column = column(10L, 1000L, board, card(100L, 1000L, null), card(101L, 2000L, user(7L)));
        board.setColumns(new ArrayList<>(List.of(column)));

        BoardResponse response = service.toResponse(board);

        assertNull(response.getTeamId());
        assertEquals("Board 1", response.getName());
        List<CardResponse> cards = response.getColumns().get(0).getCards();
        assertNull(cards.get(0).getAssignedTo());
        assertEquals(1000L, cards.get(0).getVersion());
        assertEquals("Description 100", cards.get(0).getDescription());
        assertEquals(7L, cards.get(1).getAssignedTo());
        verifyNoInteractions(access, boardRepo);
    }

    @Test
    void createBoardRejectsTeamFromAnotherWorkspace() {
        Workspace workspace = workspace(5L);
        Team foreignTeam = team(8L, workspace(6L));
        when(workspaceRepo.findById(5L)).thenReturn(Optional.of(workspace));
        when(teamRepo.findById(8L)).thenReturn(Optional.of(foreignTeam));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createBoard(boardReq("Roadmap", 5L, 8L)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("That team belongs to another workspace", ex.getReason());
        verify(boardRepo, never()).save(any());
    }

    @Test
    void createBoardReturns404ForUnknownTeam() {
        when(workspaceRepo.findById(5L)).thenReturn(Optional.of(workspace(5L)));
        when(teamRepo.findById(8L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createBoard(boardReq("Roadmap", 5L, 8L)));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void createBoardReturns404ForUnknownWorkspace() {
        when(workspaceRepo.findById(5L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createBoard(boardReq("Roadmap", 5L, null)));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verifyNoInteractions(access);
    }

    @Test
    void createBoardRejectsBlankName() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createBoard(boardReq("   ", 5L, null)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(workspaceRepo, boardRepo);
    }

    @Test
    void createBoardRequiresEditorAndReturnsSavedBoardWithEmptyColumns() {
        Workspace workspace = workspace(5L);
        Team team = team(8L, workspace(5L));
        when(workspaceRepo.findById(5L)).thenReturn(Optional.of(workspace));
        when(teamRepo.findById(8L)).thenReturn(Optional.of(team));
        when(boardRepo.save(any(Board.class))).thenAnswer(inv -> {
            Board saved = inv.getArgument(0);
            saved.setBoardId(42L);
            return saved;
        });

        BoardResponse response = service.createBoard(boardReq(" Roadmap ", 5L, 8L));

        verify(access).requireRole(workspace, WorkspaceAccess.EDITORS);
        assertEquals(42L, response.getBoardId());
        assertEquals("Roadmap", response.getName());
        assertEquals(8L, response.getTeamId());
        assertEquals(3L, response.getPosition());
        assertTrue(response.getColumns().isEmpty());
    }
}
