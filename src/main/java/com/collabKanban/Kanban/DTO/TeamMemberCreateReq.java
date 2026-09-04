package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamMemberCreateReq {

    private Long userId;
    private Long teamId;

}
