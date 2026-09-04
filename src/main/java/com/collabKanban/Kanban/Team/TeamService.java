package com.collabKanban.Kanban.Team;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TeamService {

    private final TeamRepo repo;


    public TeamService(TeamRepo repo){
        this.repo=repo;
    }


    public String createTeam(String name){
      Team team=new Team();
      team.setName(name);

    return name;
    }
}
