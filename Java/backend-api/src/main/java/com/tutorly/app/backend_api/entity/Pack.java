package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing a lesson Package (a prepaid block of tutoring hours) in the
 * tutoring system.
 *
 * <p>A pack bundles a fixed number of hours purchased for a student. Individual lessons
 * can optionally be drawn from a pack (see {@link Lesson#getPack()}) to track remaining
 * balance; a lesson doesn't have to belong to any pack.</p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: pack</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Key: id_student</li>
 * </ul>
 * </p>
 *
 * @see Student
 * @see Lesson
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "pack")
@JsonIgnoreProperties(value = {"lessons"}, allowGetters = true)
public class Pack {

    /**
     * Primary key - Unique identifier for the pack.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Timestamp when this pack record was created.
     *
     * Automatically initialized to the current time when the entity is instantiated,
     * same pattern as {@link Prenotation#getCreatedAt()}. Non-nullable, audit-only -
     * not user-editable via the create/update DTO.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Date and time the package starts being usable.
     *
     * Required field - cannot be null. Unlike createdAt, this is a business-meaningful,
     * user-editable value (e.g. defaults to "now" in the creation form, but can be
     * backdated or postdated).
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    /**
     * Total number of hours purchased in this package.
     *
     * Required field - cannot be null.
     */
    @Column(name = "hours", nullable = false)
    private Double hours;

    /**
     * Date the package was closed (fully used, expired, or cancelled).
     *
     * Optional field - null while the package is still open/active.
     */
    @Column(name = "closure")
    private LocalDate closure;

    /**
     * The student this package was purchased for.
     *
     * Many-to-one relationship with Student entity.
     * Required (nullable = false) as every pack must belong to a student.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * The student's ID can be accessed directly via the getStudentId() helper method.
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-packs")
    private Student student;

    /**
     * Lessons drawn from this package.
     *
     * One-to-many relationship with Lesson entity.
     * Mapped by "pack" field in the Lesson entity.
     * Initialized as empty HashSet to avoid null pointer exceptions.
     */
    @OneToMany(mappedBy = "pack")
    @JsonManagedReference("pack-lessons")
    private Set<Lesson> lessons = new HashSet<>();


    // Constructors


    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public Pack() {
    }

    /**
     * Parameterized constructor to create a new pack with all required fields.
     *
     * The createdAt timestamp is initialized by the field default value.
     *
     * @param startTime Date and time the package starts being usable (required)
     * @param hours Total number of hours purchased (required)
     * @param closure Date the package was closed (optional, null while active)
     * @param student The student this package belongs to (required)
     */
    public Pack(LocalDateTime startTime, Double hours, LocalDate closure, Student student) {
        this.startTime = startTime;
        this.hours = hours;
        this.closure = closure;
        this.student = student;
    }


    // Getters and Setters


    /**
     * Gets the unique identifier of the pack.
     *
     * @return The pack ID
     */
    public Long getId() {
        return id;
    }

    /**
     * Sets the unique identifier of the pack.
     *
     * @param id The pack ID
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the timestamp when this pack record was created.
     *
     * @return The creation date and time
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Sets the timestamp when this pack record was created.
     *
     * @param createdAt The creation date and time
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * Gets the date and time the package starts being usable.
     *
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }

    /**
     * Sets the date and time the package starts being usable.
     *
     * @param startTime The start date and time
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    /**
     * Gets the total number of hours purchased in this package.
     *
     * @return The number of hours
     */
    public Double getHours() {
        return hours;
    }

    /**
     * Sets the total number of hours purchased in this package.
     *
     * @param hours The number of hours
     */
    public void setHours(Double hours) {
        this.hours = hours;
    }

    /**
     * Gets the date the package was closed.
     *
     * @return The closure date, or null if the package is still active
     */
    public LocalDate getClosure() {
        return closure;
    }

    /**
     * Sets the date the package was closed.
     *
     * @param closure The closure date
     */
    public void setClosure(LocalDate closure) {
        this.closure = closure;
    }

    /**
     * Gets the student this package was purchased for.
     *
     * @return The Student entity
     */
    public Student getStudent() {
        return student;
    }

    /**
     * Sets the student this package was purchased for.
     *
     * @param student The Student entity
     */
    public void setStudent(Student student) {
        this.student = student;
    }

    /**
     * Gets the lessons drawn from this package.
     *
     * @return Set of Lesson entities
     */
    public Set<Lesson> getLessons() {
        return lessons;
    }

    /**
     * Sets the lessons drawn from this package.
     *
     * @param lessons Set of Lesson entities
     */
    public void setLessons(Set<Lesson> lessons) {
        this.lessons = lessons;
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
}
