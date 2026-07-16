package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private UserRepo userRepo;

    @Autowired
    public void setUserRepo(UserRepo userRepo){
        this.userRepo=userRepo;
    }

    public CreateUserReq addUser(CreateUserReq user){
        Users users=new Users();

        users.setName(user.getName());
        users.setEmail(user.getEmail());
        users.setPassword(user.getPassword());

        userRepo.save(users);
        return user;
    }







}
