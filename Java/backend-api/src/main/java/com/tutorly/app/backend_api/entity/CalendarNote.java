package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "calendar_note")
public class CalendarNote {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    @ManyToOne
    @JoinColumn(name = "id_creator", nullable = false)
    @JsonBackReference("tutor-createdCalendarNotes")
    private Tutor creator;
    
    @ManyToMany
    @JoinTable(
        name = "has",
        joinColumns = @JoinColumn(name = "id_calendar_note"),
        inverseJoinColumns = @JoinColumn(name = "id_tutor")
    )
    @JsonBackReference("tutor-calendarNotes")
    private Set<Tutor> tutors = new HashSet<>();
    
    // Costruttori
    public CalendarNote() {
    }
    
    public CalendarNote(String description, LocalDateTime startTime, LocalDateTime endTime, Tutor creator) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.creator = creator;
    }
    
    // Getter e Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public Tutor getCreator() {
        return creator;
    }
    
    public void setCreator(Tutor creator) {
        this.creator = creator;
    }
    
    public Set<Tutor> getTutors() {
        return tutors;
    }
    
    public void setTutors(Set<Tutor> tutors) {
        this.tutors = tutors;
    }
}
