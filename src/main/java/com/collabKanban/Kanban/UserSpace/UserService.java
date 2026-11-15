package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
import com.collabKanban.Kanban.DTO.UserAuthReq;
import com.collabKanban.Kanban.WorkSpace.WorkspaceAccess;
import com.collabKanban.Kanban.authentication.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

@Service
public class UserService {

    private static final int BCRYPT_STRENGTH = 12;
    private static final String BEARER_PREFIX = "Bearer ";

    private final UserRepo userRepo;
    private final AuthenticationManager manager;
    private final JwtService jwtService;
    private final WorkspaceAccess access;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCRYPT_STRENGTH);

    public UserService(UserRepo userRepo, AuthenticationManager manager,
                       JwtService jwtService, WorkspaceAccess access) {
        this.userRepo = userRepo;
        this.manager = manager;
        this.jwtService = jwtService;
        this.access = access;
    }

    // ── Signup ──────────────────────────────────────────────────────
    // The response keeps the request's shape so the frontend contract is
    // unchanged, but never echoes the password back.
    public CreateUserReq addUser(CreateUserReq user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String name = requireText(user.getName(), "Name");
        String email = requireText(user.getEmail(), "Email");
        String password = requireText(user.getPassword(), "Password");

        // The unique column still backs this up (409 via GlobalExceptionHandler)
        // if two signups race past the check.
        if (userRepo.findByemail(email) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists");
        }

        Users users = new Users();
        users.setName(name);
        users.setEmail(email);
        users.setPassword(encoder.encode(password));
        userRepo.save(users);

        CreateUserReq response = new CreateUserReq();
        response.setName(name);
        response.setEmail(email);
        response.setPassword(null);
        return response;
    }

    // ── Delete account ─────────────────────────────────────────────
    // Ownership is checked before existence, so a caller cannot probe which
    // ids exist by deleting other people's accounts.
    @Transactional
    public CreateUserReq deleteUser(Long userId) {
        Users caller = access.currentUser();
        if (userId == null || !Objects.equals(caller.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own account");
        }

        Users user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        CreateUserReq response = new CreateUserReq();
        response.setName(user.getName());
        response.setEmail(user.getEmail());

        userRepo.delete(user);
        return response;
    }

    // ── Current user from a raw request ────────────────────────────
    // Kept null-safe for callers that still pass the servlet request; new
    // code should use WorkspaceAccess.currentUser() instead.
    public Users getuser(HttpServletRequest request) {
        String header = request == null ? null : request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER_PREFIX) || header.length() == BEARER_PREFIX.length()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again");
        }

        String email;
        try {
            email = jwtService.extractUserName(header.substring(BEARER_PREFIX.length()));
        } catch (JwtException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again");
        }

        Users user = email == null ? null : userRepo.findByemail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again");
        }
        return user;
    }

    // ── Login ──────────────────────────────────────────────────────
    public String verifyUser(UserAuthReq user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String email = requireText(user.getEmail(), "Email");
        String password = requireText(user.getPassword(), "Password");

        Authentication auth;
        try {
            auth = manager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong email or password");
        }
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong email or password");
        }
        return jwtService.generateToken(email);
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value;
    }
}
