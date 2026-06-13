package com.collabKanban.Kanban.Response;

import com.collabKanban.Kanban.Boards.Colum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CardResponse {
    private Long cardId;
    private String title;
    private String description;
    private Long position;
    private Long assignedTo;

}
