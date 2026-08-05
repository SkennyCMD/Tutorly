package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Pack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Pack entity
 *
 * Provides CRUD operations for lesson packages (prepaid blocks of hours).
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 */
@Repository
public interface PackRepository extends JpaRepository<Pack, Long> {

    /**
     * Find all packs purchased for a specific student
     *
     * @param studentId The student ID to search for
     * @return List of packs belonging to the specified student
     */
    List<Pack> findByStudent_Id(Long studentId);
}
