package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CreateTeamReq {
    String teamName;
    Long workSpaceId;

}
