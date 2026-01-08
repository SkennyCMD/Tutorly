package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Student entity
 * 
 * Provides CRUD operations and custom queries for student management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for filtering by status, class, and searching by name.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    /**
     * Find students by status
     * 
     * Status can be: ACTIVE, INACTIVE, SUSPENDED, etc.
     * 
     * @param status The student status to filter by
     * @return List of students with the specified status
     */
    List<Student> findByStatus(String status);
    
    /**
     * Find students by class/grade
     * 
     * @param studentClass The class identifier (e.g., "1A", "2B")
     * @return List of students in the specified class
     */
    List<Student> findByStudentClass(String studentClass);
    
    /**
     * Search students by name or surname
     * 
     * Performs a case-insensitive partial match search across both name and surname fields.
     * Useful for search functionality in the UI.
     * 
     * @param name The search term to match against student names
     * @param surname The search term to match against student surnames
     * @return List of students whose name or surname contains the search term
     */
    List<Student> findByNameContainingOrSurnameContaining(String name, String surname);
}
