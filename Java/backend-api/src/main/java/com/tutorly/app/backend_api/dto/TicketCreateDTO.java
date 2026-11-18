package com.tutorly.app.backend_api.dto;

/**
 * Data Transfer Object for creating a new {@link com.tutorly.app.backend_api.entity.Ticket}.
 * Accepts a plain user ID rather than a full entity reference, same rationale
 * as {@link AvailabilityCreateDTO}. {@code creation}/{@code status} are never
 * accepted from the client - always "now"/"open" server-side.
 */
public class TicketCreateDTO {

    private String content;

    /**
     * ID of the user raising the ticket. Nullable - a ticket can exist with
     * no requester on record.
     */
    private Long userId;


    public TicketCreateDTO() {
    }

    public TicketCreateDTO(String content, Long userId) {
        this.content = content;
        this.userId = userId;
    }


    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
