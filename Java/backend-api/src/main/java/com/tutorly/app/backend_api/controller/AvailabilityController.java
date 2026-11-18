package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.AvailabilityCreateDTO;
import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.service.AvailabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Availability entity operations.
 *
 * Backs the Node.js frontend's Availability page - see
 * docs/03_Nodejs_Frontend.md and docs/05_Service_Modules.md. All endpoints
 * require API key authentication. Role restriction (creating a slot is
 * STAFF-only) is enforced in the Node.js layer, not here - same as every
 * other entity in this codebase.
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

    /**
     * Create a new recurring availability slot.
     *
     * @param dto The slot data to create (weekDay, startTime, endTime, tutorId)
     * @return Created slot with 201 Created status, or 400 if invalid/tutor not found
     * @apiNote POST /api/availability
     */
    @PostMapping
    public ResponseEntity<?> createAvailability(@RequestBody AvailabilityCreateDTO dto) {
        try {
            Availability saved = availabilityService.createAvailability(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Update an existing recurring availability slot's day/time range.
     *
     * @param id The slot to update
     * @param dto The new weekDay/startTime/endTime (tutorId is ignored - the
     *            slot's tutor is never reassigned here)
     * @return Updated slot, 404 if it doesn't exist, 400 if invalid
     * @apiNote PUT /api/availability/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAvailability(@PathVariable Long id, @RequestBody AvailabilityCreateDTO dto) {
        try {
            Availability updated = availabilityService.updateAvailability(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("Availability slot not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Delete a recurring availability slot.
     *
     * @param id The slot to delete
     * @return 204 No Content if deleted, 404 Not Found if it doesn't exist
     * @apiNote DELETE /api/availability/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable Long id) {
        if (availabilityService.getAvailabilityById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        availabilityService.deleteAvailability(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete every recurring availability slot, for every tutor. The Node
     * layer gates this behind a typed confirmation phrase before ever
     * calling it - there's no confirmation step here, since role/identity
     * checks already happen in Node, not this layer (see class javadoc).
     *
     * @return 200 with how many rows were deleted
     * @apiNote DELETE /api/availability
     */
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteAllAvailability() {
        long deletedCount = availabilityService.deleteAllAvailability();
        return ResponseEntity.ok(Map.of("deletedCount", deletedCount));
    }
}
