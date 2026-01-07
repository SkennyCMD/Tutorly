package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = "*")
public class LessonController {
    
    @Autowired
    private LessonService lessonService;
    
    @GetMapping
    public ResponseEntity<List<Lesson>> getAllLessons() {
        return ResponseEntity.ok(lessonService.getAllLessons());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Lesson> getLessonById(@PathVariable Long id) {
        Optional<Lesson> lesson = lessonService.getLessonById(id);
        return lesson.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Lesson>> getLessonsByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(lessonService.getLessonsByTutor(tutorId));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Lesson>> getLessonsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(lessonService.getLessonsByStudent(studentId));
    }
    
    @GetMapping("/tutor/{tutorId}/student/{studentId}")
    public ResponseEntity<List<Lesson>> getLessonsByTutorAndStudent(
            @PathVariable Long tutorId, @PathVariable Long studentId) {
        return ResponseEntity.ok(lessonService.getLessonsByTutorAndStudent(tutorId, studentId));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<Lesson>> getLessonsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(lessonService.getLessonsByDateRange(start, end));
    }
    
    @PostMapping
    public ResponseEntity<Lesson> createLesson(@RequestBody Lesson lesson) {
        Lesson savedLesson = lessonService.saveLesson(lesson);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedLesson);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Lesson> updateLesson(@PathVariable Long id, @RequestBody Lesson lesson) {
        if (lessonService.getLessonById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        lesson.setId(id);
        return ResponseEntity.ok(lessonService.saveLesson(lesson));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        if (lessonService.getLessonById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        lessonService.deleteLesson(id);
        return ResponseEntity.noContent().build();
    }
}
