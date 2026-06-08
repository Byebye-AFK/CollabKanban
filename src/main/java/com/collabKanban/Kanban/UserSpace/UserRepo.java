package com.collabKanban.Kanban.UserSpace;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<Users, Long> {
        Users findByuserId(Long id);

}
