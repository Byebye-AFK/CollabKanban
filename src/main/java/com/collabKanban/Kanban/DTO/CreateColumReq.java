package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateColumReq {

    private String name;
    private  Long boardId;
    private Long position;
}
