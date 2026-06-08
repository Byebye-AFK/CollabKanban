package com.collabKanban.Kanban;

import com.collabKanban.Kanban.WorkSpace.Role;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMembers;
import com.collabKanban.Kanban.WorkSpace.MemberRepo;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.WorkSpace.WorkspaceRepo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class KanbanApplication {

	public static void main(String[] args) {
		SpringApplication.run(KanbanApplication.class, args);
	}
	@Bean
    CommandLineRunner testData(
			UserRepo userRepo,
			WorkspaceRepo workspaceRepo,
			MemberRepo memberRepo
	) {

		return args -> {

			Users user = new Users();
			user.setName("John");
			user.setEmail("john@gmail.com");
			user.setPassword("123");

			userRepo.save(user);

			Workspace workspace = new Workspace();
			workspace.setName("Backend Team");

			workspaceRepo.save(workspace);

			WorkspaceMembers member = new WorkspaceMembers();
			member.setUser(user);
			member.setWorkspace(workspace);
			member.setRole(Role.ADMIN);

			memberRepo.save(member);
		};
	}


}
