package com.collabKanban.Kanban.WorkSpace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MemberRepo extends JpaRepository<WorkspaceMembers,Long> {

    @Query("SELECT M FROM WorkspaceMembers M WHERE "+"M.user=:userId "+"AND "+"M.workspace=:workspace")
    WorkspaceMembers findByuserAndworkspace(Long userId,Long workspaceId);
}
