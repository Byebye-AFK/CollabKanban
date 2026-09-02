package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;


import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long teamId;

    private String name;

    private int count;

    @OneToMany(mappedBy = "teams",cascade = CascadeType.ALL)
    private List<TeamMembers> teamMembers=new ArrayList<>();

    @ManyToOne
    @JoinColumn(name="workspaceId")
    private Workspace workspaces;


}
