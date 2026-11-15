package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OauthService implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OauthService.class);
    static final String CALLBACK_PATH = "/oauth2/callback";

    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final String frontendUrl;

    public OauthService(JwtService jwtService, UserRepo userRepo,
                        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.frontendUrl = stripTrailingSlash(frontendUrl);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User user = (OAuth2User) authentication.getPrincipal();
        String email = user.getAttribute("email");
        if (email == null || email.isBlank()) {
            log.warn("OAuth2 login without an email attribute; refusing to issue a token");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "OAuth2 account has no email");
            return;
        }

        if (userRepo.findByemail(email) == null) {
            Users newUser = new Users();
            newUser.setName(displayName(user.getAttribute("name"), email));
            newUser.setEmail(email);
            userRepo.save(newUser);
        }

        // The token goes in the fragment, not the query string: fragments are
        // never sent to a server and never appear in a Referer header.
        String token = jwtService.generateToken(email);
        response.sendRedirect(frontendUrl + CALLBACK_PATH + "#token=" + token);
    }

    // Google's principal name is the numeric `sub`, so prefer the profile name,
    // then the email's local part, then the whole email.
    static String displayName(String nameAttribute, String email) {
        if (nameAttribute != null && !nameAttribute.isBlank()) {
            return nameAttribute.trim();
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private static String stripTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("app.frontend-url (env var frontendurl) must not be blank");
        }
        String trimmed = url.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }
}
