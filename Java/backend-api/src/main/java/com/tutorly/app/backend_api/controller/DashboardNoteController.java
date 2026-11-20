package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.DashboardNoteCreateDTO;
import com.tutorly.app.backend_api.entity.DashboardNote;
import com.tutorly.app.backend_api.service.DashboardNoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for DashboardNote entity operations.
 *
 * Backs the Node.js frontend's admin-only Dashboard Notes page - see
 * docs/03_Nodejs_Frontend.md. All endpoints require API key authentication.
 * Role restriction (only an admin can view/publish notices) is enforced in
 * the Node.js layer, not here - same as every other entity in this codebase.
 *
 * Base URL: /api/dashboard-notes
 */
@RestController
@RequestMapping("/api/dashboard-notes")
@CrossOrigin(origins = "*")
public class DashboardNoteController {

    @Autowired
    private DashboardNoteService dashboardNoteService;

    /**
     * Get every notice, active and expired alike.
     *
     * @return List of all dashboard notes
     * @apiNote GET /api/dashboard-notes
     */
    @GetMapping
    public ResponseEntity<List<DashboardNote>> getAllNotes() {
        return ResponseEntity.ok(dashboardNoteService.getAllNotes());
    }

    /**
     * Get a notice by ID.
     *
     * @param id The note ID
     * @return The note if found, 404 Not Found otherwise
     * @apiNote GET /api/dashboard-notes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DashboardNote> getNoteById(@PathVariable Long id) {
        Optional<DashboardNote> note = dashboardNoteService.getNoteById(id);
        return note.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get every notice distributed to a specific user (see_dashboard_note) -
     * used by the Node.js frontend's own dashboard page to show each user
     * only the notices meant for them.
     *
     * @param userId The recipient's user ID
     * @return List of notes that user was fanned out to
     * @apiNote GET /api/dashboard-notes/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DashboardNote>> getNotesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(dashboardNoteService.getNotesByUser(userId));
    }

    /**
     * Mark a note as viewed by a user ("Sign as viewed" in the Node.js
     * frontend): removes their row from {@code see_dashboard_note}.
     *
     * @param noteId The note's ID
     * @param userId The user who viewed it
     * @return 404 if the note doesn't exist, 204 No Content otherwise
     * @apiNote DELETE /api/dashboard-notes/{noteId}/user/{userId}
     */
    @DeleteMapping("/{noteId}/user/{userId}")
    public ResponseEntity<Void> markAsViewed(@PathVariable Long noteId, @PathVariable Long userId) {
        if (dashboardNoteService.getNoteById(noteId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        dashboardNoteService.markAsViewed(noteId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Clear every {@code see_dashboard_note} row for a note - used by the
     * Node.js frontend's daily midnight cleanup of expired notices.
     *
     * @param noteId The note's ID
     * @return 404 if the note doesn't exist, 204 No Content otherwise
     * @apiNote DELETE /api/dashboard-notes/{noteId}/recipients
     */
    @DeleteMapping("/{noteId}/recipients")
    public ResponseEntity<Void> clearRecipients(@PathVariable Long noteId) {
        if (dashboardNoteService.getNoteById(noteId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        dashboardNoteService.clearRecipients(noteId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Publish a new notice.
     *
     * @param dto The note data to create (content, expiration, adminId)
     * @return Created note with 201 Created status, or 400 if invalid/admin not found
     * @apiNote POST /api/dashboard-notes
     */
    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody DashboardNoteCreateDTO dto) {
        try {
            DashboardNote saved = dashboardNoteService.createNote(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
