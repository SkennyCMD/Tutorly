package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.PushSubscription;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.PushSubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for PushSubscription entity business logic
 *
 * Provides business logic and operations for Web Push subscription management.
 * Acts as an intermediary between the controller layer and repository layer.
 */
@Service
public class PushSubscriptionService {

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    /**
     * Find all subscriptions belonging to a specific user
     *
     * @param userId The user ID to search for
     * @return List of subscriptions for the specified user, one per subscribed device
     */
    public List<PushSubscription> getSubscriptionsForUser(Long userId) {
        return pushSubscriptionRepository.findByUser_Id(userId);
    }

    /**
     * Create a new subscription, or update an existing one for the same endpoint.
     *
     * Re-subscribing the same browser (e.g. after the push service rotates keys)
     * sends the same endpoint again - updating that row in place instead of
     * inserting a duplicate keeps one row per physical device subscription.
     *
     * @param endpoint The push service endpoint URL
     * @param p256dh The subscription's public key
     * @param auth The subscription's authentication secret
     * @param userAgent The subscribing browser's User-Agent (optional)
     * @param user The user this subscription belongs to
     * @return The saved subscription entity
     */
    public PushSubscription upsertSubscription(String endpoint, String p256dh, String auth, String userAgent, User user) {
        PushSubscription subscription = pushSubscriptionRepository.findByEndpoint(endpoint)
                .orElseGet(PushSubscription::new);

        subscription.setEndpoint(endpoint);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);
        subscription.setUserAgent(userAgent);
        subscription.setUser(user);

        return pushSubscriptionRepository.save(subscription);
    }

    /**
     * Delete a subscription by its endpoint URL.
     *
     * Used both for explicit unsubscribe requests and to prune subscriptions
     * the push service reports as dead (404/410 on send). A no-op if no
     * subscription exists for that endpoint.
     *
     * @param endpoint The push service endpoint URL
     */
    public void deleteByEndpoint(String endpoint) {
        Optional<PushSubscription> subscription = pushSubscriptionRepository.findByEndpoint(endpoint);
        subscription.ifPresent(sub -> pushSubscriptionRepository.deleteById(sub.getId()));
    }
}
