package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.WorkSpace.Workspace;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
@Entity
@Getter
@Setter

public class Board {

    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Id
    private Long boardId;

    @ManyToOne
    @JoinColumn(name="workspaceId",nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "columnId")
    List<Colum> columns=new ArrayList<>();

    private int columnCount=0;



}
