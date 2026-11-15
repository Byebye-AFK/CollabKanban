package com.collabKanban.Kanban.authentication;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final MyuserDetailsService detailsService;
    private final JwtService service;

    public JwtFilter(JwtService service, MyuserDetailsService detailsService) {
        this.service = service;
        this.detailsService = detailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticate(header.substring(BEARER_PREFIX.length()), request);
        }
        filterChain.doFilter(request, response);
    }

    // A bad, expired or orphaned token must not break the request: it simply
    // stays unauthenticated. Protected routes then get the 401 from the entry
    // point, and public routes (login/signup) still work with a stale header.
    private void authenticate(String token, HttpServletRequest request) {
        try {
            String username = service.extractUserName(token);
            if (username == null) {
                return;
            }
            UserDetails userDetails = detailsService.loadUserByUsername(username);
            if (userDetails instanceof DetailsOfUser details && service.validateToken(token, details)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
            log.debug("Ignoring bearer token on {}: {}", request.getRequestURI(), e.getMessage());
        }
    }
}
