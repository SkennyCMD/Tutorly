package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Tutor entity
 * 
 * Provides CRUD operations and custom queries for tutor management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for finding tutors by username, status, role, and checking username existence.
 */
@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {
    
    /**
     * Find a tutor by username
     * 
     * Used for authentication and lookup operations.
     * 
     * @param username The username to search for
     * @return Optional containing the tutor if found, empty otherwise
     */
    Optional<Tutor> findByUsername(String username);
    
    /**
     * Find tutors by status
     * 
     * Status can be: ACTIVE, INACTIVE, ON_LEAVE, etc.
     * Useful for filtering active tutors or managing tutor availability.
     * 
     * @param status The tutor status to filter by
     * @return List of tutors with the specified status
     */
    List<Tutor> findByStatus(String status);
    
    /**
     * Find tutors by role
     * 
     * Role can be: GENERIC, TEACHER, ASSISTANT, COORDINATOR, etc.
     * Useful for organizing tutors by their function or level.
     * 
     * @param role The tutor role to filter by
     * @return List of tutors with the specified role
     */
    List<Tutor> findByRole(String role);
    
    /**
     * Check if a tutor with the given username exists
     * 
     * Useful for validation before creating new tutors to ensure username uniqueness.
     * 
     * @param username The username to check
     * @return true if a tutor with this username exists, false otherwise
     */
    boolean existsByUsername(String username);
}
