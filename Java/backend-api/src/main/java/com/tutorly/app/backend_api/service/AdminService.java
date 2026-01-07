package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;
    
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }
    
    public Optional<Admin> getAdminById(Long id) {
        return adminRepository.findById(id);
    }
    
    public Optional<Admin> getAdminByUsername(String username) {
        return adminRepository.findByUsername(username);
    }
    
    public Optional<Admin> getAdminByMail(String mail) {
        return adminRepository.findByMail(mail);
    }
    
    public Admin saveAdmin(Admin admin) {
        return adminRepository.save(admin);
    }
    
    public void deleteAdmin(Long id) {
        adminRepository.deleteById(id);
    }
    
    public boolean existsByUsername(String username) {
        return adminRepository.existsByUsername(username);
    }
    
    public boolean existsByMail(String mail) {
        return adminRepository.existsByMail(mail);
    }
}
