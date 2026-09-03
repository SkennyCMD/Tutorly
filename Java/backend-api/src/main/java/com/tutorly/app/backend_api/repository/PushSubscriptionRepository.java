package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for PushSubscription entity
 *
 * Provides CRUD operations for Web Push subscriptions.
 * Inherits standard repository methods from JpaRepository (save, findById, findAll, delete, etc.).
 */
@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    /**
     * Find all subscriptions belonging to a specific user (one per subscribed device)
     *
     * @param userId The user ID to search for
     * @return List of subscriptions belonging to the specified user
     */
    List<PushSubscription> findByUser_Id(Long userId);

    /**
     * Find a subscription by its endpoint URL
     *
     * Used both for upsert-by-endpoint on subscribe, and to look up the row to
     * delete for explicit unsubscribe requests or dead-subscription pruning
     * (404/410 on send) - see PushSubscriptionService, which deletes via the
     * standard findByEndpoint + deleteById rather than a custom derived
     * delete method, matching this repository interface's existing
     * query-methods-only style (no @Modifying methods elsewhere in the app).
     *
     * @param endpoint The push service endpoint URL
     * @return Optional containing the subscription if found, empty otherwise
     */
    Optional<PushSubscription> findByEndpoint(String endpoint);
}
