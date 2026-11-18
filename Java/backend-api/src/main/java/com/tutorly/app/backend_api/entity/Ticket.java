package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a support ticket raised by a tutor/GUEST account and
 * handled by an admin.
 *
 * <p>Lifecycle is strictly sequential: "open" (default, just submitted) -&gt;
 * "managing" (an admin has picked it up, {@code admin} set) -&gt; "closed"
 * ({@code closure} timestamp set, {@code comment} optionally added). Enforced
 * in {@link com.tutorly.app.backend_api.service.TicketService}, not here.</p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: ticket</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Keys: id_user (ON DELETE SET NULL, nullable), id_admin (ON DELETE SET NULL, nullable)</li>
 * </ul>
 * </p>
 *
 * @see User
 * @see Admin
 * @author Tutorly Development Team
 * @version 1.0
 * @since 3.0.0
 */
@Entity
@Table(name = "ticket")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The ticket body as submitted by the user.
     */
    @Column(name = "content", nullable = false)
    private String content;

    /**
     * When the ticket was opened.
     */
    @Column(name = "creation", nullable = false)
    private LocalDateTime creation;

    /**
     * "open" (default), "managing", or "closed".
     */
    @Column(name = "status", nullable = false)
    private String status = "open";

    /**
     * When the ticket was closed. Must be set if and only if status = "closed".
     */
    @Column(name = "closure")
    private LocalDateTime closure;

    /**
     * The admin's resolution comment, if any. Only meaningful once closed.
     */
    @Column(name = "comment")
    private String comment;

    /**
     * The user who raised the ticket. Nullable - preserved as history (not
     * deleted) if that account is later erased/removed.
     */
    @ManyToOne
    @JoinColumn(name = "id_user")
    @JsonIgnoreProperties({"password", "calendarNotes", "createdCalendarNotes", "createdPrenotations",
                           "lessons", "prenotations", "tests", "createdByAdmins"})
    private User user;

    /**
     * The admin currently handling (or who closed) this ticket. Nullable -
     * unset while status is "open".
     */
    @ManyToOne
    @JoinColumn(name = "id_admin")
    @JsonIgnoreProperties({"password", "createdUsers"})
    private Admin admin;


    // Constructors


    public Ticket() {
    }

    public Ticket(String content, LocalDateTime creation, User user) {
        this.content = content;
        this.creation = creation;
        this.user = user;
    }


    // Getters and Setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreation() {
        return creation;
    }

    public void setCreation(LocalDateTime creation) {
        this.creation = creation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getClosure() {
        return closure;
    }

    public void setClosure(LocalDateTime closure) {
        this.closure = closure;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Admin getAdmin() {
        return admin;
    }

    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @JsonProperty("adminId")
    public Long getAdminId() {
        return admin != null ? admin.getId() : null;
    }
}
