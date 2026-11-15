package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Response.RoleResponse;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceMemberServiceTest {

    @Mock WorkspaceMemberRepo workspaceMemberRepo;
    @Mock WorkspaceRepo workspaceRepo;
    @Mock UserRepo userRepo;
    @Mock WorkspaceAccess access;

    WorkspaceMemberService service;
    Workspace workspace;
    Users invitee;

    @BeforeEach
    void setUp() {
        service = new WorkspaceMemberService(workspaceMemberRepo, userRepo, workspaceRepo, access);
        workspace = new Workspace();
        workspace.setWorkspaceId(1L);
        invitee = new Users();
        invitee.setUserId(9L);
        invitee.setName("Grace");
    }

    @Test
    void managerCanAddAMember() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace)).thenReturn(Role.ADMIN);
        when(userRepo.findById(9L)).thenReturn(Optional.of(invitee));
        when(workspaceMemberRepo.getRoleOfMember(invitee, workspace)).thenReturn(null);

        RoleResponse res = service.addMembership(1L, 9L, Role.MEMBER);

        ArgumentCaptor<WorkspaceMembers> saved = ArgumentCaptor.forClass(WorkspaceMembers.class);
        verify(workspaceMemberRepo).save(saved.capture());
        assertEquals(Role.MEMBER, saved.getValue().getRole());
        assertSame(invitee, saved.getValue().getUser());
        assertEquals(9L, res.getUserId());
        assertEquals(1L, res.getWorkSpaceId());
        assertEquals(Role.MEMBER, res.getRole());
    }

    @Test
    void nonManagerGets403() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role in this workspace cannot do that"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembership(1L, 9L, Role.OWNER));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(workspaceMemberRepo, never()).save(any());
    }

    @Test
    void adminCannotGrantOwner() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace)).thenReturn(Role.ADMIN);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembership(1L, 9L, Role.OWNER));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(workspaceMemberRepo, never()).save(any());
    }

    @Test
    void ownerCanGrantOwner() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace)).thenReturn(Role.OWNER);
        when(userRepo.findById(9L)).thenReturn(Optional.of(invitee));

        RoleResponse res = service.addMembership(1L, 9L, Role.OWNER);

        assertEquals(Role.OWNER, res.getRole());
        verify(workspaceMemberRepo).save(any(WorkspaceMembers.class));
    }

    @Test
    void existingMemberGets409() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace)).thenReturn(Role.OWNER);
        when(userRepo.findById(9L)).thenReturn(Optional.of(invitee));
        when(workspaceMemberRepo.getRoleOfMember(invitee, workspace)).thenReturn(Role.VIEWER);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembership(1L, 9L, Role.MEMBER));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertEquals("Grace is already a member of this workspace", ex.getReason());
        verify(workspaceMemberRepo, never()).save(any());
    }

    @Test
    void missingRoleGets400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembership(1L, 9L, null));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(workspaceRepo, access);
    }

    @Test
    void missingWorkspaceGets404() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembership(1L, 9L, Role.MEMBER));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("Workspace not found", ex.getReason());
    }

    @Test
    void missingUserGets404() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace)).thenReturn(Role.OWNER);
        when(userRepo.findById(9L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembership(1L, 9L, Role.MEMBER));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("User not found", ex.getReason());
    }
}
