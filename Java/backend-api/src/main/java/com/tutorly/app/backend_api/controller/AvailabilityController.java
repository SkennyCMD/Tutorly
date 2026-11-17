package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.service.AvailabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Availability entity operations (read-only).
 *
 * Backs the Node.js frontend's Availability page - see
 * docs/03_Nodejs_Frontend.md and docs/05_Service_Modules.md. All endpoints
 * require API key authentication.
 *
 * Base URL: /api/availability
 */
@RestController
@RequestMapping("/api/availability")
@CrossOrigin(origins = "*")
public class AvailabilityController {

    @Autowired
    private AvailabilityService availabilityService;

    /**
     * Get all recurring availability slots, for every tutor.
     *
     * @return List of all availability slots
     * @apiNote GET /api/availability
     */
    @GetMapping
    public ResponseEntity<List<Availability>> getAllAvailability() {
        return ResponseEntity.ok(availabilityService.getAllAvailability());
    }

    /**
     * Get an availability slot by ID.
     *
     * @param id The availability slot ID
     * @return The slot if found, 404 Not Found otherwise
     * @apiNote GET /api/availability/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Availability> getAvailabilityById(@PathVariable Long id) {
        Optional<Availability> availability = availabilityService.getAvailabilityById(id);
        return availability.map(ResponseEntity::ok)
                            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all recurring availability slots for a specific tutor.
     *
     * @param tutorId The tutor's ID
     * @return List of availability slots belonging to that tutor
     * @apiNote GET /api/availability/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Availability>> getAvailabilityByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(availabilityService.getAvailabilityByTutor(tutorId));
    }
}
