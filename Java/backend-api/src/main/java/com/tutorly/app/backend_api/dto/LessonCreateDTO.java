package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating a new Lesson
 * Used to accept simple IDs instead of full entity objects
 */
public class LessonCreateDTO {
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long tutorId;
    private Long studentId;
    
    // Constructors
    public LessonCreateDTO() {
    }
    
    public LessonCreateDTO(String description, LocalDateTime startTime, LocalDateTime endTime, Long tutorId, Long studentId) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.tutorId = tutorId;
        this.studentId = studentId;
    }
    
    // Getters and Setters
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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
    
    public Long getTutorId() {
        return tutorId;
    }
    
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }
    
    public Long getStudentId() {
        return studentId;
    }
    
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}
