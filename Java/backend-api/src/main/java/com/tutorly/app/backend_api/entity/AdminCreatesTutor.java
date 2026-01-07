package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_creates_tutor")
public class AdminCreatesTutor {
    
    @EmbeddedId
    private AdminCreatesTutorId id;
    
    @ManyToOne
    @MapsId("idAdmin")
    @JoinColumn(name = "id_admin")
    @JsonBackReference("admin-createdTutors")
    private Admin admin;
    
    @ManyToOne
    @MapsId("idTutor")
    @JoinColumn(name = "id_tutor")
    @JsonBackReference("tutor-createdByAdmins")
    private Tutor tutor;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Costruttori
    public AdminCreatesTutor() {
    }
    
    public AdminCreatesTutor(Admin admin, Tutor tutor) {
        this.admin = admin;
        this.tutor = tutor;
        this.id = new AdminCreatesTutorId(admin.getId(), tutor.getId());
    }
    
    // Getter e Setter
    public AdminCreatesTutorId getId() {
        return id;
    }
    
    public void setId(AdminCreatesTutorId id) {
        this.id = id;
    }
    
    public Admin getAdmin() {
        return admin;
    }
    
    public void setAdmin(Admin admin) {
        this.admin = admin;
    }
    
    public Tutor getTutor() {
        return tutor;
    }
    
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
