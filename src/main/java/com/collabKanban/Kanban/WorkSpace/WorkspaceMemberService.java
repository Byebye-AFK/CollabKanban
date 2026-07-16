package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Response.RoleResponse;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceMemberService {

     private final WorkspaceMemberRepo workspaceMemberRepo;
     private final WorkspaceRepo workspaceRepo;
     private final UserRepo userRepo;
    public WorkspaceMemberService( WorkspaceMemberRepo workspaceMemberRepo,UserRepo userRepo, WorkspaceRepo workspaceRepo  ){
        this.workspaceMemberRepo=workspaceMemberRepo;
        this.workspaceRepo=workspaceRepo;
        this.userRepo=userRepo;




    }

    public RoleResponse addMembership(Long workSpaceId,Long userId, Role role){
        WorkspaceMembers member;
        Workspace space;
        Users user;
        try {
            member = new WorkspaceMembers();
            space = workspaceRepo.getReferenceById(workSpaceId);
            user = userRepo.getReferenceById(userId);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }


        member.setWorkspace(space);
            member.setUser(user);
            member.setRole(role);

            workspaceMemberRepo.save(member);





        return  new RoleResponse(userId,workSpaceId,role);
    }



}
