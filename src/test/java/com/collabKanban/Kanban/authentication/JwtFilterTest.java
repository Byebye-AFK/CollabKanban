package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.Users;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class JwtFilterTest {

    private JwtService jwtService;
    private MyuserDetailsService detailsService;
    private JwtFilter filter;
    private FilterChain chain;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwtService = new JwtService(JwtServiceTest.SECRET);
        detailsService = mock(MyuserDetailsService.class);
        filter = new JwtFilter(jwtService, detailsService);
        chain = mock(FilterChain.class);
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest requestWith(String authorization) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/workspace/mine");
        if (authorization != null) {
            request.addHeader("Authorization", authorization);
        }
        return request;
    }

    private void assertUnauthenticatedAndContinued(MockHttpServletRequest request) throws Exception {
        verify(chain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void validTokenAuthenticates() throws Exception {
        Users user = new Users();
        user.setEmail("ada@example.com");
        user.setName("Ada");
        when(detailsService.loadUserByUsername("ada@example.com")).thenReturn(new DetailsOfUser(user));
        MockHttpServletRequest request = requestWith("Bearer " + jwtService.generateToken("ada@example.com"));

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void malformedTokenContinuesUnauthenticated() throws Exception {
        MockHttpServletRequest request = requestWith("Bearer not-a-jwt");

        filter.doFilter(request, response, chain);

        assertUnauthenticatedAndContinued(request);
        verifyNoInteractions(detailsService);
    }

    @Test
    void emptyTokenContinuesUnauthenticated() throws Exception {
        MockHttpServletRequest request = requestWith("Bearer ");

        filter.doFilter(request, response, chain);

        assertUnauthenticatedAndContinued(request);
    }

    @Test
    void expiredTokenContinuesUnauthenticated() throws Exception {
        String expired = Jwts.builder()
                .subject("ada@example.com")
                .expiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(JwtServiceTest.SECRET)))
                .compact();
        MockHttpServletRequest request = requestWith("Bearer " + expired);

        filter.doFilter(request, response, chain);

        assertUnauthenticatedAndContinued(request);
    }

    @Test
    void tokenSignedWithAnotherKeyContinuesUnauthenticated() throws Exception {
        String foreign = new JwtService("").generateToken("ada@example.com");
        MockHttpServletRequest request = requestWith("Bearer " + foreign);

        filter.doFilter(request, response, chain);

        assertUnauthenticatedAndContinued(request);
    }

    @Test
    void deletedUserContinuesUnauthenticated() throws Exception {
        when(detailsService.loadUserByUsername(anyString())).thenThrow(new UsernameNotFoundException("gone"));
        MockHttpServletRequest request = requestWith("Bearer " + jwtService.generateToken("ada@example.com"));

        filter.doFilter(request, response, chain);

        assertUnauthenticatedAndContinued(request);
    }

    @Test
    void missingOrNonBearerHeaderIsIgnored() throws Exception {
        MockHttpServletRequest none = requestWith(null);
        filter.doFilter(none, response, chain);
        assertUnauthenticatedAndContinued(none);

        MockHttpServletRequest basic = requestWith("Basic abc");
        filter.doFilter(basic, response, chain);
        verify(chain).doFilter(basic, response);
        verifyNoInteractions(detailsService);
    }
}
