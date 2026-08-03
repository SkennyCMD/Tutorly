package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.TestCreateDTO;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.Test;
import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.service.StudentService;
import com.tutorly.app.backend_api.service.TestService;
import com.tutorly.app.backend_api.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Test entity operations
 *
 * Manages student tests/exams in the tutoring system.
 * Tracks test results, scores, and performance metrics.
 * All endpoints require API key authentication.
 *
 * Base URL: /api/tests
 */
@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
@Slf4j
public class TestController {

    @Autowired
    private TestService testService;

    @Autowired
    private TutorService tutorService;

    @Autowired
    private StudentService studentService;
    
    /**
     * Get all tests
     * 
     * @return List of all tests in the system
     * @apiNote GET /api/tests
     */
    @GetMapping
    public ResponseEntity<List<Test>> getAllTests() {
        return ResponseEntity.ok(testService.getAllTests());
    }
    
    /**
     * Get test by ID
     * 
     * @param id The test ID
     * @return Test entity if found, 404 Not Found otherwise
     * @apiNote GET /api/tests/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id) {
        Optional<Test> test = testService.getTestById(id);
        return test.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all tests administered by a specific tutor
     * 
     * @param tutorId The tutor ID
     * @return List of tests administered by the specified tutor
     * @apiNote GET /api/tests/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Test>> getTestsByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(testService.getTestsByTutor(tutorId));
    }
    
    /**
     * Get all tests taken by a specific student
     * 
     * @param studentId The student ID
     * @return List of tests taken by the specified student
     * @apiNote GET /api/tests/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Test>> getTestsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(testService.getTestsByStudent(studentId));
    }
    
    /**
     * Get all tests between a specific tutor and student
     * 
     * Useful for tracking assessment history between a tutor-student pair.
     * 
     * @param tutorId The tutor ID
     * @param studentId The student ID
     * @return List of tests between the specified tutor and student
     * @apiNote GET /api/tests/tutor/{tutorId}/student/{studentId}
     */
    @GetMapping("/tutor/{tutorId}/student/{studentId}")
    public ResponseEntity<List<Test>> getTestsByTutorAndStudent(
            @PathVariable Long tutorId, @PathVariable Long studentId) {
        return ResponseEntity.ok(testService.getTestsByTutorAndStudent(tutorId, studentId));
    }
    
    /**
     * Get tests within a date range
     * 
     * @param start Start date (ISO 8601 format: yyyy-MM-dd)
     * @param end End date (ISO 8601 format: yyyy-MM-dd)
     * @return List of tests within the specified date range
     * @apiNote GET /api/tests/date-range?start=2026-01-01&end=2026-01-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<Test>> getTestsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(testService.getTestsByDateRange(start, end));
    }
    
    /**
     * Get tests with a minimum mark/score
     * 
     * Useful for filtering tests by performance level.
     * 
     * @param mark The minimum mark/score
     * @return List of tests with mark >= specified value
     * @apiNote GET /api/tests/min-mark/{mark}
     */
    @GetMapping("/min-mark/{mark}")
    public ResponseEntity<List<Test>> getTestsByMinMark(@PathVariable Double mark) {
        return ResponseEntity.ok(testService.getTestsByMinMark(mark));
    }

    /**
     * Create a new test
     *
     * Accepts a flat-ID DTO (tutorId/studentId) rather than the raw entity,
     * looking up the referenced Tutor and Student before saving - mirrors
     * LessonController's createLesson.
     *
     * @param testDTO The test data to create
     * @return Created test with 201 Created status, or 400 if tutor/student not found
     * @apiNote POST /api/tests
     */
    @PostMapping
    public ResponseEntity<?> createTest(@RequestBody TestCreateDTO testDTO) {
        try {
            log.info("Attempting to create test for tutor {} and student {}", testDTO.getTutorId(), testDTO.getStudentId());
            Optional<Tutor> tutorOpt = tutorService.getTutorById(testDTO.getTutorId());
            Optional<Student> studentOpt = studentService.getStudentById(testDTO.getStudentId());

            if (tutorOpt.isEmpty()) {
                log.warn("Tutor not found with ID: {}", testDTO.getTutorId());
                return ResponseEntity.badRequest().body("Tutor not found with ID: " + testDTO.getTutorId());
            }
            if (studentOpt.isEmpty()) {
                log.warn("Student not found with ID: {}", testDTO.getStudentId());
                return ResponseEntity.badRequest().body("Student not found with ID: " + testDTO.getStudentId());
            }

            Test test = new Test();
            test.setDay(testDTO.getDay());
            test.setDescription(testDTO.getDescription());
            test.setMark(testDTO.getMark());
            test.setSubject(testDTO.getSubject());
            test.setTutor(tutorOpt.get());
            test.setStudent(studentOpt.get());

            Test savedTest = testService.saveTest(test);
            log.info("Successfully created test with ID {}", savedTest.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTest);
        } catch (Exception e) {
            log.error("Error creating test: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating test: " + e.getMessage());
        }
    }

    /**
     * Update an existing test
     *
     * Accepts the same flat-ID DTO shape as test creation (studentId/tutorId)
     * rather than the raw entity, since Test's student/tutor fields are
     * write-only via their related entities and aren't deserializable from
     * plain IDs on the entity itself.
     *
     * @param id The test ID to update
     * @param dto The updated test data (day, description, mark, tutorId, studentId)
     * @return Updated test if found, 404 Not Found if test/tutor/student don't exist
     * @apiNote PUT /api/tests/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTest(@PathVariable Long id, @RequestBody TestCreateDTO dto) {
        Optional<Test> existingTest = testService.getTestById(id);
        if (existingTest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Tutor> tutor = tutorService.getTutorById(dto.getTutorId());
        Optional<Student> student = studentService.getStudentById(dto.getStudentId());

        if (tutor.isEmpty()) {
            return ResponseEntity.badRequest().body("Tutor not found with ID: " + dto.getTutorId());
        }
        if (student.isEmpty()) {
            return ResponseEntity.badRequest().body("Student not found with ID: " + dto.getStudentId());
        }

        Test test = existingTest.get();
        test.setDay(dto.getDay());
        test.setDescription(dto.getDescription());
        test.setMark(dto.getMark());
        test.setSubject(dto.getSubject());
        test.setTutor(tutor.get());
        test.setStudent(student.get());

        return ResponseEntity.ok(testService.saveTest(test));
    }
    
    /**
     * Delete a test
     * 
     * @param id The test ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if test doesn't exist
     * @apiNote DELETE /api/tests/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        if (testService.getTestById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        testService.deleteTest(id);
        return ResponseEntity.noContent().build();
    }
}
