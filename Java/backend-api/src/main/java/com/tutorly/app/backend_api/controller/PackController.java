package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.PackCreateDTO;
import com.tutorly.app.backend_api.entity.Pack;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.service.PackService;
import com.tutorly.app.backend_api.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Pack entity operations
 *
 * Manages lesson packages (prepaid blocks of tutoring hours) in the system.
 * All endpoints require API key authentication.
 *
 * Base URL: /api/packs
 */
@RestController
@RequestMapping("/api/packs")
@CrossOrigin(origins = "*")
@Slf4j
public class PackController {

    @Autowired
    private PackService packService;

    @Autowired
    private StudentService studentService;

    /**
     * Get all packs
     *
     * @return List of all packs in the system
     * @apiNote GET /api/packs
     */
    @GetMapping
    public ResponseEntity<List<Pack>> getAllPacks() {
        return ResponseEntity.ok(packService.getAllPacks());
    }

    /**
     * Get pack by ID
     *
     * @param id The pack ID
     * @return Pack entity if found, 404 Not Found otherwise
     * @apiNote GET /api/packs/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Pack> getPackById(@PathVariable Long id) {
        Optional<Pack> pack = packService.getPackById(id);
        return pack.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all packs for a specific student
     *
     * Each pack is annotated with "usedHours" - the total hours already drawn from it
     * by its associated lessons - so clients can render progress (e.g. a progress bar)
     * without having to fetch and cross-reference every lesson themselves. Packs that are
     * full (usedHours >= hours) and still open are also annotated with "unassignedHours" -
     * hours the student has done since that pack started that weren't drawn from any pack,
     * i.e. lessons booked once the pack ran out - and, if there are any, with
     * "firstUnassignedLessonStart", the start time of the earliest such lesson (useful to
     * pre-fill a new pack's start date/time so it can absorb those hours retroactively).
     *
     * @param studentId The student ID
     * @return List of packs belonging to the specified student, each with a usedHours field
     * @apiNote GET /api/packs/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getPacksByStudent(@PathVariable Long studentId) {
        List<Map<String, Object>> packs = packService.getPacksByStudent(studentId).stream()
                .map(pack -> {
                    Map<String, Object> dto = new HashMap<>();
                    double usedHours = packService.getUsedHours(pack);
                    boolean isFullAndOpen = pack.getClosure() == null && usedHours >= pack.getHours();
                    double unassignedHours = isFullAndOpen ? packService.getHoursOutsidePack(pack) : 0.0;
                    dto.put("id", pack.getId());
                    dto.put("createdAt", pack.getCreatedAt());
                    dto.put("startTime", pack.getStartTime());
                    dto.put("hours", pack.getHours());
                    dto.put("closure", pack.getClosure());
                    dto.put("studentId", pack.getStudentId());
                    dto.put("usedHours", usedHours);
                    dto.put("unassignedHours", unassignedHours);
                    if (unassignedHours > 0) {
                        packService.getFirstUnassignedLessonStart(pack)
                                .ifPresent(start -> dto.put("firstUnassignedLessonStart", start));
                    }
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(packs);
    }

    /**
     * Create a new pack
     *
     * Accepts a flat-ID DTO (studentId) rather than the raw entity, looking up
     * the referenced Student before saving - mirrors TestController's createTest.
     *
     * @param dto The pack data to create
     * @return Created pack with 201 Created status, or 400 if student not found
     * @apiNote POST /api/packs
     */
    @PostMapping
    public ResponseEntity<?> createPack(@RequestBody PackCreateDTO dto) {
        try {
            log.info("Attempting to create pack for student {}", dto.getStudentId());
            Optional<Student> studentOpt = studentService.getStudentById(dto.getStudentId());

            if (studentOpt.isEmpty()) {
                log.warn("Student not found with ID: {}", dto.getStudentId());
                return ResponseEntity.badRequest().body("Student not found with ID: " + dto.getStudentId());
            }

            Pack pack = new Pack();
            pack.setStartTime(dto.getStartTime());
            pack.setHours(dto.getHours());
            pack.setClosure(dto.getClosure());
            pack.setStudent(studentOpt.get());

            Pack savedPack = packService.savePack(pack);
            log.info("Successfully created pack with ID {}", savedPack.getId());

            packService.assignUnassignedLessonsSince(savedPack);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedPack);
        } catch (Exception e) {
            log.error("Error creating pack: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating pack: " + e.getMessage());
        }
    }

    /**
     * Update an existing pack
     *
     * Accepts the same flat-ID DTO shape as pack creation (studentId) rather
     * than the raw entity, since Pack's student field is write-only via its
     * related entity and isn't deserializable from a plain ID on the entity itself.
     *
     * @param id The pack ID to update
     * @param dto The updated pack data (hours, closure, studentId)
     * @return Updated pack if found, 404 Not Found if pack/student don't exist
     * @apiNote PUT /api/packs/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePack(@PathVariable Long id, @RequestBody PackCreateDTO dto) {
        Optional<Pack> existingPack = packService.getPackById(id);
        if (existingPack.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Student> student = studentService.getStudentById(dto.getStudentId());
        if (student.isEmpty()) {
            return ResponseEntity.badRequest().body("Student not found with ID: " + dto.getStudentId());
        }

        Pack pack = existingPack.get();
        pack.setStartTime(dto.getStartTime());
        pack.setHours(dto.getHours());
        pack.setClosure(dto.getClosure());
        pack.setStudent(student.get());

        return ResponseEntity.ok(packService.savePack(pack));
    }

    /**
     * Close a pack
     *
     * Sets the pack's closure date to today, marking it as no longer active.
     * If the pack is already closed, its existing closure date is left untouched.
     *
     * @param id The pack ID to close
     * @return Updated pack if found, 404 Not Found if pack doesn't exist
     * @apiNote PUT /api/packs/{id}/close
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closePack(@PathVariable Long id) {
        Optional<Pack> packOpt = packService.getPackById(id);
        if (packOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Pack pack = packOpt.get();
        if (pack.getClosure() == null) {
            pack.setClosure(LocalDate.now());
            pack = packService.savePack(pack);
            log.info("Closed pack with ID {}", id);
        }

        return ResponseEntity.ok(pack);
    }

    /**
     * Delete a pack
     *
     * @param id The pack ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if pack doesn't exist
     * @apiNote DELETE /api/packs/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePack(@PathVariable Long id) {
        if (packService.getPackById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        packService.deletePack(id);
        return ResponseEntity.noContent().build();
    }
}
