package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Prenotation;
import com.tutorly.app.backend_api.service.PrenotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/prenotations")
@CrossOrigin(origins = "*")
public class PrenotationController {
    
    @Autowired
    private PrenotationService prenotationService;
    
    @GetMapping
    public ResponseEntity<List<Prenotation>> getAllPrenotations() {
        return ResponseEntity.ok(prenotationService.getAllPrenotations());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Prenotation> getPrenotationById(@PathVariable Long id) {
        Optional<Prenotation> prenotation = prenotationService.getPrenotationById(id);
        return prenotation.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByStudent(studentId));
    }
    
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByTutor(tutorId));
    }
    
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByCreator(@PathVariable Long creatorId) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByCreator(creatorId));
    }
    
    @GetMapping("/flag/{flag}")
    public ResponseEntity<List<Prenotation>> getPrenotationsByFlag(@PathVariable Boolean flag) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByFlag(flag));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<Prenotation>> getPrenotationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(prenotationService.getPrenotationsByDateRange(start, end));
    }
    
    @PostMapping
    public ResponseEntity<Prenotation> createPrenotation(@RequestBody Prenotation prenotation) {
        Prenotation savedPrenotation = prenotationService.savePrenotation(prenotation);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPrenotation);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Prenotation> updatePrenotation(@PathVariable Long id, @RequestBody Prenotation prenotation) {
        if (prenotationService.getPrenotationById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        prenotation.setId(id);
        return ResponseEntity.ok(prenotationService.savePrenotation(prenotation));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrenotation(@PathVariable Long id) {
        if (prenotationService.getPrenotationById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        prenotationService.deletePrenotation(id);
        return ResponseEntity.noContent().build();
    }
}
