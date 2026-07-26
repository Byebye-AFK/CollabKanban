package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
import com.collabKanban.Kanban.DTO.UserAuthReq;
import com.collabKanban.Kanban.authentication.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private UserRepo userRepo;
    private final BCryptPasswordEncoder encoder=new BCryptPasswordEncoder(12);

    private  AuthenticationManager manager;
    private  JwtService jwtService;

    @Autowired
    public void setUserRepo(UserRepo userRepo,AuthenticationManager manager,JwtService jservice){
        this.userRepo=userRepo;
        this.manager=manager;
        jwtService=jservice;

    }

    public CreateUserReq addUser(CreateUserReq user){
        Users users=new Users();

        users.setName(user.getName());
        users.setEmail(user.getEmail());
        users.setPassword(encoder.encode(user.getPassword()));

        userRepo.save(users);


        return user;
    }

    public CreateUserReq deleteUser(Long userId){
        Users user=null;
        CreateUserReq req=new CreateUserReq();
        try {
            user = userRepo.getReferenceById(userId);
            req.setName(user.getName());
            req.setEmail(user.getEmail());
            userRepo.deleteById(userId);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }




        return req;



    }

    public String verifyUser(UserAuthReq user){
        Authentication auth=manager.authenticate(new UsernamePasswordAuthenticationToken(user.getName(),user.getPassword()));
        if(auth.isAuthenticated())
            return  jwtService.generateToken(user.getName());


        return  "Failed";

    }







}
