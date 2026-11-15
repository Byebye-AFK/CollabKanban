package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.CreateTeamReq;
import com.collabKanban.Kanban.Response.TeamResponse;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepo repo;
    private final TeamMemberRepo teamMemberRepo;
    private final WorkspaceRepo workspaceRepo;
    private final WorkspaceAccess access;

    public TeamService(TeamRepo repo, WorkspaceRepo workspaceRepo, TeamMemberRepo teamMemberRepo,
                       WorkspaceAccess access) {
        this.repo = repo;
        this.workspaceRepo = workspaceRepo;
        this.teamMemberRepo = teamMemberRepo;
        this.access = access;
    }

    // ── Creating a team ────────────────────────────────────────
    // Only a workspace's owners and admins may create teams in it. The
    // creator joins as the first member in the same transaction, so the
    // team and its count of 1 are saved together or not at all.
    @Transactional
    public TeamResponse createTeam(CreateTeamReq req) {
        String name = req == null || req.getTeamName() == null ? "" : req.getTeamName().trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Give the team a name");
        }
        if (req.getWorkSpaceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "workSpaceId is required");
        }

        Workspace workspace = workspaceRepo.findById(req.getWorkSpaceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));
        access.requireManager(workspace);
        Users creator = access.currentUser();

        Team team = new Team();
        team.setName(name);
        team.setWorkspaces(workspace);
        team.setCount(1);
        Team saved = repo.save(team);

        TeamMembers member = new TeamMembers();
        member.setTeams(saved);
        member.setMembers(creator);
        teamMemberRepo.save(member);

        TeamResponse res = new TeamResponse();
        res.setTeamId(saved.getTeamId());
        res.setTeamName(saved.getName());
        res.setCount(saved.getCount());
        res.setMembers(List.of());
        return res;
    }
}
