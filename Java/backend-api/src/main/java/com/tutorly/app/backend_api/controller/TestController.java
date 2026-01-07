package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Test;
import com.tutorly.app.backend_api.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestController {
    
    @Autowired
    private TestService testService;
    
    @GetMapping
    public ResponseEntity<List<Test>> getAllTests() {
        return ResponseEntity.ok(testService.getAllTests());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id) {
        Optional<Test> test = testService.getTestById(id);
        return test.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Test>> getTestsByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(testService.getTestsByTutor(tutorId));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Test>> getTestsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(testService.getTestsByStudent(studentId));
    }
    
    @GetMapping("/tutor/{tutorId}/student/{studentId}")
    public ResponseEntity<List<Test>> getTestsByTutorAndStudent(
            @PathVariable Long tutorId, @PathVariable Long studentId) {
        return ResponseEntity.ok(testService.getTestsByTutorAndStudent(tutorId, studentId));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<Test>> getTestsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(testService.getTestsByDateRange(start, end));
    }
    
    @GetMapping("/min-mark/{mark}")
    public ResponseEntity<List<Test>> getTestsByMinMark(@PathVariable Integer mark) {
        return ResponseEntity.ok(testService.getTestsByMinMark(mark));
    }
    
    @PostMapping
    public ResponseEntity<Test> createTest(@RequestBody Test test) {
        Test savedTest = testService.saveTest(test);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTest);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Test> updateTest(@PathVariable Long id, @RequestBody Test test) {
        if (testService.getTestById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        test.setId(id);
        return ResponseEntity.ok(testService.saveTest(test));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        if (testService.getTestById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        testService.deleteTest(id);
        return ResponseEntity.noContent().build();
    }
}
