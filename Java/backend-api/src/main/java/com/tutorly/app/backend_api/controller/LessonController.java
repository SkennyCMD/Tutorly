package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Lesson entity operations
 * 
 * Manages tutoring lessons in the system, including scheduling and tracking.
 * Lessons represent actual tutoring sessions between tutors and students.
 * All endpoints require API key authentication.
 * 
 * Base URL: /api/lessons
 */
@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = "*")
public class LessonController {
    
    @Autowired
    private LessonService lessonService;
    
    /**
     * Get all lessons
     * 
     * @return List of all lessons in the system
     * @apiNote GET /api/lessons
     */
    @GetMapping
    public ResponseEntity<List<Lesson>> getAllLessons() {
        return ResponseEntity.ok(lessonService.getAllLessons());
    }
    
    /**
     * Get lesson by ID
     * 
     * @param id The lesson ID
     * @return Lesson entity if found, 404 Not Found otherwise
     * @apiNote GET /api/lessons/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Lesson> getLessonById(@PathVariable Long id) {
        Optional<Lesson> lesson = lessonService.getLessonById(id);
        return lesson.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all lessons for a specific tutor
     * 
     * @param tutorId The tutor ID
     * @return List of lessons taught by the specified tutor
     * @apiNote GET /api/lessons/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Lesson>> getLessonsByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(lessonService.getLessonsByTutor(tutorId));
    }
    
    /**
     * Get all lessons for a specific student
     * 
     * @param studentId The student ID
     * @return List of lessons attended by the specified student
     * @apiNote GET /api/lessons/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Lesson>> getLessonsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(lessonService.getLessonsByStudent(studentId));
    }
    
    /**
     * Get all lessons between a specific tutor and student
     * 
     * Useful for tracking lesson history between a tutor-student pair.
     * 
     * @param tutorId The tutor ID
     * @param studentId The student ID
     * @return List of lessons between the specified tutor and student
     * @apiNote GET /api/lessons/tutor/{tutorId}/student/{studentId}
     */
    @GetMapping("/tutor/{tutorId}/student/{studentId}")
    public ResponseEntity<List<Lesson>> getLessonsByTutorAndStudent(
            @PathVariable Long tutorId, @PathVariable Long studentId) {
        return ResponseEntity.ok(lessonService.getLessonsByTutorAndStudent(tutorId, studentId));
    }
    
    /**
     * Get lessons within a date range
     * 
     * @param start Start date/time (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)
     * @param end End date/time (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)
     * @return List of lessons within the specified date range
     * @apiNote GET /api/lessons/date-range?start=2026-01-01T00:00:00&end=2026-01-31T23:59:59
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<Lesson>> getLessonsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(lessonService.getLessonsByDateRange(start, end));
    }
    
    /**
     * Create a new lesson
     * 
     * @param lesson The lesson data to create
     * @return Created lesson with 201 Created status
     * @apiNote POST /api/lessons
     */
    @PostMapping
    public ResponseEntity<Lesson> createLesson(@RequestBody Lesson lesson) {
        Lesson savedLesson = lessonService.saveLesson(lesson);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedLesson);
    }
    
    /**
     * Update an existing lesson
     * 
     * @param id The lesson ID to update
     * @param lesson The updated lesson data
     * @return Updated lesson if found, 404 Not Found otherwise
     * @apiNote PUT /api/lessons/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Lesson> updateLesson(@PathVariable Long id, @RequestBody Lesson lesson) {
        if (lessonService.getLessonById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        lesson.setId(id);
        return ResponseEntity.ok(lessonService.saveLesson(lesson));
    }
    
    /**
     * Delete a lesson
     * 
     * @param id The lesson ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if lesson doesn't exist
     * @apiNote DELETE /api/lessons/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        if (lessonService.getLessonById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        lessonService.deleteLesson(id);
        return ResponseEntity.noContent().build();
    }
}
