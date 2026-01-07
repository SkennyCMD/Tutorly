package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    
    Optional<Admin> findByUsername(String username);
    
    Optional<Admin> findByMail(String mail);
    
    boolean existsByUsername(String username);
    
    boolean existsByMail(String mail);
}
