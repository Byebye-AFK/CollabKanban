package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.Card.Card;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Workspace;

import java.util.ArrayList;
import java.util.List;

/** Small builders for entities used by the Boards unit tests. */
final class BoardFixtures {

    private BoardFixtures() {
    }

    static Workspace workspace(Long id) {
        Workspace workspace = new Workspace();
        workspace.setWorkspaceId(id);
        workspace.setName("Workspace " + id);
        return workspace;
    }

    static Team team(Long id, Workspace workspace) {
        Team team = new Team();
        team.setTeamId(id);
        team.setName("Team " + id);
        team.setWorkspaces(workspace);
        return team;
    }

    static Board board(Long id, Workspace workspace) {
        Board board = new Board();
        board.setBoardId(id);
        board.setName("Board " + id);
        board.setWorkspace(workspace);
        return board;
    }

    static Colum column(Long id, Long position, Board board, Card... cards) {
        Colum column = new Colum();
        column.setColumnId(id);
        column.setName("Column " + id);
        column.setPosition(position);
        column.setBoard(board);
        column.setCards(new ArrayList<>(List.of(cards)));
        return column;
    }

    static Card card(Long id, Long position, Users assignee) {
        Card card = new Card();
        card.setCardId(id);
        card.setTitle("Card " + id);
        card.setDescription("Description " + id);
        card.setPosition(position);
        card.setAssignedTo(assignee);
        card.setVersion(id * 10);
        return card;
    }

    static Users user(Long id) {
        Users user = new Users();
        user.setUserId(id);
        return user;
    }
}
