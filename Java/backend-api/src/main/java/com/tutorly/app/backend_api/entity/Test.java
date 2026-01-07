package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "test")
public class Test {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "day", nullable = false)
    private LocalDate day;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "mark")
    private Integer mark;
    
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-tests")
    private Tutor tutor;
    
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-tests")
    private Student student;
    
    // Costruttori
    public Test() {
    }
    
    public Test(LocalDate day, String description, Integer mark, Tutor tutor, Student student) {
        this.day = day;
        this.description = description;
        this.mark = mark;
        this.tutor = tutor;
        this.student = student;
    }
    
    // Getter e Setter
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
