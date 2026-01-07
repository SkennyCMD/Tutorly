package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tutors")
@CrossOrigin(origins = "*")
public class TutorController {
    
    @Autowired
    private TutorService tutorService;
    
    @GetMapping
    public ResponseEntity<List<Tutor>> getAllTutors() {
        return ResponseEntity.ok(tutorService.getAllTutors());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Tutor> getTutorById(@PathVariable Long id) {
        Optional<Tutor> tutor = tutorService.getTutorById(id);
        return tutor.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<Tutor> getTutorByUsername(@PathVariable String username) {
        Optional<Tutor> tutor = tutorService.getTutorByUsername(username);
        return tutor.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Tutor>> getTutorsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(tutorService.getTutorsByStatus(status));
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<Tutor>> getTutorsByRole(@PathVariable String role) {
        return ResponseEntity.ok(tutorService.getTutorsByRole(role));
    }
    
    @PostMapping
    public ResponseEntity<Tutor> createTutor(@RequestBody Tutor tutor) {
        if (tutorService.existsByUsername(tutor.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        Tutor savedTutor = tutorService.saveTutor(tutor);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTutor);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Tutor> updateTutor(@PathVariable Long id, @RequestBody Tutor tutor) {
        if (tutorService.getTutorById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        tutor.setId(id);
        return ResponseEntity.ok(tutorService.saveTutor(tutor));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTutor(@PathVariable Long id) {
        if (tutorService.getTutorById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        tutorService.deleteTutor(id);
        return ResponseEntity.noContent().build();
    }
}
