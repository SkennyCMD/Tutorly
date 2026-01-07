package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {
    
    Optional<Tutor> findByUsername(String username);
    
    List<Tutor> findByStatus(String status);
    
    List<Tutor> findByRole(String role);
    
    boolean existsByUsername(String username);
}
