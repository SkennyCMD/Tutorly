package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.DashboardNoteCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.DashboardNote;
import com.tutorly.app.backend_api.repository.AdminRepository;
import com.tutorly.app.backend_api.repository.DashboardNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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

    public List<DashboardNote> getAllNotes() {
        return dashboardNoteRepository.findAll();
    }

    public Optional<DashboardNote> getNoteById(Long id) {
        return dashboardNoteRepository.findById(id);
    }

    /**
     * Publishes a new notice. {@code creation} is always "now", regardless
     * of what's in the request body.
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
        return dashboardNoteRepository.save(note);
    }
}
