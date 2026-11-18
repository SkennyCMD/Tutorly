package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.TicketAdminActionDTO;
import com.tutorly.app.backend_api.dto.TicketCloseDTO;
import com.tutorly.app.backend_api.dto.TicketCreateDTO;
import com.tutorly.app.backend_api.entity.Ticket;
import com.tutorly.app.backend_api.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Ticket entity operations.
 *
 * Backs the Node.js frontend's admin-only support ticket page - see
 * docs/03_Nodejs_Frontend.md. All endpoints require API key authentication.
 * Role restriction (only an admin can list/manage tickets) is enforced in the
 * Node.js layer, not here - same as every other entity in this codebase.
 *
 * Base URL: /api/tickets
 */
@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    /**
     * Get every ticket, regardless of status.
     *
     * @return List of all tickets
     * @apiNote GET /api/tickets
     */
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    /**
     * Get a ticket by ID.
     *
     * @param id The ticket ID
     * @return The ticket if found, 404 Not Found otherwise
     * @apiNote GET /api/tickets/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        Optional<Ticket> ticket = ticketService.getTicketById(id);
        return ticket.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get every ticket raised by a specific user.
     *
     * @param userId The user's ID
     * @return List of tickets raised by that user
     * @apiNote GET /api/tickets/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getTicketsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    /**
     * Create a new ticket. Always saved as "open".
     *
     * @param dto The ticket data to create (content, userId)
     * @return Created ticket with 201 Created status, or 400 if invalid/user not found
     * @apiNote POST /api/tickets
     */
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketCreateDTO dto) {
        try {
            Ticket saved = ticketService.createTicket(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * An admin picks up an open ticket, moving it to "managing".
     *
     * @param id  The ticket ID
     * @param dto The admin picking it up
     * @return Updated ticket, 404 if it doesn't exist, 400 if invalid (wrong status/admin not found)
     * @apiNote PUT /api/tickets/{id}/manage
     */
    @PutMapping("/{id}/manage")
    public ResponseEntity<?> startManaging(@PathVariable Long id, @RequestBody TicketAdminActionDTO dto) {
        if (ticketService.getTicketById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        try {
            return ResponseEntity.ok(ticketService.startManaging(id, dto.getAdminId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * An admin closes a ticket being managed, optionally with a resolution comment.
     *
     * @param id  The ticket ID
     * @param dto The admin closing it, and an optional comment
     * @return Updated ticket, 404 if it doesn't exist, 400 if invalid (wrong status/admin not found)
     * @apiNote PUT /api/tickets/{id}/close
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeTicket(@PathVariable Long id, @RequestBody TicketCloseDTO dto) {
        if (ticketService.getTicketById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        try {
            return ResponseEntity.ok(ticketService.closeTicket(id, dto.getAdminId(), dto.getComment()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
