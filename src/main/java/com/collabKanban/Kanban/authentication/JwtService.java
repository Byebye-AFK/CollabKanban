package com.collabKanban.Kanban.authentication;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    // HS256 needs a key of at least 256 bits.
    static final int MIN_KEY_BYTES = 32;
    private static final long TOKEN_TTL_MILLIS = 1000L * 60 * 60 * 24;

    private final SecretKey key;

    // jwt.secret comes from the `jwtsecret` env var (see application.properties).
    // When it is blank we fall back to a random key so local dev still starts,
    // but every token then dies on restart, so we warn loudly.
    public JwtService(@Value("${jwt.secret:}") String secret) {
        this.key = (secret == null || secret.isBlank()) ? generateKey() : decodeKey(secret.trim());
    }

    private static SecretKey decodeKey(String secret) {
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("jwt.secret (env var jwtsecret) must be Base64-encoded", e);
        }
        if (keyBytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException("jwt.secret (env var jwtsecret) must decode to at least "
                    + MIN_KEY_BYTES + " bytes, got " + keyBytes.length);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private static SecretKey generateKey() {
        log.warn("jwt.secret is not set: generated a random signing key. Issued tokens will not "
                + "survive a restart. Set the jwtsecret env var to a Base64 key of at least "
                + MIN_KEY_BYTES + " bytes.");
        try {
            return KeyGenerator.getInstance("HmacSHA256").generateKey();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("HmacSHA256 is not available on this JVM", e);
        }
    }

    public String generateToken(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Cannot issue a token without an email");
        }
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TOKEN_TTL_MILLIS))
                .signWith(key)
                .compact();
    }

    /** Throws a JwtException for a bad signature, malformed or expired token. */
    public String extractUserName(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimResolver) {
        return claimResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token, DetailsOfUser userDetails) {
        if (token == null || userDetails == null || userDetails.getUser() == null) {
            return false;
        }
        String email = userDetails.getEmail();
        Claims claims = extractAllClaims(token);
        Date expiration = claims.getExpiration();
        return email != null
                && email.equals(claims.getSubject())
                && (expiration == null || expiration.after(new Date()));
    }
}
