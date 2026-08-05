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
    List<Lesson> findByTutor_Id(Long tutorId);
    
    /**
     * Find all lessons attended by a specific student
     * 
     * @param studentId The ID of the student
     * @return List of lessons attended by the specified student
     */
    List<Lesson> findByStudent_Id(Long studentId);
    
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
    List<Lesson> findByTutor_IdAndStudent_Id(Long tutorId, Long studentId);

    /**
     * Find all lessons drawn from a specific pack
     *
     * @param packId The ID of the pack
     * @return List of lessons linked to the specified pack
     */
    List<Lesson> findByPack_Id(Long packId);

    /**
     * Find lessons for a student that aren't drawn from any pack, starting after a given time
     *
     * Used to surface hours a student has done that fell outside a pack - e.g. lessons
     * booked after a pack ran out of hours.
     *
     * @param studentId The ID of the student
     * @param after Only lessons starting after this time are included
     * @return List of pack-less lessons for the student starting after the given time
     */
    List<Lesson> findByStudent_IdAndPackIsNullAndStartTimeAfter(Long studentId, LocalDateTime after);

    /**
     * Find lessons for a student that aren't drawn from any pack, starting at or after a given time
     *
     * Used when a new pack is created to retroactively absorb unassigned lessons that
     * fall within the pack's coverage (i.e. starting from the pack's own start time).
     *
     * @param studentId The ID of the student
     * @param start Only lessons starting at or after this time are included
     * @return List of pack-less lessons for the student starting at or after the given time
     */
    List<Lesson> findByStudent_IdAndPackIsNullAndStartTimeGreaterThanEqual(Long studentId, LocalDateTime start);
}
