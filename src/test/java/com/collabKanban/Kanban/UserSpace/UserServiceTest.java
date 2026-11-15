package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
import com.collabKanban.Kanban.DTO.UserAuthReq;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.authentication.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserRepo userRepo;
    private AuthenticationManager manager;
    private JwtService jwtService;
    private WorkspaceAccess access;
    private UserService service;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepo.class);
        manager = mock(AuthenticationManager.class);
        jwtService = mock(JwtService.class);
        access = mock(WorkspaceAccess.class);
        service = new UserService(userRepo, manager, jwtService, access);
    }

    private static Users user(long id, String email) {
        Users u = new Users();
        u.setUserId(id);
        u.setName("User " + id);
        u.setEmail(email);
        return u;
    }

    private static CreateUserReq signup(String name, String email, String password) {
        CreateUserReq req = new CreateUserReq();
        req.setName(name);
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    private static UserAuthReq login(String email, String password) {
        UserAuthReq req = new UserAuthReq();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    private static HttpStatus statusOf(Throwable t) {
        return HttpStatus.valueOf(((ResponseStatusException) t).getStatusCode().value());
    }

    // ── deleteUser ──────────────────────────────────────────────────

    @Test
    void deletesTheCallersOwnAccount() {
        Users me = user(1L, "me@example.com");
        when(access.currentUser()).thenReturn(me);
        when(userRepo.findById(1L)).thenReturn(Optional.of(me));

        CreateUserReq res = service.deleteUser(1L);

        verify(userRepo).delete(me);
        assertThat(res.getEmail()).isEqualTo("me@example.com");
        assertThat(res.getPassword()).isNull();
    }

    @Test
    void refusesToDeleteSomeoneElsesAccount() {
        when(access.currentUser()).thenReturn(user(1L, "me@example.com"));

        assertThatThrownBy(() -> service.deleteUser(2L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.FORBIDDEN))
                .hasMessageContaining("You can only delete your own account");
        verify(userRepo, never()).delete(any());
        verify(userRepo, never()).deleteById(any());
    }

    @Test
    void returns404WhenTheAccountIsAlreadyGone() {
        when(access.currentUser()).thenReturn(user(1L, "me@example.com"));
        when(userRepo.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteUser(1L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.NOT_FOUND))
                .hasMessageContaining("User not found");
    }

    // ── verifyUser ──────────────────────────────────────────────────

    @Test
    void returnsATokenForCorrectCredentials() {
        Authentication ok = UsernamePasswordAuthenticationToken.authenticated("me@example.com", null, List.of());
        when(manager.authenticate(any())).thenReturn(ok);
        when(jwtService.generateToken("me@example.com")).thenReturn("jwt");

        assertThat(service.verifyUser(login("me@example.com", "secret"))).isEqualTo("jwt");
    }

    @Test
    void wrongPasswordIs401() {
        when(manager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> service.verifyUser(login("me@example.com", "wrong")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.UNAUTHORIZED))
                .hasMessageContaining("Wrong email or password");
    }

    @Test
    void blankLoginFieldsAre400() {
        assertThatThrownBy(() -> service.verifyUser(login(" ", "secret")))
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> service.verifyUser(login("me@example.com", "")))
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(manager, never()).authenticate(any());
    }

    // ── addUser ─────────────────────────────────────────────────────

    @Test
    void duplicateEmailIs409() {
        when(userRepo.findByemail("me@example.com")).thenReturn(user(1L, "me@example.com"));

        assertThatThrownBy(() -> service.addUser(signup("Me", "me@example.com", "secret")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("An account with that email already exists");
        verify(userRepo, never()).save(any());
    }

    @Test
    void signupDoesNotEchoThePasswordAndStoresAHash() {
        CreateUserReq req = signup("Me", "me@example.com", "secret");

        CreateUserReq res = service.addUser(req);

        assertThat(res.getPassword()).isNull();
        assertThat(res.getName()).isEqualTo("Me");
        assertThat(res.getEmail()).isEqualTo("me@example.com");
        ArgumentCaptor<Users> saved = ArgumentCaptor.forClass(Users.class);
        verify(userRepo).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isNotBlank().isNotEqualTo("secret");
    }

    @Test
    void blankSignupFieldsAre400() {
        assertThatThrownBy(() -> service.addUser(signup("", "me@example.com", "secret")))
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> service.addUser(signup("Me", null, "secret")))
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> service.addUser(signup("Me", "me@example.com", "  ")))
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(userRepo, never()).save(any());
    }

    // ── getuser ─────────────────────────────────────────────────────

    @Test
    void getuserWithoutAHeaderIs401() {
        assertThatThrownBy(() -> service.getuser(new MockHttpServletRequest()))
                .satisfies(t -> assertThat(statusOf(t)).isEqualTo(HttpStatus.UNAUTHORIZED));
    }
}
