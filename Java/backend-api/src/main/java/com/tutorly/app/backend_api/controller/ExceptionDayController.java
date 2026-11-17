package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.ExceptionDayCreateDTO;
import com.tutorly.app.backend_api.entity.ExceptionDay;
import com.tutorly.app.backend_api.service.ExceptionDayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for ExceptionDay entity operations.
 *
 * Backs the Node.js frontend's Availability page - see
 * docs/03_Nodejs_Frontend.md and docs/05_Service_Modules.md. All endpoints
 * require API key authentication. Role restriction (GENERIC/STAFF can submit
 * a request for themselves; approving/refusing it is a separate, not-yet-built
 * STAFF-only action) is enforced in the Node.js layer, not here.
 *
 * Base URL: /api/exception-days
 */
@RestController
@RequestMapping("/api/exception-days")
@CrossOrigin(origins = "*")
public class ExceptionDayController {

    @Autowired
    private ExceptionDayService exceptionDayService;

    /**
     * Get all exception days, for every tutor, regardless of approval status.
     *
     * @return List of all exception days
     * @apiNote GET /api/exception-days
     */
    @GetMapping
    public ResponseEntity<List<ExceptionDay>> getAllExceptionDays() {
        return ResponseEntity.ok(exceptionDayService.getAllExceptionDays());
    }

    /**
     * Get an exception day by ID.
     *
     * @param id The exception day ID
     * @return The exception day if found, 404 Not Found otherwise
     * @apiNote GET /api/exception-days/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExceptionDay> getExceptionDayById(@PathVariable Long id) {
        Optional<ExceptionDay> exceptionDay = exceptionDayService.getExceptionDayById(id);
        return exceptionDay.map(ResponseEntity::ok)
                            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all exception days requested by a specific tutor, regardless of
     * approval status.
     *
     * @param tutorId The tutor's ID
     * @return List of exception days belonging to that tutor
     * @apiNote GET /api/exception-days/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<ExceptionDay>> getExceptionDaysByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(exceptionDayService.getExceptionDaysByTutor(tutorId));
    }

    /**
     * Get a specific tutor's exception days falling within a date range
     * (inclusive), regardless of approval status - callers decide whether to
     * honor pending/refused ones.
     *
     * @param tutorId The tutor's ID
     * @param start   Start of the date range, inclusive (ISO 8601 date: yyyy-MM-dd)
     * @param end     End of the date range, inclusive (ISO 8601 date: yyyy-MM-dd)
     * @return List of matching exception days
     * @apiNote GET /api/exception-days/tutor/{tutorId}/range?start=2026-11-17&end=2026-11-23
     */
    @GetMapping("/tutor/{tutorId}/range")
    public ResponseEntity<List<ExceptionDay>> getExceptionDaysByTutorAndRange(
            @PathVariable Long tutorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(exceptionDayService.getExceptionDaysByTutorAndDateRange(tutorId, start, end));
    }

    /**
     * Create a new exception day request. Always saved as "pending", regardless
     * of what's in the request body - there's no status/staffId field on the DTO.
     *
     * @param dto The exception data to create (day, type, startTime, endTime, tutorId)
     * @return Created exception with 201 Created status, or 400 if invalid/tutor not found
     * @apiNote POST /api/exception-days
     */
    @PostMapping
    public ResponseEntity<?> createExceptionDay(@RequestBody ExceptionDayCreateDTO dto) {
        try {
            ExceptionDay saved = exceptionDayService.createExceptionDay(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
