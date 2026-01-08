package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for Admin entity
 * 
 * Provides CRUD operations and custom queries for administrator management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for finding and checking existence of admins by username or email.
 */
@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    
    /**
     * Find an admin by username
     * 
     * @param username The username to search for
     * @return Optional containing the admin if found, empty otherwise
     */
    Optional<Admin> findByUsername(String username);
    
    /**
     * Find an admin by email address
     * 
     * @param mail The email address to search for
     * @return Optional containing the admin if found, empty otherwise
     */
    Optional<Admin> findByMail(String mail);
    
    /**
     * Check if an admin with the given username exists
     * 
     * Useful for validation before creating new admins to ensure username uniqueness.
     * 
     * @param username The username to check
     * @return true if an admin with this username exists, false otherwise
     */
    boolean existsByUsername(String username);
    
    /**
     * Check if an admin with the given email exists
     * 
     * Useful for validation before creating new admins to ensure email uniqueness.
     * 
     * @param mail The email address to check
     * @return true if an admin with this email exists, false otherwise
     */
    boolean existsByMail(String mail);
}
