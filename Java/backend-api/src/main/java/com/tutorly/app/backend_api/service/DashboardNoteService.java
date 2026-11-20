package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.DashboardNoteCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.DashboardNote;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AdminRepository;
import com.tutorly.app.backend_api.repository.DashboardNoteRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for DashboardNote entity: reading the shared board and
 * publishing a new notice - see
 * {@link com.tutorly.app.backend_api.controller.DashboardNoteController}.
 */
@Service
public class DashboardNoteService {

    @Autowired
    private DashboardNoteRepository dashboardNoteRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UserRepository userRepository;

    public List<DashboardNote> getAllNotes() {
        return dashboardNoteRepository.findAll();
    }

    public Optional<DashboardNote> getNoteById(Long id) {
        return dashboardNoteRepository.findById(id);
    }

    /**
     * Get every note distributed to a specific user - see
     * {@link #createNote} for how {@code see_dashboard_note} gets populated.
     *
     * @param userId The recipient's user ID
     * @return List of notes that user was fanned out to
     */
    public List<DashboardNote> getNotesByUser(Long userId) {
        return dashboardNoteRepository.findByRecipients_Id(userId);
    }

    /**
     * Marks a note as viewed by a user: removes their row from
     * {@code see_dashboard_note}, so it stops showing up in
     * {@link #getNotesByUser}. Idempotent - a no-op if the note doesn't
     * exist or that user was never one of its recipients.
     *
     * @param noteId The note's ID
     * @param userId The user who viewed it
     */
    public void markAsViewed(Long noteId, Long userId) {
        dashboardNoteRepository.findById(noteId).ifPresent(note -> {
            boolean removed = note.getRecipients().removeIf(u -> u.getId().equals(userId));
            if (removed) {
                dashboardNoteRepository.save(note);
            }
        });
    }

    /**
     * Clears every {@code see_dashboard_note} row for a note, e.g. once it's
     * expired and there's no point keeping track of who still has it to
     * view. Idempotent - a no-op if the note doesn't exist or already has no
     * recipients.
     *
     * @param noteId The note's ID
     */
    public void clearRecipients(Long noteId) {
        dashboardNoteRepository.findById(noteId).ifPresent(note -> {
            if (!note.getRecipients().isEmpty()) {
                note.getRecipients().clear();
                dashboardNoteRepository.save(note);
            }
        });
    }

    /**
     * Publishes a new notice. {@code creation} is always "now", regardless
     * of what's in the request body.
     *
     * Also distributes the note to every STAFF and GENERIC user (GUEST
     * accounts are excluded) by populating {@code see_dashboard_note}.
     *
     * @param dto The note data to create
     * @return The created note
     * @throws IllegalArgumentException if content is blank, expiration is missing or already
     *                                   past, or adminId doesn't reference an existing admin
     */
    public DashboardNote createNote(DashboardNoteCreateDTO dto) {
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new IllegalArgumentException("content is required");
        }
        if (dto.getExpiration() == null) {
            throw new IllegalArgumentException("expiration is required");
        }

        LocalDateTime now = LocalDateTime.now();
        if (dto.getExpiration().isBefore(now)) {
            throw new IllegalArgumentException("expiration must be today or in the future");
        }

        Admin admin = adminRepository.findById(dto.getAdminId())
                .orElseThrow(() -> new IllegalArgumentException("Admin not found with ID: " + dto.getAdminId()));

        DashboardNote note = new DashboardNote(dto.getContent(), now, dto.getExpiration(), admin);
        List<User> recipients = userRepository.findByRoleIn(List.of("STAFF", "GENERIC"));
        note.setRecipients(new HashSet<>(recipients));
        return dashboardNoteRepository.save(note);
    }
}
