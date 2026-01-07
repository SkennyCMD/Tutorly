package com.tutorly.app.backend_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class AdminCreatesTutorId implements Serializable {
    
    @Column(name = "id_admin")
    private Long idAdmin;
    
    @Column(name = "id_tutor")
    private Long idTutor;
    
    public AdminCreatesTutorId() {
    }
    
    public AdminCreatesTutorId(Long idAdmin, Long idTutor) {
        this.idAdmin = idAdmin;
        this.idTutor = idTutor;
    }
    
    // Getter e Setter
    public Long getIdAdmin() {
        return idAdmin;
    }
    
    public void setIdAdmin(Long idAdmin) {
        this.idAdmin = idAdmin;
    }
    
    public Long getIdTutor() {
        return idTutor;
    }
    
    public void setIdTutor(Long idTutor) {
        this.idTutor = idTutor;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AdminCreatesTutorId)) return false;
        AdminCreatesTutorId that = (AdminCreatesTutorId) o;
        return Objects.equals(idAdmin, that.idAdmin) && 
               Objects.equals(idTutor, that.idTutor);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(idAdmin, idTutor);
    }
}
