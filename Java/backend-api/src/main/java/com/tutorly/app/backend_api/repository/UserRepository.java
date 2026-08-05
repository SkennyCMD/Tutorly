package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for User entity
 *
 * Provides CRUD operations and custom queries for user account management.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 * Includes methods for finding users by username, status, role, and checking username existence.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by username
     *
     * Used for authentication and lookup operations.
     *
     * @param username The username to search for
     * @return Optional containing the user if found, empty otherwise
     */
    Optional<User> findByUsername(String username);

    /**
     * Find users by status
     *
     * Status can be: ACTIVE, INACTIVE, ON_LEAVE, etc.
     * Useful for filtering active users or managing availability.
     *
     * @param status The status to filter by
     * @return List of users with the specified status
     */
    List<User> findByStatus(String status);

    /**
     * Find users by role
     *
     * Role can be: GENERIC, STAFF, GUEST.
     * Useful for organizing users by their function or level.
     *
     * @param role The role to filter by
     * @return List of users with the specified role
     */
    List<User> findByRole(String role);

    /**
     * Check if a user with the given username exists
     *
     * Useful for validation before creating new users to ensure username uniqueness.
     *
     * @param username The username to check
     * @return true if a user with this username exists, false otherwise
     */
    boolean existsByUsername(String username);
}
