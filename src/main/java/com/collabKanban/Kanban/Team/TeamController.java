package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.CreateTeamReq;
import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import com.collabKanban.Kanban.Response.TeamResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// The caller is taken from the SecurityContext by WorkspaceAccess inside
// the services, so no endpoint parses the Authorization header itself.
@RestController
@RequestMapping("team")
public class TeamController {

    private final TeamService teamService;
    private final TeamMembersService membersService;

    public TeamController(TeamService teamService, TeamMembersService membersService) {
        this.teamService = teamService;
        this.membersService = membersService;
    }

    @PostMapping("/add")
    public ResponseEntity<TeamResponse> addTeam(@RequestBody CreateTeamReq req) {
        return ResponseEntity.ok(teamService.createTeam(req));
    }

    @PostMapping("/addMember")
    public ResponseEntity<TeamMemberRes> addMember(@RequestBody TeamMemberCreateReq req) {
        return ResponseEntity.ok(membersService.addMembers(req));
    }

    @DeleteMapping("/removeMember")
    public ResponseEntity<TeamMemberRes> removeMember(@RequestBody TeamMemberCreateReq req) {
        return ResponseEntity.ok(membersService.removeMembers(req));
    }
}
