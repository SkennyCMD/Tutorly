package com.tutorly.app.backend_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/**
 * Composite Primary Key for AdminCreatesUser entity
 *
 * This embeddable class represents a composite key consisting of admin ID and user ID.
 * Used in the admin_creates_user join table to uniquely identify the relationship.
 * Implements Serializable as required for JPA composite keys.
 */
@Embeddable
public class AdminCreatesUserId implements Serializable {

    /**
     * Admin ID component of the composite key
     */
    @Column(name = "id_admin")
    private Long idAdmin;

    /**
     * User ID component of the composite key
     */
    @Column(name = "id_user")
    private Long idUser;

    /**
     * Default constructor required by JPA
     */
    public AdminCreatesUserId() {
    }

    /**
     * Constructor with both ID components
     *
     * @param idAdmin Admin ID
     * @param idUser User ID
     */
    public AdminCreatesUserId(Long idAdmin, Long idUser) {
        this.idAdmin = idAdmin;
        this.idUser = idUser;
    }

    // Getters and Setters

    /**
     * Get the admin ID
     * @return Admin ID
     */
    public Long getIdAdmin() {
        return idAdmin;
    }

    /**
     * Set the admin ID
     * @param idAdmin Admin ID
     */
    public void setIdAdmin(Long idAdmin) {
        this.idAdmin = idAdmin;
    }

    /**
     * Get the user ID
     * @return User ID
     */
    public Long getIdUser() {
        return idUser;
    }

    /**
     * Set the user ID
     * @param idUser User ID
     */
    public void setIdUser(Long idUser) {
        this.idUser = idUser;
    }

    /**
     * Check equality based on both admin ID and user ID
     * Required for JPA composite key operations
     *
     * @param o Object to compare with
     * @return true if both IDs match, false otherwise
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AdminCreatesUserId)) return false;
        AdminCreatesUserId that = (AdminCreatesUserId) o;
        return Objects.equals(idAdmin, that.idAdmin) &&
               Objects.equals(idUser, that.idUser);
    }

    /**
     * Generate hash code from both admin ID and user ID
     * Required for JPA composite key operations
     *
     * @return Combined hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(idAdmin, idUser);
    }
}
