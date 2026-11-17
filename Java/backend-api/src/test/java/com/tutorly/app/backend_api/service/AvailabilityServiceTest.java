package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AvailabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AvailabilityService} - a thin pass-through to
 * {@link AvailabilityRepository}, so these just verify the delegation.
 */
@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    private User tutor;

    @BeforeEach
    void setUp() {
        tutor = new User("tutor.a", "hashedPassword123", "ACTIVE", "GENERIC");
        tutor.setId(4L);
    }

    @Test
    void getAllAvailability_delegatesToRepository() {
        Availability slot = new Availability(1, LocalTime.of(9, 0), LocalTime.of(12, 0), tutor);
        when(availabilityRepository.findAll()).thenReturn(List.of(slot));

        assertThat(availabilityService.getAllAvailability()).containsExactly(slot);
    }

    @Test
    void getAvailabilityById_delegatesToRepository() {
        Availability slot = new Availability(1, LocalTime.of(9, 0), LocalTime.of(12, 0), tutor);
        slot.setId(7L);
        when(availabilityRepository.findById(7L)).thenReturn(Optional.of(slot));

        assertThat(availabilityService.getAvailabilityById(7L)).contains(slot);
    }

    @Test
    void getAvailabilityByTutor_delegatesToRepository() {
        Availability slot = new Availability(5, LocalTime.of(13, 0), LocalTime.of(16, 0), tutor);
        when(availabilityRepository.findByTutor_Id(4L)).thenReturn(List.of(slot));

        assertThat(availabilityService.getAvailabilityByTutor(4L)).containsExactly(slot);
    }
}
