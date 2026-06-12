package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Boards.Board;
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

    @OneToMany( mappedBy = "workspace") // workspace and workspace members aka membership relationship
    List<WorkspaceMembers> members=new ArrayList<>();

    @OneToMany(mappedBy = "workspace") //Board and Workspace relationship
    List<Board>boards=new ArrayList<>();

}
