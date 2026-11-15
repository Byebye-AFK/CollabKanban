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
    public void setUserRepo(UserRepo repo) {
        userRepo = repo;
    }

    // Throwing UsernameNotFoundException (instead of returning DetailsOfUser(null))
    // lets DaoAuthenticationProvider answer a bad login with BadCredentials (401)
    // and lets JwtFilter treat a token for a deleted user as unauthenticated.
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.isBlank()) {
            throw new UsernameNotFoundException("No email given");
        }
        Users user = userRepo.findByemail(email);
        if (user == null) {
            throw new UsernameNotFoundException("No user with that email");
        }
        return new DetailsOfUser(user);
    }
}
