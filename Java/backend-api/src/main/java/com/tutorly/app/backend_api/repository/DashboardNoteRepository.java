package com.tutorly.app.backend_api.repository;

import com.tutorly.app.backend_api.entity.DashboardNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for DashboardNote entity. Every admin manages
 * the same shared board, so no per-admin query methods are needed beyond
 * what JpaRepository already provides.
 */
@Repository
public interface DashboardNoteRepository extends JpaRepository<DashboardNote, Long> {
}
