package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OauthService implements AuthenticationSuccessHandler {

    JwtService jwtService;
    UserRepo userRepo;
    public OauthService(JwtService jwtService, UserRepo userRepo){
        this.jwtService=jwtService;
        this.userRepo=userRepo;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        String frontend="http://localhost:5173";
        OAuth2User user=(OAuth2User) authentication.getPrincipal();

        String email= user.getAttribute("email");
        String name=user.getName();
        if( userRepo.findByemail(email)==null ){

            Users newUser= new Users();
            newUser.setName(name);
            newUser.setEmail(email);

            userRepo.save(newUser);



        }

        String token =jwtService.generateToken(email);
        response.sendRedirect(frontend+"/oauth2/callback?token=" + token);


    }
}
