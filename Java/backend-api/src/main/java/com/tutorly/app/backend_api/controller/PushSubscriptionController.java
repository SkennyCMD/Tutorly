package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.PushSubscriptionCreateDTO;
import com.tutorly.app.backend_api.entity.PushSubscription;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.PushSubscriptionService;
import com.tutorly.app.backend_api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for PushSubscription entity operations
 *
 * Manages Web Push subscriptions (endpoint + keys per device) in the system.
 * All endpoints require API key authentication.
 *
 * Base URL: /api/push-subscriptions
 */
@RestController
@RequestMapping("/api/push-subscriptions")
@CrossOrigin(origins = "*")
@Slf4j
public class PushSubscriptionController {

    @Autowired
    private PushSubscriptionService pushSubscriptionService;

    @Autowired
    private UserService userService;

    /**
     * Get all subscriptions for a specific user
     *
     * @param userId The user ID
     * @return List of subscriptions belonging to the specified user
     * @apiNote GET /api/push-subscriptions/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PushSubscription>> getSubscriptionsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(pushSubscriptionService.getSubscriptionsForUser(userId));
    }

    /**
     * Create or update a subscription
     *
     * Accepts a flat-ID DTO (userId) rather than the raw entity, looking up
     * the referenced User before saving - mirrors PackController's createPack.
     * Upserts by endpoint: re-subscribing the same browser updates its
     * existing row instead of creating a duplicate.
     *
     * @param dto The subscription data to create/update
     * @return Saved subscription with 201 Created status, or 400 if user not found
     * @apiNote POST /api/push-subscriptions
     */
    @PostMapping
    public ResponseEntity<?> upsertSubscription(@RequestBody PushSubscriptionCreateDTO dto) {
        try {
            log.info("Upserting push subscription for user {}", dto.getUserId());
            Optional<User> userOpt = userService.getUserById(dto.getUserId());

            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", dto.getUserId());
                return ResponseEntity.badRequest().body("User not found with ID: " + dto.getUserId());
            }

            PushSubscription saved = pushSubscriptionService.upsertSubscription(
                    dto.getEndpoint(), dto.getP256dh(), dto.getAuth(), dto.getUserAgent(), userOpt.get());

            log.info("Successfully saved push subscription with ID {}", saved.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            log.error("Error saving push subscription: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error saving push subscription: " + e.getMessage());
        }
    }

    /**
     * Delete a subscription by its endpoint URL
     *
     * @param endpoint The push service endpoint URL (query parameter, since it
     *                  may contain characters unsuited to a path segment)
     * @return 204 No Content (idempotent - also returned if no matching subscription existed)
     * @apiNote DELETE /api/push-subscriptions/by-endpoint?endpoint=...
     */
    @DeleteMapping("/by-endpoint")
    public ResponseEntity<Void> deleteByEndpoint(@RequestParam String endpoint) {
        pushSubscriptionService.deleteByEndpoint(endpoint);
        return ResponseEntity.noContent().build();
    }
}
