package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAuthReq {

    private String email;
    private String password;
}
