package com.collabKanban.Kanban.WorkSpace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberRepo extends JpaRepository<WorkspaceMembers,Long> {

    List<WorkspaceMembers> findByuserAndworkspace(Long userId,Long workspaceId);
}
