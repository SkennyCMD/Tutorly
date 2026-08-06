package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.StudentService;
import com.tutorly.app.backend_api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Student entity operations
 * 
 * Manages student accounts and information in the tutoring system.
 * Provides CRUD operations and search/filter capabilities.
 * All endpoints require API key authentication.
 * 
 * Base URL: /api/students
 */
@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {
    
    @Autowired
    private StudentService studentService;

    @Autowired
    private UserService userService;

    /**
     * Get all students
     * 
     * @return List of all students in the system
     * @apiNote GET /api/students
     */
    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }
    
    /**
     * Get student by ID
     * 
     * @param id The student ID
     * @return Student entity if found, 404 Not Found otherwise
     * @apiNote GET /api/students/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        Optional<Student> student = studentService.getStudentById(id);
        return student.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get students by status
     * 
     * Status can be: active, inactive, suspended, etc.
     * 
     * @param status The student status
     * @return List of students with the specified status
     * @apiNote GET /api/students/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Student>> getStudentsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(studentService.getStudentsByStatus(status));
    }
    
    /**
     * Get students by class
     * 
     * @param studentClass The class/grade (e.g., "1A", "2B")
     * @return List of students in the specified class
     * @apiNote GET /api/students/class/{studentClass}
     */
    @GetMapping("/class/{studentClass}")
    public ResponseEntity<List<Student>> getStudentsByClass(@PathVariable String studentClass) {
        return ResponseEntity.ok(studentService.getStudentsByClass(studentClass));
    }
    
    /**
     * Search students by query
     * 
     * Searches across student name and other relevant fields.
     * 
     * @param q The search query string
     * @return List of students matching the search criteria
     * @apiNote GET /api/students/search?q=john
     */
    @GetMapping("/search")
    public ResponseEntity<List<Student>> searchStudents(@RequestParam String q) {
        return ResponseEntity.ok(studentService.searchStudents(q));
    }

    /**
     * Get students not linked to any GUEST account
     *
     * Used to populate the pool of students a GUEST account can be assigned to.
     *
     * @return List of students with no linked GUEST account
     * @apiNote GET /api/students/unassigned
     */
    @GetMapping("/unassigned")
    public ResponseEntity<List<Student>> getUnassignedStudents() {
        return ResponseEntity.ok(studentService.getUnassignedStudents());
    }

    /**
     * Get students linked to a specific GUEST account
     *
     * @param userId The GUEST account's user ID
     * @return List of students linked to the specified GUEST account
     * @apiNote GET /api/students/guest/{userId}
     */
    @GetMapping("/guest/{userId}")
    public ResponseEntity<List<Student>> getStudentsByGuest(@PathVariable Long userId) {
        return ResponseEntity.ok(studentService.getStudentsByGuest(userId));
    }

    /**
     * Assign or unassign a student's GUEST account
     *
     * Sets (or clears, if userId is null) the student's linked GUEST account.
     *
     * @param id The student ID to update
     * @param request Object containing the GUEST account's user ID (or null to unassign)
     * @return Updated student if found, 404 Not Found if student/user don't exist
     * @apiNote PATCH /api/students/{id}/guest
     */
    @PatchMapping("/{id}/guest")
    public ResponseEntity<?> updateStudentGuest(@PathVariable Long id, @RequestBody GuestAssignRequest request) {
        Optional<Student> studentOpt = studentService.getStudentById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Student student = studentOpt.get();

        if (request.getUserId() == null) {
            student.setUser(null);
        } else {
            Optional<User> userOpt = userService.getUserById(request.getUserId());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found with ID: " + request.getUserId());
            }
            student.setUser(userOpt.get());
        }

        return ResponseEntity.ok(studentService.saveStudent(student));
    }

    /**
     * Create a new student
     * 
     * @param student The student data to create
     * @return Created student with 201 Created status
     * @apiNote POST /api/students
     */
    @PostMapping
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        Student savedStudent = studentService.saveStudent(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedStudent);
    }
    
    /**
     * Update an existing student
     * 
     * @param id The student ID to update
     * @param student The updated student data
     * @return Updated student if found, 404 Not Found otherwise
     * @apiNote PUT /api/students/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        if (studentService.getStudentById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        student.setId(id);
        return ResponseEntity.ok(studentService.saveStudent(student));
    }
    
    /**
     * Delete a student
     * 
     * @param id The student ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if student doesn't exist
     * @apiNote DELETE /api/students/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        if (studentService.getStudentById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Inner class for GUEST assignment request payload
     */
    public static class GuestAssignRequest {
        private Long userId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }
}
