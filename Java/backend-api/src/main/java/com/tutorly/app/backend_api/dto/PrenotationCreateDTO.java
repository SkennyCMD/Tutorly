package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating a new Prenotation (lesson booking/reservation).
 * 
 * <p>This DTO is used in REST API endpoints to accept prenotation creation requests
 * with simplified data structures. Instead of requiring full entity objects, it accepts
 * simple IDs for related entities (student, tutor, and creator), reducing payload complexity
 * and preventing unnecessary data exposure.</p>
 * 
 * <p>Design Rationale:
 * <ul>
 *   <li>Uses primitive IDs instead of entity references to avoid circular dependencies</li>
 *   <li>Prenotations represent scheduled time slots that may or may not be confirmed</li>
 *   <li>Flag field indicates prenotation status (confirmed, pending, etc.)</li>
 *   <li>Validates time ranges (startTime before endTime) at service layer</li>
 *   <li>Separates API contracts from database entity structure</li>
 *   <li>Creator may differ from student (e.g., staff creating on behalf of student)</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * PrenotationCreateDTO dto = new PrenotationCreateDTO();
 * dto.setStartTime(LocalDateTime.of(2026, 2, 16, 10, 0));
 * dto.setEndTime(LocalDateTime.of(2026, 2, 16, 11, 0));
 * dto.setStudentId(15L);
 * dto.setTutorId(8L);
 * dto.setCreatorId(8L);
 * dto.setFlag(true);
 * </pre>
 * </p>
 * 
 * @see com.tutorly.app.backend_api.entity.Prenotation
 * @see com.tutorly.app.backend_api.controller.PrenotationController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class PrenotationCreateDTO {
    
    /**
     * Start date and time of the prenotation.
     * Must be before or equal to endTime.
     */
    private LocalDateTime startTime;
    
    /**
     * End date and time of the prenotation.
     * Must be after or equal to startTime.
     */
    private LocalDateTime endTime;
    
    /**
     * ID of the student for whom this prenotation is being made.
     * References the User entity's primary key (must have STUDENT role).
     */
    private Long studentId;
    
    /**
     * ID of the tutor assigned to this prenotation.
     * References the User entity's primary key (must have TUTOR or STAFF role).
     */
    private Long tutorId;
    
    /**
     * ID of the user creating this prenotation.
     * May differ from studentId when staff creates prenotations on behalf of students.
     * References the User entity's primary key.
     */
    private Long creatorId;
    
    /**
     * Flag indicating the status of the prenotation.
     * Default value is false. True typically indicates the prenotation is confirmed.
     */
    private Boolean flag = false;

    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required for JSON deserialization by Jackson and other serialization frameworks.
     * Initializes flag to false by default.
     */
    public PrenotationCreateDTO() {
    }

    /**
     * Parameterized constructor for creating a fully initialized DTO.
     * Flag is initialized to default value (false).
     * 
     * @param startTime Start time of the prenotation
     * @param endTime End time of the prenotation
     * @param studentId ID of the student
     * @param tutorId ID of the tutor
     * @param creatorId ID of the user creating the prenotation
     */
    public PrenotationCreateDTO(LocalDateTime startTime, LocalDateTime endTime, Long studentId, Long tutorId, Long creatorId) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.studentId = studentId;
        this.tutorId = tutorId;
        this.creatorId = creatorId;
    }

    
    // Getters and Setters
    
    
    /**
     * Gets the start time of the prenotation.
     * 
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }

    /**
     * Sets the start time of the prenotation.
     * 
     * @param startTime The start date and time (should be before or equal to endTime)
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    /**
     * Gets the end time of the prenotation.
     * 
     * @return The end date and time
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }

    /**
     * Sets the end time of the prenotation.
     * 
     * @param endTime The end date and time (should be after or equal to startTime)
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    /**
     * Gets the ID of the student for this prenotation.
     * 
     * @return The student's user ID
     */
    public Long getStudentId() {
        return studentId;
    }

    /**
     * Sets the ID of the student for this prenotation.
     * 
     * @param studentId The student's user ID (must reference a user with STUDENT role)
     */
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    /**
     * Gets the ID of the tutor assigned to this prenotation.
     * 
     * @return The tutor's user ID
     */
    public Long getTutorId() {
        return tutorId;
    }

    /**
     * Sets the ID of the tutor assigned to this prenotation.
     * 
     * @param tutorId The tutor's user ID (must reference a user with TUTOR or STAFF role)
     */
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }

    /**
     * Gets the ID of the user creating this prenotation.
     * 
     * @return The creator's user ID
     */
    public Long getCreatorId() {
        return creatorId;
    }

    /**
     * Sets the ID of the user creating this prenotation.
     * 
     * @param creatorId The creator's user ID (may differ from studentId for staff-created prenotations)
     */
    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    /**
     * Gets the flag indicating the status of the prenotation.
     * 
     * @return True if confirmed, false otherwise (default is false)
     */
    public Boolean getFlag() {
        return flag;
    }

    /**
     * Sets the flag indicating the status of the prenotation.
     * 
     * @param flag True for confirmed prenotation, false for pending/unconfirmed
     */
    public void setFlag(Boolean flag) {
        this.flag = flag;
    }
}
