package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Prenotation;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.dto.PrenotationCreateDTO;
import com.tutorly.app.backend_api.service.PrenotationService;
import com.tutorly.app.backend_api.service.StudentService;
import com.tutorly.app.backend_api.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Prenotation (Booking/Reservation) entity operations
 * 
 * Manages lesson reservations/bookings in the tutoring system.
 * Prenotations represent scheduled or requested tutoring sessions.
 * All endpoints require API key authentication.
 * 
 * Base URL: /api/prenotations
 */
@RestController
@RequestMapping("/api/prenotations")
@CrossOrigin(origins = "*")
public class PrenotationController {
    
    @Autowired
    private PrenotationService prenotationService;
    
    @Autowired
    private StudentService studentService;
    
    @Autowired
    private TutorService tutorService;
    
    /**
     * Get all prenotations
     * 
     * @return List of all prenotations in the system
     * @apiNote GET /api/prenotations
     */
    @GetMapping
    public ResponseEntity<List<Prenotation>> getAllPrenotations() {
        return ResponseEntity.ok(prenotationService.getAllPrenotations());
    }
    
    /**
     * Get prenotation by ID
     * 
     * @param id The prenotation ID
     * @return Prenotation entity if found, 404 Not Found otherwise
     * @apiNote GET /api/prenotations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Prenotation> getPrenotationById(@PathVariable Long id) {
        Optional<Prenotation> prenotation = prenotationService.getPrenotationById(id);
        return prenotation.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all prenotations for a specific student
     * 
     * @param studentId The student ID
     * @return List of prenotations for the specified student
     * @apiNote GET /api/prenotations/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByStudent(studentId));
    }
    
    /**
     * Get all prenotations for a specific tutor
     * 
     * @param tutorId The tutor ID
     * @return List of prenotations assigned to the specified tutor
     * @apiNote GET /api/prenotations/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByTutor(tutorId));
    }
    
    /**
     * Get all prenotations created by a specific admin
     * 
     * @param creatorId The admin ID who created the prenotations
     * @return List of prenotations created by the specified admin
     * @apiNote GET /api/prenotations/creator/{creatorId}
     */
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByCreator(@PathVariable Long creatorId) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByCreator(creatorId));
    }
    
    /**
     * Get prenotations by flag status
     * 
     * Flag typically indicates confirmation or completion status.
     * 
     * @param flag The flag value (true/false)
     * @return List of prenotations with the specified flag value
     * @apiNote GET /api/prenotations/flag/{flag}
     */
    @GetMapping("/flag/{flag}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByFlag(@PathVariable Boolean flag) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByFlag(flag));
    }
    
    /**
     * Get prenotations within a date range
     * 
     * @param start Start date/time (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)
     * @param end End date/time (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)
     * @return List of prenotations within the specified date range
     * @apiNote GET /api/prenotations/date-range?start=2026-01-01T00:00:00&end=2026-01-31T23:59:59
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<Prenotation>> getPrenotationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByDateRange(start, end));
    }
    
    /**
     * Create a new prenotation using DTO with IDs
     * 
     * @param dto The prenotation data with student, tutor, and creator IDs
     * @return Created prenotation with 201 Created status
     * @apiNote POST /api/prenotations/create
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPrenotationFromDTO(@RequestBody PrenotationCreateDTO dto) {
        try {
            // Fetch entities by ID
            Optional<Student> student = studentService.getStudentById(dto.getStudentId());
            Optional<Tutor> tutor = tutorService.getTutorById(dto.getTutorId());
            Optional<Tutor> creator = tutorService.getTutorById(dto.getCreatorId());
            
            if (student.isEmpty()) {
                return ResponseEntity.badRequest().body("Student not found with ID: " + dto.getStudentId());
            }
            if (tutor.isEmpty()) {
                return ResponseEntity.badRequest().body("Tutor not found with ID: " + dto.getTutorId());
            }
            if (creator.isEmpty()) {
                return ResponseEntity.badRequest().body("Creator not found with ID: " + dto.getCreatorId());
            }
            
            // Create prenotation with entities
            Prenotation prenotation = new Prenotation();
            prenotation.setStartTime(dto.getStartTime());
            prenotation.setEndTime(dto.getEndTime());
            prenotation.setStudent(student.get());
            prenotation.setTutor(tutor.get());
            prenotation.setCreator(creator.get());
            prenotation.setFlag(dto.getFlag() != null ? dto.getFlag() : false);
            
            Prenotation savedPrenotation = prenotationService.savePrenotation(prenotation);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPrenotation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating prenotation: " + e.getMessage());
        }
    }
    
    /**
     * Create a new prenotation
     * 
     * @param prenotation The prenotation data to create
     * @return Created prenotation with 201 Created status
     * @apiNote POST /api/prenotations
     */
    @PostMapping
    public ResponseEntity<Prenotation> createPrenotation(@RequestBody Prenotation prenotation) {
        Prenotation savedPrenotation = prenotationService.savePrenotation(prenotation);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPrenotation);
    }
    
    /**
     * Update an existing prenotation
     * 
     * @param id The prenotation ID to update
     * @param prenotation The updated prenotation data
     * @return Updated prenotation if found, 404 Not Found otherwise
     * @apiNote PUT /api/prenotations/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Prenotation> updatePrenotation(@PathVariable Long id, @RequestBody Prenotation prenotation) {
        if (prenotationService.getPrenotationById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        prenotation.setId(id);
        return ResponseEntity.ok(prenotationService.savePrenotation(prenotation));
    }
    
    /**
     * Delete a prenotation
     * 
     * @param id The prenotation ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if prenotation doesn't exist
     * @apiNote DELETE /api/prenotations/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrenotation(@PathVariable Long id) {
        if (prenotationService.getPrenotationById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        prenotationService.deletePrenotation(id);
        return ResponseEntity.noContent().build();
    }
}
