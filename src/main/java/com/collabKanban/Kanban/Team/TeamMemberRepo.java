package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMemberRepo extends JpaRepository<TeamMembers,Long> {

    TeamMembers findBymembers(Users member);

    List<TeamMembers> findByteams(Team team);


}
