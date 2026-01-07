package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    
    List<Test> findByTutorId(Long tutorId);
    
    List<Test> findByStudentId(Long studentId);
    
    List<Test> findByDayBetween(LocalDate start, LocalDate end);
    
    List<Test> findByTutorIdAndStudentId(Long tutorId, Long studentId);
    
    List<Test> findByMarkGreaterThanEqual(Integer mark);
}
