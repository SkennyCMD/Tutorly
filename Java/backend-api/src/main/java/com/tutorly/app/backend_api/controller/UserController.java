package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for User entity operations
 *
 * Manages user accounts (tutors, STAFF, and GUEST accounts) in the tutoring system.
 * Provides CRUD operations and filtering by status, role, and username.
 * All endpoints require API key authentication.
 *
 * Base URL: /api/users
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Get all users
     *
     * @return List of all users in the system
     * @apiNote GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Get user by ID
     *
     * @param id The user ID
     * @return User entity if found, 404 Not Found otherwise
     * @apiNote GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get user by username
     *
     * @param username The username
     * @return User entity if found, 404 Not Found otherwise
     * @apiNote GET /api/users/username/{username}
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        Optional<User> user = userService.getUserByUsername(username);
        return user.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get users by status
     *
     * Status can be: active, inactive, on leave, etc.
     *
     * @param status The user status
     * @return List of users with the specified status
     * @apiNote GET /api/users/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<User>> getUsersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }

    /**
     * Get users by role
     *
     * Role can be: GENERIC, STAFF, GUEST.
     *
     * @param role The user role
     * @return List of users with the specified role
     * @apiNote GET /api/users/role/{role}
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    /**
     * Create a new user
     *
     * Validates that username is unique before creation.
     *
     * @param userRequest The user data to create
     * @return Created user with 201 Created status, or 409 Conflict if username already exists
     * @apiNote POST /api/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserCreateRequest userRequest) {
        if (userService.existsByUsername(userRequest.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = new User();
        user.setUsername(userRequest.getUsername());
        user.setPassword(userRequest.getPassword());
        user.setRole(userRequest.getRole() != null ? userRequest.getRole() : "GENERIC");
        user.setStatus(userRequest.getStatus() != null ? userRequest.getStatus() : "ACTIVE");

        User savedUser = userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    /**
     * Update an existing user
     *
     * @param id The user ID to update
     * @param user The updated user data
     * @return Updated user if found, 404 Not Found otherwise
     * @apiNote PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        if (userService.getUserById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        user.setId(id);
        return ResponseEntity.ok(userService.saveUser(user));
    }

    /**
     * Delete a user
     *
     * @param id The user ID to delete
     * @return 204 No Content if deleted successfully, 404 Not Found if user doesn't exist
     * @apiNote DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.getUserById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update user status only
     *
     * @param id The user ID
     * @param statusUpdate Object containing the new status
     * @return Updated user if found, 404 Not Found otherwise
     * @apiNote PATCH /api/users/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<User> updateUserStatus(@PathVariable Long id, @RequestBody StatusUpdate statusUpdate) {
        Optional<User> userOptional = userService.getUserById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOptional.get();
        user.setStatus(statusUpdate.getStatus());
        return ResponseEntity.ok(userService.saveUser(user));
    }

    /**
     * Update user role only
     *
     * @param id The user ID
     * @param roleUpdate Object containing the new role
     * @return Updated user if found, 404 Not Found otherwise
     * @apiNote PATCH /api/users/{id}/role
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody RoleUpdate roleUpdate) {
        Optional<User> userOptional = userService.getUserById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOptional.get();
        user.setRole(roleUpdate.getRole());
        return ResponseEntity.ok(userService.saveUser(user));
    }

    /**
     * Authenticate a user and get their ID
     *
     * Validates the provided username and password.
     * Returns the user's ID if credentials are valid, null otherwise.
     *
     * @param credentials Object containing username and password
     * @return User ID if authentication successful, null otherwise
     * @apiNote POST /api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<Long> loginUser(@RequestBody LoginRequest credentials) {
        Long userId = userService.authenticateUser(
            credentials.getUsername(),
            credentials.getPassword()
        );

        if (userId != null) {
            return ResponseEntity.ok(userId);
        } else {
            return ResponseEntity.ok(null);
        }
    }

    /**
     * Inner class for user creation request payload
     */
    public static class UserCreateRequest {
        private String username;
        private String password;
        private String role;
        private String status;

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

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    /**
     * Inner class for status update request payload
     */
    public static class StatusUpdate {
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    /**
     * Inner class for role update request payload
     */
    public static class RoleUpdate {
        private String role;

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    /**
     * Inner class for login request payload
     */
    public static class LoginRequest {
        private String username;
        private String password;

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
    }
}
