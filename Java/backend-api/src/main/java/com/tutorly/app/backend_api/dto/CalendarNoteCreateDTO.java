package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for creating a new Calendar Note.
 * 
 * <p>This DTO is used in REST API endpoints to accept calendar note creation requests
 * with simplified data structures. Instead of requiring full entity objects, it accepts
 * simple IDs for related entities (creator and tutors), reducing payload complexity and
 * preventing unnecessary data exposure.</p>
 * 
 * <p>Design Rationale:
 * <ul>
 *   <li>Uses primitive IDs instead of entity references to avoid circular dependencies</li>
 *   <li>Supports multiple tutor assignments via List of tutor IDs</li>
 *   <li>Validates time ranges (startTime before endTime) at service layer</li>
 *   <li>Separates API contracts from database entity structure</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * CalendarNoteCreateDTO dto = new CalendarNoteCreateDTO();
 * dto.setDescription("Team meeting");
 * dto.setStartTime(LocalDateTime.of(2026, 2, 16, 10, 0));
 * dto.setEndTime(LocalDateTime.of(2026, 2, 16, 11, 0));
 * dto.setCreatorId(1L);
 * dto.setTutorIds(Arrays.asList(2L, 3L, 4L));
 * </pre>
 * </p>
 * 
 * @see com.tutorly.app.backend_api.entity.CalendarNote
 * @see com.tutorly.app.backend_api.controller.CalendarNoteController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class CalendarNoteCreateDTO {
    
    /**
     * Textual description/content of the calendar note.
     * This field contains the main message or purpose of the note.
     */
    private String description;
    
    /**
     * Start date and time of the note's time range.
     * Must be before or equal to endTime.
     */
    private LocalDateTime startTime;
    
    /**
     * End date and time of the note's time range.
     * Must be after or equal to startTime.
     */
    private LocalDateTime endTime;
    
    /**
     * ID of the user creating this calendar note.
     * References the User entity's primary key.
     */
    private Long creatorId;
    
    /**
     * List of tutor IDs to whom this note should be assigned.
     * Each ID references a User entity with TUTOR or STAFF role.
     * Empty list means the note is assigned to no specific tutors.
     */
    private List<Long> tutorIds;
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required for JSON deserialization by Jackson and other serialization frameworks.
     */
    public CalendarNoteCreateDTO() {
    }
    
    /**
     * Parameterized constructor for creating a fully initialized DTO.
     * 
     * @param description Textual content of the note
     * @param startTime Start time of the note's time range
     * @param endTime End time of the note's time range
     * @param creatorId ID of the user creating the note
     * @param tutorIds List of tutor IDs to assign the note to
     */
    public CalendarNoteCreateDTO(String description, LocalDateTime startTime, LocalDateTime endTime, 
                                  Long creatorId, List<Long> tutorIds) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.creatorId = creatorId;
        this.tutorIds = tutorIds;
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the description of the calendar note.
     * 
     * @return The note's description text
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the description of the calendar note.
     * 
     * @param description The note's description text
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the start time of the note's time range.
     * 
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    /**
     * Sets the start time of the note's time range.
     * 
     * @param startTime The start date and time (should be before or equal to endTime)
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    /**
     * Gets the end time of the note's time range.
     * 
     * @return The end date and time
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    /**
     * Sets the end time of the note's time range.
     * 
     * @param endTime The end date and time (should be after or equal to startTime)
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    /**
     * Gets the ID of the user creating this note.
     * 
     * @return The creator's user ID
     */
    public Long getCreatorId() {
        return creatorId;
    }
    
    /**
     * Sets the ID of the user creating this note.
     * 
     * @param creatorId The creator's user ID
     */
    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }
    
    /**
     * Gets the list of tutor IDs to whom this note is assigned.
     * 
     * @return List of tutor user IDs (may be empty but not null)
     */
    public List<Long> getTutorIds() {
        return tutorIds;
    }
    
    /**
     * Sets the list of tutor IDs to whom this note should be assigned.
     * 
     * @param tutorIds List of tutor user IDs (can be empty for unassigned notes)
     */
    public void setTutorIds(List<Long> tutorIds) {
        this.tutorIds = tutorIds;
    }
}
