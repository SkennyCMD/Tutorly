package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.LessonCreateDTO;
import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.service.LessonService;
import com.tutorly.app.backend_api.service.StudentService;
import com.tutorly.app.backend_api.service.TutorService;
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
    
    @Autowired
    private TutorService tutorService;
    
    @Autowired
    private StudentService studentService;
    
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
     * Get paginated lessons for a specific tutor
     * 
     * @param tutorId The tutor ID
     * @param limit Maximum number of lessons to return (optional)
     * @param offset Number of lessons to skip (optional, default 0)
     * @return JSON object with lessons array, total count, limit, and offset
     * @apiNote GET /api/lessons/tutor/{tutorId}/paginated?limit=20&offset=0
     */
    @GetMapping("/tutor/{tutorId}/paginated")
    public ResponseEntity<?> getLessonsByTutorPaginated(
            @PathVariable Long tutorId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") Integer offset) {
        
        List<Lesson> allLessons = lessonService.getLessonsByTutor(tutorId);
        int totalCount = allLessons.size();
        
        // Sort by startTime descending (most recent first)
        allLessons.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));
        
        // Apply pagination if limit is specified
        List<Lesson> paginatedLessons;
        if (limit != null && limit > 0) {
            int fromIndex = Math.min(offset, allLessons.size());
            int toIndex = Math.min(offset + limit, allLessons.size());
            paginatedLessons = allLessons.subList(fromIndex, toIndex);
        } else {
            paginatedLessons = allLessons;
        }
        
        // Convert to simple DTOs to avoid serialization issues
        var lessonDTOs = paginatedLessons.stream().map(lesson -> {
            var dto = new java.util.HashMap<String, Object>();
            dto.put("id", lesson.getId());
            dto.put("description", lesson.getDescription());
            dto.put("startTime", lesson.getStartTime());
            dto.put("endTime", lesson.getEndTime());
            dto.put("tutorId", lesson.getTutor() != null ? lesson.getTutor().getId() : null);
            dto.put("studentId", lesson.getStudent() != null ? lesson.getStudent().getId() : null);
            return dto;
        }).toList();
        
        // Build response JSON
        var response = new java.util.HashMap<String, Object>();
        response.put("lessons", lessonDTOs);
        response.put("total", totalCount);
        response.put("limit", limit);
        response.put("offset", offset);
        
        return ResponseEntity.ok(response);
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
    public ResponseEntity<?> createLesson(@RequestBody LessonCreateDTO lessonDTO) {
        try {
            // Fetch tutor and student by ID
            Optional<Tutor> tutorOpt = tutorService.getTutorById(lessonDTO.getTutorId());
            Optional<Student> studentOpt = studentService.getStudentById(lessonDTO.getStudentId());
            
            if (tutorOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Tutor not found with ID: " + lessonDTO.getTutorId());
            }
            if (studentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Student not found with ID: " + lessonDTO.getStudentId());
            }
            
            // Create lesson entity
            Lesson lesson = new Lesson();
            lesson.setDescription(lessonDTO.getDescription());
            lesson.setStartTime(lessonDTO.getStartTime());
            lesson.setEndTime(lessonDTO.getEndTime());
            lesson.setTutor(tutorOpt.get());
            lesson.setStudent(studentOpt.get());
            
            Lesson savedLesson = lessonService.saveLesson(lesson);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedLesson);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating lesson: " + e.getMessage());
        }
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
