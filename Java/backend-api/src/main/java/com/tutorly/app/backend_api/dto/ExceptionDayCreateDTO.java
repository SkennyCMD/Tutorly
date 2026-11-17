package com.tutorly.app.backend_api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Data Transfer Object for creating a new {@link com.tutorly.app.backend_api.entity.ExceptionDay}.
 *
 * <p>Deliberately has no {@code status}/{@code staffId} fields - every exception
 * is created as "pending" and unreviewed; approving/refusing it is a separate,
 * STAFF-only action (not yet built), so a tutor requesting an exception can never
 * self-approve it through this DTO.</p>
 */
public class ExceptionDayCreateDTO {

    private LocalDate day;

    /**
     * "present" or "absent".
     */
    private String type;

    /**
     * Required when type = "present", must be omitted/null when type = "absent".
     */
    private LocalTime startTime;

    private LocalTime endTime;

    /**
     * ID of the tutor requesting this exception.
     */
    private Long tutorId;


    public ExceptionDayCreateDTO() {
    }

    public ExceptionDayCreateDTO(LocalDate day, String type, LocalTime startTime, LocalTime endTime, Long tutorId) {
        this.day = day;
        this.type = type;
        this.startTime = startTime;
        this.endTime = endTime;
        this.tutorId = tutorId;
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

    public Long getTutorId() {
        return tutorId;
    }

    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }
}
