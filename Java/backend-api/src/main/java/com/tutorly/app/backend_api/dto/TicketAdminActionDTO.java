package com.tutorly.app.backend_api.dto;

/**
 * Data Transfer Object for an admin picking up an open
 * {@link com.tutorly.app.backend_api.entity.Ticket} (moving it to "managing").
 */
public class TicketAdminActionDTO {

    private Long adminId;


    public TicketAdminActionDTO() {
    }

    public TicketAdminActionDTO(Long adminId) {
        this.adminId = adminId;
    }


    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }
}
