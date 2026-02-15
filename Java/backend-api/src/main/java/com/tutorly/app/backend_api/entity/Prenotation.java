package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a Prenotation (Booking/Reservation) in the tutoring system.
 * 
 * <p>Prenotations are scheduled or requested tutoring sessions that may be pending
 * confirmation, confirmed, or completed. They represent lesson bookings created by tutors
 * on behalf of students, with flexible creator tracking.</p>
 * 
 * <p>Key Features:
 * <ul>
 *   <li>Status tracking: boolean flag for confirmation state</li>
 *   <li>Time-bound: has defined start and end times</li>
 *   <li>Creator tracking: distinguishes who created the booking vs who it's assigned to</li>
 *   <li>Timestamp: automatically records creation time</li>
 *   <li>JSON-friendly: provides helper methods for ID serialization</li>
 * </ul>
 * </p>
 * 
 * <p>Common Use Cases:
 * <ul>
 *   <li>Creating lesson bookings for students by tutors or admins</li>
 *   <li>Managing pending vs confirmed tutoring sessions</li>
 *   <li>Tracking who initiated bookings for accountability</li>
 *   <li>Scheduling future sessions with confirmation workflow</li>
 *   <li>Converting prenotations to completed lessons after delivery</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
 * Student student = studentRepository.findById(studentId).orElseThrow();
 * Tutor creator = tutorRepository.findById(creatorId).orElseThrow();
 * Prenotation prenotation = new Prenotation(
 *     LocalDateTime.of(2026, 2, 20, 10, 0),
 *     LocalDateTime.of(2026, 2, 20, 11, 30),
 *     student,
 *     tutor,
 *     creator
 * );
 * // Set flag to true when confirmed
 * prenotation.setFlag(true);
 * prenotationRepository.save(prenotation);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: prenotation</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Keys: id_student, id_tutor, id_creator</li>
 *   <li>Timestamps: created_at (automatically set)</li>
 * </ul>
 * </p>
 * 
 * @see Student
 * @see Tutor
 * @see Lesson
 * @see PrenotationCreateDTO
 * @see PrenotationResponseDTO
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "prenotation")
public class Prenotation {
    
    /**
     * Primary key - Unique identifier for the prenotation.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Timestamp when the prenotation record was created.
     * 
     * Automatically initialized to current time upon entity instantiation.
     * Cannot be null - used for tracking when bookings were made.
     * Useful for sorting, filtering, and auditing prenotation creation history.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Boolean status flag for tracking prenotation state.
     * 
     * Typically used to indicate:
     * - false: unconfirmed, pending, or awaiting approval
     * - true: confirmed, approved, or completed
     * 
     * Default value is false (pending state).
     * Cannot be null - every prenotation must have a defined status.
     */
    @Column(name = "flag", nullable = false)
    private Boolean flag = false;
    
    /**
     * Start date and time of the scheduled tutoring session.
     * 
     * Marks when the booked session is scheduled to begin.
     * Cannot be null - every prenotation must have a defined start time.
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    /**
     * End date and time of the scheduled tutoring session.
     * 
     * Marks when the booked session is scheduled to end.
     * Cannot be null - every prenotation must have a defined end time.
     * Duration is calculated as the difference between endTime and startTime.
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    /**
     * The student who is assigned to or receiving this prenotation.
     * 
     * Many-to-one relationship with Student entity.
     * Required (nullable = false) as every prenotation must have an assigned student.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * The student's ID can be accessed directly via the getStudentId() helper method.
     * 
     * Note: The student may not be the creator of the prenotation - tutors often
     * create bookings on behalf of students.
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-prenotations")
    private Student student;
    
    /**
     * The tutor assigned to conduct this tutoring session.
     * 
     * Many-to-one relationship with Tutor entity.
     * Required (nullable = false) as every prenotation must have an assigned tutor.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * The tutor's ID can be accessed directly via the getTutorId() helper method.
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-prenotations")
    private Tutor tutor;
    
    /**
     * The tutor who created this prenotation record.
     * 
     * Many-to-one relationship with Tutor entity.
     * Required (nullable = false) as every prenotation must have a tracked creator.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * The creator's ID can be accessed directly via the getCreatorId() helper method.
     * 
     * Note: The creator may be different from the assigned tutor - one tutor
     * can create bookings for another tutor's sessions.
     * Useful for accountability and tracking who initiated the booking.
     */
    @ManyToOne
    @JoinColumn(name = "id_creator", nullable = false)
    @JsonBackReference("tutor-createdPrenotations")
    private Tutor creator;
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public Prenotation() {
    }
    
    /**
     * Parameterized constructor to create a new prenotation with all required fields.
     * 
     * The flag is initialized to false (pending/unconfirmed) by default.
     * The createdAt timestamp is automatically set to the current time.
     * 
     * @param startTime Start date and time of the scheduled session
     * @param endTime End date and time of the scheduled session
     * @param student The student assigned to the session (required)
     * @param tutor The tutor assigned to conduct the session (required)
     * @param creator The tutor who created this prenotation record (required)
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
     * Gets the timestamp when this prenotation was created.
     * 
     * @return The creation timestamp
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    /**
     * Sets the timestamp when this prenotation was created.
     * 
     * @param createdAt The creation timestamp
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    /**
     * Gets the status flag of the prenotation.
     * 
     * @return true if confirmed/completed, false if pending/unconfirmed
     */
    public Boolean getFlag() {
        return flag;
    }
    
    /**
     * Sets the status flag of the prenotation.
     * 
     * @param flag true to mark as confirmed/completed, false for pending/unconfirmed
     */
    public void setFlag(Boolean flag) {
        this.flag = flag;
    }
    
    /**
     * Gets the start time of the scheduled session.
     * 
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    /**
     * Sets the start time of the scheduled session.
     * 
     * @param startTime The start date and time
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    /**
     * Gets the end time of the scheduled session.
     * 
     * @return The end date and time
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    /**
     * Sets the end time of the scheduled session.
     * 
     * @param endTime The end date and time
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    /**
     * Gets the student assigned to this prenotation.
     * 
     * @return The Student entity
     */
    public Student getStudent() {
        return student;
    }
    
    /**
     * Sets the student assigned to this prenotation.
     * 
     * @param student The Student entity
     */
    public void setStudent(Student student) {
        this.student = student;
    }
    
    /**
     * Gets the tutor assigned to conduct this session.
     * 
     * @return The Tutor entity
     */
    public Tutor getTutor() {
        return tutor;
    }
    
    /**
     * Sets the tutor assigned to conduct this session.
     * 
     * @param tutor The Tutor entity
     */
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    /**
     * Gets the tutor who created this prenotation record.
     * 
     * @return The creator Tutor entity
     */
    public Tutor getCreator() {
        return creator;
    }
    
    /**
     * Sets the tutor who created this prenotation record.
     * 
     * @param creator The creator Tutor entity
     */
    public void setCreator(Tutor creator) {
        this.creator = creator;
    }
    
    
    // JSON Serialization Helper Methods
    
    
    /**
     * Gets the student ID for JSON serialization.
     * 
     * This helper method provides direct access to the student's ID without
     * serializing the entire Student entity, avoiding circular references and
     * reducing payload size.
     * 
     * @return The student's ID, or null if student is not set
     */
    @JsonProperty("studentId")
    public Long getStudentId() {
        return student != null ? student.getId() : null;
    }
    
    /**
     * Gets the tutor ID for JSON serialization.
     * 
     * This helper method provides direct access to the tutor's ID without
     * serializing the entire Tutor entity, avoiding circular references and
     * reducing payload size.
     * 
     * @return The tutor's ID, or null if tutor is not set
     */
    @JsonProperty("tutorId")
    public Long getTutorId() {
        return tutor != null ? tutor.getId() : null;
    }
    
    /**
     * Gets the creator tutor ID for JSON serialization.
     * 
     * This helper method provides direct access to the creator's ID without
     * serializing the entire Tutor entity, avoiding circular references and
     * reducing payload size. Useful for accountability and tracking who initiated
     * the booking.
     * 
     * @return The creator tutor's ID, or null if creator is not set
     */
    @JsonProperty("creatorId")
    public Long getCreatorId() {
        return creator != null ? creator.getId() : null;
    }
}
