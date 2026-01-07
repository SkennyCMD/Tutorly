package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "student")
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "surname", nullable = false)
    private String surname;
    
    @Column(name = "class")
    private String studentClass;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-prenotations")
    private Set<Prenotation> prenotations = new HashSet<>();
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-lessons")
    private Set<Lesson> lessons = new HashSet<>();
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonManagedReference("student-tests")
    private Set<Test> tests = new HashSet<>();
    
    // Costruttori
    public Student() {
    }
    
    public Student(String name, String surname, String studentClass, String description, String status) {
        this.name = name;
        this.surname = surname;
        this.studentClass = studentClass;
        this.description = description;
        this.status = status;
    }
    
    // Getter e Setter
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
