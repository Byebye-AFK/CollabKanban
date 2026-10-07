package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.Response.ColumResponse;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.Team.TeamRepo;
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
    TeamRepo teamRepo;


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

    @Autowired
    private void setTeamRepo(TeamRepo repo){ teamRepo=repo; }

    public BoardResponse createBoard(CreateBoardReq req){
        Board board=new Board();
        BoardResponse response=new BoardResponse();
        Workspace workspace=workspaceRepo.getReferenceById(req.getWorkspaceId());

        board.setPosition(req.getPosition());
        board.setName(req.getName());
        board.setWorkspace(workspace);
        if (req.getTeamId() != null) {
            board.setTeam(teamRepo.getReferenceById(req.getTeamId()));
        }
        boardRepo.save(board);

        response.setBoardId(board.getBoardId());
        response.setName(board.getName());
        response.setTeamId(req.getTeamId());
        response.setColumns( board.getColumns().stream().map( colum ->{ ColumResponse columnRes=new ColumResponse();
                                                                            columnRes.setColumnId(colum.getColumnId());
                                                                            columnRes.setName(colum.getName());
                                                                            columnRes.setCards(colum.getCards().stream().map(card -> { CardResponse res=new CardResponse();
                                                                                        res.setTitle(card.getTitle());
                                                                                        res.setDescription(card.getTitle());
                                                                                        res.setPosition(card.getPosition());
                                                                                        res.setCardId(card.getCardId());
                                                                                        res.setAssignedTo(card.getAssignedTo().getUserId());
                                                                                        return  res;
                                                                                        }).toList());
                                                             return columnRes;  })
                                                             .toList() );

            return response;
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
        Team team=board.getTeam();
        response.setTeamId(team == null ? null : team.getTeamId());

        return response;
    }

}
