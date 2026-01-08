package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Prenotation;
import com.tutorly.app.backend_api.repository.PrenotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Prenotation entity business logic
 * 
 * Provides business logic and operations for prenotation/booking management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by student/tutor/creator, flag filtering, and date range queries.
 */
@Service
public class PrenotationService {
    
    @Autowired
    private PrenotationRepository prenotationRepository;
    
    /**
     * Retrieve all prenotations
     * 
     * @return List of all prenotations in the system
     */
    public List<Prenotation> getAllPrenotations() {
        return prenotationRepository.findAll();
    }
    
    /**
     * Find a prenotation by ID
     * 
     * @param id The prenotation ID to search for
     * @return Optional containing the prenotation if found, empty otherwise
     */
    public Optional<Prenotation> getPrenotationById(Long id) {
        return prenotationRepository.findById(id);
    }
    
    /**
     * Find all prenotations for a specific student
     * 
     * @param studentId The ID of the student
     * @return List of prenotations for the specified student
     */
    public List<Prenotation> getPrenotationsByStudent(Long studentId) {
        return prenotationRepository.findByStudentId(studentId);
    }
    
    /**
     * Find all prenotations assigned to a specific tutor
     * 
     * @param tutorId The ID of the tutor conducting the sessions
     * @return List of prenotations assigned to the specified tutor
     */
    public List<Prenotation> getPrenotationsByTutor(Long tutorId) {
        return prenotationRepository.findByTutorId(tutorId);
    }
    
    /**
     * Find all prenotations created by a specific tutor
     * 
     * Returns prenotations where the specified tutor is the creator.
     * 
     * @param creatorId The ID of the tutor who created the prenotations
     * @return List of prenotations created by the specified tutor
     */
    public List<Prenotation> getPrenotationsByCreator(Long creatorId) {
        return prenotationRepository.findByCreatorId(creatorId);
    }
    
    /**
     * Find prenotations by flag status
     * 
     * The flag typically indicates confirmation or completion status.
     * Useful for filtering pending vs. confirmed/completed prenotations.
     * 
     * @param flag The flag value (true/false)
     * @return List of prenotations with the specified flag value
     */
    public List<Prenotation> getPrenotationsByFlag(Boolean flag) {
        return prenotationRepository.findByFlag(flag);
    }
    
    /**
     * Find prenotations within a specific date/time range
     * 
     * Useful for schedule views and availability checking.
     * 
     * @param start The start of the date range
     * @param end The end of the date range
     * @return List of prenotations within the specified range
     */
    public List<Prenotation> getPrenotationsByDateRange(LocalDateTime start, LocalDateTime end) {
        return prenotationRepository.findByStartTimeBetween(start, end);
    }
    
    /**
     * Save or update a prenotation
     * 
     * Creates a new prenotation if ID is null, updates existing prenotation otherwise.
     * 
     * @param prenotation The prenotation entity to save
     * @return The saved prenotation entity with generated ID (if new)
     */
    public Prenotation savePrenotation(Prenotation prenotation) {
        return prenotationRepository.save(prenotation);
    }
    
    /**
     * Delete a prenotation by ID
     * 
     * @param id The ID of the prenotation to delete
     */
    public void deletePrenotation(Long id) {
        prenotationRepository.deleteById(id);
    }
}
