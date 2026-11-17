package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.AvailabilityCreateDTO;
import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AvailabilityRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AvailabilityService}: the read methods are a thin
 * pass-through to {@link AvailabilityRepository}; createAvailability has real
 * validation logic (weekDay range, end-after-start, tutor existence).
 */
@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;

    @Mock
    private UserRepository userRepository;

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

    @Test
    void createAvailability_valid_savesAndReturnsSlot() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(tutor));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(9, 0), LocalTime.of(12, 0), 4L);
        Availability result = availabilityService.createAvailability(dto);

        assertThat(result.getWeekDay()).isEqualTo(1);
        assertThat(result.getTutor()).isEqualTo(tutor);
    }

    @Test
    void createAvailability_weekDayOutOfRange_throwsAndDoesNotSave() {
        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(8, LocalTime.of(9, 0), LocalTime.of(12, 0), 4L);

        assertThatThrownBy(() -> availabilityService.createAvailability(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(availabilityRepository, never()).save(any());
    }

    @Test
    void createAvailability_endNotAfterStart_throwsAndDoesNotSave() {
        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(12, 0), LocalTime.of(9, 0), 4L);

        assertThatThrownBy(() -> availabilityService.createAvailability(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(availabilityRepository, never()).save(any());
    }

    @Test
    void createAvailability_tutorNotFound_throwsAndDoesNotSave() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(9, 0), LocalTime.of(12, 0), 99L);

        assertThatThrownBy(() -> availabilityService.createAvailability(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(availabilityRepository, never()).save(any());
    }
}
