package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.UserSpace.Users;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"userId","workspaceId"})})
@Getter
@Setter
public class WorkspaceMembers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long workspacMemberId;

    @JoinColumn( name= "userId",nullable = false)
    @ManyToOne
    private Users user;

    @JoinColumn( name="workspaceId",nullable = false)
    @ManyToOne
    private Workspace workspace;

    @Enumerated(EnumType.STRING)
    private Role role;

}
