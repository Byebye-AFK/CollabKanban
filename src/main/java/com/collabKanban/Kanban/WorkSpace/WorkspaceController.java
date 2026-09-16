package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import com.collabKanban.Kanban.Response.WorkSpaceResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/mine/{token}")
    public ResponseEntity<List<WorkSpaceResponse>> getWorkspace(@PathVariable String token){

        System.out.println("Gettig Workspace of the user ");

       List<WorkSpaceResponse> response=workspaceService.getMyWorkspaces(token);


       if (response!=null){

           return  new ResponseEntity<>(response,HttpStatus.OK);

       }

       return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);


    }

}
