package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.CreateTeamReq;
import com.collabKanban.Kanban.Response.TeamResponse;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepo repo;
    private  final TeamMemberRepo teamMemberRepo;

  private final WorkspaceRepo workspaceRepo;
  private final UserRepo userRepo;

    public TeamService(TeamRepo repo,WorkspaceRepo wrepo, UserRepo urepo, TeamMemberRepo teamMemberRepo){

        workspaceRepo=wrepo;
        this.repo=repo;
        userRepo=urepo;
        this.teamMemberRepo=teamMemberRepo;

    }



    public TeamResponse createTeam(CreateTeamReq req,String userEmail) {
        TeamResponse res;
            Workspace workspace = workspaceRepo.findByWorkspaceId(req.getWorkSpaceId());
            if (workspace == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace is Not found");

            }

            Team team = new Team();
            team.setName(req.getTeamName());
            team.setWorkspaces(workspace);
            team.setCount(1);

            Team team1=repo.save(team);
            Users user=userRepo.findByemail(userEmail);
            res = new TeamResponse();
            res.setTeamName(req.getTeamName());
            res.setTeamId(team1.getTeamId());
            res.setCount(team1.getCount());

            //Adding the user who created as a member
            TeamMembers member=new TeamMembers();
            member.setTeams(team1);
            member.setMembers(user);
            teamMemberRepo.save(member);






        return res;
    }
}
