package com.collabKanban.Kanban.DTO;

import com.collabKanban.Kanban.WorkSpace.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddWorkspaceMember {

    private Long userId;
    private Long workSpaceId;
    private Role role;

}
