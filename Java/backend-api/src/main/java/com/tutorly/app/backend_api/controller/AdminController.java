package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admins")
@CrossOrigin(origins = "*")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @GetMapping
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Admin> getAdminById(@PathVariable Long id) {
        Optional<Admin> admin = adminService.getAdminById(id);
        return admin.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<Admin> getAdminByUsername(@PathVariable String username) {
        Optional<Admin> admin = adminService.getAdminByUsername(username);
        return admin.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Admin> createAdmin(@RequestBody Admin admin) {
        if (adminService.existsByUsername(admin.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (adminService.existsByMail(admin.getMail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        Admin savedAdmin = adminService.saveAdmin(admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAdmin);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Admin> updateAdmin(@PathVariable Long id, @RequestBody Admin admin) {
        if (adminService.getAdminById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        admin.setId(id);
        return ResponseEntity.ok(adminService.saveAdmin(admin));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        if (adminService.getAdminById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        adminService.deleteAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
