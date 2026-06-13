package com.collabKanban.Kanban.Response;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Card.Card;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ColumResponse {
    private Long columnId;
    private String name;
    private List<CardResponse> cards;

}
