package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing the Admin-Creates-Tutor relationship.
 * 
 * <p>This is an association/join table entity that tracks which admin user created which tutor.
 * It implements a many-to-many relationship with additional metadata (creation timestamp)
 * between Admin and Tutor entities.</p>
 * 
 * <p>Design Details:
 * <ul>
 *   <li>Uses a composite primary key (AdminCreatesTutorId) consisting of admin ID and tutor ID</li>
 *   <li>Stores the creation timestamp for audit purposes</li>
 *   <li>Prevents circular JSON serialization with @JsonBackReference annotations</li>
 *   <li>Automatically initializes createdAt timestamp to current time</li>
 * </ul>
 * </p>
 * 
 * <p>Usage Example:
 * <pre>
 * Admin admin = adminRepository.findById(adminId).orElseThrow();
 * Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
 * AdminCreatesTutor relation = new AdminCreatesTutor(admin, tutor);
 * adminCreatesTutorRepository.save(relation);
 * </pre>
 * </p>
 * 
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: admin_creates_tutor</li>
 *   <li>Composite PK: (id_admin, id_tutor)</li>
 *   <li>Additional columns: created_at</li>
 * </ul>
 * </p>
 * 
 * @see Admin
 * @see Tutor
 * @see AdminCreatesTutorId
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "admin_creates_tutor")
public class AdminCreatesTutor {
    
    /**
     * Composite primary key containing both admin ID and tutor ID.
     * This embedded ID uniquely identifies each admin-tutor creation relationship.
     */
    @EmbeddedId
    private AdminCreatesTutorId id;
    
    /**
     * The admin user who created the tutor account.
     * 
     * Many-to-one relationship with Admin entity.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     */
    @ManyToOne
    @MapsId("idAdmin")
    @JoinColumn(name = "id_admin")
    @JsonBackReference("admin-createdTutors")
    private Admin admin;
    
    /**
     * The tutor account that was created by the admin.
     * 
     * Many-to-one relationship with Tutor entity.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     */
    @ManyToOne
    @MapsId("idTutor")
    @JoinColumn(name = "id_tutor")
    @JsonBackReference("tutor-createdByAdmins")
    private Tutor tutor;
    
    /**
     * Timestamp when the tutor was created by the admin.
     * 
     * Automatically initialized to the current time when the entity is instantiated.
     * Non-nullable field for audit tracking purposes.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    
    // Constructors
    
    
    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public AdminCreatesTutor() {
    }
    
    /**
     * Parameterized constructor to create a new admin-tutor relationship.
     * 
     * Automatically creates and sets the composite ID from the admin and tutor IDs.
     * The createdAt timestamp is initialized by the field default value.
     * 
     * @param admin The admin user creating the tutor account
     * @param tutor The tutor account being created
     */
    public AdminCreatesTutor(Admin admin, Tutor tutor) {
        this.admin = admin;
        this.tutor = tutor;
        this.id = new AdminCreatesTutorId(admin.getId(), tutor.getId());
    }
    
    
    // Getters and Setters
    
    
    /**
     * Gets the composite primary key.
     * 
     * @return AdminCreatesTutorId containing both admin ID and tutor ID
     */
    public AdminCreatesTutorId getId() {
        return id;
    }
    
    /**
     * Sets the composite primary key.
     * 
     * @param id The composite primary key containing admin and tutor IDs
     */
    public void setId(AdminCreatesTutorId id) {
        this.id = id;
    }
    
    /**
     * Gets the admin user who created the tutor.
     * 
     * @return The Admin entity
     */
    public Admin getAdmin() {
        return admin;
    }
    
    /**
     * Sets the admin user who created the tutor.
     * 
     * @param admin The Admin entity
     */
    public void setAdmin(Admin admin) {
        this.admin = admin;
    }
    
    /**
     * Gets the tutor account that was created.
     * 
     * @return The Tutor entity
     */
    public Tutor getTutor() {
        return tutor;
    }
    
    /**
     * Sets the tutor account that was created.
     * 
     * @param tutor The Tutor entity
     */
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    /**
     * Gets the timestamp when the tutor was created.
     * 
     * @return The creation date and time
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    /**
     * Sets the timestamp when the tutor was created.
     * 
     * @param createdAt The creation date and time
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
