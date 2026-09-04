package com.collabKanban.Kanban.Team;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("team")
public class TeamController {

    TeamService teamService;

    @Autowired
    public void setTeamService(TeamService service){

        teamService=service;
    }

    @PostMapping("/add/{name}")
    public ResponseEntity<String> addTeam(@PathVariable String name){

        return new ResponseEntity<>(teamService.createTeam(name), HttpStatus.OK);


    }




}
