package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.CreateTeamReq;
import com.collabKanban.Kanban.Response.TeamResponse;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Role;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
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
class TeamServiceTest {

    @Mock TeamRepo repo;
    @Mock TeamMemberRepo teamMemberRepo;
    @Mock WorkspaceRepo workspaceRepo;
    @Mock WorkspaceAccess access;

    TeamService service;
    Workspace workspace;

    @BeforeEach
    void setUp() {
        service = new TeamService(repo, workspaceRepo, teamMemberRepo, access);
        workspace = new Workspace();
        workspace.setWorkspaceId(1L);
    }

    private static CreateTeamReq req(String name, Long workspaceId) {
        CreateTeamReq req = new CreateTeamReq();
        req.setTeamName(name);
        req.setWorkSpaceId(workspaceId);
        return req;
    }

    @Test
    void managerCreatesATeamAndJoinsIt() {
        Users creator = new Users();
        creator.setUserId(7L);
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace)).thenReturn(Role.OWNER);
        when(access.currentUser()).thenReturn(creator);
        when(repo.save(any(Team.class))).thenAnswer(inv -> {
            Team t = inv.getArgument(0);
            t.setTeamId(5L);
            return t;
        });

        TeamResponse res = service.createTeam(req(" Platform ", 1L));

        ArgumentCaptor<TeamMembers> member = ArgumentCaptor.forClass(TeamMembers.class);
        verify(teamMemberRepo).save(member.capture());
        assertSame(creator, member.getValue().getMembers());
        assertEquals(5L, member.getValue().getTeams().getTeamId());
        assertEquals(5L, res.getTeamId());
        assertEquals("Platform", res.getTeamName());
        assertEquals(1, res.getCount());
    }

    @Test
    void nonManagerCannotCreateATeam() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.of(workspace));
        when(access.requireManager(workspace))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role in this workspace cannot do that"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createTeam(req("Platform", 1L)));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(repo, never()).save(any());
        verify(teamMemberRepo, never()).save(any());
    }

    @Test
    void blankNameGets400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createTeam(req("  ", 1L)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(workspaceRepo, repo, access);
    }

    @Test
    void missingWorkspaceGets404() {
        when(workspaceRepo.findById(1L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createTeam(req("Platform", 1L)));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }
}
