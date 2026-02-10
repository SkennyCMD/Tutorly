package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.CalendarNoteCreateDTO;
import com.tutorly.app.backend_api.entity.CalendarNote;
import com.tutorly.app.backend_api.service.CalendarNoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Calendar Note entity operations
 * 
 * Manages calendar notes/events in the tutoring system.
 * Calendar notes can be used for scheduling lessons, reminders, and events.
 * All endpoints require API key authentication.
 * 
 * Base URL: /api/calendar-notes
 */
@RestController
@RequestMapping("/api/calendar-notes")
@CrossOrigin(origins = "*")
public class CalendarNoteController {
    
    @Autowired
    private CalendarNoteService calendarNoteService;
    
    /**
     * Get all calendar notes
     * 
     * @return List of all calendar notes
     * @apiNote GET /api/calendar-notes
     */
    @GetMapping
    public ResponseEntity<List<CalendarNote>> getAllCalendarNotes() {
        return ResponseEntity.ok(calendarNoteService.getAllCalendarNotes());
    }
    
    /**
     * Get calendar note by ID
     * 
     * @param id The calendar note ID
     * @return Calendar note if found, 404 Not Found otherwise
     * @apiNote GET /api/calendar-notes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CalendarNote> getCalendarNoteById(@PathVariable Long id) {
        Optional<CalendarNote> calendarNote = calendarNoteService.getCalendarNoteById(id);
        return calendarNote.map(ResponseEntity::ok)
                           .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all calendar notes created by a specific admin
     * 
     * @param creatorId The admin ID who created the notes
     * @return List of calendar notes created by the specified admin
     * @apiNote GET /api/calendar-notes/creator/{creatorId}
     */
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<CalendarNote>> getCalendarNotesByCreator(@PathVariable Long creatorId) {
        return ResponseEntity.ok(calendarNoteService.getCalendarNotesByCreator(creatorId));
    }
    
    /**
     * Get all calendar notes assigned to a specific tutor
     * 
     * @param tutorId The tutor ID
     * @return List of calendar notes for the specified tutor
     * @apiNote GET /api/calendar-notes/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<CalendarNote>> getCalendarNotesByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(calendarNoteService.getCalendarNotesByTutor(tutorId));
    }
    
    /**
     * Get calendar notes within a date range
     * 
     * Useful for fetching events for a specific week, month, or custom period.
     * 
     * @param start Start date/time (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)
     * @param end End date/time (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)
     * @return List of calendar notes within the specified date range
     * @apiNote GET /api/calendar-notes/date-range?start=2026-01-01T00:00:00&end=2026-01-31T23:59:59
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<CalendarNote>> getCalendarNotesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(calendarNoteService.getCalendarNotesByDateRange(start, end));
    }
    
    /**
     * Create a new calendar note
     * 
     * @param dto The calendar note data to create (with IDs)
     * @return Created calendar note with 201 Created status
     * @apiNote POST /api/calendar-notes
     */
    @PostMapping
    public ResponseEntity<CalendarNote> createCalendarNote(@RequestBody CalendarNoteCreateDTO dto) {
        try {
            CalendarNote savedCalendarNote = calendarNoteService.createCalendarNoteFromDTO(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCalendarNote);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Update an existing calendar note using DTO with IDs
     * 
     * @param id The calendar note ID to update
     * @param dto The updated calendar note data with creator and tutor IDs
     * @return Updated calendar note if found, 404 Not Found otherwise
     * @apiNote PUT /api/calendar-notes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCalendarNoteFromDTO(@PathVariable Long id, @RequestBody CalendarNoteCreateDTO dto) {
        try {
            // Check if note exists
            Optional<CalendarNote> existingNote = calendarNoteService.getCalendarNoteById(id);
            if (existingNote.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Update using service method
            CalendarNote updatedNote = calendarNoteService.updateCalendarNoteFromDTO(id, dto);
            return ResponseEntity.ok(updatedNote);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating calendar note: " + e.getMessage());
        }
    }
    
    /**
     * Delete a calendar note
     * 
     * @param id The calendar note ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if note doesn't exist
     * @apiNote DELETE /api/calendar-notes/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCalendarNote(@PathVariable Long id) {
        if (calendarNoteService.getCalendarNoteById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        calendarNoteService.deleteCalendarNote(id);
        return ResponseEntity.noContent().build();
    }
}
