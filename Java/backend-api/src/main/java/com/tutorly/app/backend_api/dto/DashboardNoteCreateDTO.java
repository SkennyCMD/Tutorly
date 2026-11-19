package com.tutorly.app.backend_api.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating a new
 * {@link com.tutorly.app.backend_api.entity.DashboardNote}. Accepts a plain
 * admin ID rather than a full entity reference, same rationale as
 * {@link TicketCreateDTO}. {@code creation} is never accepted from the
 * client - always "now" server-side.
 */
public class DashboardNoteCreateDTO {

    private String content;

    /**
     * When the notice stops being shown. The Node.js frontend sends this as
     * the end of the admin's chosen calendar day (23:59:59), so the note
     * stays active through that whole day regardless of what time it is now.
     */
    private LocalDateTime expiration;

    /**
     * ID of the admin authoring the notice.
     */
    private Long adminId;


    public DashboardNoteCreateDTO() {
    }

    public DashboardNoteCreateDTO(String content, LocalDateTime expiration, Long adminId) {
        this.content = content;
        this.expiration = expiration;
        this.adminId = adminId;
    }


    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getExpiration() {
        return expiration;
    }

    public void setExpiration(LocalDateTime expiration) {
        this.expiration = expiration;
    }

    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }
}
