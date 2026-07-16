package com.collabKanban.Kanban.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserReq {

    private  String name;
    private String email;
    private String password;

}
