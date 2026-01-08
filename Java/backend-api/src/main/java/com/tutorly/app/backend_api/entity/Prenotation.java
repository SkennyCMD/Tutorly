package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a Prenotation (Booking/Reservation) in the tutoring system
 * 
 * Prenotations are scheduled or requested tutoring sessions.
 * Each prenotation has a time range, links to student and tutor, and a flag for status tracking.
 * The creator field tracks which tutor created the prenotation.
 * 
 * Database table: prenotation
 */
@Entity
@Table(name = "prenotation")
public class Prenotation {
    
    /**
     * Primary key - auto-generated prenotation ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Timestamp when the prenotation was created
     * Automatically set to current time on creation
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Status flag (typically for confirmation or completion status)
     * Default: false (unconfirmed/pending)
     */
    @Column(name = "flag", nullable = false)
    private Boolean flag = false;
    
    /**
     * Start date/time of the scheduled session
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    /**
     * End date/time of the scheduled session
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    /**
     * The student who booked or is assigned to this prenotation
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-prenotations")
    private Student student;
    
    /**
     * The tutor assigned to conduct this session
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-prenotations")
    private Tutor tutor;
    
    /**
     * The tutor who created this prenotation record
     */
    @ManyToOne
    @JoinColumn(name = "id_creator", nullable = false)
    @JsonBackReference("tutor-createdPrenotations")
    private Tutor creator;
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public Prenotation() {
    }
    
    /**
     * Constructor with required fields
     * 
     * @param startTime Start date/time
     * @param endTime End date/time
     * @param student Student for the session
     * @param tutor Tutor conducting the session
     * @param creator Tutor who created the prenotation
     */
    public Prenotation(LocalDateTime startTime, LocalDateTime endTime, Student student, Tutor tutor, Tutor creator) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.student = student;
        this.tutor = tutor;
        this.creator = creator;
    }
    
    // Getters and Setters
    
    /**
     * Get the prenotation ID
     * @return Prenotation ID
     */
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
    
    public Tutor getTutor() {
        return tutor;
    }
    
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    public Tutor getCreator() {
        return creator;
    }
    
    public void setCreator(Tutor creator) {
        this.creator = creator;
    }
}
