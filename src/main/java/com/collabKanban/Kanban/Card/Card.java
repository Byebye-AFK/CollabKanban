package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Colum;
import com.collabKanban.Kanban.UserSpace.Users;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Card {
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Id
    public Long cardId;

    @ManyToOne
    @JoinColumn(name="assignedBy")
    public Users assignedBy;

    @ManyToOne
    @JoinColumn(name="assignedTo")
    public Users assignedTo;

    public String title;
    public String description;

    public Long position;

    @ManyToOne
    @JoinColumn(name = "columnId")
    private Colum colum;

}






