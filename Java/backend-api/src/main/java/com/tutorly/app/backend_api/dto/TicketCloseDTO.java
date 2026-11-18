package com.tutorly.app.backend_api.dto;

/**
 * Data Transfer Object for an admin closing a {@link com.tutorly.app.backend_api.entity.Ticket}
 * that's currently being managed. {@code comment} is optional.
 */
public class TicketCloseDTO {

    private Long adminId;

    private String comment;


    public TicketCloseDTO() {
    }

    public TicketCloseDTO(Long adminId, String comment) {
        this.adminId = adminId;
        this.comment = comment;
    }


    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
