package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("team")
public class TeamController {

    TeamService teamService;
    TeamMembersService membersService;

    public  TeamController(TeamService service,TeamMembersService membersService){

        teamService=service;
        this.membersService=membersService;
    }

    @PostMapping("/add/{name}")
    public ResponseEntity<String> addTeam(@PathVariable String name){

        return new ResponseEntity<>(teamService.createTeam(name), HttpStatus.OK);


    }

    @PostMapping("/addMember")
    public ResponseEntity<TeamMemberRes> addMember(@RequestBody TeamMemberCreateReq req){

        return new ResponseEntity<>(membersService.addMembers(req),HttpStatus.OK);

    }


    @DeleteMapping("/removeMember")
    public ResponseEntity<TeamMemberRes> removeMember(@RequestBody TeamMemberCreateReq req){


        return new ResponseEntity<>(membersService.removeMembers(req),HttpStatus.OK);
    }






}
