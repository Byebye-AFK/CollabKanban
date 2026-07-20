package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MyuserDetailsService implements UserDetailsService {


    UserRepo userRepo;

    @Autowired
    public void setUserRepo ( UserRepo repo){
        userRepo=repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Users user= null;
        try {
            user = userRepo.findByname(username);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }


        return new DetailsOfUser(user);




    }
}
