package com.collabKanban.Kanban.Response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ColumResponse {
    private Long position;
    private Long columnId;
    private String name;
    private List<CardResponse> cards;

}
