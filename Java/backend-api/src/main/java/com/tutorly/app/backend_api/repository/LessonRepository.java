package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA Repository for Lesson entity
 * 
 * Provides CRUD operations and custom queries for lesson management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for filtering lessons by tutor, student, date range, and tutor-student pairs.
 */
@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    
    /**
     * Find all lessons conducted by a specific tutor
     * 
     * @param tutorId The ID of the tutor
     * @return List of lessons conducted by the specified tutor
     */
    List<Lesson> findByTutorId(Long tutorId);
    
    /**
     * Find all lessons attended by a specific student
     * 
     * @param studentId The ID of the student
     * @return List of lessons attended by the specified student
     */
    List<Lesson> findByStudentId(Long studentId);
    
    /**
     * Find lessons within a specific date/time range
     * 
     * Returns lessons where the start time falls between the specified start and end dates.
     * Useful for schedule views and reporting.
     * 
     * @param start The start of the date range
     * @param end The end of the date range
     * @return List of lessons within the specified range
     */
    List<Lesson> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find all lessons between a specific tutor and student
     * 
     * Returns the lesson history for a particular tutor-student pairing.
     * Useful for tracking progress and relationship history.
     * 
     * @param tutorId The ID of the tutor
     * @param studentId The ID of the student
     * @return List of lessons between the specified tutor and student
     */
    List<Lesson> findByTutorIdAndStudentId(Long tutorId, Long studentId);
}
