package com.collabKanban.Kanban.authentication;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
@EnableWebSecurity
public class Security {

    MyuserDetailsService userDetails;
    public Security(MyuserDetailsService userDetails){
        this.userDetails=userDetails;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity security){

           security.csrf(csrfConfigurer-> csrfConfigurer.disable());

           security.authorizeHttpRequests(authorize-> authorize
                   .requestMatchers("/user/**").permitAll()
                   .anyRequest().authenticated());

            security.sessionManagement(session-> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
            security.authenticationProvider(authenticationProvider());
        security.httpBasic(Customizer.withDefaults()); //enables Basic Auth ( without this Spring Doesnt know how credentials arrive (it can be jwt or basic auth or bearer token as well ))
            return security.build();


    }

    @Bean
    public AuthenticationProvider authenticationProvider(){
        DaoAuthenticationProvider db=new DaoAuthenticationProvider(userDetails);
        db.setPasswordEncoder(new BCryptPasswordEncoder(12));

        return db;
    }






}
