package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    
    List<Lesson> findByTutorId(Long tutorId);
    
    List<Lesson> findByStudentId(Long studentId);
    
    List<Lesson> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<Lesson> findByTutorIdAndStudentId(Long tutorId, Long studentId);
}
