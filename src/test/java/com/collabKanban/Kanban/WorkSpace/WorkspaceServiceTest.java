package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Boards.BoardService;
import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import com.collabKanban.Kanban.Response.WorkSpaceResponse;
import com.collabKanban.Kanban.UserSpace.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock WorkspaceRepo workspaceRepo;
    @Mock WorkspaceMemberRepo workspaceMemberRepo;
    @Mock BoardService boardService;
    @Mock WorkspaceAccess access;

    WorkspaceService service;
    Users caller;

    @BeforeEach
    void setUp() {
        service = new WorkspaceService(workspaceRepo, workspaceMemberRepo, boardService, access);
        caller = new Users();
        caller.setUserId(7L);
        caller.setName("Ada");
    }

    private static CreateWorkspaceReq req(String name) {
        CreateWorkspaceReq req = new CreateWorkspaceReq();
        req.setName(name);
        return req;
    }

    @Test
    void createWorkspaceMakesTheCreatorItsOwner() {
        when(access.currentUser()).thenReturn(caller);
        when(workspaceRepo.save(any(Workspace.class))).thenAnswer(inv -> {
            Workspace w = inv.getArgument(0);
            w.setWorkspaceId(42L);
            return w;
        });

        WorkSpaceResponse res = service.createWorkspace(req("  Product  "));

        ArgumentCaptor<WorkspaceMembers> member = ArgumentCaptor.forClass(WorkspaceMembers.class);
        verify(workspaceMemberRepo).save(member.capture());
        assertSame(caller, member.getValue().getUser());
        assertEquals(Role.OWNER, member.getValue().getRole());
        assertEquals(42L, member.getValue().getWorkspace().getWorkspaceId());

        assertEquals(42L, res.getWorkSpaceId());
        assertEquals("Product", res.getName());
        assertEquals(Role.OWNER, res.getRole());
        assertEquals(List.of(), res.getBoards());
        assertEquals(List.of(), res.getTeams());
        assertEquals(List.of(), res.getMembers());
    }

    @Test
    void createWorkspaceRejectsABlankName() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createWorkspace(req("   ")));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(workspaceRepo, workspaceMemberRepo);
    }

    @Test
    void getMyWorkspacesFailsWith401WhenTheCallerIsUnknown() {
        when(access.currentUser()).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getMyWorkspaces());

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verifyNoInteractions(workspaceMemberRepo);
    }
}
