package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for User entity business logic
 *
 * Provides business logic and operations for user account management.
 * Acts as an intermediary between the controller layer and repository layer.
 * Handles CRUD operations, lookups by username/status/role, and validation.
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Retrieve all users
     *
     * @return List of all users in the system
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Find a user by ID
     *
     * @param id The user ID to search for
     * @return Optional containing the user if found, empty otherwise
     */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Find a user by username
     *
     * Used for authentication and profile lookups.
     *
     * @param username The username to search for
     * @return Optional containing the user if found, empty otherwise
     */
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Find users by status
     *
     * Status can be: ACTIVE, INACTIVE, ON_LEAVE, etc.
     * Useful for filtering active users or managing availability.
     *
     * @param status The status to filter by
     * @return List of users with the specified status
     */
    public List<User> getUsersByStatus(String status) {
        return userRepository.findByStatus(status);
    }

    /**
     * Find users by role
     *
     * Role can be: GENERIC, STAFF, GUEST.
     * Useful for organizing users by their function or level.
     *
     * @param role The role to filter by
     * @return List of users with the specified role
     */
    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }

    /**
     * Save or update a user
     *
     * Creates a new user if ID is null, updates existing user otherwise.
     *
     * @param user The user entity to save
     * @return The saved user entity with generated ID (if new)
     */
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Delete a user by ID
     *
     * @param id The ID of the user to delete
     */
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Check if a user with the given username exists
     *
     * Useful for validation before creating new users to ensure username uniqueness.
     *
     * @param username The username to check
     * @return true if a user with this username exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Authenticate a user by username and password
     *
     * Validates the credentials and returns the user ID if successful.
     * Returns null if authentication fails (invalid username or password).
     *
     * @param username The user's username
     * @param password The user's password
     * @return The user's ID if credentials are valid, null otherwise
     */
    public Long authenticateUser(String username, String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Check if password matches (plain text comparison - should use hashing in production)
            if (user.getPassword().equals(password)) {
                return user.getId();
            }
        }

        return null;
    }
}
