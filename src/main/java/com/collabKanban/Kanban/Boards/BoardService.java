package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateBoardReq;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service

public class BoardService {
    WorkspaceRepo workspaceRepo;
    BoardRepo boardRepo;

    @Autowired
    public void workspaceSetter(WorkspaceRepo workspaceRepo){
        this.workspaceRepo=workspaceRepo;
    }

    @Autowired
    private void setBoardRepo(BoardRepo repo){
        boardRepo=repo;
    }

    public Board createBoard(CreateBoardReq req){
        Board board=new Board();
        Workspace workspace=workspaceRepo.getReferenceById(req.getWorkspaceId());
        board.setPosition(req.getPosition());
        board.setName(req.getName());
        board.setWorkspace(workspace);
        boardRepo.save(board);
        return board;
    }

}
