package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * JPA Entity representing a Test or Exam in the tutoring system.
 * 
 * <p>Tests track student assessments, exam results, and academic performance metrics.
 * Each test record associates a student with a tutor on a specific date, optionally including
 * a score/mark and descriptive information about the assessment content or subject matter.</p>
 * 
 * <p>Key Features:
 * <ul>
 *   <li>Date tracking: records when the test was administered</li>
 *   <li>Optional scoring: mark field can be null for ungraded tests</li>
 *   <li>Descriptive content: supports detailed test description (TEXT field)</li>
 *   <li>Relationship tracking: links to both tutor and student</li>
 *   <li>Progress monitoring: used for analytics and performance reports</li>
 * </ul>
 * </p>
 * 
 * <p>Common Use Cases:
 * <ul>
 *   <li>Recording exam results for students</li>
 *   <li>Tracking student progress over time</li>
 *   <li>Generating performance reports and analytics</li>
 *   <li>Monitoring tutor effectiveness through student scores</li>
 *   <li>Creating academic history for students</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
 * Student student = studentRepository.findById(studentId).orElseThrow();
 * Test test = new Test(
 *     LocalDate.of(2026, 2, 16),
 *     "Mathematics Final Exam - Algebra and Geometry",
 *     85,  // score out of 100
 *     tutor,
 *     student
 * );
 * testRepository.save(test);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: test</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Keys: id_tutor, id_student</li>
 *   <li>Nullable fields: description, mark (score can be null for ungraded tests)</li>
 * </ul>
 * </p>
 * 
 * @see Tutor
 * @see Student
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "test")
public class Test {
    
    /**
     * Primary key - Unique identifier for the test.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Date when the test was administered or taken.
     * 
     * Required field - cannot be null.
     * Uses LocalDate (date only, no time component) as tests are typically
     * tracked by day rather than specific time.
     * Used for chronological ordering and date-based queries.
     */
    @Column(name = "day", nullable = false)
    private LocalDate day;
    
    /**
     * Textual description of the test content, subject, or assessment type.
     * 
     * Stored as TEXT in database to support longer descriptions.
     * Optional field - can be null.
     * 
     * Common uses:
     * - Subject area: "Mathematics Final Exam"
     * - Topics covered: "Algebra, Geometry, and Trigonometry"
     * - Assessment type: "Midterm", "Quiz", "Practice Test"
     * - Specific content: "Chapters 5-8 Review"
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Test score or mark awarded to the student.
     * 
     * Optional field - can be null for tests that haven't been graded yet.
     * Typically represents a numeric score (e.g., 0-100, or other grading scale).
     * 
     * Use cases:
     * - null: Test not yet graded or score not recorded
     * - 0-100: Percentage score
     * - Custom scales: As defined by the tutoring program
     * 
     * Used for calculating averages, tracking progress, and generating reports.
     */
    @Column(name = "mark")
    private Integer mark;
    
    /**
     * The tutor who administered, proctored, or graded this test.
     * 
     * Many-to-one relationship with Tutor entity.
     * Required (nullable = false) as every test must be associated with a tutor.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * 
     * Used for tracking tutor effectiveness and workload distribution.
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-tests")
    private Tutor tutor;
    
    /**
     * The student who took or will take this test.
     * 
     * Many-to-one relationship with Student entity.
     * Required (nullable = false) as every test must be associated with a student.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     * 
     * Used for tracking student performance and academic progress.
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-tests")
    private Student student;
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public Test() {
    }
    
    /**
     * Parameterized constructor to create a new test with all fields.
     * 
     * @param day Date when the test was administered (required)
     * @param description Test content description or subject (optional)
     * @param mark Test score or grade (optional, can be null for ungraded tests)
     * @param tutor The tutor who administered the test (required)
     * @param student The student who took the test (required)
     */
    public Test(LocalDate day, String description, Integer mark, Tutor tutor, Student student) {
        this.day = day;
        this.description = description;
        this.mark = mark;
        this.tutor = tutor;
        this.student = student;
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the unique identifier of the test.
     * 
     * @return The test ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the test.
     * 
     * @param id The test ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Gets the date when the test was administered.
     * 
     * @return The test date
     */
    public LocalDate getDay() {
        return day;
    }
    
    /**
     * Sets the date when the test was administered.
     * 
     * @param day The test date
     */
    public void setDay(LocalDate day) {
        this.day = day;
    }
    
    /**
     * Gets the description of the test content or subject.
     * 
     * @return The test description, or null if not provided
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the description of the test content or subject.
     * 
     * @param description The test description
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the test score or mark.
     * 
     * @return The test score, or null if not yet graded
     */
    public Integer getMark() {
        return mark;
    }
    
    /**
     * Sets the test score or mark.
     * 
     * @param mark The test score (can be null for ungraded tests)
     */
    public void setMark(Integer mark) {
        this.mark = mark;
    }
    
    /**
     * Gets the tutor who administered this test.
     * 
     * @return The Tutor entity
     */
    public Tutor getTutor() {
        return tutor;
    }
    
    /**
     * Sets the tutor who administered this test.
     * 
     * @param tutor The Tutor entity
     */
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    /**
     * Gets the student who took this test.
     * 
     * @return The Student entity
     */
    public Student getStudent() {
        return student;
    }
    
    /**
     * Sets the student who took this test.
     * 
     * @param student The Student entity
     */
    public void setStudent(Student student) {
        this.student = student;
    }
}
