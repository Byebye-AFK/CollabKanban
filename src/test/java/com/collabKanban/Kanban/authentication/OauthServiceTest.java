package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OauthServiceTest {

    private UserRepo userRepo;
    private JwtService jwtService;
    private OauthService handler;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepo.class);
        jwtService = new JwtService(JwtServiceTest.SECRET);
        handler = new OauthService(jwtService, userRepo, "http://app.test/");
        response = new MockHttpServletResponse();
    }

    private Authentication authWith(String email, String name) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "1234567890");
        if (email != null) attributes.put("email", email);
        if (name != null) attributes.put("name", name);
        OAuth2User principal = new DefaultOAuth2User(List.of(), attributes, "sub");
        return new TestingAuthenticationToken(principal, null);
    }

    private Users savedUser() {
        ArgumentCaptor<Users> captor = ArgumentCaptor.forClass(Users.class);
        verify(userRepo).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void newUserGetsTheProfileName() throws Exception {
        when(userRepo.findByemail("ada@example.com")).thenReturn(null);

        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authWith("ada@example.com", "Ada Lovelace"));

        Users saved = savedUser();
        assertEquals("Ada Lovelace", saved.getName());
        assertEquals("ada@example.com", saved.getEmail());
    }

    @Test
    void missingNameFallsBackToEmailLocalPart() throws Exception {
        when(userRepo.findByemail("ada@example.com")).thenReturn(null);

        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authWith("ada@example.com", null));

        assertEquals("ada", savedUser().getName());
    }

    @Test
    void displayNameFallsBackToWholeEmailWithoutLocalPart() {
        assertEquals("@example.com", OauthService.displayName(" ", "@example.com"));
        assertEquals("ada", OauthService.displayName(null, "ada@example.com"));
        assertEquals("Ada", OauthService.displayName("  Ada ", "ada@example.com"));
    }

    @Test
    void existingUserIsNotOverwritten() throws Exception {
        Users existing = new Users();
        existing.setEmail("ada@example.com");
        existing.setName("Original");
        when(userRepo.findByemail("ada@example.com")).thenReturn(existing);

        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authWith("ada@example.com", "New Name"));

        verify(userRepo, never()).save(any());
        assertEquals("Original", existing.getName());
    }

    @Test
    void redirectPutsTokenInTheFragment() throws Exception {
        when(userRepo.findByemail("ada@example.com")).thenReturn(null);

        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authWith("ada@example.com", "Ada"));

        String location = response.getRedirectedUrl();
        assertNotNull(location);
        String prefix = "http://app.test/oauth2/callback#token=";
        assertTrue(location.startsWith(prefix), location);
        assertFalse(location.contains("?"), location);
        assertEquals("ada@example.com", jwtService.extractUserName(location.substring(prefix.length())));
    }

    @Test
    void missingEmailIsRejected() throws Exception {
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authWith(null, "Ada"));

        assertEquals(401, response.getStatus());
        assertNull(response.getRedirectedUrl());
        verify(userRepo, never()).save(any());
    }

    @Test
    void blankFrontendUrlFailsStartup() {
        assertThrows(IllegalStateException.class, () -> new OauthService(jwtService, userRepo, " "));
    }
}
