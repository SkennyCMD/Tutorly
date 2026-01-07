package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.CalendarNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarNoteRepository extends JpaRepository<CalendarNote, Long> {
    
    List<CalendarNote> findByCreatorId(Long creatorId);
    
    List<CalendarNote> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<CalendarNote> findByTutorsId(Long tutorId);
}
