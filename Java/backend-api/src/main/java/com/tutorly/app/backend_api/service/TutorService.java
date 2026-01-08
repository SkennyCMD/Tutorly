package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Tutor entity business logic
 * 
 * Provides business logic and operations for tutor management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by username/status/role, and validation.
 */
@Service
public class TutorService {
    
    @Autowired
    private TutorRepository tutorRepository;
    
    /**
     * Retrieve all tutors
     * 
     * @return List of all tutors in the system
     */
    public List<Tutor> getAllTutors() {
        return tutorRepository.findAll();
    }
    
    /**
     * Find a tutor by ID
     * 
     * @param id The tutor ID to search for
     * @return Optional containing the tutor if found, empty otherwise
     */
    public Optional<Tutor> getTutorById(Long id) {
        return tutorRepository.findById(id);
    }
    
    /**
     * Find a tutor by username
     * 
     * Used for authentication and profile lookups.
     * 
     * @param username The username to search for
     * @return Optional containing the tutor if found, empty otherwise
     */
    public Optional<Tutor> getTutorByUsername(String username) {
        return tutorRepository.findByUsername(username);
    }
    
    /**
     * Find tutors by status
     * 
     * Status can be: ACTIVE, INACTIVE, ON_LEAVE, etc.
     * Useful for filtering active tutors or managing tutor availability.
     * 
     * @param status The tutor status to filter by
     * @return List of tutors with the specified status
     */
    public List<Tutor> getTutorsByStatus(String status) {
        return tutorRepository.findByStatus(status);
    }
    
    /**
     * Find tutors by role
     * 
     * Role can be: GENERIC, TEACHER, ASSISTANT, COORDINATOR, etc.
     * Useful for organizing tutors by their function or level.
     * 
     * @param role The tutor role to filter by
     * @return List of tutors with the specified role
     */
    public List<Tutor> getTutorsByRole(String role) {
        return tutorRepository.findByRole(role);
    }
    
    /**
     * Save or update a tutor
     * 
     * Creates a new tutor if ID is null, updates existing tutor otherwise.
     * 
     * @param tutor The tutor entity to save
     * @return The saved tutor entity with generated ID (if new)
     */
    public Tutor saveTutor(Tutor tutor) {
        return tutorRepository.save(tutor);
    }
    
    /**
     * Delete a tutor by ID
     * 
     * @param id The ID of the tutor to delete
     */
    public void deleteTutor(Long id) {
        tutorRepository.deleteById(id);
    }
    
    /**
     * Check if a tutor with the given username exists
     * 
     * Useful for validation before creating new tutors to ensure username uniqueness.
     * 
     * @param username The username to check
     * @return true if a tutor with this username exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return tutorRepository.existsByUsername(username);
    }
}
