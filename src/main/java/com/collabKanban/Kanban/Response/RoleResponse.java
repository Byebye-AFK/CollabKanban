package com.collabKanban.Kanban.Response;

import com.collabKanban.Kanban.WorkSpace.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleResponse {

    public RoleResponse(Long userId, Long workSpaceId, Role role) {
        this.userId = userId;
        this.workSpaceId = workSpaceId;
        this.role = role;
    }

    private Long userId;

    private  Long workSpaceId;

    private Role role;


}
