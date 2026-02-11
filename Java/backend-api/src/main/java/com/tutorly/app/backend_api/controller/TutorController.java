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
     * @param tutorRequest The tutor data to create
     * @return Created tutor with 201 Created status, or 409 Conflict if username already exists
     * @apiNote POST /api/tutors
     */
    @PostMapping
    public ResponseEntity<Tutor> createTutor(@RequestBody TutorCreateRequest tutorRequest) {
        if (tutorService.existsByUsername(tutorRequest.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        
        Tutor tutor = new Tutor();
        tutor.setUsername(tutorRequest.getUsername());
        tutor.setPassword(tutorRequest.getPassword());
        tutor.setRole(tutorRequest.getRole() != null ? tutorRequest.getRole() : "GENERIC");
        tutor.setStatus(tutorRequest.getStatus() != null ? tutorRequest.getStatus() : "ACTIVE");
        
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
    
    /**
     * Update tutor status only
     * 
     * @param id The tutor ID
     * @param statusUpdate Object containing the new status
     * @return Updated tutor if found, 404 Not Found otherwise
     * @apiNote PATCH /api/tutors/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Tutor> updateTutorStatus(@PathVariable Long id, @RequestBody StatusUpdate statusUpdate) {
        Optional<Tutor> tutorOptional = tutorService.getTutorById(id);
        if (tutorOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Tutor tutor = tutorOptional.get();
        tutor.setStatus(statusUpdate.getStatus());
        return ResponseEntity.ok(tutorService.saveTutor(tutor));
    }
    
    /**
     * Update tutor role only
     * 
     * @param id The tutor ID
     * @param roleUpdate Object containing the new role
     * @return Updated tutor if found, 404 Not Found otherwise
     * @apiNote PATCH /api/tutors/{id}/role
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<Tutor> updateTutorRole(@PathVariable Long id, @RequestBody RoleUpdate roleUpdate) {
        Optional<Tutor> tutorOptional = tutorService.getTutorById(id);
        if (tutorOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Tutor tutor = tutorOptional.get();
        tutor.setRole(roleUpdate.getRole());
        return ResponseEntity.ok(tutorService.saveTutor(tutor));
    }
    
    /**
     * Authenticate a tutor and get their ID
     * 
     * Validates the provided username and password.
     * Returns the tutor's ID if credentials are valid, null otherwise.
     * 
     * @param credentials Object containing username and password
     * @return Tutor ID if authentication successful, null otherwise
     * @apiNote POST /api/tutors/login
     */
    @PostMapping("/login")
    public ResponseEntity<Long> loginTutor(@RequestBody LoginRequest credentials) {
        Long tutorId = tutorService.authenticateTutor(
            credentials.getUsername(), 
            credentials.getPassword()
        );
        
        if (tutorId != null) {
            return ResponseEntity.ok(tutorId);
        } else {
            return ResponseEntity.ok(null);
        }
    }
    
    /**
     * Inner class for tutor creation request payload
     */
    public static class TutorCreateRequest {
        private String username;
        private String password;
        private String role;
        private String status;
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
    }
    
    /**
     * Inner class for status update request payload
     */
    public static class StatusUpdate {
        private String status;
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
    }
    
    /**
     * Inner class for role update request payload
     */
    public static class RoleUpdate {
        private String role;
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
    }
    
    /**
     * Inner class for login request payload
     */
    public static class LoginRequest {
        private String username;
        private String password;
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
}
