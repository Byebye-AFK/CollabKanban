package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.Response.TeamMemberRes;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamMembersService {

    private final UserRepo userRepo;

    private final TeamRepo teamRepo;

    private final TeamMemberRepo repo;

    public TeamMembersService(TeamMemberRepo repo,TeamRepo teamRepo, UserRepo userRepo){
        this.repo=repo;
        this.teamRepo=teamRepo;
        this.userRepo=userRepo;

    }
    public TeamMemberRes addMembers(TeamMemberCreateReq req){
        int count=0;
        TeamMembers newMember=new TeamMembers();
        TeamMemberRes res=new TeamMemberRes();

        Users user= userRepo.findByuserId(req.getUserId());
        Team team=teamRepo.findByteamId(req.getTeamId());


        newMember.setMembers(user);
        newMember.setTeams(team);

        repo.save(newMember);
        count= (getMembers(req.getTeamId())!=null) ?  getMembers(req.getTeamId()).size():0;
        team.setCount(count);
        teamRepo.save(team);

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
