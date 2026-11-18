package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.TicketCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.Ticket;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AdminRepository;
import com.tutorly.app.backend_api.repository.TicketRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link TicketService}: the read methods are a thin
 * pass-through to {@link TicketRepository}; createTicket/startManaging/
 * closeTicket have real validation logic (content, lifecycle status, user/
 * admin existence).
 */
@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AdminRepository adminRepository;

    @InjectMocks
    private TicketService ticketService;

    private User user;
    private Admin admin;

    @BeforeEach
    void setUp() {
        user = new User("tutor.a", "hashedPassword123", "ACTIVE", "GENERIC");
        user.setId(4L);
        admin = new Admin("admin@tutorly.test", "hashedPassword123", "admin.one");
        admin.setId(1L);
    }

    @Test
    void getAllTickets_delegatesToRepository() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        when(ticketRepository.findAll()).thenReturn(List.of(ticket));

        assertThat(ticketService.getAllTickets()).containsExactly(ticket);
    }

    @Test
    void getTicketById_delegatesToRepository() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));

        assertThat(ticketService.getTicketById(7L)).contains(ticket);
    }

    @Test
    void getTicketsByUser_delegatesToRepository() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        when(ticketRepository.findByUser_Id(4L)).thenReturn(List.of(ticket));

        assertThat(ticketService.getTicketsByUser(4L)).containsExactly(ticket);
    }

    @Test
    void createTicket_valid_savesAsOpenWithNoAdmin() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketCreateDTO dto = new TicketCreateDTO("I can't access my materials", 4L);
        Ticket result = ticketService.createTicket(dto);

        assertThat(result.getContent()).isEqualTo("I can't access my materials");
        assertThat(result.getStatus()).isEqualTo("open");
        assertThat(result.getUser()).isEqualTo(user);
        assertThat(result.getAdmin()).isNull();
    }

    @Test
    void createTicket_noUserId_savesWithNoRequester() {
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketCreateDTO dto = new TicketCreateDTO("Anonymous report", null);
        Ticket result = ticketService.createTicket(dto);

        assertThat(result.getUser()).isNull();
        verify(userRepository, never()).findById(any());
    }

    @Test
    void createTicket_blankContent_throwsAndDoesNotSave() {
        TicketCreateDTO dto = new TicketCreateDTO("   ", 4L);

        assertThatThrownBy(() -> ticketService.createTicket(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void createTicket_userNotFound_throwsAndDoesNotSave() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        TicketCreateDTO dto = new TicketCreateDTO("Help", 99L);

        assertThatThrownBy(() -> ticketService.createTicket(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void startManaging_valid_setsStatusAndAdmin() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));
        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket result = ticketService.startManaging(7L, 1L);

        assertThat(result.getStatus()).isEqualTo("managing");
        assertThat(result.getAdmin()).isEqualTo(admin);
    }

    @Test
    void startManaging_notOpen_throwsAndDoesNotSave() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        ticket.setStatus("managing");
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.startManaging(7L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void startManaging_ticketNotFound_throwsAndDoesNotSave() {
        when(ticketRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.startManaging(404L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void startManaging_adminNotFound_throwsAndDoesNotSave() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));
        when(adminRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.startManaging(7L, 99L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void closeTicket_valid_setsStatusClosureAndComment() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        ticket.setStatus("managing");
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));
        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket result = ticketService.closeTicket(7L, 1L, "Resolved via email.");

        assertThat(result.getStatus()).isEqualTo("closed");
        assertThat(result.getAdmin()).isEqualTo(admin);
        assertThat(result.getClosure()).isNotNull();
        assertThat(result.getComment()).isEqualTo("Resolved via email.");
    }

    @Test
    void closeTicket_notManaging_throwsAndDoesNotSave() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.closeTicket(7L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void closeTicket_ticketNotFound_throwsAndDoesNotSave() {
        when(ticketRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.closeTicket(404L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void closeTicket_adminNotFound_throwsAndDoesNotSave() {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user);
        ticket.setId(7L);
        ticket.setStatus("managing");
        when(ticketRepository.findById(7L)).thenReturn(Optional.of(ticket));
        when(adminRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.closeTicket(7L, 99L, null))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ticketRepository, never()).save(any());
    }
}
