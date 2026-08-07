package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing an authenticated account in the tutoring system.
 *
 * <p>A User is any account that can log in: a tutor who conducts lessons and
 * administers tests, a STAFF member with elevated management privileges, or a
 * GUEST who only has read access to their assigned student(s) (e.g. a parent
 * or guardian). The role field determines which of these the account is.</p>
 *
 * <p>Key Features:
 * <ul>
 *   <li>Authentication: unique username and password for system access</li>
 *   <li>Status management: tracks active, inactive, on-leave states</li>
 *   <li>Role classification: GENERIC, STAFF, GUEST</li>
 *   <li>Creation tracking: links to admins who created the account</li>
 *   <li>Activity management: lessons, tests, prenotations, and calendar notes</li>
 *   <li>Dual prenotation roles: as assigned tutor and as creator</li>
 * </ul>
 * </p>
 *
 * <p>Common Use Cases:
 * <ul>
 *   <li>Creating tutor/staff/guest accounts by administrators</li>
 *   <li>Managing tutor assignments to lessons and students</li>
 *   <li>Tracking tutor availability through calendar notes</li>
 *   <li>Recording lessons conducted and tests administered</li>
 *   <li>Creating and managing student bookings (prenotations)</li>
 *   <li>Letting a GUEST account view the student(s) linked to it (see {@link Student#getUser()})</li>
 * </ul>
 * </p>
 *
 * <p>Usage Example:
 * <pre>
 * User user = new User(
 *     "mario.rossi",
 *     "hashedPassword123",  // Should be hashed in production
 *     "ACTIVE",
 *     "STAFF"
 * );
 * userRepository.save(user);
 * </pre>
 * </p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: app_user (named to avoid the reserved SQL keyword "user")</li>
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
 * @see AdminCreatesUser
 * @see Student
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "app_user")
public class User {

    /**
     * Primary key - Unique identifier for the user.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User's unique username for authentication and system login.
     *
     * Required field - cannot be null.
     * Must be unique - enforced by database constraint.
     * Used as the primary identifier for login and authentication.
     *
     * Example values: "mario.rossi", "giulia.bianchi", "tutor123"
     */
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    /**
     * User's password for authentication.
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
     * Current employment or activity status of the user.
     *
     * Required field - cannot be null.
     * Default value is "ACTIVE" for newly created users.
     *
     * Common status values:
     * - "ACTIVE": Currently active and available
     * - "INACTIVE": Not currently active but account remains
     * - "ON_LEAVE": Temporarily unavailable (vacation, sick leave)
     * - "SUSPENDED": Account suspended for administrative reasons
     *
     * Used for filtering available tutors and access control.
     */
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    /**
     * User's role or classification within the tutoring organization.
     *
     * Required field - cannot be null.
     * Default value is "GENERIC" for newly created users.
     *
     * Valid role values:
     * - "GENERIC": Standard tutor with basic permissions
     * - "STAFF": Elevated management privileges (staff panel, reports, student profiles)
     * - "GUEST": Read-only access limited to their assigned student(s) via {@link Student#getUser()}
     *
     * Used for permission assignment and organizational hierarchy.
     */
    @Column(name = "role", nullable = false)
    private String role = "GENERIC";

    /**
     * User's email address.
     *
     * Optional field - can be null, unlike {@link Admin#getMail()} which is required.
     */
    @Column(name = "mail")
    private String mail;

    /**
     * Collection tracking which administrators created this user account.
     *
     * One-to-many relationship with AdminCreatesUser join table entity.
     * Cascade ALL: operations on user cascade to creation records.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "user" field in the AdminCreatesUser entity.
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Useful for accountability and audit trails of account creation.
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference("user-createdByAdmins")
    private Set<AdminCreatesUser> createdByAdmins = new HashSet<>();

    /**
     * Calendar notes that were created by this user.
     *
     * One-to-many relationship with CalendarNote entity.
     * Cascade ALL: operations on user cascade to created calendar notes.
     * Mapped by "creator" field in the CalendarNote entity.
     *
     * No @JsonManagedReference here: CalendarNote.creator/tutors already break the
     * cycle on their own side via @JsonIgnoreProperties, and pairing this with a
     * (non-existent) @JsonBackReference on CalendarNote would make Jackson fail to
     * build a deserializer for User - which breaks any endpoint deserializing a type
     * that references User, e.g. POST /api/students (Student.user).
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents calendar notes this user authored (as opposed to being assigned to).
     */
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    private Set<CalendarNote> createdCalendarNotes = new HashSet<>();

    /**
     * Calendar notes associated with this user (many-to-many relationship).
     *
     * Many-to-many relationship with CalendarNote entity.
     * The inverse side of the relationship - CalendarNote owns the association.
     * Mapped by "tutors" field in the CalendarNote entity.
     *
     * No @JsonManagedReference here - see createdCalendarNotes above for why.
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents calendar notes this user is assigned to or involved with,
     * regardless of who created them. This allows multiple users to be
     * associated with the same calendar note (e.g., group meetings, shared events).
     */
    @ManyToMany(mappedBy = "tutors")
    private Set<CalendarNote> calendarNotes = new HashSet<>();

    /**
     * Prenotations (bookings) where this user is assigned to conduct the session.
     *
     * One-to-many relationship with Prenotation entity.
     * Cascade ALL: operations on user cascade to assigned prenotations.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the Prenotation entity.
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents sessions this user is scheduled to teach.
     */
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-prenotations")
    private Set<Prenotation> prenotations = new HashSet<>();

    /**
     * Prenotations (bookings) that were created by this user.
     *
     * One-to-many relationship with Prenotation entity.
     * Cascade ALL: operations on user cascade to created prenotations.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "creator" field in the Prenotation entity.
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents bookings this user initiated (which may be for other tutors).
     * This distinction allows tracking who created bookings vs who conducts them,
     * useful for accountability and workflow management.
     */
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdPrenotations")
    private Set<Prenotation> createdPrenotations = new HashSet<>();

    /**
     * Lessons conducted or taught by this user.
     *
     * One-to-many relationship with Lesson entity.
     * Cascade ALL: operations on user cascade to lessons.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the Lesson entity.
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents actual tutoring sessions this user has taught or will teach.
     * Used for tracking tutor workload, attendance, and billing.
     */
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-lessons")
    private Set<Lesson> lessons = new HashSet<>();

    /**
     * Tests administered or graded by this user.
     *
     * One-to-many relationship with Test entity.
     * Cascade ALL: operations on user cascade to tests.
     * Uses @JsonManagedReference to manage bidirectional relationship serialization.
     * Mapped by "tutor" field in the Test entity.
     *
     * Initialized as empty HashSet to avoid null pointer exceptions.
     * Represents assessments this user has given to students.
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
    public User() {
    }

    /**
     * Parameterized constructor to create a new user with required fields.
     *
     * All collections are automatically initialized as empty HashSets by the field declarations.
     *
     * @param username Unique username for authentication (required)
     * @param password User password (should be hashed in production)
     * @param status Current status (e.g., "ACTIVE", "INACTIVE")
     * @param role User role classification (e.g., "GENERIC", "STAFF", "GUEST")
     */
    public User(String username, String password, String status, String role) {
        this.username = username;
        this.password = password;
        this.status = status;
        this.role = role;
    }


    // Getters and Setters


    /**
     * Gets the unique identifier of the user.
     *
     * @return The user ID
     */
    public Long getId() {
        return id;
    }

    /**
     * Sets the unique identifier of the user.
     *
     * @param id The user ID
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the user's username.
     *
     * @return The username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Sets the user's username.
     *
     * @param username The username (must be unique)
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Gets the user's password.
     *
     * @return The password (should be hashed in production)
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the user's password.
     *
     * @param password The password (should be hashed before storing)
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Gets the current status of the user.
     *
     * @return The status (e.g., "ACTIVE", "INACTIVE", "ON_LEAVE")
     */
    public String getStatus() {
        return status;
    }

    /**
     * Sets the current status of the user.
     *
     * @param status The status (e.g., "ACTIVE", "INACTIVE", "ON_LEAVE")
     */
    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * Gets the role classification of the user.
     *
     * @return The role ("GENERIC", "STAFF", or "GUEST")
     */
    public String getRole() {
        return role;
    }

    /**
     * Sets the role classification of the user.
     *
     * @param role The role ("GENERIC", "STAFF", or "GUEST")
     */
    public void setRole(String role) {
        this.role = role;
    }

    /**
     * Gets the user's email address.
     *
     * @return The email address, or null if not provided
     */
    public String getMail() {
        return mail;
    }

    /**
     * Sets the user's email address.
     *
     * @param mail The email address
     */
    public void setMail(String mail) {
        this.mail = mail;
    }

    /**
     * Gets the collection of admin creation records for this user.
     *
     * @return Set of AdminCreatesUser entities tracking which admins created this user
     */
    public Set<AdminCreatesUser> getCreatedByAdmins() {
        return createdByAdmins;
    }

    /**
     * Sets the collection of admin creation records for this user.
     *
     * @param createdByAdmins Set of AdminCreatesUser entities
     */
    public void setCreatedByAdmins(Set<AdminCreatesUser> createdByAdmins) {
        this.createdByAdmins = createdByAdmins;
    }

    /**
     * Gets the collection of calendar notes created by this user.
     *
     * @return Set of CalendarNote entities authored by this user
     */
    public Set<CalendarNote> getCreatedCalendarNotes() {
        return createdCalendarNotes;
    }

    /**
     * Sets the collection of calendar notes created by this user.
     *
     * @param createdCalendarNotes Set of CalendarNote entities
     */
    public void setCreatedCalendarNotes(Set<CalendarNote> createdCalendarNotes) {
        this.createdCalendarNotes = createdCalendarNotes;
    }

    /**
     * Gets the collection of calendar notes associated with this user.
     *
     * @return Set of CalendarNote entities this user is assigned to
     */
    public Set<CalendarNote> getCalendarNotes() {
        return calendarNotes;
    }

    /**
     * Sets the collection of calendar notes associated with this user.
     *
     * @param calendarNotes Set of CalendarNote entities
     */
    public void setCalendarNotes(Set<CalendarNote> calendarNotes) {
        this.calendarNotes = calendarNotes;
    }

    /**
     * Gets the collection of prenotations where this user is assigned.
     *
     * @return Set of Prenotation entities this user will conduct
     */
    public Set<Prenotation> getPrenotations() {
        return prenotations;
    }

    /**
     * Sets the collection of prenotations where this user is assigned.
     *
     * @param prenotations Set of Prenotation entities
     */
    public void setPrenotations(Set<Prenotation> prenotations) {
        this.prenotations = prenotations;
    }

    /**
     * Gets the collection of prenotations created by this user.
     *
     * @return Set of Prenotation entities this user initiated
     */
    public Set<Prenotation> getCreatedPrenotations() {
        return createdPrenotations;
    }

    /**
     * Sets the collection of prenotations created by this user.
     *
     * @param createdPrenotations Set of Prenotation entities
     */
    public void setCreatedPrenotations(Set<Prenotation> createdPrenotations) {
        this.createdPrenotations = createdPrenotations;
    }

    /**
     * Gets the collection of lessons conducted by this user.
     *
     * @return Set of Lesson entities this user taught or will teach
     */
    public Set<Lesson> getLessons() {
        return lessons;
    }

    /**
     * Sets the collection of lessons conducted by this user.
     *
     * @param lessons Set of Lesson entities
     */
    public void setLessons(Set<Lesson> lessons) {
        this.lessons = lessons;
    }

    /**
     * Gets the collection of tests administered by this user.
     *
     * @return Set of Test entities this user gave to students
     */
    public Set<Test> getTests() {
        return tests;
    }

    /**
     * Sets the collection of tests administered by this user.
     *
     * @param tests Set of Test entities
     */
    public void setTests(Set<Test> tests) {
        this.tests = tests;
    }
}
