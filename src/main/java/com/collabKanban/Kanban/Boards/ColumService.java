package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateColumReq;
import com.collabKanban.Kanban.Response.ColumResponse;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ColumService {
    // Gap between neighbouring columns, so a column can later be dropped
    // between two others without renumbering the rest.
    static final long POSITION_STEP = 1000L;

    private final ColumRepo columRepo;
    private final BoardRepo boardRepo;
    private final WorkspaceAccess access;

    public ColumService(ColumRepo columRepo, BoardRepo boardRepo, WorkspaceAccess access) {
        this.columRepo = columRepo;
        this.boardRepo = boardRepo;
        this.access = access;
    }

    // ── Create ───────────────────────────────────────────────────────────
    @Transactional
    public ColumResponse createColum(CreateColumReq req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column details are missing");
        }
        String name = BoardMapper.requireName(req.getName(), "Column name is required");
        if (req.getBoardId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Board is required");
        }
        Board board = boardRepo.findById(req.getBoardId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        access.requireBoardEditor(board);

        Colum colum = new Colum();
        colum.setName(name);
        colum.setBoard(board);
        colum.setPosition(req.getPosition() != null ? req.getPosition() : nextPosition(board));

        // Map the saved entity: the id only exists after save.
        return BoardMapper.toColumResponse(columRepo.save(colum));
    }

    private long nextPosition(Board board) {
        Colum last = columRepo.findTop(board);
        if (last == null || last.getPosition() == null) {
            return POSITION_STEP;
        }
        return last.getPosition() + POSITION_STEP;
    }

    // ── Read ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ColumResponse getColum(Long id) {
        Colum column = requireColumn(id);
        access.requireBoardReader(column.getBoard());
        return BoardMapper.toColumResponse(column);
    }

    // ── Delete ───────────────────────────────────────────────────────────
    // Cascade plus orphan removal delete the column's cards with it.
    @Transactional
    public ColumResponse deleteColum(Long id) {
        Colum column = requireColumn(id);
        access.requireBoardEditor(column.getBoard());

        ColumResponse response = new ColumResponse();
        response.setColumnId(column.getColumnId());
        response.setName(column.getName());
        response.setPosition(column.getPosition());

        columRepo.delete(column);
        return response;
    }

    private Colum requireColumn(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found");
        }
        return columRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found"));
    }
}
