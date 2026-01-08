package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Spring Data JPA Repository for Test entity
 * 
 * Provides CRUD operations and custom queries for test/exam management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for filtering by tutor, student, date range, minimum marks, and tutor-student pairs.
 */
@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    
    /**
     * Find all tests administered by a specific tutor
     * 
     * @param tutorId The ID of the tutor who administered the tests
     * @return List of tests administered by the specified tutor
     */
    List<Test> findByTutorId(Long tutorId);
    
    /**
     * Find all tests taken by a specific student
     * 
     * @param studentId The ID of the student
     * @return List of tests taken by the specified student
     */
    List<Test> findByStudentId(Long studentId);
    
    /**
     * Find tests within a specific date range
     * 
     * Returns tests where the test date falls between the specified start and end dates.
     * Useful for reporting and performance tracking over time.
     * 
     * @param start The start date of the range
     * @param end The end date of the range
     * @return List of tests within the specified date range
     */
    List<Test> findByDayBetween(LocalDate start, LocalDate end);
    
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
    List<Test> findByTutorIdAndStudentId(Long tutorId, Long studentId);
    
    /**
     * Find tests with a minimum mark/score
     * 
     * Returns tests where the mark is greater than or equal to the specified value.
     * Useful for filtering high-performing tests or finding tests above a passing grade.
     * 
     * @param mark The minimum mark threshold
     * @return List of tests with mark >= specified value
     */
    List<Test> findByMarkGreaterThanEqual(Integer mark);
}
