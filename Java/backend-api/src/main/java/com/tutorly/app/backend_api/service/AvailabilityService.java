package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.AvailabilityCreateDTO;
import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AvailabilityRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Availability entity. Mostly read-only (the Availability
 * page displays recurring schedules), plus creation - STAFF add slots on
 * behalf of a tutor, see {@link com.tutorly.app.backend_api.controller.AvailabilityController}.
 */
@Service
public class AvailabilityService {

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Availability> getAllAvailability() {
        return availabilityRepository.findAll();
    }

    public Optional<Availability> getAvailabilityById(Long id) {
        return availabilityRepository.findById(id);
    }

    public List<Availability> getAvailabilityByTutor(Long tutorId) {
        return availabilityRepository.findByTutor_Id(tutorId);
    }

    /**
     * Creates a new recurring availability slot from a DTO with a plain tutor ID.
     *
     * @param dto The slot data to create
     * @return The created slot
     * @throws IllegalArgumentException if weekDay/times are invalid or the tutor doesn't exist
     */
    public Availability createAvailability(AvailabilityCreateDTO dto) {
        if (dto.getWeekDay() == null || dto.getWeekDay() < 1 || dto.getWeekDay() > 7) {
            throw new IllegalArgumentException("weekDay must be between 1 (Monday) and 7 (Sunday)");
        }
        if (dto.getStartTime() == null || dto.getEndTime() == null || !dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }

        User tutor = userRepository.findById(dto.getTutorId())
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found with ID: " + dto.getTutorId()));

        Availability availability = new Availability(dto.getWeekDay(), dto.getStartTime(), dto.getEndTime(), tutor);
        return availabilityRepository.save(availability);
    }
}
