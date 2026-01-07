package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Prenotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PrenotationRepository extends JpaRepository<Prenotation, Long> {
    
    List<Prenotation> findByStudentId(Long studentId);
    
    List<Prenotation> findByTutorId(Long tutorId);
    
    List<Prenotation> findByCreatorId(Long creatorId);
    
    List<Prenotation> findByFlag(Boolean flag);
    
    List<Prenotation> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
