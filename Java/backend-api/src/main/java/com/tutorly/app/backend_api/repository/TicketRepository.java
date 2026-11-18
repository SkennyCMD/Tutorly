package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Ticket entity.
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /**
     * Find every ticket raised by a given user, regardless of status.
     *
     * @param userId The user's ID
     * @return List of tickets raised by that user
     */
    List<Ticket> findByUser_Id(Long userId);
}
