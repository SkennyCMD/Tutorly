package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Admin entity operations
 * 
 * Provides endpoints for CRUD operations on admin accounts.
 * All endpoints require API key authentication (configured in ApiKeyInterceptor).
 * 
 * Base URL: /api/admins
 */
@RestController
@RequestMapping("/api/admins")
@CrossOrigin(origins = "*")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    /**
     * Get all admins
     * 
     * @return List of all admin accounts
     * @apiNote GET /api/admins
     */
    @GetMapping
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }
    
    /**
     * Get admin by ID
     * 
     * @param id The admin ID
     * @return Admin entity if found, 404 Not Found otherwise
     * @apiNote GET /api/admins/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Admin> getAdminById(@PathVariable Long id) {
        Optional<Admin> admin = adminService.getAdminById(id);
        return admin.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get admin by username
     * 
     * @param username The admin username
     * @return Admin entity if found, 404 Not Found otherwise
     * @apiNote GET /api/admins/username/{username}
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<Admin> getAdminByUsername(@PathVariable String username) {
        Optional<Admin> admin = adminService.getAdminByUsername(username);
        return admin.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Admin login endpoint
     * 
     * Authenticates admin by username and password.
     * Returns admin ID if authentication is successful.
     * 
     * @param credentials Map containing username and password
     * @return Admin ID as plain text if authenticated, 401 Unauthorized otherwise
     * @apiNote POST /api/admins/login
     */
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username and password required");
        }
        
        Optional<Admin> admin = adminService.getAdminByUsername(username);
        
        if (admin.isPresent() && admin.get().getPassword().equals(password)) {
            // Authentication successful - return admin ID
            return ResponseEntity.ok(admin.get().getId().toString());
        }
        
        // Authentication failed
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
    
    /**
     * Create a new admin
     * 
     * Validates that username and email are unique before creation.
     * 
     * @param admin The admin data to create
     * @return Created admin with 201 Created status, or 409 Conflict if username/email already exists
     * @apiNote POST /api/admins
     */
    @PostMapping
    public ResponseEntity<Admin> createAdmin(@RequestBody Admin admin) {
        // Check if username already exists
        if (adminService.existsByUsername(admin.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        // Check if email already exists
        if (adminService.existsByMail(admin.getMail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        Admin savedAdmin = adminService.saveAdmin(admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAdmin);
    }
    
    /**
     * Update an existing admin
     * 
     * @param id The admin ID to update
     * @param admin The updated admin data
     * @return Updated admin if found, 404 Not Found otherwise
     * @apiNote PUT /api/admins/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Admin> updateAdmin(@PathVariable Long id, @RequestBody Admin admin) {
        if (adminService.getAdminById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        admin.setId(id);
        return ResponseEntity.ok(adminService.saveAdmin(admin));
    }
    
    /**
     * Delete an admin
     * 
     * @param id The admin ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if admin doesn't exist
     * @apiNote DELETE /api/admins/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        if (adminService.getAdminById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        adminService.deleteAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
