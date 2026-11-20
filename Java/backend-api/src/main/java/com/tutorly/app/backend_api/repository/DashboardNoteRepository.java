package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.DashboardNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for DashboardNote entity. Every admin manages
 * the same shared board, so no per-admin query methods are needed beyond
 * what JpaRepository already provides.
 */
@Repository
public interface DashboardNoteRepository extends JpaRepository<DashboardNote, Long> {

    /**
     * Find every note distributed to a specific user (see_dashboard_note).
     *
     * @param userId The recipient's user ID
     * @return List of notes that user was fanned out to at publication time
     */
    List<DashboardNote> findByRecipients_Id(Long userId);
}
