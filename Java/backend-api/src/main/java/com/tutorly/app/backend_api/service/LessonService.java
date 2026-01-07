package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LessonService {
    
    @Autowired
    private LessonRepository lessonRepository;
    
    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }
    
    public Optional<Lesson> getLessonById(Long id) {
        return lessonRepository.findById(id);
    }
    
    public List<Lesson> getLessonsByTutor(Long tutorId) {
        return lessonRepository.findByTutorId(tutorId);
    }
    
    public List<Lesson> getLessonsByStudent(Long studentId) {
        return lessonRepository.findByStudentId(studentId);
    }
    
    public List<Lesson> getLessonsByTutorAndStudent(Long tutorId, Long studentId) {
        return lessonRepository.findByTutorIdAndStudentId(tutorId, studentId);
    }
    
    public List<Lesson> getLessonsByDateRange(LocalDateTime start, LocalDateTime end) {
        return lessonRepository.findByStartTimeBetween(start, end);
    }
    
    public Lesson saveLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }
    
    public void deleteLesson(Long id) {
        lessonRepository.deleteById(id);
    }
}
