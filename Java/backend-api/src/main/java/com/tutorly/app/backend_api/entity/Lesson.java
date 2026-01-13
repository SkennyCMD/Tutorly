package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a Lesson in the tutoring system
 * 
 * Lessons are actual tutoring sessions between a tutor and a student.
 * Each lesson has a time range, description, and links to the involved tutor and student.
 * Used for tracking completed and scheduled tutoring sessions.
 * 
 * Database table: lesson
 */
@Entity
@Table(name = "lesson")
public class Lesson {
    
    /**
     * Primary key - auto-generated lesson ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Description of the lesson content or topics covered
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Start date/time of the lesson
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    /**
     * End date/time of the lesson
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    /**
     * The tutor conducting the lesson
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-lessons")
    private Tutor tutor;
    
    /**
     * The student attending the lesson
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-lessons")
    private Student student;
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public Lesson() {
    }
    
    /**
     * Constructor with all required fields
     * 
     * @param description Lesson content description
     * @param startTime Start date/time
     * @param endTime End date/time
     * @param tutor Tutor conducting the lesson
     * @param student Student attending the lesson
     */
    public Lesson(String description, LocalDateTime startTime, LocalDateTime endTime, Tutor tutor, Student student) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.tutor = tutor;
        this.student = student;
    }
    
    // Getters and Setters
    
    /**
     * Get the lesson ID
     * @return Lesson ID
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
    
    public Tutor getTutor() {
        return tutor;
    }
    
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
    
    /**
     * Get the student ID for JSON serialization
     * @return Student ID
     */
    @JsonProperty("studentId")
    public Long getStudentId() {
        return student != null ? student.getId() : null;
    }
    
    /**
     * Get the tutor ID for JSON serialization
     * @return Tutor ID
     */
    @JsonProperty("tutorId")
    public Long getTutorId() {
        return tutor != null ? tutor.getId() : null;
    }
}
