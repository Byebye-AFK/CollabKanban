package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.CreateTeamReq;
import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import com.collabKanban.Kanban.Response.TeamResponse;
import com.collabKanban.Kanban.authentication.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("team")
public class TeamController {

    TeamService teamService;
    TeamMembersService membersService;
    JwtService jwtService;

    public  TeamController(TeamService service,TeamMembersService membersService,JwtService jwtService){

        teamService=service;
        this.membersService=membersService;
        this.jwtService=jwtService;
    }

    @PostMapping("/add")
    public ResponseEntity<TeamResponse> addTeam(@RequestBody CreateTeamReq req, @RequestHeader("Authorization") String authHeader){
        String userEmail=jwtService.extractUserName(authHeader.replace("Bearer ",""));

        return new ResponseEntity<>(teamService.createTeam(req,userEmail), HttpStatus.OK);


    }

    @PostMapping("/addMember")
    public ResponseEntity<TeamMemberRes> addMember(@RequestBody TeamMemberCreateReq req,
                                                   @RequestHeader("Authorization") String authHeader){

        String callerEmail=jwtService.extractUserName(authHeader.replace("Bearer ",""));

        return new ResponseEntity<>(membersService.addMembers(req,callerEmail),HttpStatus.OK);

    }


    @DeleteMapping("/removeMember")
    public ResponseEntity<TeamMemberRes> removeMember(@RequestBody TeamMemberCreateReq req){


        return new ResponseEntity<>(membersService.removeMembers(req),HttpStatus.OK);
    }






}
