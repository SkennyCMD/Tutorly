package com.tutorly.app.backend_api.dto;

import com.tutorly.app.backend_api.entity.Prenotation;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Prenotation responses.
 * 
 * <p>This DTO is used in REST API endpoints to return prenotation data to clients.
 * It provides a flat structure with student information included directly in the response,
 * avoiding circular reference issues that can occur during JSON serialization when
 * entity relationships are involved.</p>
 * 
 * <p>Design Rationale:
 * <ul>
 *   <li>Flattens entity relationships to prevent circular serialization issues</li>
 *   <li>Includes denormalized student data (name, surname, class) for client convenience</li>
 *   <li>Handles null student references and lazy loading exceptions gracefully</li>
 *   <li>Separates API response structure from database entity structure</li>
 *   <li>Provides all necessary information for calendar and booking displays</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * // Converting entity to response DTO
 * Prenotation prenotation = prenotationRepository.findById(id);
 * PrenotationResponseDTO dto = new PrenotationResponseDTO(prenotation);
 * return ResponseEntity.ok(dto);
 * 
 * // The response will include student details without circular references
 * </pre>
 * </p>
 * 
 * @see com.tutorly.app.backend_api.entity.Prenotation
 * @see com.tutorly.app.backend_api.controller.PrenotationController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class PrenotationResponseDTO {
    
    /**
     * Unique identifier of the prenotation.
     */
    private Long id;
    
    /**
     * Start date and time of the prenotation.
     */
    private LocalDateTime startTime;
    
    /**
     * End date and time of the prenotation.
     */
    private LocalDateTime endTime;
    
    /**
     * Timestamp when the prenotation was created.
     */
    private LocalDateTime createdAt;
    
    /**
     * Flag indicating the status of the prenotation.
     * True typically means confirmed, false means pending.
     */
    private Boolean flag;
    
    /**
     * ID of the student for whom the prenotation was made.
     */
    private Long studentId;
    
    /**
     * ID of the tutor assigned to the prenotation.
     */
    private Long tutorId;
    
    /**
     * ID of the user who created the prenotation.
     */
    private Long creatorId;
    
    
    // Denormalized Student Information
    
    // These fields contain student data extracted from the related entity
    // to avoid circular references and provide convenient access for clients.
    
    /**
     * First name of the student.
     * Set to "Unknown" if student entity is not available.
     */
    private String studentName;
    
    /**
     * Surname of the student.
     * Set to empty string if student entity is not available.
     */
    private String studentSurname;
    
    /**
     * Class/grade of the student (e.g., "3A", "5B").
     * Set to empty string if student entity is not available.
     */
    private String studentClass;
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Creates an empty DTO instance for manual population.
     */
    public PrenotationResponseDTO() {
    }
    
    /**
     * Constructor that converts a Prenotation entity to a response DTO.
     * 
     * <p>Automatically extracts and flattens student information from the entity.
     * Handles null student references and lazy loading exceptions by providing
     * default fallback values ("Unknown" for name, empty strings for other fields).</p>
     * 
     * @param prenotation The Prenotation entity to convert to DTO
     */
    public PrenotationResponseDTO(Prenotation prenotation) {
        this.id = prenotation.getId();
        this.startTime = prenotation.getStartTime();
        this.endTime = prenotation.getEndTime();
        this.createdAt = prenotation.getCreatedAt();
        this.flag = prenotation.getFlag();
        this.studentId = prenotation.getStudentId();
        this.tutorId = prenotation.getTutorId();
        this.creatorId = prenotation.getCreatorId();
        
        // Extract and flatten student information to avoid circular references
        // Handle null case and lazy loading exceptions gracefully
        try {
            if (prenotation.getStudent() != null) {
                this.studentName = prenotation.getStudent().getName();
                this.studentSurname = prenotation.getStudent().getSurname();
                this.studentClass = prenotation.getStudent().getStudentClass();
            } else {
                // Fallback values if student is null
                this.studentName = "Unknown";
                this.studentSurname = "";
                this.studentClass = "";
            }
        } catch (Exception e) {
            // Handle lazy loading exceptions or other entity access issues
            // Provide fallback values to ensure the DTO is always usable
            this.studentName = "Unknown";
            this.studentSurname = "";
            this.studentClass = "";
        }
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the unique identifier of the prenotation.
     * 
     * @return The prenotation ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the prenotation.
     * 
     * @param id The prenotation ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
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
     * @param startTime The start date and time
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
     * @param endTime The end date and time
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    /**
     * Gets the timestamp when the prenotation was created.
     * 
     * @return The creation timestamp
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    /**
     * Sets the timestamp when the prenotation was created.
     * 
     * @param createdAt The creation timestamp
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    /**
     * Gets the flag indicating the status of the prenotation.
     * 
     * @return True if confirmed, false if pending
     */
    public Boolean getFlag() {
        return flag;
    }
    
    /**
     * Sets the flag indicating the status of the prenotation.
     * 
     * @param flag True for confirmed, false for pending
     */
    public void setFlag(Boolean flag) {
        this.flag = flag;
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
     * @param studentId The student's user ID
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
     * @param tutorId The tutor's user ID
     */
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }
    
    /**
     * Gets the ID of the user who created this prenotation.
     * 
     * @return The creator's user ID
     */
    public Long getCreatorId() {
        return creatorId;
    }
    
    /**
     * Sets the ID of the user who created this prenotation.
     * 
     * @param creatorId The creator's user ID
     */
    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }
    
    /**
     * Gets the first name of the student.
     * Returns "Unknown" if student information was not available.
     * 
     * @return The student's first name
     */
    public String getStudentName() {
        return studentName;
    }
    
    /**
     * Sets the first name of the student.
     * 
     * @param studentName The student's first name
     */
    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }
    
    /**
     * Gets the surname of the student.
     * Returns empty string if student information was not available.
     * 
     * @return The student's surname
     */
    public String getStudentSurname() {
        return studentSurname;
    }
    
    /**
     * Sets the surname of the student.
     * 
     * @param studentSurname The student's surname
     */
    public void setStudentSurname(String studentSurname) {
        this.studentSurname = studentSurname;
    }
    
    /**
     * Gets the class/grade of the student (e.g., "3A", "5B").
     * Returns empty string if student information was not available.
     * 
     * @return The student's class
     */
    public String getStudentClass() {
        return studentClass;
    }
    
    /**
     * Sets the class/grade of the student.
     * 
     * @param studentClass The student's class (e.g., "3A", "5B")
     */
    public void setStudentClass(String studentClass) {
        this.studentClass = studentClass;
    }
}
