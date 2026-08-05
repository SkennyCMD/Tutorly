package com.tutorly.app.backend_api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating a new Pack.
 *
 * <p>This DTO is used in REST API endpoints to accept lesson-package creation
 * requests with a simplified data structure. Instead of requiring a full entity
 * object, it accepts a plain ID for the related student, reducing payload
 * complexity and preventing unnecessary data exposure.</p>
 *
 * <p>Design Rationale:
 * <ul>
 *   <li>Uses a primitive ID instead of an entity reference to avoid circular dependencies</li>
 *   <li>Each pack is associated with exactly one student</li>
 *   <li>Separates API contracts from database entity structure</li>
 *   <li>A pack with no closure date is considered still active/open</li>
 * </ul>
 * </p>
 *
 * <p>Usage Example:
 * <pre>
 * PackCreateDTO dto = new PackCreateDTO();
 * dto.setHours(10.0);
 * dto.setStudentId(10L);
 * </pre>
 * </p>
 *
 * @see com.tutorly.app.backend_api.entity.Pack
 * @see com.tutorly.app.backend_api.controller.PackController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class PackCreateDTO {

    /**
     * Date and time the package starts being usable.
     */
    private LocalDateTime startTime;

    /**
     * Total number of hours purchased in this package.
     */
    private Double hours;

    /**
     * Date the package was closed (fully used, expired, or cancelled). Optional -
     * a package with no closure date is considered still active.
     */
    private LocalDate closure;

    /**
     * ID of the student this package was purchased for.
     */
    private Long studentId;


    // Constructors


    /**
     * Default no-argument constructor.
     * Required for JSON deserialization by Jackson and other serialization frameworks.
     */
    public PackCreateDTO() {
    }

    /**
     * Parameterized constructor for creating a fully initialized DTO.
     *
     * @param startTime Date and time the package starts being usable
     * @param hours Total number of hours purchased
     * @param closure Date the package was closed (optional, null while active)
     * @param studentId ID of the student this package belongs to
     */
    public PackCreateDTO(LocalDateTime startTime, Double hours, LocalDate closure, Long studentId) {
        this.startTime = startTime;
        this.hours = hours;
        this.closure = closure;
        this.studentId = studentId;
    }


    // Getters and Setters


    /**
     * Gets the date and time the package starts being usable.
     *
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }

    /**
     * Sets the date and time the package starts being usable.
     *
     * @param startTime The start date and time
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    /**
     * Gets the total number of hours purchased in this package.
     *
     * @return The number of hours
     */
    public Double getHours() {
        return hours;
    }

    /**
     * Sets the total number of hours purchased in this package.
     *
     * @param hours The number of hours
     */
    public void setHours(Double hours) {
        this.hours = hours;
    }

    /**
     * Gets the date the package was closed.
     *
     * @return The closure date, or null if the package is still active
     */
    public LocalDate getClosure() {
        return closure;
    }

    /**
     * Sets the date the package was closed.
     *
     * @param closure The closure date
     */
    public void setClosure(LocalDate closure) {
        this.closure = closure;
    }

    /**
     * Gets the ID of the student this package was purchased for.
     *
     * @return The student's ID
     */
    public Long getStudentId() {
        return studentId;
    }

    /**
     * Sets the ID of the student this package was purchased for.
     *
     * @param studentId The student's ID
     */
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}
