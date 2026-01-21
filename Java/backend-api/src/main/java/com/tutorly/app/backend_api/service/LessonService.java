package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Lesson entity business logic
 * 
 * Provides business logic and operations for lesson management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by tutor/student, and date range filtering.
 */
@Service
public class LessonService {
    
    @Autowired
    private LessonRepository lessonRepository;
    
    /**
     * Retrieve all lessons
     * 
     * @return List of all lessons in the system
     */
    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }
    
    /**
     * Find a lesson by ID
     * 
     * @param id The lesson ID to search for
     * @return Optional containing the lesson if found, empty otherwise
     */
    public Optional<Lesson> getLessonById(Long id) {
        return lessonRepository.findById(id);
    }
    
    /**
     * Find all lessons conducted by a specific tutor
     * 
     * @param tutorId The ID of the tutor
     * @return List of lessons conducted by the specified tutor
     */
    public List<Lesson> getLessonsByTutor(Long tutorId) {
        return lessonRepository.findByTutor_Id(tutorId);
    }
    
    /**
     * Find all lessons attended by a specific student
     * 
     * @param studentId The ID of the student
     * @return List of lessons attended by the specified student
     */
    public List<Lesson> getLessonsByStudent(Long studentId) {
        return lessonRepository.findByStudent_Id(studentId);
    }
    
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
    public List<Lesson> getLessonsByTutorAndStudent(Long tutorId, Long studentId) {
        return lessonRepository.findByTutor_IdAndStudent_Id(tutorId, studentId);
    }
    
    /**
     * Find lessons within a specific date/time range
     * 
     * Useful for schedule views and reporting.
     * 
     * @param start The start of the date range
     * @param end The end of the date range
     * @return List of lessons within the specified range
     */
    public List<Lesson> getLessonsByDateRange(LocalDateTime start, LocalDateTime end) {
        return lessonRepository.findByStartTimeBetween(start, end);
    }
    
    /**
     * Save or update a lesson
     * 
     * Creates a new lesson if ID is null, updates existing lesson otherwise.
     * 
     * @param lesson The lesson entity to save
     * @return The saved lesson entity with generated ID (if new)
     */
    public Lesson saveLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }
    
    /**
     * Delete a lesson by ID
     * 
     * @param id The ID of the lesson to delete
     */
    public void deleteLesson(Long id) {
        lessonRepository.deleteById(id);
    }
}
