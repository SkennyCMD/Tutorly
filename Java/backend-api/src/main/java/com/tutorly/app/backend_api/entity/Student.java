package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing a Student in the tutoring system.
 * 
 * <p>Students are the primary recipients of tutoring services. Each student can be enrolled
 * in lessons, have prenotations (bookings), and take tests. Students are tracked with personal
 * information, class assignments, and status indicators for active enrollment management.</p>
 * 
 * <p>Key Features:
 * <ul>
 *   <li>Personal information: name, surname, and description</li>
 *   <li>Class assignment: tracks student's grade or class level</li>
 *   <li>Status tracking: ACTIVE, INACTIVE, SUSPENDED, etc.</li>
 *   <li>Relationship management: one-to-many with lessons, prenotations, and tests</li>
 *   <li>JSON optimization: uses @JsonIgnoreProperties to exclude collections on serialization</li>
 * </ul>
 * </p>
 * 
 * <p>Common Use Cases:
 * <ul>
 *   <li>Enrolling new students in the tutoring program</li>
 *   <li>Scheduling lessons and creating bookings for students</li>
 *   <li>Tracking student progress through tests and attendance</li>
 *   <li>Managing active vs inactive student status</li>
 *   <li>Querying student history (lessons attended, tests taken)</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Student student = new Student(
 *     "Marco",
 *     "Rossi",
 *     "3A",
 *     "Excellent in mathematics, needs help with physics",
 *     "ACTIVE"
 * );
 * studentRepository.save(student);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: student</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Collections: prenotations, lessons, tests (one-to-many with cascade)</li>
 * </ul>
 * </p>
 * 
 * <p>JSON Serialization:
 * The @JsonIgnoreProperties annotation prevents the collections (lessons, prenotations, tests)
 * from being serialized to JSON by default, avoiding circular references and large payloads.
 * The allowGetters = true setting allows these collections to be included if explicitly requested.
 * </p>
 * 
 * @see Lesson
 * @see Prenotation
 * @see Test
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "student")
@JsonIgnoreProperties(value = {"lessons", "prenotations", "tests"}, allowGetters = true)
public class Student {
    
    /**
     * Primary key - Unique identifier for the student.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Student's first name.
     * 
     * Required field - cannot be null.
     * Used for identification and display purposes throughout the application.
     */
    @Column(name = "name", nullable = false)
    private String name;
    
    /**
     * Student's last name / family name.
     * 
     * Required field - cannot be null.
     * Used for identification and display purposes throughout the application.
     */
    @Column(name = "surname", nullable = false)
    private String surname;
    
    /**
     * Student's class or grade assignment.
     * 
     * Optional field - can be null if not assigned to a specific class.
     * Examples: "1A", "2B", "3C" (grade level and section)
     * Used for grouping students and organizing lessons by class level.
     */
    @Column(name = "class")
    private String studentClass;
    
    /**
     * Additional notes or descriptive information about the student.
     * 
     * Stored as TEXT in database to support longer descriptions.
     * Optional field - can be null.
     * Common uses:
     * - Learning preferences or style
     * - Academic strengths and weaknesses
     * - Special needs or accommodations
     * - Parent/guardian contact notes
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Current enrollment status of the student.
     * 
     * Required field - cannot be null.
     * Default value is "ACTIVE" for newly created students.
     * 
     * Common status values:
     * - "ACTIVE": Currently enrolled and attending tutoring sessions
     * - "INACTIVE": Not currently attending but may return
     * - "SUSPENDED": Temporarily suspended from the program
     * - "GRADUATED": Completed the program
     * 
     * Used for filtering active students in queries and reports.
     */
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
    
    /**
     * Collection of prenotations (bookings/reservations) associated with this student.
     * 
     * One-to-many relationship with Prenotation entity.
     * Cascade ALL: operations on student cascade to prenotations.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "student" field in the Prenotation entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-prenotations")
    private Set<Prenotation> prenotations = new HashSet<>();
    
    /**
     * Collection of lessons attended or scheduled for this student.
     * 
     * One-to-many relationship with Lesson entity.
     * Cascade ALL: operations on student cascade to lessons.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "student" field in the Lesson entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-lessons")
    private Set<Lesson> lessons = new HashSet<>();
    
    /**
     * Collection of tests taken by this student.
     * 
     * One-to-many relationship with Test entity.
     * Cascade ALL: operations on student cascade to tests.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "student" field in the Test entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-tests")
    private Set<Test> tests = new HashSet<>();
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public Student() {
    }
    
    /**
     * Parameterized constructor to create a new student with all required fields.
     * 
     * The collections (lessons, prenotations, tests) are automatically initialized
     * as empty HashSets by the field declarations.
     * 
     * @param name Student's first name (required)
     * @param surname Student's last name (required)
     * @param studentClass Class or grade assignment (optional)
     * @param description Additional notes about the student (optional)
     * @param status Current enrollment status (required, e.g., "ACTIVE", "INACTIVE")
     */
    public Student(String name, String surname, String studentClass, String description, String status) {
        this.name = name;
        this.surname = surname;
        this.studentClass = studentClass;
        this.description = description;
        this.status = status;
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the unique identifier of the student.
     * 
     * @return The student ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the student.
     * 
     * @param id The student ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Gets the student's first name.
     * 
     * @return The student's first name
     */
    public String getName() {
        return name;
    }
    
    /**
     * Sets the student's first name.
     * 
     * @param name The student's first name
     */
    public void setName(String name) {
        this.name = name;
    }
    
    /**
     * Gets the student's last name.
     * 
     * @return The student's last name
     */
    public String getSurname() {
        return surname;
    }
    
    /**
     * Sets the student's last name.
     * 
     * @param surname The student's last name
     */
    public void setSurname(String surname) {
        this.surname = surname;
    }
    
    /**
     * Gets the student's class or grade assignment.
     * 
     * @return The class assignment, or null if not assigned
     */
    public String getStudentClass() {
        return studentClass;
    }
    
    /**
     * Sets the student's class or grade assignment.
     * 
     * @param studentClass The class assignment
     */
    public void setStudentClass(String studentClass) {
        this.studentClass = studentClass;
    }
    
    /**
     * Gets the additional notes or description about the student.
     * 
     * @return The student description, or null if not provided
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the additional notes or description about the student.
     * 
     * @param description The student description
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the current enrollment status of the student.
     * 
     * @return The status (e.g., "ACTIVE", "INACTIVE", "SUSPENDED")
     */
    public String getStatus() {
        return status;
    }
    
    /**
     * Sets the current enrollment status of the student.
     * 
     * @param status The status (e.g., "ACTIVE", "INACTIVE", "SUSPENDED")
     */
    public void setStatus(String status) {
        this.status = status;
    }
    
    /**
     * Gets the collection of prenotations associated with this student.
     * 
     * @return Set of Prenotation entities
     */
    public Set<Prenotation> getPrenotations() {
        return prenotations;
    }
    
    /**
     * Sets the collection of prenotations associated with this student.
     * 
     * @param prenotations Set of Prenotation entities
     */
    public void setPrenotations(Set<Prenotation> prenotations) {
        this.prenotations = prenotations;
    }
    
    /**
     * Gets the collection of lessons associated with this student.
     * 
     * @return Set of Lesson entities
     */
    public Set<Lesson> getLessons() {
        return lessons;
    }
    
    /**
     * Sets the collection of lessons associated with this student.
     * 
     * @param lessons Set of Lesson entities
     */
    public void setLessons(Set<Lesson> lessons) {
        this.lessons = lessons;
    }
    
    /**
     * Gets the collection of tests taken by this student.
     * 
     * @return Set of Test entities
     */
    public Set<Test> getTests() {
        return tests;
    }
    
    /**
     * Sets the collection of tests taken by this student.
     * 
     * @param tests Set of Test entities
     */
    public void setTests(Set<Test> tests) {
        this.tests = tests;
    }
}
