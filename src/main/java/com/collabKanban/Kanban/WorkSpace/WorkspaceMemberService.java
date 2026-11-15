package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Response.RoleResponse;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkspaceMemberService {

    private final WorkspaceMemberRepo workspaceMemberRepo;
    private final WorkspaceRepo workspaceRepo;
    private final UserRepo userRepo;
    private final WorkspaceAccess access;

    public WorkspaceMemberService(WorkspaceMemberRepo workspaceMemberRepo, UserRepo userRepo,
                                  WorkspaceRepo workspaceRepo, WorkspaceAccess access) {
        this.workspaceMemberRepo = workspaceMemberRepo;
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.access = access;
    }

    // ── Granting a membership ──────────────────────────────────
    // Only owners and admins may add people, and only an owner may make
    // another owner, so nobody can promote themselves past their role.
    // The duplicate pre-check gives a clear 409; the table's unique
    // constraint stays as the backstop for a concurrent request.
    @Transactional
    public RoleResponse addMembership(Long workSpaceId, Long userId, Role role) {
        if (workSpaceId == null || userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "workSpaceId and userId are required");
        }
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }

        Workspace workspace = workspaceRepo.findById(workSpaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));

        Role callerRole = access.requireManager(workspace);
        if (role == Role.OWNER && callerRole != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an owner can make someone an owner");
        }

        Users user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (workspaceMemberRepo.getRoleOfMember(user, workspace) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    user.getName() + " is already a member of this workspace");
        }

        WorkspaceMembers member = new WorkspaceMembers();
        member.setWorkspace(workspace);
        member.setUser(user);
        member.setRole(role);
        workspaceMemberRepo.save(member);

        return new RoleResponse(user.getUserId(), workspace.getWorkspaceId(), role);
    }
}
