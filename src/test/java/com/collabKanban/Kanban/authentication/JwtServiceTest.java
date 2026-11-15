package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.Users;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    static final String SECRET = Base64.getEncoder().encodeToString(new byte[32]);

    static DetailsOfUser details(String email) {
        Users user = new Users();
        user.setEmail(email);
        user.setName("Ada");
        return new DetailsOfUser(user);
    }

    @Test
    void configuredKeyRoundTripsAcrossInstances() {
        String token = new JwtService(SECRET).generateToken("ada@example.com");

        JwtService restarted = new JwtService(SECRET);

        assertEquals("ada@example.com", restarted.extractUserName(token));
        assertTrue(restarted.validateToken(token, details("ada@example.com")));
    }

    @Test
    void blankKeyGeneratesARandomKeyThatStillWorks() {
        JwtService service = new JwtService("  ");

        String token = service.generateToken("ada@example.com");

        assertEquals("ada@example.com", service.extractUserName(token));
        assertThrows(JwtException.class, () -> new JwtService("").extractUserName(token));
    }

    @Test
    void nullKeyIsTreatedAsBlank() {
        JwtService service = new JwtService(null);
        assertNotNull(service.generateToken("ada@example.com"));
    }

    @Test
    void shortKeyIsRejectedAtStartup() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);

        IllegalStateException e = assertThrows(IllegalStateException.class, () -> new JwtService(shortKey));
        assertTrue(e.getMessage().contains("32"));
    }

    @Test
    void nonBase64KeyIsRejectedAtStartup() {
        assertThrows(IllegalStateException.class, () -> new JwtService("not base64 !!!"));
    }

    @Test
    void validateTokenIsNullSafe() {
        JwtService service = new JwtService(SECRET);
        String token = service.generateToken("ada@example.com");

        assertFalse(service.validateToken(null, details("ada@example.com")));
        assertFalse(service.validateToken(token, null));
        assertFalse(service.validateToken(token, new DetailsOfUser(null)));
        assertFalse(service.validateToken(token, details(null)));
    }

    @Test
    void validateTokenRejectsAnotherUsersEmail() {
        JwtService service = new JwtService(SECRET);
        String token = service.generateToken("ada@example.com");

        assertFalse(service.validateToken(token, details("bob@example.com")));
    }

    @Test
    void expiredTokenThrowsJwtException() {
        JwtService service = new JwtService(SECRET);
        String expired = Jwts.builder()
                .subject("ada@example.com")
                .expiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(SECRET)))
                .compact();

        assertThrows(JwtException.class, () -> service.extractUserName(expired));
    }

    @Test
    void generateTokenRequiresEmail() {
        JwtService service = new JwtService(SECRET);
        assertThrows(IllegalArgumentException.class, () -> service.generateToken(" "));
    }
}
