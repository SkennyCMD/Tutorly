package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating a new Prenotation
 * Accepts IDs instead of full entity objects for simpler API requests
 */
public class PrenotationCreateDTO {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long studentId;
    private Long tutorId;
    private Long creatorId;
    private Boolean flag = false;

    // Constructors
    public PrenotationCreateDTO() {
    }

    public PrenotationCreateDTO(LocalDateTime startTime, LocalDateTime endTime, Long studentId, Long tutorId, Long creatorId) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.studentId = studentId;
        this.tutorId = tutorId;
        this.creatorId = creatorId;
    }

    // Getters and Setters
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

    public Boolean getFlag() {
        return flag;
    }

    public void setFlag(Boolean flag) {
        this.flag = flag;
    }
}
