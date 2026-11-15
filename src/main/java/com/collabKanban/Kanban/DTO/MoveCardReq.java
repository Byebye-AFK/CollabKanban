package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MoveCardReq {
    private Long boardId;
    private Long targetColumnId;
    private Long position;
    // Optional: the card version the client last saw. When sent and stale, the move is rejected with 409.
    private Long version;

}
