package com.collabKanban.Kanban.Response;

import com.collabKanban.Kanban.WorkSpace.Role;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class WorkSpaceResponse {

    private Long workSpaceId;
    private String name ;
    private Role role;

    private List<UserResponse> members;
    private List<BoardResponse> boards;
    private List<TeamResponse> teams;


}
