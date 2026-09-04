package com.collabKanban.Kanban.Team;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepo extends JpaRepository<Team,Long> {

    Team findByteamId(Long id);
}
