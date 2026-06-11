package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBoardReq {

    private String name;
    private Long workspaceId;
    private Long position;
}
