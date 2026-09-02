package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Team.Team;
import jakarta.persistence.*;
import lombok.Getter;

import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class Workspace {

    @GeneratedValue( strategy = GenerationType.IDENTITY)
    @Id
    private  Long workspaceId;

    @Column(nullable = false)
    public String name;

    @OneToMany( mappedBy = "workspace",cascade=CascadeType.ALL) // workspace and workspace members aka membership relationship
    List<WorkspaceMembers> members=new ArrayList<>();

    @OneToMany(mappedBy = "workspace",cascade = CascadeType.ALL) //Board and Workspace relationship
    List<Board>boards=new ArrayList<>();

    @OneToMany(mappedBy = "workspaces",cascade = CascadeType.ALL)
    List<Team> teamsBworkspace=new ArrayList<>();

}
