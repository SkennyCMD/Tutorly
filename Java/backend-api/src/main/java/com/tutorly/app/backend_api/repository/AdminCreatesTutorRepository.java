package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.AdminCreatesTutor;
import com.tutorly.app.backend_api.entity.AdminCreatesTutorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminCreatesTutorRepository extends JpaRepository<AdminCreatesTutor, AdminCreatesTutorId> {
    
    List<AdminCreatesTutor> findByAdminId(Long adminId);
    
    List<AdminCreatesTutor> findByTutorId(Long tutorId);
}
