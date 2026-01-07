package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    
    public List<Student> getStudentsByStatus(String status) {
        return studentRepository.findByStatus(status);
    }
    
    public List<Student> getStudentsByClass(String studentClass) {
        return studentRepository.findByStudentClass(studentClass);
    }
    
    public List<Student> searchStudents(String searchTerm) {
        return studentRepository.findByNameContainingOrSurnameContaining(searchTerm, searchTerm);
    }
    
    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }
    
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}
