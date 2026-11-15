package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import com.collabKanban.Kanban.Response.WorkSpaceResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// The caller comes from the SecurityContext (see WorkspaceAccess), so
// neither endpoint reads the Authorization header itself. Failures are
// ResponseStatusExceptions thrown by the service.
@RestController
@RequestMapping("workspace")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping("/create")
    public ResponseEntity<WorkSpaceResponse> createsWorkspace(@RequestBody CreateWorkspaceReq req) {
        return ResponseEntity.ok(workspaceService.createWorkspace(req));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<WorkSpaceResponse>> getWorkspace() {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces());
    }
}
