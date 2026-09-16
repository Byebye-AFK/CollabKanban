package com.collabKanban.Kanban.Response;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.Team.TeamRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Role;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.lang.reflect.Type;
import java.util.List;

@Getter
@Setter
public class WorkSpaceResponse {

    private Long workSpaceId;
    private String name ;
    @Enumerated(EnumType.STRING)
    private Role role;

    private List<UserResponse> members;
    private List<BoardResponse> boards;
    private List<TeamResponse> teams;


}
