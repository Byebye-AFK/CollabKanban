package com.collabKanban.Kanban.Response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TeamResponse {

    private Long teamId;
    private String teamName;
    private int count;
    private List<UserResponse> members;
}
