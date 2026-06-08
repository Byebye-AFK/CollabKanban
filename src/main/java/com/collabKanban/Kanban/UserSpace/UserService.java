package com.collabKanban.Kanban.UserSpace;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private UserRepo userRepo;

    @Autowired
    public void setUserRepo(UserRepo userRepo){
        this.userRepo=userRepo;
    }

    public Users addUser(Users user){
        userRepo.save(user);
        return user;
    }

}
