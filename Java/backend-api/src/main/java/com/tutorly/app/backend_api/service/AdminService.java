package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Admin entity business logic
 * 
 * Provides business logic and operations for administrator management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups, and validation for admin accounts.
 */
@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;
    
    /**
     * Retrieve all administrators
     * 
     * @return List of all admin accounts in the system
     */
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }
    
    /**
     * Find an admin by ID
     * 
     * @param id The admin ID to search for
     * @return Optional containing the admin if found, empty otherwise
     */
    public Optional<Admin> getAdminById(Long id) {
        return adminRepository.findById(id);
    }
    
    /**
     * Find an admin by username
     * 
     * Used for authentication and profile lookups.
     * 
     * @param username The username to search for
     * @return Optional containing the admin if found, empty otherwise
     */
    public Optional<Admin> getAdminByUsername(String username) {
        return adminRepository.findByUsername(username);
    }
    
    /**
     * Find an admin by email address
     * 
     * @param mail The email address to search for
     * @return Optional containing the admin if found, empty otherwise
     */
    public Optional<Admin> getAdminByMail(String mail) {
        return adminRepository.findByMail(mail);
    }
    
    /**
     * Save or update an admin
     * 
     * Creates a new admin if ID is null, updates existing admin otherwise.
     * 
     * @param admin The admin entity to save
     * @return The saved admin entity with generated ID (if new)
     */
    public Admin saveAdmin(Admin admin) {
        return adminRepository.save(admin);
    }
    
    /**
     * Delete an admin by ID
     * 
     * @param id The ID of the admin to delete
     */
    public void deleteAdmin(Long id) {
        adminRepository.deleteById(id);
    }
    
    /**
     * Check if an admin with the given username exists
     * 
     * Useful for validation before creating new admins.
     * 
     * @param username The username to check
     * @return true if an admin with this username exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return adminRepository.existsByUsername(username);
    }
    
    /**
     * Check if an admin with the given email exists
     * 
     * Useful for validation before creating new admins.
     * 
     * @param mail The email address to check
     * @return true if an admin with this email exists, false otherwise
     */
    public boolean existsByMail(String mail) {
        return adminRepository.existsByMail(mail);
    }
}
