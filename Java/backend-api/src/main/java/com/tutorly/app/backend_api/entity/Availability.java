package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalTime;

/**
 * JPA Entity representing a tutor's recurring weekly availability slot.
 *
 * <p>Each row is one recurring time range on one day of the week (e.g. "Mondays
 * 09:00-12:00"). A tutor typically has several rows, one per day/time-range they're
 * regularly available. Read by the Node.js frontend's Availability page - see
 * {@code docs/03_Nodejs_Frontend.md}.</p>
 *
 * <p>{@code weekDay} follows ISO-8601 (1 = Monday ... 7 = Sunday), not the
 * {@code java.time.DayOfWeek} enum directly, to match the plain
 * {@code SMALLINT CHECK (week_day BETWEEN 1 AND 7)} column in {@code Database/init.sql}.</p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: availability</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Key: id_tutor (references app_user, ON DELETE CASCADE)</li>
 * </ul>
 * </p>
 *
 * @see User
 * @see ExceptionDay
 * @author Tutorly Development Team
 * @version 1.0
 * @since 2.5.0
 */
@Entity
@Table(name = "availability")
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Day of the week this slot recurs on, ISO-8601 (1 = Monday ... 7 = Sunday).
     */
    @Column(name = "week_day", nullable = false)
    private Integer weekDay;

    /**
     * Slot start time (time of day, no date component).
     */
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    /**
     * Slot end time (time of day, no date component). Must be after startTime.
     */
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /**
     * The tutor this recurring availability belongs to.
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations",
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private User tutor;


    // Constructors


    public Availability() {
    }

    public Availability(Integer weekDay, LocalTime startTime, LocalTime endTime, User tutor) {
        this.weekDay = weekDay;
        this.startTime = startTime;
        this.endTime = endTime;
        this.tutor = tutor;
    }


    // Getters and Setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getWeekDay() {
        return weekDay;
    }

    public void setWeekDay(Integer weekDay) {
        this.weekDay = weekDay;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public User getTutor() {
        return tutor;
    }

    public void setTutor(User tutor) {
        this.tutor = tutor;
    }

    /**
     * Gets the tutor's ID for JSON serialization, without exposing the full User entity.
     *
     * @return The tutor's ID, or null if tutor is not set
     */
    @JsonProperty("tutorId")
    public Long getTutorId() {
        return tutor != null ? tutor.getId() : null;
    }
}
