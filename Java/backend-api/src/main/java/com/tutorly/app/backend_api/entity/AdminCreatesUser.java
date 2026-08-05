package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing the Admin-Creates-User relationship.
 *
 * <p>This is an association/join table entity that tracks which admin user created which
 * account. It implements a many-to-many relationship with additional metadata (creation
 * timestamp) between Admin and User entities.</p>
 *
 * <p>Design Details:
 * <ul>
 *   <li>Uses a composite primary key (AdminCreatesUserId) consisting of admin ID and user ID</li>
 *   <li>Stores the creation timestamp for audit purposes</li>
 *   <li>Prevents circular JSON serialization with @JsonBackReference annotations</li>
 *   <li>Automatically initializes createdAt timestamp to current time</li>
 * </ul>
 * </p>
 *
 * <p>Usage Example:
 * <pre>
 * Admin admin = adminRepository.findById(adminId).orElseThrow();
 * User user = userRepository.findById(userId).orElseThrow();
 * AdminCreatesUser relation = new AdminCreatesUser(admin, user);
 * adminCreatesUserRepository.save(relation);
 * </pre>
 * </p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: admin_creates_user</li>
 *   <li>Composite PK: (id_admin, id_user)</li>
 *   <li>Additional columns: created_at</li>
 * </ul>
 * </p>
 *
 * @see Admin
 * @see User
 * @see AdminCreatesUserId
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "admin_creates_user")
public class AdminCreatesUser {

    /**
     * Composite primary key containing both admin ID and user ID.
     * This embedded ID uniquely identifies each admin-user creation relationship.
     */
    @EmbeddedId
    private AdminCreatesUserId id;

    /**
     * The admin user who created the user account.
     *
     * Many-to-one relationship with Admin entity.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     */
    @ManyToOne
    @MapsId("idAdmin")
    @JoinColumn(name = "id_admin")
    @JsonBackReference("admin-createdUsers")
    private Admin admin;

    /**
     * The user account that was created by the admin.
     *
     * Many-to-one relationship with User entity.
     * Uses @JsonBackReference to prevent circular references during JSON serialization.
     */
    @ManyToOne
    @MapsId("idUser")
    @JoinColumn(name = "id_user")
    @JsonBackReference("user-createdByAdmins")
    private User user;

    /**
     * Timestamp when the user was created by the admin.
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
    public AdminCreatesUser() {
    }

    /**
     * Parameterized constructor to create a new admin-user relationship.
     *
     * Automatically creates and sets the composite ID from the admin and user IDs.
     * The createdAt timestamp is initialized by the field default value.
     *
     * @param admin The admin user creating the account
     * @param user The user account being created
     */
    public AdminCreatesUser(Admin admin, User user) {
        this.admin = admin;
        this.user = user;
        this.id = new AdminCreatesUserId(admin.getId(), user.getId());
    }


    // Getters and Setters


    /**
     * Gets the composite primary key.
     *
     * @return AdminCreatesUserId containing both admin ID and user ID
     */
    public AdminCreatesUserId getId() {
        return id;
    }

    /**
     * Sets the composite primary key.
     *
     * @param id The composite primary key containing admin and user IDs
     */
    public void setId(AdminCreatesUserId id) {
        this.id = id;
    }

    /**
     * Gets the admin user who created the account.
     *
     * @return The Admin entity
     */
    public Admin getAdmin() {
        return admin;
    }

    /**
     * Sets the admin user who created the account.
     *
     * @param admin The Admin entity
     */
    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    /**
     * Gets the user account that was created.
     *
     * @return The User entity
     */
    public User getUser() {
        return user;
    }

    /**
     * Sets the user account that was created.
     *
     * @param user The User entity
     */
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * Gets the timestamp when the user was created.
     *
     * @return The creation date and time
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Sets the timestamp when the user was created.
     *
     * @param createdAt The creation date and time
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
