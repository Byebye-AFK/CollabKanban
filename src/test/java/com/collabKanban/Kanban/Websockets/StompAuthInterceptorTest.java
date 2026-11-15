package com.collabKanban.Kanban.Websockets;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Boards.BoardRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.WorkSpace.Role;
import com.collabKanban.Kanban.WorkSpace.Workspace;
import com.collabKanban.Kanban.WorkSpace.WorkspaceMemberRepo;
import com.collabKanban.Kanban.authentication.DetailsOfUser;
import com.collabKanban.Kanban.authentication.JwtService;
import com.collabKanban.Kanban.authentication.MyuserDetailsService;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StompAuthInterceptorTest {

    private JwtService jwtService;
    private MyuserDetailsService userDetailsService;
    private BoardRepo boardRepo;
    private WorkspaceMemberRepo workspaceMemberRepo;
    private StompAuthInterceptor interceptor;
    private final MessageChannel channel = mock(MessageChannel.class);

    private Users user;
    private DetailsOfUser details;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        userDetailsService = mock(MyuserDetailsService.class);
        boardRepo = mock(BoardRepo.class);
        workspaceMemberRepo = mock(WorkspaceMemberRepo.class);
        interceptor = new StompAuthInterceptor(jwtService, userDetailsService, boardRepo, workspaceMemberRepo);

        user = new Users();
        user.setUserId(1L);
        user.setName("Me");
        user.setEmail("me@example.com");
        details = new DetailsOfUser(user);
    }

    /** Mutable headers, as on the real inbound channel, so setUser() sticks. */
    private static Message<byte[]> frame(StompHeaderAccessor accessor) {
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private static Message<byte[]> connect(String authorization) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        if (authorization != null) {
            accessor.addNativeHeader("Authorization", authorization);
        }
        return frame(accessor);
    }

    private Message<byte[]> subscribe(String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination(destination);
        accessor.setSubscriptionId("sub-0");
        accessor.setUser(new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
        return frame(accessor);
    }

    private static Board boardIn(Workspace workspace) {
        Board board = mock(Board.class);
        when(board.getWorkspace()).thenReturn(workspace);
        return board;
    }

    // ── CONNECT ─────────────────────────────────────────────────────

    @Test
    void connectWithoutATokenIsRejected() {
        assertThatThrownBy(() -> interceptor.preSend(connect(null), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    void connectWithAMalformedTokenIsRejected() {
        when(jwtService.extractUserName("garbage")).thenThrow(new MalformedJwtException("bad"));

        assertThatThrownBy(() -> interceptor.preSend(connect("Bearer garbage"), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    void connectWithAValidTokenAttachesTheUser() {
        when(jwtService.extractUserName("good")).thenReturn("me@example.com");
        when(userDetailsService.loadUserByUsername("me@example.com")).thenReturn(details);
        when(jwtService.validateToken("good", details)).thenReturn(true);

        Message<?> out = interceptor.preSend(connect("Bearer good"), channel);

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(out, StompHeaderAccessor.class);
        assertThat(accessor.getUser()).isInstanceOf(UsernamePasswordAuthenticationToken.class);
        assertThat(((UsernamePasswordAuthenticationToken) accessor.getUser()).getPrincipal()).isSameAs(details);
    }

    // ── SUBSCRIBE ───────────────────────────────────────────────────

    @Test
    void subscribeToABoardOutsideTheUsersWorkspacesIsRejected() {
        Workspace workspace = new Workspace();
        Board board = boardIn(workspace);
        when(boardRepo.findById(5L)).thenReturn(Optional.of(board));
        when(workspaceMemberRepo.getRoleOfMember(any(), any())).thenReturn(null);

        assertThatThrownBy(() -> interceptor.preSend(subscribe("/topic/board/5"), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void subscribeToABoardInTheUsersWorkspaceIsAllowed() {
        Workspace workspace = new Workspace();
        Board board = boardIn(workspace);
        when(boardRepo.findById(5L)).thenReturn(Optional.of(board));
        when(workspaceMemberRepo.getRoleOfMember(user, workspace)).thenReturn(Role.VIEWER);

        Message<byte[]> msg = subscribe("/topic/board/5");

        assertThat(interceptor.preSend(msg, channel)).isSameAs(msg);
    }

    @Test
    void subscribeToAnyOtherDestinationIsRejected() {
        assertThatThrownBy(() -> interceptor.preSend(subscribe("/topic/card/move/1"), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void sendIsRejectedBecauseTheSocketIsReceiveOnly() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setDestination("/topic/board/5");

        assertThatThrownBy(() -> interceptor.preSend(frame(accessor), channel))
                .isInstanceOf(AccessDeniedException.class);
    }
}
