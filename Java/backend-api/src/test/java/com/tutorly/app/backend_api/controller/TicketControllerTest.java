package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.TicketAdminActionDTO;
import com.tutorly.app.backend_api.dto.TicketCloseDTO;
import com.tutorly.app.backend_api.dto.TicketCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.Ticket;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.TicketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link TicketController}: the three GET endpoints, plus
 * createTicket/startManaging/closeTicket's success/validation-error branches.
 */
@WebMvcTest(TicketController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class TicketControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TicketService ticketService;

    private User user() {
        User u = new User("tutor1", "hashedPassword123", "ACTIVE", "GENERIC");
        u.setId(4L);
        return u;
    }

    private Admin admin() {
        Admin a = new Admin("admin@tutorly.test", "hashedPassword123", "admin.one");
        a.setId(1L);
        return a;
    }

    @Test
    void getAllTickets_returns200WithList() throws Exception {
        when(ticketService.getAllTickets()).thenReturn(List.of(new Ticket()));

        mockMvc.perform(get("/api/tickets").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void getTicketById_found_returns200() throws Exception {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user());
        ticket.setId(7L);
        when(ticketService.getTicketById(7L)).thenReturn(Optional.of(ticket));

        mockMvc.perform(get("/api/tickets/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("open"))
                .andExpect(jsonPath("$.userId").value(4));
    }

    @Test
    void getTicketById_notFound_returns404() throws Exception {
        when(ticketService.getTicketById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/tickets/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void getTicketsByUser_returns200WithList() throws Exception {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user());
        when(ticketService.getTicketsByUser(4L)).thenReturn(List.of(ticket));

        mockMvc.perform(get("/api/tickets/user/4").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(4));
    }

    @Test
    void createTicket_valid_returns201() throws Exception {
        Ticket saved = new Ticket("Help", LocalDateTime.now(), user());
        saved.setId(7L);
        when(ticketService.createTicket(any())).thenReturn(saved);

        TicketCreateDTO dto = new TicketCreateDTO("Help", 4L);

        mockMvc.perform(post("/api/tickets")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void createTicket_invalid_returns400() throws Exception {
        when(ticketService.createTicket(any()))
                .thenThrow(new IllegalArgumentException("content is required"));

        TicketCreateDTO dto = new TicketCreateDTO("   ", 4L);

        mockMvc.perform(post("/api/tickets")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void startManaging_found_returns200() throws Exception {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user());
        ticket.setId(7L);
        when(ticketService.getTicketById(7L)).thenReturn(Optional.of(ticket));

        Ticket managing = new Ticket("Help", LocalDateTime.now(), user());
        managing.setId(7L);
        managing.setStatus("managing");
        managing.setAdmin(admin());
        when(ticketService.startManaging(7L, 1L)).thenReturn(managing);

        mockMvc.perform(put("/api/tickets/7/manage")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketAdminActionDTO(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("managing"))
                .andExpect(jsonPath("$.adminId").value(1));
    }

    @Test
    void startManaging_notFound_returns404() throws Exception {
        when(ticketService.getTicketById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/tickets/99/manage")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketAdminActionDTO(1L))))
                .andExpect(status().isNotFound());
    }

    @Test
    void startManaging_invalid_returns400() throws Exception {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user());
        ticket.setId(7L);
        ticket.setStatus("managing");
        when(ticketService.getTicketById(7L)).thenReturn(Optional.of(ticket));
        when(ticketService.startManaging(eq(7L), any()))
                .thenThrow(new IllegalArgumentException("Only an open ticket can be put into management"));

        mockMvc.perform(put("/api/tickets/7/manage")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketAdminActionDTO(1L))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void closeTicket_found_returns200() throws Exception {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user());
        ticket.setId(7L);
        ticket.setStatus("managing");
        when(ticketService.getTicketById(7L)).thenReturn(Optional.of(ticket));

        Ticket closed = new Ticket("Help", LocalDateTime.now(), user());
        closed.setId(7L);
        closed.setStatus("closed");
        closed.setClosure(LocalDateTime.now());
        closed.setComment("Resolved.");
        closed.setAdmin(admin());
        when(ticketService.closeTicket(7L, 1L, "Resolved.")).thenReturn(closed);

        mockMvc.perform(put("/api/tickets/7/close")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketCloseDTO(1L, "Resolved."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("closed"))
                .andExpect(jsonPath("$.comment").value("Resolved."));
    }

    @Test
    void closeTicket_notFound_returns404() throws Exception {
        when(ticketService.getTicketById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/tickets/99/close")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketCloseDTO(1L, null))))
                .andExpect(status().isNotFound());
    }

    @Test
    void closeTicket_invalid_returns400() throws Exception {
        Ticket ticket = new Ticket("Help", LocalDateTime.now(), user());
        ticket.setId(7L);
        when(ticketService.getTicketById(7L)).thenReturn(Optional.of(ticket));
        when(ticketService.closeTicket(eq(7L), any(), any()))
                .thenThrow(new IllegalArgumentException("Only a ticket being managed can be closed"));

        mockMvc.perform(put("/api/tickets/7/close")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketCloseDTO(1L, null))))
                .andExpect(status().isBadRequest());
    }
}
