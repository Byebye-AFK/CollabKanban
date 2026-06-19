package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@CrossOrigin("http://localhost:5173")
@RestController
@RequestMapping("board")
public class BoardController {
    BoardService boardService;

    @Autowired
    private void boardService(BoardService service){
        boardService=service;
    }

    @PostMapping("/create")
    public ResponseEntity<Board> createsBoard(@RequestBody CreateBoardReq req){
        Board board= boardService.createBoard(req);
        if(board!=null){
            return  new ResponseEntity<>(board,HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardResponse> getBoards(@PathVariable Long id){
        BoardResponse response=boardService.findBoards(id);

        if(response!=null){
            return  new ResponseEntity<>(response,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

}
