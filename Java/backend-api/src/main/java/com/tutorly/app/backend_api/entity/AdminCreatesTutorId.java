package com.tutorly.app.backend_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/**
 * Composite Primary Key for AdminCreatesTutor entity
 * 
 * This embeddable class represents a composite key consisting of admin ID and tutor ID.
 * Used in the admin_creates_tutor join table to uniquely identify the relationship.
 * Implements Serializable as required for JPA composite keys.
 */
@Embeddable
public class AdminCreatesTutorId implements Serializable {
    
    /**
     * Admin ID component of the composite key
     */
    @Column(name = "id_admin")
    private Long idAdmin;
    
    /**
     * Tutor ID component of the composite key
     */
    @Column(name = "id_tutor")
    private Long idTutor;
    
    /**
     * Default constructor required by JPA
     */
    public AdminCreatesTutorId() {
    }
    
    /**
     * Constructor with both ID components
     * 
     * @param idAdmin Admin ID
     * @param idTutor Tutor ID
     */
    public AdminCreatesTutorId(Long idAdmin, Long idTutor) {
        this.idAdmin = idAdmin;
        this.idTutor = idTutor;
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
     * Get the tutor ID
     * @return Tutor ID
     */
    public Long getIdTutor() {
        return idTutor;
    }
    
    /**
     * Set the tutor ID
     * @param idTutor Tutor ID
     */
    public void setIdTutor(Long idTutor) {
        this.idTutor = idTutor;
    }
    
    /**
     * Check equality based on both admin ID and tutor ID
     * Required for JPA composite key operations
     * 
     * @param o Object to compare with
     * @return true if both IDs match, false otherwise
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AdminCreatesTutorId)) return false;
        AdminCreatesTutorId that = (AdminCreatesTutorId) o;
        return Objects.equals(idAdmin, that.idAdmin) && 
               Objects.equals(idTutor, that.idTutor);
    }
    
    /**
     * Generate hash code from both admin ID and tutor ID
     * Required for JPA composite key operations
     * 
     * @return Combined hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(idAdmin, idTutor);
    }
}
