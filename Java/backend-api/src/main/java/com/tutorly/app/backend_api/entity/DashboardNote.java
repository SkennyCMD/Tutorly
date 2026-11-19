package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a time-bound notice an admin publishes to every
 * tutor's dashboard (e.g. an announcement or a learning note), written in
 * Markdown and rendered client-side.
 *
 * <p>A note is "active" while {@code expiration} hasn't passed yet, and
 * "expired" afterward - this is a derived, read-only distinction (computed
 * from {@code expiration} vs. now), not its own stored field.</p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: dashboard_note</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Key: id_admin (ON DELETE CASCADE, not nullable)</li>
 * </ul>
 * </p>
 *
 * @see Admin
 * @author Tutorly Development Team
 * @version 1.0
 * @since 3.0.0
 */
@Entity
@Table(name = "dashboard_note")
public class DashboardNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The notice body, written in Markdown.
     */
    @Column(name = "content", nullable = false)
    private String content;

    /**
     * When the notice was created.
     */
    @Column(name = "creation", nullable = false)
    private LocalDateTime creation;

    /**
     * When the notice stops being shown (inclusive - active through this
     * instant).
     */
    @Column(name = "expiration", nullable = false)
    private LocalDateTime expiration;

    /**
     * The admin who authored this notice.
     */
    @ManyToOne
    @JoinColumn(name = "id_admin", nullable = false)
    @JsonIgnoreProperties({"password", "createdUsers"})
    private Admin admin;


    // Constructors


    public DashboardNote() {
    }

    public DashboardNote(String content, LocalDateTime creation, LocalDateTime expiration, Admin admin) {
        this.content = content;
        this.creation = creation;
        this.expiration = expiration;
        this.admin = admin;
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

    public LocalDateTime getExpiration() {
        return expiration;
    }

    public void setExpiration(LocalDateTime expiration) {
        this.expiration = expiration;
    }

    public Admin getAdmin() {
        return admin;
    }

    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    @JsonProperty("adminId")
    public Long getAdminId() {
        return admin != null ? admin.getId() : null;
    }
}
