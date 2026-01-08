package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.CalendarNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA Repository for CalendarNote entity
 * 
 * Provides CRUD operations and custom queries for calendar note management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for filtering by creator, date range, and associated tutors.
 */
@Repository
public interface CalendarNoteRepository extends JpaRepository<CalendarNote, Long> {
    
    /**
     * Find all calendar notes created by a specific tutor
     * 
     * @param creatorId The ID of the tutor who created the notes
     * @return List of calendar notes created by the specified tutor
     */
    List<CalendarNote> findByCreatorId(Long creatorId);
    
    /**
     * Find calendar notes within a specific date/time range
     * 
     * Returns notes where the start time falls between the specified start and end dates.
     * Useful for calendar views and schedule filtering.
     * 
     * @param start The start of the date range
     * @param end The end of the date range
     * @return List of calendar notes within the specified range
     */
    List<CalendarNote> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find all calendar notes associated with a specific tutor
     * 
     * Returns notes where the tutor is listed in the associated tutors collection
     * (many-to-many relationship). Different from findByCreatorId which only returns
     * notes created by the tutor.
     * 
     * @param tutorId The ID of the associated tutor
     * @return List of calendar notes associated with the specified tutor
     */
    List<CalendarNote> findByTutorsId(Long tutorId);
}
