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

    /**
     * Find a tutor's recurring availability slots on one specific day of the
     * week (ISO-8601, 1 = Monday ... 7 = Sunday) - used to validate exception
     * day requests against the tutor's regular schedule.
     *
     * @param tutorId The tutor's ID
     * @param weekDay ISO-8601 day of the week (1-7)
     * @return List of availability slots belonging to that tutor on that weekday
     */
    List<Availability> findByTutor_IdAndWeekDay(Long tutorId, Integer weekDay);
}
