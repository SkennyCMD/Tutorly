package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.CalendarNoteCreateDTO;
import com.tutorly.app.backend_api.entity.CalendarNote;
import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.repository.CalendarNoteRepository;
import com.tutorly.app.backend_api.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Service layer for CalendarNote entity business logic
 * 
 * Provides business logic and operations for calendar note management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by creator/tutor, and date range filtering.
 */
@Service
public class CalendarNoteService {
    
    @Autowired
    private CalendarNoteRepository calendarNoteRepository;
    
    @Autowired
    private TutorRepository tutorRepository;
    
    /**
     * Retrieve all calendar notes
     * 
     * @return List of all calendar notes in the system
     */
    public List<CalendarNote> getAllCalendarNotes() {
        return calendarNoteRepository.findAll();
    }
    
    /**
     * Find a calendar note by ID
     * 
     * @param id The calendar note ID to search for
     * @return Optional containing the calendar note if found, empty otherwise
     */
    public Optional<CalendarNote> getCalendarNoteById(Long id) {
        return calendarNoteRepository.findById(id);
    }
    
    /**
     * Find all calendar notes created by a specific tutor
     * 
     * @param creatorId The ID of the tutor who created the notes
     * @return List of calendar notes created by the specified tutor
     */
    public List<CalendarNote> getCalendarNotesByCreator(Long creatorId) {
        return calendarNoteRepository.findByCreatorId(creatorId);
    }
    
    /**
     * Find all calendar notes associated with a specific tutor
     * 
     * Returns notes where the tutor is in the associated tutors collection
     * (many-to-many relationship). This is different from getCalendarNotesByCreator.
     * 
     * @param tutorId The ID of the associated tutor
     * @return List of calendar notes associated with the specified tutor
     */
    public List<CalendarNote> getCalendarNotesByTutor(Long tutorId) {
        return calendarNoteRepository.findByTutorsId(tutorId);
    }
    
    /**
     * Find calendar notes within a specific date/time range
     * 
     * Useful for calendar views and schedule filtering.
     * 
     * @param start The start of the date range
     * @param end The end of the date range
     * @return List of calendar notes within the specified range
     */
    public List<CalendarNote> getCalendarNotesByDateRange(LocalDateTime start, LocalDateTime end) {
        return calendarNoteRepository.findByStartTimeBetween(start, end);
    }
    
    /**
     * Create a calendar note from a DTO with IDs
     * 
     * @param dto The DTO containing description, times, creator ID, and tutor IDs
     * @return The created calendar note
     * @throws RuntimeException if creator or any tutor is not found
     */
    public CalendarNote createCalendarNoteFromDTO(CalendarNoteCreateDTO dto) {
        // Find creator
        Tutor creator = tutorRepository.findById(dto.getCreatorId())
                .orElseThrow(() -> new RuntimeException("Creator tutor not found with ID: " + dto.getCreatorId()));
        
        // Create calendar note
        CalendarNote note = new CalendarNote();
        note.setDescription(dto.getDescription());
        note.setStartTime(dto.getStartTime());
        note.setEndTime(dto.getEndTime());
        note.setCreator(creator);
        
        // Find and assign tutors if provided
        if (dto.getTutorIds() != null && !dto.getTutorIds().isEmpty()) {
            Set<Tutor> tutors = new HashSet<>();
            for (Long tutorId : dto.getTutorIds()) {
                Tutor tutor = tutorRepository.findById(tutorId)
                        .orElseThrow(() -> new RuntimeException("Tutor not found with ID: " + tutorId));
                tutors.add(tutor);
            }
            note.setTutors(tutors);
        }
        
        return calendarNoteRepository.save(note);
    }
    
    /**
     * Save or update a calendar note
     * 
     * Creates a new calendar note if ID is null, updates existing note otherwise.
     * 
     * @param calendarNote The calendar note entity to save
     * @return The saved calendar note entity with generated ID (if new)
     */
    public CalendarNote saveCalendarNote(CalendarNote calendarNote) {
        return calendarNoteRepository.save(calendarNote);
    }
    
    /**
     * Delete a calendar note by ID
     * 
     * @param id The ID of the calendar note to delete
     */
    public void deleteCalendarNote(Long id) {
        calendarNoteRepository.deleteById(id);
    }
}
