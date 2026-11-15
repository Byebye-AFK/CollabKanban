package com.collabKanban.Kanban.Websockets;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Boards.BoardRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMemberRepo;
import com.collabKanban.Kanban.authentication.DetailsOfUser;
import com.collabKanban.Kanban.authentication.JwtService;
import com.collabKanban.Kanban.authentication.MyuserDetailsService;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Guards the STOMP channel, which JwtFilter never sees (it is servlet-only
 * and /ws/** is public so the handshake can happen).
 *
 *  - CONNECT must carry "Authorization: Bearer <jwt>"; the user is attached
 *    to the session so later frames know who sent them.
 *  - SUBSCRIBE is allowed only to /topic/board/{boardId} for a member of
 *    that board's workspace.
 *  - SEND is refused: the socket is receive-only, and with no application
 *    prefix a SEND to /topic would otherwise reach every subscriber.
 *
 * WorkspaceAccess cannot be used here: there is no HTTP SecurityContext on a
 * STOMP frame, so the user comes from the session instead.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthInterceptor.class);

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    // 18 digits keeps Long.parseLong from overflowing.
    private static final Pattern BOARD_TOPIC = Pattern.compile("^/topic/board/(\\d{1,18})$");

    private final JwtService jwtService;
    private final MyuserDetailsService userDetailsService;
    private final BoardRepo boardRepo;
    private final WorkspaceMemberRepo workspaceMemberRepo;

    public StompAuthInterceptor(JwtService jwtService, MyuserDetailsService userDetailsService,
                                BoardRepo boardRepo, WorkspaceMemberRepo workspaceMemberRepo) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.boardRepo = boardRepo;
        this.workspaceMemberRepo = workspaceMemberRepo;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            // Heartbeats and other non-STOMP-command frames.
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT || command == StompCommand.STOMP) {
            accessor.setUser(authenticate(accessor));
        } else if (command == StompCommand.SUBSCRIBE) {
            authorizeSubscribe(accessor);
        } else if (command == StompCommand.SEND) {
            throw new AccessDeniedException("This socket is receive-only");
        }
        return message;
    }

    // ── CONNECT ─────────────────────────────────────────────────────
    private UsernamePasswordAuthenticationToken authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader(AUTH_HEADER);
        if (header == null || !header.startsWith(BEARER_PREFIX) || header.length() == BEARER_PREFIX.length()) {
            throw new MessageDeliveryException("Missing bearer token");
        }
        String token = header.substring(BEARER_PREFIX.length());

        try {
            String email = jwtService.extractUserName(token);
            if (email == null || email.isBlank()) {
                throw new MessageDeliveryException("Invalid token");
            }
            UserDetails loaded = userDetailsService.loadUserByUsername(email);
            if (!(loaded instanceof DetailsOfUser details) || details.getUser() == null
                    || !jwtService.validateToken(token, details)) {
                throw new MessageDeliveryException("Invalid token");
            }
            return new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
            log.debug("Rejected STOMP CONNECT", e);
            throw new MessageDeliveryException("Invalid token");
        }
    }

    // ── SUBSCRIBE ───────────────────────────────────────────────────
    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        Users user = sessionUser(accessor.getUser())
                .orElseThrow(() -> new AccessDeniedException("Not signed in"));

        Long boardId = boardIdOf(accessor.getDestination())
                .orElseThrow(() -> new AccessDeniedException("Unknown destination"));

        // Board.workspace is an eager ManyToOne, so no open session is needed.
        Board board = boardRepo.findById(boardId)
                .orElseThrow(() -> new AccessDeniedException("Board not found"));

        if (board.getWorkspace() == null
                || workspaceMemberRepo.getRoleOfMember(user, board.getWorkspace()) == null) {
            throw new AccessDeniedException("You are not a member of this board's workspace");
        }
    }

    private static Optional<Users> sessionUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof DetailsOfUser details) {
            return Optional.ofNullable(details.getUser());
        }
        return Optional.empty();
    }

    static Optional<Long> boardIdOf(String destination) {
        if (destination == null) {
            return Optional.empty();
        }
        Matcher matcher = BOARD_TOPIC.matcher(destination);
        return matcher.matches() ? Optional.of(Long.parseLong(matcher.group(1))) : Optional.empty();
    }
}
