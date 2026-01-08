package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing an Administrator in the tutoring system
 * 
 * Admins have privileges to create and manage tutors, students, and other system resources.
 * Each admin has unique email and username credentials for authentication.
 * Admins can create multiple tutors, tracked via AdminCreatesTutor relationship.
 * 
 * Database table: admin
 */
@Entity
@Table(name = "admin")
public class Admin {
    
    /**
     * Primary key - auto-generated admin ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Admin email address - must be unique across all admins
     * Used for authentication and communication
     */
    @Column(name = "mail", nullable = false, unique = true)
    private String mail;
    
    /**
     * Admin password - stored as-is (should be hashed in production)
     */
    @Column(name = "password", nullable = false)
    private String password;
    
    /**
     * Admin username - must be unique across all admins
     * Used for display and identification purposes
     */
    @Column(name = "username", nullable = false, unique = true)
    private String username;
    
    /**
     * Collection of tutors created by this admin
     * Tracks the relationship between admins and the tutors they've created
     * Cascade ALL ensures related records are managed automatically
     */
    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    @JsonManagedReference("admin-createdTutors")
    private Set<AdminCreatesTutor> createdTutors = new HashSet<>();
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public Admin() {
    }
    
    /**
     * Constructor with all required fields
     * 
     * @param mail Admin email address (must be unique)
     * @param password Admin password
     * @param username Admin username (must be unique)
     */
    public Admin(String mail, String password, String username) {
        this.mail = mail;
        this.password = password;
        this.username = username;
    }
    
    // Getters and Setters
    
    /**
     * Get the admin ID
     * @return Admin ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Set the admin ID
     * @param id Admin ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Get the admin email address
     * @return Email address
     */
    public String getMail() {
        return mail;
    }
    
    /**
     * Set the admin email address
     * @param mail Email address (must be unique)
     */
    public void setMail(String mail) {
        this.mail = mail;
    }
    
    /**
     * Get the admin password
     * @return Password
     */
    public String getPassword() {
        return password;
    }
    
    /**
     * Set the admin password
     * @param password Password
     */
    public void setPassword(String password) {
        this.password = password;
    }
    
    /**
     * Get the admin username
     * @return Username
     */
    public String getUsername() {
        return username;
    }
    
    /**
     * Set the admin username
     * @param username Username (must be unique)
     */
    public void setUsername(String username) {
        this.username = username;
    }
    
    /**
     * Get the collection of tutors created by this admin
     * @return Set of AdminCreatesTutor relationships
     */
    public Set<AdminCreatesTutor> getCreatedTutors() {
        return createdTutors;
    }
    
    /**
     * Set the collection of tutors created by this admin
     * @param createdTutors Set of AdminCreatesTutor relationships
     */
    public void setCreatedTutors(Set<AdminCreatesTutor> createdTutors) {
        this.createdTutors = createdTutors;
    }
}
