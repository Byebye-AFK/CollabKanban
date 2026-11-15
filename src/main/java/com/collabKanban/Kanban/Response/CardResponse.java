package com.collabKanban.Kanban.Response;

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
    // @Version of the card; the client echoes it on move so stale copies are rejected with 409.
    private Long version;

}
