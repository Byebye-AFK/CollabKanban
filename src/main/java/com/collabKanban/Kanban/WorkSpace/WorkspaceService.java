package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceService {
    WorkspaceRepo workspaceRepo;

    @Autowired
    private void setWorkspaceRepo(WorkspaceRepo repo){
        workspaceRepo=repo;
    }

    public Workspace createWorkspace(CreateWorkspaceReq req){
        Workspace workspace=new Workspace();
        workspace.setName(req.getName());
        workspaceRepo.save(workspace);

        return workspace;
    }

}
