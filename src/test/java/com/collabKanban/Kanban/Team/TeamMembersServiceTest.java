package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Role;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMemberRepo;
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
class TeamMembersServiceTest {

    @Mock TeamMemberRepo repo;
    @Mock TeamRepo teamRepo;
    @Mock UserRepo userRepo;
    @Mock WorkspaceMemberRepo workspaceMemberRepo;
    @Mock WorkspaceAccess access;

    TeamMembersService service;
    Workspace workspace;
    Team team;
    Users user;

    @BeforeEach
    void setUp() {
        service = new TeamMembersService(repo, teamRepo, userRepo, workspaceMemberRepo, access);
        workspace = new Workspace();
        workspace.setWorkspaceId(1L);
        team = new Team();
        team.setTeamId(5L);
        team.setName("Platform");
        team.setCount(3);
        team.setWorkspaces(workspace);
        user = new Users();
        user.setUserId(9L);
        user.setName("Grace");
    }

    private static TeamMemberCreateReq req(Long userId, Long teamId) {
        TeamMemberCreateReq req = new TeamMemberCreateReq();
        req.setUserId(userId);
        req.setTeamId(teamId);
        return req;
    }

    @Test
    void removeMembersDeletesAndRecomputesTheCount() {
        when(teamRepo.findByteamId(5L)).thenReturn(team);
        when(userRepo.findByuserId(9L)).thenReturn(user);
        when(access.requireManager(workspace)).thenReturn(Role.ADMIN);
        when(repo.existsByMembersAndTeams(user, team)).thenReturn(true);
        when(repo.findByteams(team)).thenReturn(List.of(new TeamMembers(), new TeamMembers()));

        TeamMemberRes res = service.removeMembers(req(9L, 5L));

        verify(teamRepo).deleteByUserandTeam(user, team);
        ArgumentCaptor<Team> saved = ArgumentCaptor.forClass(Team.class);
        verify(teamRepo).save(saved.capture());
        assertEquals(2, saved.getValue().getCount());
        assertEquals(9L, res.getUserId());
        assertEquals(5L, res.getTeamId());
    }

    @Test
    void removeMembersRequiresAManager() {
        when(teamRepo.findByteamId(5L)).thenReturn(team);
        when(userRepo.findByuserId(9L)).thenReturn(user);
        when(access.requireManager(workspace))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role in this workspace cannot do that"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.removeMembers(req(9L, 5L)));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(teamRepo, never()).deleteByUserandTeam(any(), any());
        verify(teamRepo, never()).save(any());
    }

    @Test
    void removeMembersGives404WhenTheUserIsNotOnTheTeam() {
        when(teamRepo.findByteamId(5L)).thenReturn(team);
        when(userRepo.findByuserId(9L)).thenReturn(user);
        when(access.requireManager(workspace)).thenReturn(Role.OWNER);
        when(repo.existsByMembersAndTeams(user, team)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.removeMembers(req(9L, 5L)));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("Grace is not on Platform", ex.getReason());
        verify(teamRepo, never()).deleteByUserandTeam(any(), any());
    }

    @Test
    void removeMembersGives400WithoutIds() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.removeMembers(req(null, 5L)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(teamRepo, userRepo, access);
    }

    @Test
    void removeMembersGives404ForAMissingTeam() {
        when(teamRepo.findByteamId(5L)).thenReturn(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.removeMembers(req(9L, 5L)));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("Team not found", ex.getReason());
    }

    @Test
    void addMembersRequiresAManager() {
        when(teamRepo.findByteamId(5L)).thenReturn(team);
        when(access.requireManager(workspace))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role in this workspace cannot do that"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addMembers(req(9L, 5L)));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(repo, never()).save(any());
    }

    @Test
    void addMembersSavesAndRecomputesTheCount() {
        when(teamRepo.findByteamId(5L)).thenReturn(team);
        when(access.requireManager(workspace)).thenReturn(Role.OWNER);
        when(userRepo.findByuserId(9L)).thenReturn(user);
        when(workspaceMemberRepo.getRoleOfMember(user, workspace)).thenReturn(Role.MEMBER);
        when(repo.existsByMembersAndTeams(user, team)).thenReturn(false);
        when(repo.findByteams(team)).thenReturn(List.of(new TeamMembers(), new TeamMembers(),
                new TeamMembers(), new TeamMembers()));

        service.addMembers(req(9L, 5L));

        verify(repo).save(any(TeamMembers.class));
        assertEquals(4, team.getCount());
    }
}
