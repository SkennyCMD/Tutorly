package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Test;
import com.tutorly.app.backend_api.repository.TestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TestService {
    
    @Autowired
    private TestRepository testRepository;
    
    public List<Test> getAllTests() {
        return testRepository.findAll();
    }
    
    public Optional<Test> getTestById(Long id) {
        return testRepository.findById(id);
    }
    
    public List<Test> getTestsByTutor(Long tutorId) {
        return testRepository.findByTutorId(tutorId);
    }
    
    public List<Test> getTestsByStudent(Long studentId) {
        return testRepository.findByStudentId(studentId);
    }
    
    public List<Test> getTestsByTutorAndStudent(Long tutorId, Long studentId) {
        return testRepository.findByTutorIdAndStudentId(tutorId, studentId);
    }
    
    public List<Test> getTestsByDateRange(LocalDate start, LocalDate end) {
        return testRepository.findByDayBetween(start, end);
    }
    
    public List<Test> getTestsByMinMark(Integer mark) {
        return testRepository.findByMarkGreaterThanEqual(mark);
    }
    
    public Test saveTest(Test test) {
        return testRepository.save(test);
    }
    
    public void deleteTest(Long id) {
        testRepository.deleteById(id);
    }
}
