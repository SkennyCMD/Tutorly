package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing the Admin-Creates-Tutor relationship
 * 
 * This is a join/association table entity that tracks which admin created which tutor.
 * Uses a composite primary key (AdminCreatesTutorId) consisting of admin ID and tutor ID.
 * Also stores the creation timestamp.
 * 
 * Database table: admin_creates_tutor
 */
@Entity
@Table(name = "admin_creates_tutor")
public class AdminCreatesTutor {
    
    /**
     * Composite primary key containing both admin ID and tutor ID
     */
    @EmbeddedId
    private AdminCreatesTutorId id;
    
    /**
     * The admin who created the tutor
     */
    @ManyToOne
    @MapsId("idAdmin")
    @JoinColumn(name = "id_admin")
    @JsonBackReference("admin-createdTutors")
    private Admin admin;
    
    /**
     * The tutor that was created
     */
    @ManyToOne
    @MapsId("idTutor")
    @JoinColumn(name = "id_tutor")
    @JsonBackReference("tutor-createdByAdmins")
    private Tutor tutor;
    
    /**
     * Timestamp when the tutor was created by the admin
     * Automatically set to current time
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public AdminCreatesTutor() {
    }
    
    /**
     * Constructor with admin and tutor
     * Automatically creates the composite ID from the admin and tutor IDs
     * 
     * @param admin The admin creating the tutor
     * @param tutor The tutor being created
     */
    public AdminCreatesTutor(Admin admin, Tutor tutor) {
        this.admin = admin;
        this.tutor = tutor;
        this.id = new AdminCreatesTutorId(admin.getId(), tutor.getId());
    }
    
    // Getters and Setters
    
    /**
     * Get the composite primary key
     * @return AdminCreatesTutorId containing admin and tutor IDs
     */
    public AdminCreatesTutorId getId() {
        return id;
    }
    
    public void setId(AdminCreatesTutorId id) {
        this.id = id;
    }
    
    public Admin getAdmin() {
        return admin;
    }
    
    public void setAdmin(Admin admin) {
        this.admin = admin;
    }
    
    public Tutor getTutor() {
        return tutor;
    }
    
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
