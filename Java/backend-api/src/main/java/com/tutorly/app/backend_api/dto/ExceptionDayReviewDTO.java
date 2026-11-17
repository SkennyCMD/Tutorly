package com.tutorly.app.backend_api.dto;

/**
 * Data Transfer Object for approving/refusing an {@link com.tutorly.app.backend_api.entity.ExceptionDay}.
 * Carries only the reviewing STAFF member's ID - the new status ("approved"/
 * "refused") is implied by which endpoint is called, not by this DTO.
 */
public class ExceptionDayReviewDTO {

    /**
     * ID of the STAFF member reviewing this exception.
     */
    private Long staffId;

    public ExceptionDayReviewDTO() {
    }

    public ExceptionDayReviewDTO(Long staffId) {
        this.staffId = staffId;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }
}
