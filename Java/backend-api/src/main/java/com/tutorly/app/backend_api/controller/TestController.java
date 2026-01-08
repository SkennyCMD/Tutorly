package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Test;
import com.tutorly.app.backend_api.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
public class TestController {
    
    @Autowired
    private TestService testService;
    
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
    public ResponseEntity<List<Test>> getTestsByMinMark(@PathVariable Integer mark) {
        return ResponseEntity.ok(testService.getTestsByMinMark(mark));
    }
    
    /**
     * Create a new test
     * 
     * @param test The test data to create
     * @return Created test with 201 Created status
     * @apiNote POST /api/tests
     */
    @PostMapping
    public ResponseEntity<Test> createTest(@RequestBody Test test) {
        Test savedTest = testService.saveTest(test);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTest);
    }
    
    /**
     * Update an existing test
     * 
     * @param id The test ID to update
     * @param test The updated test data
     * @return Updated test if found, 404 Not Found otherwise
     * @apiNote PUT /api/tests/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Test> updateTest(@PathVariable Long id, @RequestBody Test test) {
        if (testService.getTestById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        test.setId(id);
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
