package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Boards.BoardService;
import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Response.TeamResponse;
import com.collabKanban.Kanban.Response.UserResponse;
import com.collabKanban.Kanban.Response.WorkSpaceResponse;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class WorkspaceService {

    private final WorkspaceRepo workspaceRepo;
    private final WorkspaceMemberRepo workspaceMemberRepo;
    private final BoardService boardService;
    private final WorkspaceAccess access;

    public WorkspaceService(WorkspaceRepo workspaceRepo, WorkspaceMemberRepo workspaceMemberRepo,
                            BoardService boardService, WorkspaceAccess access) {
        this.workspaceRepo = workspaceRepo;
        this.workspaceMemberRepo = workspaceMemberRepo;
        this.boardService = boardService;
        this.access = access;
    }

    // ── Creating a workspace ───────────────────────────────────
    // The creator becomes its OWNER in the same transaction, otherwise
    // nobody could ever see or manage the new workspace. A DTO is
    // returned rather than the entity, whose members relation points
    // back at the workspace and would recurse when serialised.
    @Transactional
    public WorkSpaceResponse createWorkspace(CreateWorkspaceReq req) {
        String name = req == null || req.getName() == null ? "" : req.getName().trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Give the workspace a name");
        }
        Users creator = access.currentUser();

        Workspace workspace = new Workspace();
        workspace.setName(name);
        Workspace saved = workspaceRepo.save(workspace);

        WorkspaceMembers owner = new WorkspaceMembers();
        owner.setWorkspace(saved);
        owner.setUser(creator);
        owner.setRole(Role.OWNER);
        workspaceMemberRepo.save(owner);

        WorkSpaceResponse response = new WorkSpaceResponse();
        response.setWorkSpaceId(saved.getWorkspaceId());
        response.setName(saved.getName());
        response.setRole(Role.OWNER);
        response.setBoards(List.of());
        response.setTeams(List.of());
        response.setMembers(List.of());
        return response;
    }

    // ── The caller's workspaces ────────────────────────────────
    // One read-only transaction so the lazy boards/teams collections load
    // in a single session. Boards are mapped from the already-loaded
    // entities instead of being re-fetched one by one.
    @Transactional(readOnly = true)
    public List<WorkSpaceResponse> getMyWorkspaces() {
        Users user = access.currentUser();
        return workspaceMemberRepo.findWorkspacesUserBelong(user).stream()
                .map(workspace -> toWorkspaceResponse(workspace, user))
                .toList();
    }

    private WorkSpaceResponse toWorkspaceResponse(Workspace workspace, Users user) {
        WorkSpaceResponse response = new WorkSpaceResponse();
        response.setWorkSpaceId(workspace.getWorkspaceId());
        response.setName(workspace.getName());
        response.setRole(workspaceMemberRepo.getRoleOfMember(user, workspace));

        List<BoardResponse> boards = workspace.getBoards().stream()
                .map(boardService::toResponse)
                .toList();
        response.setBoards(boards);

        List<UserResponse> members = workspaceMemberRepo.findMembersnWorkspaceExceptUser(workspace, user).stream()
                .map(this::toUserResponse)
                .toList();
        response.setMembers(members);

        List<TeamResponse> teams = workspace.getTeamsBworkspace().stream()
                .map(this::toTeamResponse)
                .toList();
        response.setTeams(teams);
        return response;
    }

    private TeamResponse toTeamResponse(Team team) {
        TeamResponse response = new TeamResponse();
        response.setTeamId(team.getTeamId());
        response.setTeamName(team.getName());
        response.setCount(team.getCount());
        response.setMembers(team.getTeamMembers().stream()
                .map(teamMember -> toUserResponse(teamMember.getMembers()))
                .toList());
        return response;
    }

    private UserResponse toUserResponse(Users member) {
        UserResponse response = new UserResponse();
        response.setUserId(member.getUserId());
        response.setUserName(member.getName());
        response.setUserEmail(member.getEmail());
        return response;
    }
}
