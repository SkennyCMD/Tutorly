package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tutor")
public class Tutor {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", nullable = false, unique = true)
    private String username;
    
    @Column(name = "password", nullable = false)
    private String password;
    
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
    
    @Column(name = "role", nullable = false)
    private String role = "GENERIC";
    
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdByAdmins")
    private Set<AdminCreatesTutor> createdByAdmins = new HashSet<>();
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdCalendarNotes")
    private Set<CalendarNote> createdCalendarNotes = new HashSet<>();
    
    @ManyToMany(mappedBy = "tutors")
    @JsonManagedReference("tutor-calendarNotes")
    private Set<CalendarNote> calendarNotes = new HashSet<>();
    
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-prenotations")
    private Set<Prenotation> prenotations = new HashSet<>();
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-createdPrenotations")
    private Set<Prenotation> createdPrenotations = new HashSet<>();
    
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-lessons")
    private Set<Lesson> lessons = new HashSet<>();
    
    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    @JsonManagedReference("tutor-tests")
    private Set<Test> tests = new HashSet<>();
    
    // Costruttori
    public Tutor() {
    }
    
    public Tutor(String username, String password, String status, String role) {
        this.username = username;
        this.password = password;
        this.status = status;
        this.role = role;
    }
    
    // Getter e Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public Set<AdminCreatesTutor> getCreatedByAdmins() {
        return createdByAdmins;
    }
    
    public void setCreatedByAdmins(Set<AdminCreatesTutor> createdByAdmins) {
        this.createdByAdmins = createdByAdmins;
    }
    
    public Set<CalendarNote> getCreatedCalendarNotes() {
        return createdCalendarNotes;
    }
    
    public void setCreatedCalendarNotes(Set<CalendarNote> createdCalendarNotes) {
        this.createdCalendarNotes = createdCalendarNotes;
    }
    
    public Set<CalendarNote> getCalendarNotes() {
        return calendarNotes;
    }
    
    public void setCalendarNotes(Set<CalendarNote> calendarNotes) {
        this.calendarNotes = calendarNotes;
    }
    
    public Set<Prenotation> getPrenotations() {
        return prenotations;
    }
    
    public void setPrenotations(Set<Prenotation> prenotations) {
        this.prenotations = prenotations;
    }
    
    public Set<Prenotation> getCreatedPrenotations() {
        return createdPrenotations;
    }
    
    public void setCreatedPrenotations(Set<Prenotation> createdPrenotations) {
        this.createdPrenotations = createdPrenotations;
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
