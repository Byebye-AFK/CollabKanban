package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.Team.TeamMembers;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMembers;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity

public class Users {

    @GeneratedValue( strategy = GenerationType.IDENTITY)
    @Id
    public Long userId;

    @Column( nullable = false)
    private String name;

    @Column( unique = true,nullable = false)
    private String email;

    private String password;


    @OneToMany( mappedBy = "user",cascade = CascadeType.ALL)
    private List<WorkspaceMembers> memberships=new ArrayList<>();

    @OneToMany(mappedBy = "members",cascade = CascadeType.ALL)
    private List<TeamMembers> teams=new ArrayList<>();



}
