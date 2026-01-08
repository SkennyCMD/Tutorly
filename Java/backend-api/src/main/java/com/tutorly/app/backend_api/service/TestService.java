package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Test;
import com.tutorly.app.backend_api.repository.TestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Test entity business logic
 * 
 * Provides business logic and operations for test/exam management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by tutor/student, date range filtering, and mark-based queries.
 */
@Service
public class TestService {
    
    @Autowired
    private TestRepository testRepository;
    
    /**
     * Retrieve all tests
     * 
     * @return List of all tests in the system
     */
    public List<Test> getAllTests() {
        return testRepository.findAll();
    }
    
    /**
     * Find a test by ID
     * 
     * @param id The test ID to search for
     * @return Optional containing the test if found, empty otherwise
     */
    public Optional<Test> getTestById(Long id) {
        return testRepository.findById(id);
    }
    
    /**
     * Find all tests administered by a specific tutor
     * 
     * @param tutorId The ID of the tutor who administered the tests
     * @return List of tests administered by the specified tutor
     */
    public List<Test> getTestsByTutor(Long tutorId) {
        return testRepository.findByTutorId(tutorId);
    }
    
    /**
     * Find all tests taken by a specific student
     * 
     * @param studentId The ID of the student
     * @return List of tests taken by the specified student
     */
    public List<Test> getTestsByStudent(Long studentId) {
        return testRepository.findByStudentId(studentId);
    }
    
    /**
     * Find all tests between a specific tutor and student
     * 
     * Returns the test history for a particular tutor-student pairing.
     * Useful for tracking student progress with a specific tutor.
     * 
     * @param tutorId The ID of the tutor
     * @param studentId The ID of the student
     * @return List of tests between the specified tutor and student
     */
    public List<Test> getTestsByTutorAndStudent(Long tutorId, Long studentId) {
        return testRepository.findByTutorIdAndStudentId(tutorId, studentId);
    }
    
    /**
     * Find tests within a specific date range
     * 
     * Useful for reporting and performance tracking over time.
     * 
     * @param start The start date of the range
     * @param end The end date of the range
     * @return List of tests within the specified date range
     */
    public List<Test> getTestsByDateRange(LocalDate start, LocalDate end) {
        return testRepository.findByDayBetween(start, end);
    }
    
    /**
     * Find tests with a minimum mark/score
     * 
     * Returns tests where the mark is greater than or equal to the specified value.
     * Useful for filtering high-performing tests or finding tests above a passing grade.
     * 
     * @param mark The minimum mark threshold
     * @return List of tests with mark >= specified value
     */
    public List<Test> getTestsByMinMark(Integer mark) {
        return testRepository.findByMarkGreaterThanEqual(mark);
    }
    
    /**
     * Save or update a test
     * 
     * Creates a new test if ID is null, updates existing test otherwise.
     * 
     * @param test The test entity to save
     * @return The saved test entity with generated ID (if new)
     */
    public Test saveTest(Test test) {
        return testRepository.save(test);
    }
    
    /**
     * Delete a test by ID
     * 
     * @param id The ID of the test to delete
     */
    public void deleteTest(Long id) {
        testRepository.deleteById(id);
    }
}
