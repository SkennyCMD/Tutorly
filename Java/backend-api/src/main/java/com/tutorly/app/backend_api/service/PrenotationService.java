package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Prenotation;
import com.tutorly.app.backend_api.repository.PrenotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PrenotationService {
    
    @Autowired
    private PrenotationRepository prenotationRepository;
    
    public List<Prenotation> getAllPrenotations() {
        return prenotationRepository.findAll();
    }
    
    public Optional<Prenotation> getPrenotationById(Long id) {
        return prenotationRepository.findById(id);
    }
    
    public List<Prenotation> getPrenotationsByStudent(Long studentId) {
        return prenotationRepository.findByStudentId(studentId);
    }
    
    public List<Prenotation> getPrenotationsByTutor(Long tutorId) {
        return prenotationRepository.findByTutorId(tutorId);
    }
    
    public List<Prenotation> getPrenotationsByCreator(Long creatorId) {
        return prenotationRepository.findByCreatorId(creatorId);
    }
    
    public List<Prenotation> getPrenotationsByFlag(Boolean flag) {
        return prenotationRepository.findByFlag(flag);
    }
    
    public List<Prenotation> getPrenotationsByDateRange(LocalDateTime start, LocalDateTime end) {
        return prenotationRepository.findByStartTimeBetween(start, end);
    }
    
    public Prenotation savePrenotation(Prenotation prenotation) {
        return prenotationRepository.save(prenotation);
    }
    
    public void deletePrenotation(Long id) {
        prenotationRepository.deleteById(id);
    }
}
