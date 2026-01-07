package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    List<Student> findByStatus(String status);
    
    List<Student> findByStudentClass(String studentClass);
    
    List<Student> findByNameContainingOrSurnameContaining(String name, String surname);
}
