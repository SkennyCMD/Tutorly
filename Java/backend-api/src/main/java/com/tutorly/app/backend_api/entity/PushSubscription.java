package com.tutorly.app.backend_api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a Web Push subscription (endpoint + keys) for one
 * browser/device belonging to a user.
 *
 * <p>A user can have more than one subscription (e.g. phone + laptop) - each
 * row here is one device's subscription, uniquely identified by its
 * {@code endpoint}. Used by the push notification feature to notify a GUEST
 * when a lesson is booked for their linked student, and to notify a tutor
 * when a prenotation or calendar note is assigned to them.</p>
 *
 * <p>Database Mapping:
 * <ul>
 *   <li>Table: push_subscription</li>
 *   <li>Primary Key: id (auto-generated)</li>
 *   <li>Foreign Key: id_user</li>
 * </ul>
 * </p>
 *
 * @see User
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "push_subscription")
public class PushSubscription {

    /**
     * Primary key - Unique identifier for the subscription.
     * Auto-generated using database identity strategy.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The push service URL this subscription delivers to (e.g. an FCM or
     * Mozilla autopush endpoint). Unique - re-subscribing the same browser
     * updates the existing row instead of creating a duplicate.
     */
    @Column(name = "endpoint", nullable = false, unique = true, columnDefinition = "TEXT")
    private String endpoint;

    /**
     * The subscription's public key (P-256 ECDH), used to encrypt push payloads.
     */
    @Column(name = "p256dh", nullable = false)
    private String p256dh;

    /**
     * The subscription's authentication secret, used to encrypt push payloads.
     */
    @Column(name = "auth", nullable = false)
    private String auth;

    /**
     * The subscribing browser's User-Agent string, kept only for debugging
     * which device a subscription belongs to. Optional.
     */
    @Column(name = "user_agent")
    private String userAgent;

    /**
     * Timestamp when this subscription was created.
     *
     * Automatically initialized to the current time when the entity is
     * instantiated, same pattern as {@link Pack#getCreatedAt()}.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * The user this subscription belongs to.
     *
     * Many-to-one relationship with User entity. Required (nullable = false).
     * Uses @JsonBackReference to prevent circular references during JSON
     * serialization - there's no matching @JsonManagedReference collection on
     * User (nothing needs to list a user's subscriptions through User itself,
     * only through PushSubscriptionRepository.findByUser_Id), which is fine:
     * only an unpaired @JsonManagedReference breaks Jackson, not an unpaired
     * @JsonBackReference (same reasoning as Student.user - see Student.java).
     * The user's ID can be accessed directly via the getUserId() helper method.
     */
    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    @JsonBackReference("user-pushSubscriptions")
    private User user;


    // Constructors


    /**
     * Default no-argument constructor.
     * Required by JPA for entity instantiation.
     */
    public PushSubscription() {
    }

    /**
     * Parameterized constructor to create a new subscription with all required fields.
     *
     * @param endpoint The push service endpoint URL
     * @param p256dh The subscription's public key
     * @param auth The subscription's authentication secret
     * @param userAgent The subscribing browser's User-Agent (optional)
     * @param user The user this subscription belongs to
     */
    public PushSubscription(String endpoint, String p256dh, String auth, String userAgent, User user) {
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
        this.userAgent = userAgent;
        this.user = user;
    }


    // Getters and Setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public void setP256dh(String p256dh) {
        this.p256dh = p256dh;
    }

    public String getAuth() {
        return auth;
    }

    public void setAuth(String auth) {
        this.auth = auth;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }


    // JSON Serialization Helper Methods


    /**
     * Gets the user ID for JSON serialization.
     *
     * @return The user's ID, or null if user is not set
     */
    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
}
