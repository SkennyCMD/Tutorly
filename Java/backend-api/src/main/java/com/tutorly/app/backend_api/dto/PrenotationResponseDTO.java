package com.tutorly.app.backend_api.dto;

import com.tutorly.app.backend_api.entity.Prenotation;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Prenotation responses
 * 
 * Provides a flat structure with student information included
 * to avoid circular reference issues during JSON serialization.
 */
public class PrenotationResponseDTO {
    
    private Long id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private Boolean flag;
    private Long studentId;
    private Long tutorId;
    private Long creatorId;
    
    // Student information
    private String studentName;
    private String studentSurname;
    private String studentClass;
    
    /**
     * Default constructor
     */
    public PrenotationResponseDTO() {
    }
    
    /**
     * Constructor from Prenotation entity
     * 
     * @param prenotation Prenotation entity to convert
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
        
        // Extract student information - handle null case
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
            // Handle lazy loading exceptions
            this.studentName = "Unknown";
            this.studentSurname = "";
            this.studentClass = "";
        }
    }
    
    // Getters and Setters
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Boolean getFlag() {
        return flag;
    }
    
    public void setFlag(Boolean flag) {
        this.flag = flag;
    }
    
    public Long getStudentId() {
        return studentId;
    }
    
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
    
    public Long getTutorId() {
        return tutorId;
    }
    
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }
    
    public Long getCreatorId() {
        return creatorId;
    }
    
    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }
    
    public String getStudentName() {
        return studentName;
    }
    
    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }
    
    public String getStudentSurname() {
        return studentSurname;
    }
    
    public void setStudentSurname(String studentSurname) {
        this.studentSurname = studentSurname;
    }
    
    public String getStudentClass() {
        return studentClass;
    }
    
    public void setStudentClass(String studentClass) {
        this.studentClass = studentClass;
    }
}
