package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.Card.Card;
import jakarta.persistence.*;
import lombok.Getter;

import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter

public class Colum {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long columnId;

    @Column(nullable = false)
    private String name;

    private Long position;

    @ManyToOne
    @JoinColumn(name="boardId",nullable = false)
    private Board board;

    @OneToMany(mappedBy = "colum")
    List<Card> cards=new ArrayList<>();




}
