package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * JPA Entity representing a one-off exception to a tutor's regular {@link Availability}
 * on a specific date - either an extra "present" slot or a marked "absent" day.
 *
 * <p>Submitted by the tutor and reviewed by a STAFF member ({@code status}: pending,
 * refused, or approved). A 'present' exception requires both {@code startTime}/
 * {@code endTime}; an 'absent' one requires neither - enforced at the database level
 * by {@code times_match_type} in {@code Database/init.sql} and mirrored here by convention
 * rather than a Bean Validation constraint, consistent with other check-constrained
 * columns in this codebase (e.g. {@code Pack.checked}).</p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: exception_day</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Keys: id_tutor (ON DELETE CASCADE), id_staff (ON DELETE SET NULL, nullable)</li>
 * </ul>
 * </p>
 *
 * @see User
 * @see Availability
 * @author Tutorly Development Team
 * @version 1.0
 * @since 2.5.0
 */
@Entity
@Table(name = "exception_day")
public class ExceptionDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The calendar date this exception applies to.
     */
    @Column(name = "day", nullable = false)
    private LocalDate day;

    /**
     * "present" (exceptionally available, outside/instead of the regular weekly
     * schedule) or "absent" (exceptionally unavailable on a day that would
     * otherwise be a regular availability day).
     */
    @Column(name = "type", nullable = false)
    private String type;

    /**
     * Required when type = "present", must be null when type = "absent".
     */
    @Column(name = "start_time")
    private LocalTime startTime;

    /**
     * Required when type = "present", must be null when type = "absent".
     */
    @Column(name = "end_time")
    private LocalTime endTime;

    /**
     * STAFF-approval state: "pending" (default), "refused", or "approved". Only an
     * "approved" exception should actually affect what's shown as available.
     */
    @Column(name = "status", nullable = false)
    private String status = "pending";

    /**
     * The tutor requesting this exception.
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations",
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private User tutor;

    /**
     * The STAFF member who reviewed this exception, if any. Nullable - still null
     * while status is "pending".
     */
    @ManyToOne
    @JoinColumn(name = "id_staff")
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations",
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private User staff;


    // Constructors


    public ExceptionDay() {
    }

    public ExceptionDay(LocalDate day, String type, LocalTime startTime, LocalTime endTime, User tutor) {
        this.day = day;
        this.type = type;
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

    public LocalDate getDay() {
        return day;
    }

    public void setDay(LocalDate day) {
        this.day = day;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getTutor() {
        return tutor;
    }

    public void setTutor(User tutor) {
        this.tutor = tutor;
    }

    public User getStaff() {
        return staff;
    }

    public void setStaff(User staff) {
        this.staff = staff;
    }

    @JsonProperty("tutorId")
    public Long getTutorId() {
        return tutor != null ? tutor.getId() : null;
    }

    @JsonProperty("staffId")
    public Long getStaffId() {
        return staff != null ? staff.getId() : null;
    }
}
