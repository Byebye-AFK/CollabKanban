package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Failures are ResponseStatusExceptions thrown by BoardService (400/403/404),
// so every handler here simply returns 200 with the body.
@RestController
@RequestMapping("board")
public class BoardController {
    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @PostMapping("/create")
    public ResponseEntity<BoardResponse> createsBoard(@RequestBody CreateBoardReq req) {
        return ResponseEntity.ok(boardService.createBoard(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardResponse> getBoards(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.findBoards(id));
    }
}
