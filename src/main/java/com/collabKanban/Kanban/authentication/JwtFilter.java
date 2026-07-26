package com.collabKanban.Kanban.authentication;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {
     private final MyuserDetailsService  detailsService;

    private  JwtService service;

    public JwtFilter(JwtService service,MyuserDetailsService detailsService){
        this.service=service;
       this.detailsService=detailsService;

    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
            String header=request.getHeader("Authorization");
            String token=null;
            String username=null;

            if( header!=null && header.startsWith("Bearer ")){
                    token=header.substring(7);
                    username=service.extractUserName(token);
            }

            if( username!=null && SecurityContextHolder.getContext().getAuthentication()==null){
                UserDetails userDetails=detailsService.loadUserByUsername(username);
                if(service.validateToken(token,userDetails)){
                    UsernamePasswordAuthenticationToken authToken=new UsernamePasswordAuthenticationToken(userDetails,null,userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }


            }

        filterChain.doFilter(request,response);


    }
}
