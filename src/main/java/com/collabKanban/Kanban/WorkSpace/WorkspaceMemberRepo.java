package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface WorkspaceMemberRepo extends JpaRepository<WorkspaceMembers,Long> {

    @Query("SELECT w.workspace from WorkspaceMembers w where w.user=:users")
     List<Workspace> findWorkspacesUserBelong(Users users);

    @Query("SELECT w.user from WorkspaceMembers w where w.workspace=:workspace AND w.user!=:user")
    List<Users> findMembersnWorkspaceExceptUser(Workspace workspace,Users user);

    @Query("SELECT w.role FROM WorkspaceMembers w WHERE w.workspace=:workspace AND w.user=:user")
    Role getRoleOfMember(Users user,Workspace workspace);



}
