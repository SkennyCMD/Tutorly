package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prenotation")
public class Prenotation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "flag", nullable = false)
    private Boolean flag = false;
    
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    @ManyToOne
    @JoinColumn(name = "id_student", nullable = false)
    @JsonBackReference("student-prenotations")
    private Student student;
    
    @ManyToOne
    @JoinColumn(name = "id_tutor", nullable = false)
    @JsonBackReference("tutor-prenotations")
    private Tutor tutor;
    
    @ManyToOne
    @JoinColumn(name = "id_creator", nullable = false)
    @JsonBackReference("tutor-createdPrenotations")
    private Tutor creator;
    
    // Costruttori
    public Prenotation() {
    }
    
    public Prenotation(LocalDateTime startTime, LocalDateTime endTime, Student student, Tutor tutor, Tutor creator) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.student = student;
        this.tutor = tutor;
        this.creator = creator;
    }
    
    // Getter e Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Boolean getFlag() {
        return flag;
    }
    
    public void setFlag(Boolean flag) {
        this.flag = flag;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
    
    public Tutor getTutor() {
        return tutor;
    }
    
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    public Tutor getCreator() {
        return creator;
    }
    
    public void setCreator(Tutor creator) {
        this.creator = creator;
    }
}
