package com.collabKanban.Kanban.Team;

import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface TeamRepo extends JpaRepository<Team,Long> {

    Team findByteamId(Long id);


    @Transactional
    @Modifying(clearAutomatically = true)  // if any deleted entities is loaded into persitence context , any subsequent  operations may  acces the inconsistent data, clear autmoatically clears the persitence context after execution
    @Query("DELETE FROM TeamMembers t where t.teams=:team and t.members=:user")
    void deleteByUserandTeam(Users user, Team team);




}
