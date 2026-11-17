package com.tutorly.app.backend_api.dto;

import java.time.LocalTime;

/**
 * Data Transfer Object for creating a new {@link com.tutorly.app.backend_api.entity.Availability}
 * slot. Accepts a plain tutor ID rather than a full entity reference, same
 * rationale as {@link PackCreateDTO}.
 */
public class AvailabilityCreateDTO {

    /**
     * Day of the week the slot recurs on, ISO-8601 (1 = Monday ... 7 = Sunday).
     */
    private Integer weekDay;

    private LocalTime startTime;

    private LocalTime endTime;

    /**
     * ID of the tutor this slot belongs to.
     */
    private Long tutorId;


    public AvailabilityCreateDTO() {
    }

    public AvailabilityCreateDTO(Integer weekDay, LocalTime startTime, LocalTime endTime, Long tutorId) {
        this.weekDay = weekDay;
        this.startTime = startTime;
        this.endTime = endTime;
        this.tutorId = tutorId;
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

    public Long getTutorId() {
        return tutorId;
    }

    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }
}
