package com.collabKanban.Kanban.Card;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCardReq {
    public String title;
    private String description;
    private Long columnId;
    private Long assignedTo;
}
