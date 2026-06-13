package com.collabKanban.Kanban.Response;

import com.collabKanban.Kanban.Boards.Colum;
import com.collabKanban.Kanban.Boards.ColumRepo;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BoardResponse {
    private Long boardId;
    private String name;
    private List<ColumResponse> columns;

}
