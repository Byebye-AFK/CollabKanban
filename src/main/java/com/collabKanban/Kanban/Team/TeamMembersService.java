package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMemberRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TeamMembersService {

    private final UserRepo userRepo;
    private final TeamRepo teamRepo;
    private final TeamMemberRepo repo;
    private final WorkspaceMemberRepo workspaceMemberRepo;
    private final WorkspaceAccess access;

    public TeamMembersService(TeamMemberRepo repo, TeamRepo teamRepo, UserRepo userRepo,
                              WorkspaceMemberRepo workspaceMemberRepo, WorkspaceAccess access) {
        this.repo = repo;
        this.teamRepo = teamRepo;
        this.userRepo = userRepo;
        this.workspaceMemberRepo = workspaceMemberRepo;
        this.access = access;
    }

    // ── Adding a team member ───────────────────────────────────
    // Only the workspace's owners and admins may change who is on its
    // teams, and only people already in the workspace can join a team.
    @Transactional
    public TeamMemberRes addMembers(TeamMemberCreateReq req) {
        requireIds(req);
        Team team = findTeam(req.getTeamId());
        Workspace workspace = workspaceOf(team);
        access.requireManager(workspace);

        Users user = findUser(req.getUserId());
        if (workspaceMemberRepo.getRoleOfMember(user, workspace) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, user.getName() + " is not a member of this workspace");
        }
        if (repo.existsByMembersAndTeams(user, team)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, user.getName() + " is already on " + team.getName());
        }

        TeamMembers newMember = new TeamMembers();
        newMember.setMembers(user);
        newMember.setTeams(team);
        repo.save(newMember);

        team.setCount(repo.findByteams(team).size());
        teamRepo.save(team);

        return toRes(user.getUserId(), team.getTeamId());
    }

    // ── Removing a team member ─────────────────────────────────
    // Same manager rule as adding. The count is recomputed from the rows
    // that remain so it can never drift from the real membership.
    @Transactional
    public TeamMemberRes removeMembers(TeamMemberCreateReq req) {
        requireIds(req);
        Team team = findTeam(req.getTeamId());
        Users user = findUser(req.getUserId());
        access.requireManager(workspaceOf(team));

        if (!repo.existsByMembersAndTeams(user, team)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, user.getName() + " is not on " + team.getName());
        }

        // The bulk delete clears the persistence context, so the team is
        // re-read before its count is written back.
        teamRepo.deleteByUserandTeam(user, team);
        int remaining = repo.findByteams(team).size();
        Team fresh = findTeam(req.getTeamId());
        fresh.setCount(remaining);
        teamRepo.save(fresh);

        return toRes(user.getUserId(), fresh.getTeamId());
    }

    // ── Helpers ────────────────────────────────────────────────

    private static void requireIds(TeamMemberCreateReq req) {
        if (req == null || req.getUserId() == null || req.getTeamId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId and teamId are required");
        }
    }

    private Team findTeam(Long teamId) {
        Team team = teamRepo.findByteamId(teamId);
        if (team == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
        }
        return team;
    }

    private Users findUser(Long userId) {
        Users user = userRepo.findByuserId(userId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return user;
    }

    private static Workspace workspaceOf(Team team) {
        Workspace workspace = team.getWorkspaces();
        if (workspace == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team is not attached to a workspace");
        }
        return workspace;
    }

    private static TeamMemberRes toRes(Long userId, Long teamId) {
        TeamMemberRes res = new TeamMemberRes();
        res.setUserId(userId);
        res.setTeamId(teamId);
        return res;
    }
}
