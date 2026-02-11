package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing a Calendar Note in the tutoring system
 * 
 * Calendar notes are time-based events or reminders created by tutors.
 * Each note has a time range and can be associated with multiple tutors.
 * Used for scheduling, reminders, and calendar management.
 * 
 * Database table: calendar_note
 */
@Entity
@Table(name = "calendar_note")
public class CalendarNote {
    
    /**
     * Primary key - auto-generated calendar note ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Description of the calendar note/event
     * Can contain detailed information about the event
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Start date/time of the event
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    /**
     * End date/time of the event
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    /**
     * The tutor who created this calendar note
     */
    @ManyToOne
    @JoinColumn(name = "id_creator", nullable = false)
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations", 
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private Tutor creator;
    
    /**
     * Collection of tutors associated with this calendar note
     * Many-to-many relationship through the 'has' junction table
     */
    @ManyToMany
    @JoinTable(
        name = "has",
        joinColumns = @JoinColumn(name = "id_calendar_note"),
        inverseJoinColumns = @JoinColumn(name = "id_tutor")
    )
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations", 
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private Set<Tutor> tutors = new HashSet<>();
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public CalendarNote() {
    }
    
    /**
     * Constructor with required fields
     * 
     * @param description Event description
     * @param startTime Start date/time of the event
     * @param endTime End date/time of the event
     * @param creator Tutor who created the note
     */
    public CalendarNote(String description, LocalDateTime startTime, LocalDateTime endTime, Tutor creator) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.creator = creator;
    }
    
    // Getters and Setters
    
    /**
     * Get the calendar note ID
     * @return Calendar note ID
     */
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
    
    /**
     * Set the collection of associated tutors
     * @param tutors Set of tutors
     */
    public void setTutors(Set<Tutor> tutors) {
        this.tutors = tutors;
    }
}
