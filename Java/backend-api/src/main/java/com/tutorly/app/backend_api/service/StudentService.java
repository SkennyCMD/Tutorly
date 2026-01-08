package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Student entity business logic
 * 
 * Provides business logic and operations for student management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by status/class, and search functionality.
 */
@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    /**
     * Retrieve all students
     * 
     * @return List of all students in the system
     */
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    /**
     * Find a student by ID
     * 
     * @param id The student ID to search for
     * @return Optional containing the student if found, empty otherwise
     */
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    
    /**
     * Find students by status
     * 
     * Status can be: ACTIVE, INACTIVE, SUSPENDED, etc.
     * 
     * @param status The student status to filter by
     * @return List of students with the specified status
     */
    public List<Student> getStudentsByStatus(String status) {
        return studentRepository.findByStatus(status);
    }
    
    /**
     * Find students by class/grade
     * 
     * @param studentClass The class identifier (e.g., "1A", "2B")
     * @return List of students in the specified class
     */
    public List<Student> getStudentsByClass(String studentClass) {
        return studentRepository.findByStudentClass(studentClass);
    }
    
    /**
     * Search students by name or surname
     * 
     * Performs a partial match search across both name and surname fields.
     * The same search term is used for both fields.
     * 
     * @param searchTerm The term to search for in names or surnames
     * @return List of students whose name or surname contains the search term
     */
    public List<Student> searchStudents(String searchTerm) {
        return studentRepository.findByNameContainingOrSurnameContaining(searchTerm, searchTerm);
    }
    
    /**
     * Save or update a student
     * 
     * Creates a new student if ID is null, updates existing student otherwise.
     * 
     * @param student The student entity to save
     * @return The saved student entity with generated ID (if new)
     */
    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }
    
    /**
     * Delete a student by ID
     * 
     * @param id The ID of the student to delete
     */
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}
