package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "admin")
public class Admin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "mail", nullable = false, unique = true)
    private String mail;
    
    @Column(name = "password", nullable = false)
    private String password;
    
    @Column(name = "username", nullable = false, unique = true)
    private String username;
    
    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    @JsonManagedReference("admin-createdTutors")
    private Set<AdminCreatesTutor> createdTutors = new HashSet<>();
    
    // Costruttori
    public Admin() {
    }
    
    public Admin(String mail, String password, String username) {
        this.mail = mail;
        this.password = password;
        this.username = username;
    }
    
    // Getter e Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getMail() {
        return mail;
    }
    
    public void setMail(String mail) {
        this.mail = mail;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public Set<AdminCreatesTutor> getCreatedTutors() {
        return createdTutors;
    }
    
    public void setCreatedTutors(Set<AdminCreatesTutor> createdTutors) {
        this.createdTutors = createdTutors;
    }
}
