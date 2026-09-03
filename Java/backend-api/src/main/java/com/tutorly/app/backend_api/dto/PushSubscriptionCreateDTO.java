package com.tutorly.app.backend_api.dto;

/**
 * Data Transfer Object for creating or updating a Web Push subscription.
 *
 * <p>Accepts a plain user ID for the owning user, instead of a full entity
 * reference, same rationale as {@link PackCreateDTO}. The Node.js frontend
 * builds this from the browser's {@code PushSubscription.toJSON()} plus the
 * logged-in session's user ID.</p>
 *
 * @see com.tutorly.app.backend_api.entity.PushSubscription
 * @see com.tutorly.app.backend_api.controller.PushSubscriptionController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class PushSubscriptionCreateDTO {

    /**
     * The push service endpoint URL this subscription delivers to.
     */
    private String endpoint;

    /**
     * The subscription's public key (P-256 ECDH).
     */
    private String p256dh;

    /**
     * The subscription's authentication secret.
     */
    private String auth;

    /**
     * The subscribing browser's User-Agent string. Optional.
     */
    private String userAgent;

    /**
     * ID of the user this subscription belongs to.
     */
    private Long userId;


    // Constructors


    /**
     * Default no-argument constructor.
     * Required for JSON deserialization by Jackson and other serialization frameworks.
     */
    public PushSubscriptionCreateDTO() {
    }


    // Getters and Setters


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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
