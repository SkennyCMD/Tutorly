package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for creating a new Calendar Note
 * Used to accept simple IDs instead of full entity objects
 */
public class CalendarNoteCreateDTO {
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long creatorId;
    private List<Long> tutorIds; // IDs dei tutor a cui assegnare la nota
    
    // Constructors
    public CalendarNoteCreateDTO() {
    }
    
    public CalendarNoteCreateDTO(String description, LocalDateTime startTime, LocalDateTime endTime, 
                                  Long creatorId, List<Long> tutorIds) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.creatorId = creatorId;
        this.tutorIds = tutorIds;
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
    
    public Long getCreatorId() {
        return creatorId;
    }
    
    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }
    
    public List<Long> getTutorIds() {
        return tutorIds;
    }
    
    public void setTutorIds(List<Long> tutorIds) {
        this.tutorIds = tutorIds;
    }
}
