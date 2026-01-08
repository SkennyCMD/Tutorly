package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Tutor entity operations
 * 
 * Manages tutor accounts and information in the tutoring system.
 * Provides CRUD operations and filtering by status, role, and username.
 * All endpoints require API key authentication.
 * 
 * Base URL: /api/tutors
 */
@RestController
@RequestMapping("/api/tutors")
@CrossOrigin(origins = "*")
public class TutorController {
    
    @Autowired
    private TutorService tutorService;
    
    /**
     * Get all tutors
     * 
     * @return List of all tutors in the system
     * @apiNote GET /api/tutors
     */
    @GetMapping
    public ResponseEntity<List<Tutor>> getAllTutors() {
        return ResponseEntity.ok(tutorService.getAllTutors());
    }
    
    /**
     * Get tutor by ID
     * 
     * @param id The tutor ID
     * @return Tutor entity if found, 404 Not Found otherwise
     * @apiNote GET /api/tutors/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Tutor> getTutorById(@PathVariable Long id) {
        Optional<Tutor> tutor = tutorService.getTutorById(id);
        return tutor.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get tutor by username
     * 
     * @param username The tutor username
     * @return Tutor entity if found, 404 Not Found otherwise
     * @apiNote GET /api/tutors/username/{username}
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<Tutor> getTutorByUsername(@PathVariable String username) {
        Optional<Tutor> tutor = tutorService.getTutorByUsername(username);
        return tutor.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get tutors by status
     * 
     * Status can be: active, inactive, on leave, etc.
     * 
     * @param status The tutor status
     * @return List of tutors with the specified status
     * @apiNote GET /api/tutors/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Tutor>> getTutorsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(tutorService.getTutorsByStatus(status));
    }
    
    /**
     * Get tutors by role
     * 
     * Role can be: teacher, assistant, coordinator, etc.
     * 
     * @param role The tutor role
     * @return List of tutors with the specified role
     * @apiNote GET /api/tutors/role/{role}
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<Tutor>> getTutorsByRole(@PathVariable String role) {
        return ResponseEntity.ok(tutorService.getTutorsByRole(role));
    }
    
    /**
     * Create a new tutor
     * 
     * Validates that username is unique before creation.
     * 
     * @param tutor The tutor data to create
     * @return Created tutor with 201 Created status, or 409 Conflict if username already exists
     * @apiNote POST /api/tutors
     */
    @PostMapping
    public ResponseEntity<Tutor> createTutor(@RequestBody Tutor tutor) {
        if (tutorService.existsByUsername(tutor.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        Tutor savedTutor = tutorService.saveTutor(tutor);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTutor);
    }
    
    /**
     * Update an existing tutor
     * 
     * @param id The tutor ID to update
     * @param tutor The updated tutor data
     * @return Updated tutor if found, 404 Not Found otherwise
     * @apiNote PUT /api/tutors/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Tutor> updateTutor(@PathVariable Long id, @RequestBody Tutor tutor) {
        if (tutorService.getTutorById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        tutor.setId(id);
        return ResponseEntity.ok(tutorService.saveTutor(tutor));
    }
    
    /**
     * Delete a tutor
     * 
     * @param id The tutor ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if tutor doesn't exist
     * @apiNote DELETE /api/tutors/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTutor(@PathVariable Long id) {
        if (tutorService.getTutorById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        tutorService.deleteTutor(id);
        return ResponseEntity.noContent().build();
    }
}
