package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MoveCardReq {
    private Long boardId;
    private Long targetColumnId;
    private Long position;

}
