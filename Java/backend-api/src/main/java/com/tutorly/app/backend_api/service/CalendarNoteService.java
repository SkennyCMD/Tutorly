package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.CalendarNote;
import com.tutorly.app.backend_api.repository.CalendarNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CalendarNoteService {
    
    @Autowired
    private CalendarNoteRepository calendarNoteRepository;
    
    public List<CalendarNote> getAllCalendarNotes() {
        return calendarNoteRepository.findAll();
    }
    
    public Optional<CalendarNote> getCalendarNoteById(Long id) {
        return calendarNoteRepository.findById(id);
    }
    
    public List<CalendarNote> getCalendarNotesByCreator(Long creatorId) {
        return calendarNoteRepository.findByCreatorId(creatorId);
    }
    
    public List<CalendarNote> getCalendarNotesByTutor(Long tutorId) {
        return calendarNoteRepository.findByTutorsId(tutorId);
    }
    
    public List<CalendarNote> getCalendarNotesByDateRange(LocalDateTime start, LocalDateTime end) {
        return calendarNoteRepository.findByStartTimeBetween(start, end);
    }
    
    public CalendarNote saveCalendarNote(CalendarNote calendarNote) {
        return calendarNoteRepository.save(calendarNote);
    }
    
    public void deleteCalendarNote(Long id) {
        calendarNoteRepository.deleteById(id);
    }
}
