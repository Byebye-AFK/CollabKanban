package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Role;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMemberRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class TeamMembersService {

    private final UserRepo userRepo;

    private final TeamRepo teamRepo;

    private final TeamMemberRepo repo;

    private final WorkspaceMemberRepo workspaceMemberRepo;

    public TeamMembersService(TeamMemberRepo repo,TeamRepo teamRepo, UserRepo userRepo, WorkspaceMemberRepo workspaceMemberRepo){
        this.repo=repo;
        this.teamRepo=teamRepo;
        this.userRepo=userRepo;
        this.workspaceMemberRepo=workspaceMemberRepo;

    }
    // Only a workspace's owners and admins may change who is on its teams.
    private static final Set<Role> ROLES_THAT_MANAGE_TEAMS = EnumSet.of(Role.OWNER, Role.ADMIN);

    @Transactional
    public TeamMemberRes addMembers(TeamMemberCreateReq req, String callerEmail){
        if (req == null || req.getUserId() == null || req.getTeamId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId and teamId are required");
        }

        Team team = teamRepo.findByteamId(req.getTeamId());
        if (team == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
        }

        Workspace workspace = team.getWorkspaces();
        if (workspace == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team is not attached to a workspace");
        }

        Users caller = userRepo.findByemail(callerEmail);
        Role callerRole = caller == null ? null : workspaceMemberRepo.getRoleOfMember(caller, workspace);
        if (!ROLES_THAT_MANAGE_TEAMS.contains(callerRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workspace owners and admins can add team members");
        }

        Users user = userRepo.findByuserId(req.getUserId());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        if (workspaceMemberRepo.getRoleOfMember(user, workspace) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, user.getName() + " is not a member of this workspace");
        }
        if (repo.existsByMembersAndTeams(user, team)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, user.getName() + " is already on " + team.getName());
        }

        TeamMembers newMember = new TeamMembers();
        newMember.setMembers(user);
        newMember.setTeams(team);
        repo.save(newMember);

        team.setCount(repo.findByteams(team).size());
        teamRepo.save(team);

        TeamMemberRes res = new TeamMemberRes();
        res.setTeamId(team.getTeamId());
        res.setUserId(user.getUserId());
        return res;
    }

    public TeamMemberRes removeMembers(TeamMemberCreateReq req){
        TeamMemberRes res=new TeamMemberRes();
        res.setUserId(req.getUserId());
        res.setTeamId(req.getTeamId());

        Users user=userRepo.findByuserId(req.getUserId());
        Team team=teamRepo.findByteamId(req.getTeamId());
        teamRepo.deleteByUserandTeam(user, team);

        return res;

    }





    public List<TeamMembers> getMembers(Long teamId){
        Team team=teamRepo.findByteamId(teamId);

        List<TeamMembers> members=repo.findByteams(team);

        if (members !=null){
            return members;
        }
        return null;
    }

}
