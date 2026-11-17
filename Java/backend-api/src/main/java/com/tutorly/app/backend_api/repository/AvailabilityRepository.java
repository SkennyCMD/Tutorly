package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Availability entity.
 */
@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    /**
     * Find all recurring availability slots for a given tutor.
     *
     * @param tutorId The tutor's ID
     * @return List of availability slots belonging to that tutor
     */
    List<Availability> findByTutor_Id(Long tutorId);
}
