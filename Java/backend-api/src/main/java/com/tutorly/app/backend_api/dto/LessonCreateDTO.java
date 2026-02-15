package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating a new Lesson.
 * 
 * <p>This DTO is used in REST API endpoints to accept lesson creation requests
 * with simplified data structures. Instead of requiring full entity objects, it accepts
 * simple IDs for related entities (tutor and student), reducing payload complexity and
 * preventing unnecessary data exposure.</p>
 * 
 * <p>Design Rationale:
 * <ul>
 *   <li>Uses primitive IDs instead of entity references to avoid circular dependencies</li>
 *   <li>One-to-one relationship: each lesson has exactly one tutor and one student</li>
 *   <li>Validates time ranges (startTime before endTime) at service layer</li>
 *   <li>Separates API contracts from database entity structure</li>
 *   <li>Description field stores lesson type or notes (e.g., "M", "S", "U")</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * LessonCreateDTO dto = new LessonCreateDTO();
 * dto.setDescription("Mathematics tutoring session");
 * dto.setStartTime(LocalDateTime.of(2026, 2, 16, 14, 0));
 * dto.setEndTime(LocalDateTime.of(2026, 2, 16, 15, 30));
 * dto.setTutorId(5L);
 * dto.setStudentId(10L);
 * </pre>
 * </p>
 * 
 * @see com.tutorly.app.backend_api.entity.Lesson
 * @see com.tutorly.app.backend_api.controller.LessonController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class LessonCreateDTO {
    
    /**
     * Description or type of the lesson.
     * Commonly stores lesson type codes ("M" for middle school, "S" for high school, "U" for university)
     * or additional notes about the lesson content.
     */
    private String description;
    
    /**
     * Start date and time of the lesson.
     * Must be before or equal to endTime.
     */
    private LocalDateTime startTime;
    
    /**
     * End date and time of the lesson.
     * Must be after or equal to startTime.
     */
    private LocalDateTime endTime;
    
    /**
     * ID of the tutor conducting this lesson.
     * References the User entity's primary key (must have TUTOR or STAFF role).
     */
    private Long tutorId;
    
    /**
     * ID of the student attending this lesson.
     * References the User entity's primary key (must have STUDENT role).
     */
    private Long studentId;
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required for JSON deserialization by Jackson and other serialization frameworks.
     */
    public LessonCreateDTO() {
    }
    
    /**
     * Parameterized constructor for creating a fully initialized DTO.
     * 
     * @param description Description or type code of the lesson
     * @param startTime Start time of the lesson
     * @param endTime End time of the lesson
     * @param tutorId ID of the tutor conducting the lesson
     * @param studentId ID of the student attending the lesson
     */
    public LessonCreateDTO(String description, LocalDateTime startTime, LocalDateTime endTime, Long tutorId, Long studentId) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.tutorId = tutorId;
        this.studentId = studentId;
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the description or type of the lesson.
     * 
     * @return The lesson's description text or type code
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the description or type of the lesson.
     * 
     * @param description The lesson's description text or type code
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the start time of the lesson.
     * 
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    /**
     * Sets the start time of the lesson.
     * 
     * @param startTime The start date and time (should be before or equal to endTime)
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    /**
     * Gets the end time of the lesson.
     * 
     * @return The end date and time
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    /**
     * Sets the end time of the lesson.
     * 
     * @param endTime The end date and time (should be after or equal to startTime)
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    /**
     * Gets the ID of the tutor conducting this lesson.
     * 
     * @return The tutor's user ID
     */
    public Long getTutorId() {
        return tutorId;
    }
    
    /**
     * Sets the ID of the tutor conducting this lesson.
     * 
     * @param tutorId The tutor's user ID (must reference a user with TUTOR or STAFF role)
     */
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }
    
    /**
     * Gets the ID of the student attending this lesson.
     * 
     * @return The student's user ID
     */
    public Long getStudentId() {
        return studentId;
    }
    
    /**
     * Sets the ID of the student attending this lesson.
     * 
     * @param studentId The student's user ID (must reference a user with STUDENT role)
     */
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}
