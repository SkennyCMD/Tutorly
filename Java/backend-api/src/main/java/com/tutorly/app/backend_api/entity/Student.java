package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity representing a Student in the tutoring system
 * 
 * Students are enrolled in the tutoring program and can have lessons, tests, and prenotations.
 * Each student has personal information, class assignment, and status tracking.
 * 
 * Database table: student
 */
@Entity
@Table(name = "student")
@JsonIgnoreProperties(value = {"lessons", "prenotations", "tests"}, allowGetters = true)
public class Student {
    
    /**
     * Primary key - auto-generated student ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Student's first name
     */
    @Column(name = "name", nullable = false)
    private String name;
    
    /**
     * Student's last name
     */
    @Column(name = "surname", nullable = false)
    private String surname;
    
    /**
     * Student's class/grade (e.g., "1A", "2B")
     */
    @Column(name = "class")
    private String studentClass;
    
    /**
     * Additional notes or description about the student
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Student status (ACTIVE, INACTIVE, SUSPENDED, etc.)
     * Default: ACTIVE
     */
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
    
    /**
     * Collection of prenotations/bookings for this student
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-prenotations")
    private Set<Prenotation> prenotations = new HashSet<>();
    
    /**
     * Collection of lessons attended by this student
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-lessons")
    private Set<Lesson> lessons = new HashSet<>();
    
    /**
     * Collection of tests taken by this student
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-tests")
    private Set<Test> tests = new HashSet<>();
    
    // Constructors
    
    /**
     * Default constructor required by JPA
     */
    public Student() {
    }
    
    /**
     * Constructor with all required fields
     * 
     * @param name Student's first name
     * @param surname Student's last name
     * @param studentClass Class/grade assignment
     * @param description Additional notes
     * @param status Student status
     */
    public Student(String name, String surname, String studentClass, String description, String status) {
        this.name = name;
        this.surname = surname;
        this.studentClass = studentClass;
        this.description = description;
        this.status = status;
    }
    
    // Getters and Setters
    
    /**
     * Get the student ID
     * @return Student ID
     */
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getSurname() {
        return surname;
    }
    
    public void setSurname(String surname) {
        this.surname = surname;
    }
    
    public String getStudentClass() {
        return studentClass;
    }
    
    public void setStudentClass(String studentClass) {
        this.studentClass = studentClass;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Set<Prenotation> getPrenotations() {
        return prenotations;
    }
    
    public void setPrenotations(Set<Prenotation> prenotations) {
        this.prenotations = prenotations;
    }
    
    public Set<Lesson> getLessons() {
        return lessons;
    }
    
    public void setLessons(Set<Lesson> lessons) {
        this.lessons = lessons;
    }
    
    public Set<Test> getTests() {
        return tests;
    }
    
    public void setTests(Set<Test> tests) {
        this.tests = tests;
    }
}
