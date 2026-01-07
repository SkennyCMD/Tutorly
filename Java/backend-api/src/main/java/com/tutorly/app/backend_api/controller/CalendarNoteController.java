package com.tutorly.app.backend_api.controller;

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

@RestController
@RequestMapping("/api/calendar-notes")
@CrossOrigin(origins = "*")
public class CalendarNoteController {
    
    @Autowired
    private CalendarNoteService calendarNoteService;
    
    @GetMapping
    public ResponseEntity<List<CalendarNote>> getAllCalendarNotes() {
        return ResponseEntity.ok(calendarNoteService.getAllCalendarNotes());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CalendarNote> getCalendarNoteById(@PathVariable Long id) {
        Optional<CalendarNote> calendarNote = calendarNoteService.getCalendarNoteById(id);
        return calendarNote.map(ResponseEntity::ok)
                           .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<CalendarNote>> getCalendarNotesByCreator(@PathVariable Long creatorId) {
        return ResponseEntity.ok(calendarNoteService.getCalendarNotesByCreator(creatorId));
    }
    
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<CalendarNote>> getCalendarNotesByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(calendarNoteService.getCalendarNotesByTutor(tutorId));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<CalendarNote>> getCalendarNotesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(calendarNoteService.getCalendarNotesByDateRange(start, end));
    }
    
    @PostMapping
    public ResponseEntity<CalendarNote> createCalendarNote(@RequestBody CalendarNote calendarNote) {
        CalendarNote savedCalendarNote = calendarNoteService.saveCalendarNote(calendarNote);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCalendarNote);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CalendarNote> updateCalendarNote(@PathVariable Long id, @RequestBody CalendarNote calendarNote) {
        if (calendarNoteService.getCalendarNoteById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        calendarNote.setId(id);
        return ResponseEntity.ok(calendarNoteService.saveCalendarNote(calendarNote));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCalendarNote(@PathVariable Long id) {
        if (calendarNoteService.getCalendarNoteById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        calendarNoteService.deleteCalendarNote(id);
        return ResponseEntity.noContent().build();
    }
}
