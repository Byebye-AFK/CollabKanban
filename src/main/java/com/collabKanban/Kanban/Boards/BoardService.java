package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.Response.ColumResponse;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

import static java.util.stream.Collectors.toList;

@Service

public class BoardService {
    WorkspaceRepo workspaceRepo;
    BoardRepo boardRepo;
    ColumRepo columRepo;


    @Autowired
    public void workspaceSetter(WorkspaceRepo workspaceRepo){
        this.workspaceRepo=workspaceRepo;
    }

    @Autowired
    private void setBoardRepo(BoardRepo repo){
        boardRepo=repo;
    }

    @Autowired
    private void setColumRepo(ColumRepo repo){ columRepo=repo; }

    public Board createBoard(CreateBoardReq req){
        Board board=new Board();
        Workspace workspace=workspaceRepo.getReferenceById(req.getWorkspaceId());
        board.setPosition(req.getPosition());
        board.setName(req.getName());
        board.setWorkspace(workspace);
        boardRepo.save(board);
        return board;
    }


    public BoardResponse findBoards(Long boardId){
        System.out.println("FindBoards of called");
        Board board=boardRepo.findBoard(boardId);


        List<ColumResponse> columns =
                board.getColumns()
                        .stream()
                        .map(column -> {

                            ColumResponse response=new ColumResponse();
                            response.setColumnId(column.getColumnId());
                            List<CardResponse> cards=column.getCards().stream().map(card -> {CardResponse response1=new CardResponse();
                                response1.setCardId(card.getCardId());
                                response1.setTitle(card.getTitle());
                                response1.setDescription(card.getDescription());
                                response1.setPosition(card.getPosition());
                                return response1;
                            } ).toList();
                            response.setCards(cards);
                            response.setName(column.getName());

                            return response;
                        })
                        .toList();
        BoardResponse response=new BoardResponse();

        response.setBoardId(boardId);
        response.setColumns(columns);
        response.setName(board.getName());

        return response;
    }

}
