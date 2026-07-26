package com.collabKanban.Kanban.authentication;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableWebSecurity
public class Security {

    private  final JwtFilter jwtFilter;

    private final MyuserDetailsService userDetails;
    public Security(MyuserDetailsService userDetails,JwtFilter filter){
        this.userDetails=userDetails;
        jwtFilter=filter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity security){

           security.csrf(csrfConfigurer-> csrfConfigurer.disable());

           security.authorizeHttpRequests(authorize-> authorize
                   .requestMatchers("/user/**").permitAll()
                   .anyRequest().authenticated());

            security.sessionManagement(session-> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
            security.authenticationProvider(authenticationProvider());
            security.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
            return security.build();


    }

    @Bean
    public AuthenticationProvider authenticationProvider(){
        DaoAuthenticationProvider db=new DaoAuthenticationProvider(userDetails);
        db.setPasswordEncoder(new BCryptPasswordEncoder(12));

        return db;
    }


     @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration){

        return configuration.getAuthenticationManager();
     }





}
