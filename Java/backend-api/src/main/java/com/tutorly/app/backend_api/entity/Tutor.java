package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing a Tutor in the tutoring system.
 * 
 * <p>Tutors are the instructors who provide educational services in the tutoring program.
 * They conduct lessons, administer tests, create calendar notes, and manage student bookings.
 * Each tutor has unique authentication credentials, status tracking, role classification,
 * and maintains relationships with various entities including lessons, tests, and students.</p>
 * 
 * <p>Key Features:
 * <ul>
 *   <li>Authentication: unique username and password for system access</li>
 *   <li>Status management: tracks active, inactive, on-leave states</li>
 *   <li>Role classification: GENERIC, TEACHER, ASSISTANT, COORDINATOR, etc.</li>
 *   <li>Creation tracking: links to admins who created the tutor account</li>
 *   <li>Activity management: lessons, tests, prenotations, and calendar notes</li>
 *   <li>Dual prenotation roles: as assigned tutor and as creator</li>
 * </ul>
 * </p>
 * 
 * <p>Common Use Cases:
 * <ul>
 *   <li>Creating tutor accounts by administrators</li>
 *   <li>Managing tutor assignments to lessons and students</li>
 *   <li>Tracking tutor availability through calendar notes</li>
 *   <li>Recording lessons conducted and tests administered</li>
 *   <li>Creating and managing student bookings (prenotations)</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Tutor tutor = new Tutor(
 *     "mario.rossi",
 *     "hashedPassword123",  // Should be hashed in production
 *     "ACTIVE",
 *     "TEACHER"
 * );
 * tutorRepository.save(tutor);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: tutor</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Unique Constraints: username must be unique</li>
 *   <li>Collections: lessons, tests, prenotations, calendar notes (one-to-many/many-to-many)</li>
 * </ul>
 * </p>
 * 
 * @see Lesson
 * @see Test
 * @see Prenotation
 * @see CalendarNote
 * @see AdminCreatesTutor
 * @see Student
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "tutor")
public class Tutor {
    
    /**
     * Primary key - Unique identifier for the tutor.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Tutor's unique username for authentication and system login.
     * 
     * Required field - cannot be null.
     * Must be unique - enforced by database constraint.
     * Used as the primary identifier for tutor login and authentication.
     * 
     * Example values: "mario.rossi", "giulia.bianchi", "tutor123"
     */
    @Column(name = "username", nullable = false, unique = true)
    private String username;
    
    /**
     * Tutor's password for authentication.
     * 
     * Required field - cannot be null.
     * 
     * IMPORTANT SECURITY NOTE:
     * In production environments, this should ALWAYS store a hashed/encrypted password,
     * never plain text. Consider using BCrypt, Argon2, or similar secure hashing algorithms.
     * The comment "stored as-is" indicates this needs security improvement.
     */
    @Column(name = "password", nullable = false)
    private String password;
    
    /**
     * Current employment or activity status of the tutor.
     * 
     * Required field - cannot be null.
     * Default value is "ACTIVE" for newly created tutors.
     * 
     * Common status values:
     * - "ACTIVE": Currently teaching and available for lessons
     * - "INACTIVE": Not currently teaching but account remains
     * - "ON_LEAVE": Temporarily unavailable (vacation, sick leave)
     * - "SUSPENDED": Account suspended for administrative reasons
     * 
     * Used for filtering available tutors and access control.
     */
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
    
    /**
     * Tutor's role or classification within the tutoring organization.
     * 
     * Required field - cannot be null.
     * Default value is "GENERIC" for newly created tutors.
     * 
     * Common role values:
     * - "GENERIC": Standard tutor with basic permissions
     * - "TEACHER": Full-time or primary instructor
     * - "ASSISTANT": Teaching assistant role
     * - "COORDINATOR": Manages other tutors or programs
     * - "SPECIALIST": Subject matter expert
     * 
     * Used for permission assignment and organizational hierarchy.
     */
    @Column(name = "role", nullable = false)
    private String role = "GENERIC";
    
    /**
     * Collection tracking which administrators created this tutor account.
     * 
     * One-to-many relationship with AdminCreatesTutor join table entity.
     * Cascade ALL: operations on tutor cascade to creation records.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the AdminCreatesTutor entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Useful for accountability and audit trails of tutor account creation.
     */
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdByAdmins")
    private Set<AdminCreatesTutor> createdByAdmins = new HashSet<>();
    
    /**
     * Calendar notes that were created by this tutor.
     * 
     * One-to-many relationship with CalendarNote entity.
     * Cascade ALL: operations on tutor cascade to created calendar notes.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "creator" field in the CalendarNote entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents calendar notes this tutor authored (as opposed to being assigned to).
     */
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdCalendarNotes")
    private Set<CalendarNote> createdCalendarNotes = new HashSet<>();
    
    /**
     * Calendar notes associated with this tutor (many-to-many relationship).
     * 
     * Many-to-many relationship with CalendarNote entity.
     * The inverse side of the relationship - CalendarNote owns the association.
     * Mapped by "tutors" field in the CalendarNote entity.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents calendar notes this tutor is assigned to or involved with,
     * regardless of who created them. This allows multiple tutors to be
     * associated with the same calendar note (e.g., group meetings, shared events).
     */
    @ManyToMany(mappedBy = "tutors")
    @JsonManagedReference("tutor-calendarNotes")
    private Set<CalendarNote> calendarNotes = new HashSet<>();
    
    /**
     * Prenotations (bookings) where this tutor is assigned to conduct the session.
     * 
     * One-to-many relationship with Prenotation entity.
     * Cascade ALL: operations on tutor cascade to assigned prenotations.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the Prenotation entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents sessions this tutor is scheduled to teach.
     */
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-prenotations")
    private Set<Prenotation> prenotations = new HashSet<>();
    
    /**
     * Prenotations (bookings) that were created by this tutor.
     * 
     * One-to-many relationship with Prenotation entity.
     * Cascade ALL: operations on tutor cascade to created prenotations.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "creator" field in the Prenotation entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents bookings this tutor initiated (which may be for other tutors).
     * This distinction allows tracking who created bookings vs who conducts them,
     * useful for accountability and workflow management.
     */
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdPrenotations")
    private Set<Prenotation> createdPrenotations = new HashSet<>();
    
    /**
     * Lessons conducted or taught by this tutor.
     * 
     * One-to-many relationship with Lesson entity.
     * Cascade ALL: operations on tutor cascade to lessons.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the Lesson entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents actual tutoring sessions this tutor has taught or will teach.
     * Used for tracking tutor workload, attendance, and billing.
     */
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-lessons")
    private Set<Lesson> lessons = new HashSet<>();
    
    /**
     * Tests administered or graded by this tutor.
     * 
     * One-to-many relationship with Test entity.
     * Cascade ALL: operations on tutor cascade to tests.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the Test entity.
     * 
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents assessments this tutor has given to students.
     * Used for tracking student performance and tutor assessment workload.
     */
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-tests")
    private Set<Test> tests = new HashSet<>();
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public Tutor() {
    }
    
    /**
     * Parameterized constructor to create a new tutor with required fields.
     * 
     * All collections are automatically initialized as empty HashSets by the field declarations.
     * 
     * @param username Unique username for authentication (required)
     * @param password Tutor password (should be hashed in production)
     * @param status Current employment status (e.g., "ACTIVE", "INACTIVE")
     * @param role Tutor role classification (e.g., "TEACHER", "ASSISTANT")
     */
    public Tutor(String username, String password, String status, String role) {
        this.username = username;
        this.password = password;
        this.status = status;
        this.role = role;
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the unique identifier of the tutor.
     * 
     * @return The tutor ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the tutor.
     * 
     * @param id The tutor ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Gets the tutor's username.
     * 
     * @return The username
     */
    public String getUsername() {
        return username;
    }
    
    /**
     * Sets the tutor's username.
     * 
     * @param username The username (must be unique)
     */
    public void setUsername(String username) {
        this.username = username;
    }
    
    /**
     * Gets the tutor's password.
     * 
     * @return The password (should be hashed in production)
     */
    public String getPassword() {
        return password;
    }
    
    /**
     * Sets the tutor's password.
     * 
     * @param password The password (should be hashed before storing)
     */
    public void setPassword(String password) {
        this.password = password;
    }
    
    /**
     * Gets the current status of the tutor.
     * 
     * @return The status (e.g., "ACTIVE", "INACTIVE", "ON_LEAVE")
     */
    public String getStatus() {
        return status;
    }
    
    /**
     * Sets the current status of the tutor.
     * 
     * @param status The status (e.g., "ACTIVE", "INACTIVE", "ON_LEAVE")
     */
    public void setStatus(String status) {
        this.status = status;
    }
    
    /**
     * Gets the role classification of the tutor.
     * 
     * @return The role (e.g., "TEACHER", "ASSISTANT", "COORDINATOR")
     */
    public String getRole() {
        return role;
    }
    
    /**
     * Sets the role classification of the tutor.
     * 
     * @param role The role (e.g., "TEACHER", "ASSISTANT", "COORDINATOR")
     */
    public void setRole(String role) {
        this.role = role;
    }
    
    /**
     * Gets the collection of admin creation records for this tutor.
     * 
     * @return Set of AdminCreatesTutor entities tracking which admins created this tutor
     */
    public Set<AdminCreatesTutor> getCreatedByAdmins() {
        return createdByAdmins;
    }
    
    /**
     * Sets the collection of admin creation records for this tutor.
     * 
     * @param createdByAdmins Set of AdminCreatesTutor entities
     */
    public void setCreatedByAdmins(Set<AdminCreatesTutor> createdByAdmins) {
        this.createdByAdmins = createdByAdmins;
    }
    
    /**
     * Gets the collection of calendar notes created by this tutor.
     * 
     * @return Set of CalendarNote entities authored by this tutor
     */
    public Set<CalendarNote> getCreatedCalendarNotes() {
        return createdCalendarNotes;
    }
    
    /**
     * Sets the collection of calendar notes created by this tutor.
     * 
     * @param createdCalendarNotes Set of CalendarNote entities
     */
    public void setCreatedCalendarNotes(Set<CalendarNote> createdCalendarNotes) {
        this.createdCalendarNotes = createdCalendarNotes;
    }
    
    /**
     * Gets the collection of calendar notes associated with this tutor.
     * 
     * @return Set of CalendarNote entities this tutor is assigned to
     */
    public Set<CalendarNote> getCalendarNotes() {
        return calendarNotes;
    }
    
    /**
     * Sets the collection of calendar notes associated with this tutor.
     * 
     * @param calendarNotes Set of CalendarNote entities
     */
    public void setCalendarNotes(Set<CalendarNote> calendarNotes) {
        this.calendarNotes = calendarNotes;
    }
    
    /**
     * Gets the collection of prenotations where this tutor is assigned.
     * 
     * @return Set of Prenotation entities this tutor will conduct
     */
    public Set<Prenotation> getPrenotations() {
        return prenotations;
    }
    
    /**
     * Sets the collection of prenotations where this tutor is assigned.
     * 
     * @param prenotations Set of Prenotation entities
     */
    public void setPrenotations(Set<Prenotation> prenotations) {
        this.prenotations = prenotations;
    }
    
    /**
     * Gets the collection of prenotations created by this tutor.
     * 
     * @return Set of Prenotation entities this tutor initiated
     */
    public Set<Prenotation> getCreatedPrenotations() {
        return createdPrenotations;
    }
    
    /**
     * Sets the collection of prenotations created by this tutor.
     * 
     * @param createdPrenotations Set of Prenotation entities
     */
    public void setCreatedPrenotations(Set<Prenotation> createdPrenotations) {
        this.createdPrenotations = createdPrenotations;
    }
    
    /**
     * Gets the collection of lessons conducted by this tutor.
     * 
     * @return Set of Lesson entities this tutor taught or will teach
     */
    public Set<Lesson> getLessons() {
        return lessons;
    }
    
    /**
     * Sets the collection of lessons conducted by this tutor.
     * 
     * @param lessons Set of Lesson entities
     */
    public void setLessons(Set<Lesson> lessons) {
        this.lessons = lessons;
    }
    
    /**
     * Gets the collection of tests administered by this tutor.
     * 
     * @return Set of Test entities this tutor gave to students
     */
    public Set<Test> getTests() {
        return tests;
    }
    
    /**
     * Sets the collection of tests administered by this tutor.
     * 
     * @param tests Set of Test entities
     */
    public void setTests(Set<Test> tests) {
        this.tests = tests;
    }
}
