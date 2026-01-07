package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Tutor;
import com.tutorly.app.backend_api.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TutorService {
    
    @Autowired
    private TutorRepository tutorRepository;
    
    public List<Tutor> getAllTutors() {
        return tutorRepository.findAll();
    }
    
    public Optional<Tutor> getTutorById(Long id) {
        return tutorRepository.findById(id);
    }
    
    public Optional<Tutor> getTutorByUsername(String username) {
        return tutorRepository.findByUsername(username);
    }
    
    public List<Tutor> getTutorsByStatus(String status) {
        return tutorRepository.findByStatus(status);
    }
    
    public List<Tutor> getTutorsByRole(String role) {
        return tutorRepository.findByRole(role);
    }
    
    public Tutor saveTutor(Tutor tutor) {
        return tutorRepository.save(tutor);
    }
    
    public void deleteTutor(Long id) {
        tutorRepository.deleteById(id);
    }
    
    public boolean existsByUsername(String username) {
        return tutorRepository.existsByUsername(username);
    }
}
