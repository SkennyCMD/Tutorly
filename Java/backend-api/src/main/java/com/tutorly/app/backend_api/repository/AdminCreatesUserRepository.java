package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.AdminCreatesUser;
import com.tutorly.app.backend_api.entity.AdminCreatesUserId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for AdminCreatesUser entity
 *
 * Provides CRUD operations and custom queries for the admin-user creation relationship.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Uses composite key AdminCreatesUserId for entity identification.
 */
@Repository
public interface AdminCreatesUserRepository extends JpaRepository<AdminCreatesUser, AdminCreatesUserId> {

    /**
     * Find all user creation records by admin ID
     *
     * Retrieves all AdminCreatesUser relationships where the specified admin
     * is the creator, showing which users were created by that admin.
     *
     * @param adminId The admin ID to search for
     * @return List of AdminCreatesUser records for the specified admin
     */
    List<AdminCreatesUser> findByAdminId(Long adminId);

    /**
     * Find all creation records for a specific user
     *
     * Retrieves all AdminCreatesUser relationships for the specified user,
     * showing which admin(s) created that user.
     *
     * @param userId The user ID to search for
     * @return List of AdminCreatesUser records for the specified user
     */
    List<AdminCreatesUser> findByUserId(Long userId);
}
