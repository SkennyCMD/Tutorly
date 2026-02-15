package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a Lesson in the tutoring system.
 * 
 * <p>Lessons are actual tutoring sessions between a tutor and a student.
 * They represent completed or scheduled one-on-one instruction time with a defined
 * time range, description of content, and clear associations to both participants.</p>
 * 
 * <p>Key Features:
 * <ul>
 *   <li>One-to-one session: each lesson has exactly one tutor and one student</li>
 *   <li>Time-bound: has defined start and end times</li>
 *   <li>Descriptive: stores lesson content, topics, or type (M/S/U)</li>
 *   <li>Trackable: used for attendance, billing, and reporting</li>
 *   <li>JSON-friendly: provides helper methods for ID serialization</li>
 * </ul>
 * </p>
 * 
 * <p>Common Use Cases:
 * <ul>
 *   <li>Recording completed tutoring sessions for billing</li>
 *   <li>Scheduling future tutoring sessions</li>
 *   <li>Generating tutor and student attendance reports</li>
 *   <li>Tracking lesson types (M=Middle school, S=High school, U=University)</li>
 *   <li>Calculating total tutoring hours per student or tutor</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
 * Student student = studentRepository.findById(studentId).orElseThrow();
 * Lesson lesson = new Lesson(
 *     "Mathematics - Algebra",
 *     LocalDateTime.of(2026, 2, 16, 14, 0),
 *     LocalDateTime.of(2026, 2, 16, 15, 30),
 *     tutor,
 *     student
 * );
 * lessonRepository.save(lesson);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: lesson</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Keys: id_tutor, id_student</li>
 * </ul>
 * </p>
 * 
 * @see Tutor
 * @see Student
 * @see LessonCreateDTO
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "lesson")
public class Lesson {
    
    /**
     * Primary key - Unique identifier for the lesson.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Textual description of the lesson content, topics covered, or lesson type.
     * 
     * Stored as TEXT in database to support longer descriptions.
     * Common values include:
     * - Lesson type codes: "M" (Middle school), "S" (High school), "U" (University)
     * - Subject details: "Mathematics - Algebra", "Physics - Mechanics"
     * - Topics covered: "Quadratic equations and graphing"
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Start date and time of the lesson.
     * 
     * Marks when the tutoring session begins.
     * Cannot be null - every lesson must have a defined start time.
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    /**
     * End date and time of the lesson.
     * 
     * Marks when the tutoring session ends.
     * Cannot be null - every lesson must have a defined end time.
     * Duration is calculated as the difference between endTime and startTime.
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    /**
     * The tutor conducting/teaching this lesson.
     * 
     * Many-to-one relationship with Tutor entity.
     * Required (nullable = false) as every lesson must have an assigned tutor.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * The tutor's ID can be accessed directly via the getTutorId() helper method.
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-lessons")
    private Tutor tutor;
    
    /**
     * The student attending/receiving this lesson.
     * 
     * Many-to-one relationship with Student entity.
     * Required (nullable = false) as every lesson must have an assigned student.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * The student's ID can be accessed directly via the getStudentId() helper method.
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-lessons")
    private Student student;
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public Lesson() {
    }
    
    /**
     * Parameterized constructor to create a new lesson with all required fields.
     * 
     * @param description Lesson content description or type code (e.g., "M", "S", "U")
     * @param startTime Start date and time of the lesson
     * @param endTime End date and time of the lesson
     * @param tutor The tutor conducting the lesson (required)
     * @param student The student attending the lesson (required)
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
     * Gets the unique identifier of the lesson.
     * 
     * @return The lesson ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the lesson.
     * 
     * @param id The lesson ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Gets the textual description of the lesson.
     * 
     * @return The lesson description or type code
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the textual description of the lesson.
     * 
     * @param description The lesson description or type code
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the start time of the lesson.
     * 
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    /**
     * Sets the start time of the lesson.
     * 
     * @param startTime The start date and time
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    /**
     * Gets the end time of the lesson.
     * 
     * @return The end date and time
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    /**
     * Sets the end time of the lesson.
     * 
     * @param endTime The end date and time
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    /**
     * Gets the tutor conducting this lesson.
     * 
     * @return The Tutor entity
     */
    public Tutor getTutor() {
        return tutor;
    }
    
    /**
     * Sets the tutor conducting this lesson.
     * 
     * @param tutor The Tutor entity
     */
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    /**
     * Gets the student attending this lesson.
     * 
     * @return The Student entity
     */
    public Student getStudent() {
        return student;
    }
    
    /**
     * Sets the student attending this lesson.
     * 
     * @param student The Student entity
     */
    public void setStudent(Student student) {
        this.student = student;
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
}
