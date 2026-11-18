package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.TicketCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.Ticket;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AdminRepository;
import com.tutorly.app.backend_api.repository.TicketRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Ticket entity: reading, submitting a new one, and an
 * admin moving it through its "open" -&gt; "managing" -&gt; "closed" lifecycle -
 * see {@link com.tutorly.app.backend_api.controller.TicketController}.
 */
@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Optional<Ticket> getTicketById(Long id) {
        return ticketRepository.findById(id);
    }

    public List<Ticket> getTicketsByUser(Long userId) {
        return ticketRepository.findByUser_Id(userId);
    }

    /**
     * Creates a new ticket from a DTO with a plain user ID. Always saved as
     * "open" with no admin assigned, regardless of what's in the request body.
     *
     * @param dto The ticket data to create
     * @return The created ticket
     * @throws IllegalArgumentException if content is blank, or userId is set but doesn't exist
     */
    public Ticket createTicket(TicketCreateDTO dto) {
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new IllegalArgumentException("content is required");
        }

        User user = null;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + dto.getUserId()));
        }

        Ticket ticket = new Ticket(dto.getContent(), LocalDateTime.now(), user);
        return ticketRepository.save(ticket);
    }

    /**
     * An admin picks up an open ticket, moving it to "managing".
     *
     * @param id      The ticket to pick up
     * @param adminId The admin picking it up
     * @return The updated ticket
     * @throws IllegalArgumentException if the ticket/admin doesn't exist, or the ticket isn't "open"
     */
    public Ticket startManaging(Long id, Long adminId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + id));
        if (!"open".equals(ticket.getStatus())) {
            throw new IllegalArgumentException("Only an open ticket can be put into management");
        }

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found with ID: " + adminId));

        ticket.setStatus("managing");
        ticket.setAdmin(admin);
        return ticketRepository.save(ticket);
    }

    /**
     * An admin closes a ticket they're (or another admin is) managing.
     *
     * @param id      The ticket to close
     * @param adminId The admin closing it
     * @param comment Optional resolution comment
     * @return The updated ticket
     * @throws IllegalArgumentException if the ticket/admin doesn't exist, or the ticket isn't "managing"
     */
    public Ticket closeTicket(Long id, Long adminId, String comment) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + id));
        if (!"managing".equals(ticket.getStatus())) {
            throw new IllegalArgumentException("Only a ticket being managed can be closed");
        }

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found with ID: " + adminId));

        ticket.setStatus("closed");
        ticket.setAdmin(admin);
        ticket.setClosure(LocalDateTime.now());
        ticket.setComment(comment);
        return ticketRepository.save(ticket);
    }
}
