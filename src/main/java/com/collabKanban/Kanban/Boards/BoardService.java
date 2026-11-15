package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.Team.TeamRepo;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

@Service
public class BoardService {
    private final WorkspaceRepo workspaceRepo;
    private final BoardRepo boardRepo;
    private final TeamRepo teamRepo;
    private final WorkspaceAccess access;

    public BoardService(WorkspaceRepo workspaceRepo, BoardRepo boardRepo, TeamRepo teamRepo, WorkspaceAccess access) {
        this.workspaceRepo = workspaceRepo;
        this.boardRepo = boardRepo;
        this.teamRepo = teamRepo;
        this.access = access;
    }

    // ── Create ───────────────────────────────────────────────────────────
    // Only editors of the workspace may add a board. A team, when given, must
    // live in the same workspace, otherwise the board would leak across them.
    @Transactional
    public BoardResponse createBoard(CreateBoardReq req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Board details are missing");
        }
        String name = BoardMapper.requireName(req.getName(), "Board name is required");
        if (req.getWorkspaceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace is required");
        }
        Workspace workspace = workspaceRepo.findById(req.getWorkspaceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));
        access.requireRole(workspace, WorkspaceAccess.EDITORS);

        Board board = new Board();
        board.setName(name);
        board.setPosition(req.getPosition());
        board.setWorkspace(workspace);
        if (req.getTeamId() != null) {
            board.setTeam(requireTeamIn(req.getTeamId(), workspace));
        }

        // A new board has no columns, so this maps to an empty columns list.
        return toResponse(boardRepo.save(board));
    }

    private Team requireTeamIn(Long teamId, Workspace workspace) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        Workspace teamWorkspace = team.getWorkspaces();
        if (teamWorkspace == null || !Objects.equals(teamWorkspace.getWorkspaceId(), workspace.getWorkspaceId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That team belongs to another workspace");
        }
        return team;
    }

    // ── Read ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public BoardResponse findBoards(Long boardId) {
        if (boardId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found");
        }
        Board board = boardRepo.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        access.requireBoardReader(board);
        return toResponse(board);
    }

    /**
     * Maps an already-loaded board, with columns and cards sorted by position.
     * No access check and no query: callers that already checked access (for
     * example a workspace listing) use this to avoid one lookup per board.
     */
    @Transactional(readOnly = true)
    public BoardResponse toResponse(Board board) {
        return BoardMapper.toBoardResponse(board);
    }
}
