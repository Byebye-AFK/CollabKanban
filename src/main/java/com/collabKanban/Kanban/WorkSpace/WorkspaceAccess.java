package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.Team.TeamMemberRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.authentication.DetailsOfUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumSet;
import java.util.Set;

/**
 * The single place that decides who may read or change what.
 *
 * Every check starts from the caller that JwtFilter put in the
 * SecurityContext, never from an id in the request body, so a client cannot
 * act as someone else by sending a different userId.
 *
 * Policy:
 *  - Reading anything in a workspace needs any membership role.
 *  - Changing boards, columns and cards needs OWNER, ADMIN or MEMBER (VIEWER
 *    is read-only). If the board belongs to a team, a MEMBER must also be on
 *    that team; OWNER and ADMIN can change every board in their workspace.
 *  - Managing people (workspace members, team members) needs OWNER or ADMIN.
 */
@Service
public class WorkspaceAccess {

    public static final Set<Role> ALL_ROLES = EnumSet.allOf(Role.class);
    public static final Set<Role> EDITORS = EnumSet.of(Role.OWNER, Role.ADMIN, Role.MEMBER);
    public static final Set<Role> MANAGERS = EnumSet.of(Role.OWNER, Role.ADMIN);

    private final WorkspaceMemberRepo workspaceMemberRepo;
    private final TeamMemberRepo teamMemberRepo;

    public WorkspaceAccess(WorkspaceMemberRepo workspaceMemberRepo, TeamMemberRepo teamMemberRepo) {
        this.workspaceMemberRepo = workspaceMemberRepo;
        this.teamMemberRepo = teamMemberRepo;
    }

    /** The signed-in caller. 401 if the request carries no valid token. */
    public Users currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof DetailsOfUser details) || details.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again");
        }
        return details.getUser();
    }

    /** The caller's role in the workspace, or 403 if it is not in {@code allowed}. */
    public Role requireRole(Workspace workspace, Set<Role> allowed) {
        if (workspace == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found");
        }
        Role role = workspaceMemberRepo.getRoleOfMember(currentUser(), workspace);
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this workspace");
        }
        if (!allowed.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role in this workspace cannot do that");
        }
        return role;
    }

    public Role requireMember(Workspace workspace) {
        return requireRole(workspace, ALL_ROLES);
    }

    public Role requireManager(Workspace workspace) {
        return requireRole(workspace, MANAGERS);
    }

    /** Any member of the board's workspace may read the board. */
    public void requireBoardReader(Board board) {
        if (board == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found");
        }
        requireMember(board.getWorkspace());
    }

    /** Editors may change a board; on a team board a MEMBER must also be on the team. */
    public void requireBoardEditor(Board board) {
        if (board == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found");
        }
        Role role = requireRole(board.getWorkspace(), EDITORS);
        Team team = board.getTeam();
        if (team == null || MANAGERS.contains(role)) {
            return;
        }
        if (!teamMemberRepo.existsByMembersAndTeams(currentUser(), team)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only members of " + team.getName() + " can change this board");
        }
    }
}
