package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Prenotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA Repository for Prenotation entity
 * 
 * Provides CRUD operations and custom queries for prenotation/booking management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for filtering by student, tutor, creator, status flag, and date range.
 */
@Repository
public interface PrenotationRepository extends JpaRepository<Prenotation, Long> {
    
    /**
     * Find all prenotations for a specific student
     * 
     * @param studentId The ID of the student
     * @return List of prenotations for the specified student
     */
    List<Prenotation> findByStudentId(Long studentId);
    
    /**
     * Find all prenotations assigned to a specific tutor
     * 
     * @param tutorId The ID of the tutor conducting the sessions
     * @return List of prenotations assigned to the specified tutor
     */
    List<Prenotation> findByTutorId(Long tutorId);
    
    /**
     * Find all prenotations created by a specific tutor
     * 
     * Returns prenotations where the specified tutor is the creator,
     * which may be different from the tutor conducting the session.
     * 
     * @param creatorId The ID of the tutor who created the prenotations
     * @return List of prenotations created by the specified tutor
     */
    List<Prenotation> findByCreatorId(Long creatorId);
    
    /**
     * Find prenotations by flag status
     * 
     * The flag typically indicates confirmation or completion status.
     * Useful for filtering pending vs. confirmed/completed prenotations.
     * 
     * @param flag The flag value (true/false)
     * @return List of prenotations with the specified flag value
     */
    List<Prenotation> findByFlag(Boolean flag);
    
    /**
     * Find prenotations within a specific date/time range
     * 
     * Returns prenotations where the start time falls between the specified dates.
     * Useful for schedule views and availability checking.
     * 
     * @param start The start of the date range
     * @param end The end of the date range
     * @return List of prenotations within the specified range
     */
    List<Prenotation> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
