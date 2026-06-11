package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("workspace")
public class WorkspaceController {
    WorkspaceService workspaceService;

    @Autowired
    private void setWorkspaceService( WorkspaceService service ){
        workspaceService=service;
    }

    @PostMapping("/create")
    public ResponseEntity<Workspace> createsWorkspace( @RequestBody CreateWorkspaceReq req ){
        Workspace workspace= workspaceService.createWorkspace(req);

        if(workspace!=null){
            return new ResponseEntity<>(workspace, HttpStatus.OK);

        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

    }

}
