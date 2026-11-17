package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.repository.AvailabilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Availability entity - read-only for now, since the
 * Availability page (Node.js frontend) only displays recurring schedules;
 * there's no UI yet for a tutor to manage their own slots.
 */
@Service
public class AvailabilityService {

    @Autowired
    private AvailabilityRepository availabilityRepository;

    public List<Availability> getAllAvailability() {
        return availabilityRepository.findAll();
    }

    public Optional<Availability> getAvailabilityById(Long id) {
        return availabilityRepository.findById(id);
    }

    public List<Availability> getAvailabilityByTutor(Long tutorId) {
        return availabilityRepository.findByTutor_Id(tutorId);
    }
}
