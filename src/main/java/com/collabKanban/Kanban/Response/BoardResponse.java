package com.collabKanban.Kanban.Response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BoardResponse {
    private Long teamId;
    private Long boardId;
    private Long position;
    private String name;
    private List<ColumResponse> columns;



}
