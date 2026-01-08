package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * JPA Entity representing a Test/Exam in the tutoring system
 * 
 * Tests track student assessments and exam results.
 * Each test has a date, description, score/mark, and links to the tutor and student.
 * Used for tracking academic performance and progress.
 * 
 * Database table: test
 */
@Entity
@Table(name = "test")
public class Test {
    
    /**
     * Primary key - auto-generated test ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Date when the test was administered
     */
    @Column(name = "day", nullable = false)
    private LocalDate day;
    
    /**
     * Description of the test content or subject
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Test score/mark (can be null if not yet graded)
     */
    @Column(name = "mark")
    private Integer mark;
    
    /**
     * The tutor who administered the test
     */
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-tests")
    private Tutor tutor;
    
    /**
     * The student who took the test
     */
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-tests")
    private Student student;
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public Test() {
    }
    
    /**
     * Constructor with all fields
     * 
     * @param day Test date
     * @param description Test content description
     * @param mark Test score (can be null)
     * @param tutor Tutor who administered the test
     * @param student Student who took the test
     */
    public Test(LocalDate day, String description, Integer mark, Tutor tutor, Student student) {
        this.day = day;
        this.description = description;
        this.mark = mark;
        this.tutor = tutor;
        this.student = student;
    }
    
    // Getters and Setters
    
    /**
     * Get the test ID
     * @return Test ID
     */
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDate getDay() {
        return day;
    }
    
    public void setDay(LocalDate day) {
        this.day = day;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getMark() {
        return mark;
    }
    
    public void setMark(Integer mark) {
        this.mark = mark;
    }
    
    public Tutor getTutor() {
        return tutor;
    }
    
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
}
