package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.ExceptionDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Spring Data JPA Repository for ExceptionDay entity.
 */
@Repository
public interface ExceptionDayRepository extends JpaRepository<ExceptionDay, Long> {

    /**
     * Find all exception days requested by a given tutor.
     *
     * @param tutorId The tutor's ID
     * @return List of exception days belonging to that tutor
     */
    List<ExceptionDay> findByTutor_Id(Long tutorId);

    /**
     * Find a tutor's exception days falling within a date range (inclusive),
     * regardless of approval status - callers decide whether to honor pending/
     * refused ones.
     *
     * @param tutorId The tutor's ID
     * @param start   Start of the date range (inclusive)
     * @param end     End of the date range (inclusive)
     * @return List of matching exception days
     */
    List<ExceptionDay> findByTutor_IdAndDayBetween(Long tutorId, LocalDate start, LocalDate end);
}
