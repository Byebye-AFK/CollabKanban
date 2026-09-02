package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.UserSpace.Users;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
public class TeamMembers {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long teamMemberId;

    @ManyToOne
    @JoinColumn(name="userId")
    private Users members;

    @ManyToOne
    @JoinColumn(name="teamId")
    private Team teams;

}
