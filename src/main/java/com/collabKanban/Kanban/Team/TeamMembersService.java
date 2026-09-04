package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.DTO.TeamMemberCreateReq;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamMembersService {

    private UserRepo userRepo;

    private TeamRepo teamRepo;

    private final TeamMemberRepo repo;

    public TeamMembersService(TeamMemberRepo repo){
        this.repo=repo;

    }
    public boolean addMembers(TeamMemberCreateReq req){
        int count=0;
        TeamMembers newMember=new TeamMembers();

        Users user= userRepo.findByuserId(req.getUserId());
        Team team=teamRepo.findByteamId(req.getTeamId());


        newMember.setMembers(user);
        newMember.setTeams(team);

        repo.save(newMember);
        count= (getMembers(req.getTeamId())!=null) ?  getMembers(req.getTeamId()).size():0;
        team.setCount(count);
        teamRepo.save(team);

        if(repo.findBymembers(user)!=null){
            return true;
        }

        return false;


    }

    public List<TeamMembers> getMembers(Long teamId){
        Team team=teamRepo.findByteamId(teamId);

        List<TeamMembers> members=repo.findByteams(team);

        if(members !=null){
            return members;
        }
        return null;
    }

}
