package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.AdminCreatesTutor;
import com.tutorly.app.backend_api.entity.AdminCreatesTutorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for AdminCreatesTutor entity
 * 
 * Provides CRUD operations and custom queries for the admin-tutor creation relationship.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Uses composite key AdminCreatesTutorId for entity identification.
 */
@Repository
public interface AdminCreatesTutorRepository extends JpaRepository<AdminCreatesTutor, AdminCreatesTutorId> {
    
    /**
     * Find all tutor creation records by admin ID
     * 
     * Retrieves all AdminCreatesTutor relationships where the specified admin
     * is the creator, showing which tutors were created by that admin.
     * 
     * @param adminId The admin ID to search for
     * @return List of AdminCreatesTutor records for the specified admin
     */
    List<AdminCreatesTutor> findByAdminId(Long adminId);
    
    /**
     * Find all creation records for a specific tutor
     * 
     * Retrieves all AdminCreatesTutor relationships for the specified tutor,
     * showing which admin(s) created that tutor.
     * 
     * @param tutorId The tutor ID to search for
     * @return List of AdminCreatesTutor records for the specified tutor
     */
    List<AdminCreatesTutor> findByTutorId(Long tutorId);
}
