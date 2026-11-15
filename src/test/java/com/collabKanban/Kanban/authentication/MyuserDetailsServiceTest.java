package com.collabKanban.Kanban.authentication;

import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MyuserDetailsServiceTest {

    private UserRepo userRepo;
    private MyuserDetailsService service;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepo.class);
        service = new MyuserDetailsService();
        service.setUserRepo(userRepo);
    }

    @Test
    void knownEmailReturnsDetails() {
        Users user = new Users();
        user.setEmail("ada@example.com");
        user.setName("Ada");
        when(userRepo.findByemail("ada@example.com")).thenReturn(user);

        UserDetails details = service.loadUserByUsername("ada@example.com");

        assertSame(user, ((DetailsOfUser) details).getUser());
    }

    @Test
    void unknownEmailThrowsUsernameNotFound() {
        when(userRepo.findByemail("nobody@example.com")).thenReturn(null);

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("nobody@example.com"));
    }

    @Test
    void blankEmailThrowsWithoutQuerying() {
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername(" "));
        verifyNoInteractions(userRepo);
    }

    @Test
    void repositoryExceptionsAreNotWrapped() {
        IllegalStateException failure = new IllegalStateException("db down");
        when(userRepo.findByemail(anyString())).thenThrow(failure);

        IllegalStateException thrown = assertThrows(IllegalStateException.class,
                () -> service.loadUserByUsername("ada@example.com"));
        assertSame(failure, thrown);
    }
}
