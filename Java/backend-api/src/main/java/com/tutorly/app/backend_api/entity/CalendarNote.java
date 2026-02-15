package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing a Calendar Note in the tutoring system.
 * 
 * <p>Calendar notes are time-based events, reminders, or annotations created by tutors
 * for scheduling and calendar management purposes. Each note has a defined time range
 * and can be associated with multiple tutors through a many-to-many relationship.</p>
 * 
 * <p>Key Features:
 * <ul>
 *   <li>Created by a specific tutor (creator)</li>
 *   <li>Can be assigned to multiple tutors via many-to-many relationship</li>
 *   <li>Has a time range (startTime to endTime)</li>
 *   <li>Supports detailed TEXT descriptions</li>
 *   <li>Uses @JsonIgnoreProperties to prevent circular serialization</li>
 * </ul>
 * </p>
 * 
 * <p>Common Use Cases:
 * <ul>
 *   <li>Scheduling team meetings or events</li>
 *   <li>Marking holidays or unavailable periods</li>
 *   <li>Creating reminders for tutors</li>
 *   <li>Blocking time slots on calendars</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Tutor creator = tutorRepository.findById(tutorId).orElseThrow();
 * CalendarNote note = new CalendarNote(
 *     "Staff meeting",
 *     LocalDateTime.of(2026, 2, 16, 10, 0),
 *     LocalDateTime.of(2026, 2, 16, 11, 0),
 *     creator
 * );
 * note.getTutors().add(tutor1);
 * note.getTutors().add(tutor2);
 * calendarNoteRepository.save(note);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: calendar_note</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Key: id_creator (references tutor)</li>
 *   <li>Junction Table: has (links calendar_note and tutor in many-to-many)</li>
 * </ul>
 * </p>
 * 
 * @see Tutor
 * @see CalendarNoteCreateDTO
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "calendar_note")
public class CalendarNote {
    
    /**
     * Primary key - Unique identifier for the calendar note.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Textual description of the calendar note/event.
     * 
     * Stored as TEXT in database to support longer descriptions.
     * Can contain detailed information about the event, instructions,
     * or any relevant notes for the associated tutors.
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Start date and time of the event.
     * 
     * Marks the beginning of the calendar note's time range.
     * Cannot be null - every calendar note must have a defined start time.
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    /**
     * End date and time of the event.
     * 
     * Marks the end of the calendar note's time range.
     * Cannot be null - every calendar note must have a defined end time.
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    /**
     * The tutor who created this calendar note (owner/author).
     * 
     * Many-to-one relationship with Tutor entity.
     * The creator is required (nullable = false) as every note must have an author.
     * Uses @JsonIgnoreProperties to prevent circular references during JSON serialization
     * by excluding sensitive and recursive fields.
     */
    @ManyToOne
    @JoinColumn(name = "id_creator", nullable = false)
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations", 
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private Tutor creator;
    
    /**
     * Collection of tutors assigned to or associated with this calendar note.
     * 
     * Many-to-many relationship with Tutor entity through the 'has' junction table.
     * A calendar note can be assigned to multiple tutors, and a tutor can have multiple notes.
     * Initialized as HashSet to prevent duplicates and ensure efficient operations.
     * Uses @JsonIgnoreProperties to prevent circular references during JSON serialization.
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
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public CalendarNote() {
    }
    
    /**
     * Parameterized constructor to create a new calendar note with required fields.
     * 
     * The tutors collection is initialized as an empty HashSet by the field default.
     * Additional tutors can be added after construction using getTutors().add().
     * 
     * @param description Textual description/content of the event
     * @param startTime Start date and time of the event
     * @param endTime End date and time of the event
     * @param creator The tutor creating/owning this note
     */
    public CalendarNote(String description, LocalDateTime startTime, LocalDateTime endTime, Tutor creator) {
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.creator = creator;
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the unique identifier of the calendar note.
     * 
     * @return The calendar note ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the calendar note.
     * 
     * @param id The calendar note ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Gets the textual description of the calendar note.
     * 
     * @return The event description
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the textual description of the calendar note.
     * 
     * @param description The event description
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the start time of the calendar note.
     * 
     * @return The start date and time
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    /**
     * Sets the start time of the calendar note.
     * 
     * @param startTime The start date and time
     */
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    /**
     * Gets the end time of the calendar note.
     * 
     * @return The end date and time
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    /**
     * Sets the end time of the calendar note.
     * 
     * @param endTime The end date and time
     */
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    /**
     * Gets the tutor who created this calendar note.
     * 
     * @return The creator Tutor entity
     */
    public Tutor getCreator() {
        return creator;
    }
    
    /**
     * Sets the tutor who created this calendar note.
     * 
     * @param creator The creator Tutor entity
     */
    public void setCreator(Tutor creator) {
        this.creator = creator;
    }
    
    /**
     * Gets the collection of tutors associated with this calendar note.
     * 
     * @return Set of Tutor entities (modifiable)
     */
    public Set<Tutor> getTutors() {
        return tutors;
    }
    
    /**
     * Sets the collection of tutors associated with this calendar note.
     * 
     * @param tutors Set of Tutor entities to associate with this note
     */
    public void setTutors(Set<Tutor> tutors) {
        this.tutors = tutors;
    }
}
