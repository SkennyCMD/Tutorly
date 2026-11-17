package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.ExceptionDay;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.ExceptionDayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ExceptionDayService} - a thin pass-through to
 * {@link ExceptionDayRepository}, so these just verify the delegation.
 */
@ExtendWith(MockitoExtension.class)
class ExceptionDayServiceTest {

    @Mock
    private ExceptionDayRepository exceptionDayRepository;

    @InjectMocks
    private ExceptionDayService exceptionDayService;

    private User tutor;

    @BeforeEach
    void setUp() {
        tutor = new User("tutor.a", "hashedPassword123", "ACTIVE", "GENERIC");
        tutor.setId(4L);
    }

    @Test
    void getAllExceptionDays_delegatesToRepository() {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor);
        when(exceptionDayRepository.findAll()).thenReturn(List.of(exception));

        assertThat(exceptionDayService.getAllExceptionDays()).containsExactly(exception);
    }

    @Test
    void getExceptionDayById_delegatesToRepository() {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor);
        exception.setId(7L);
        when(exceptionDayRepository.findById(7L)).thenReturn(Optional.of(exception));

        assertThat(exceptionDayService.getExceptionDayById(7L)).contains(exception);
    }

    @Test
    void getExceptionDaysByTutor_delegatesToRepository() {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor);
        when(exceptionDayRepository.findByTutor_Id(4L)).thenReturn(List.of(exception));

        assertThat(exceptionDayService.getExceptionDaysByTutor(4L)).containsExactly(exception);
    }

    @Test
    void getExceptionDaysByTutorAndDateRange_delegatesToRepository() {
        LocalDate start = LocalDate.of(2026, 11, 17);
        LocalDate end = LocalDate.of(2026, 11, 23);
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 11, 20), "absent", null, null, tutor);
        when(exceptionDayRepository.findByTutor_IdAndDayBetween(4L, start, end)).thenReturn(List.of(exception));

        assertThat(exceptionDayService.getExceptionDaysByTutorAndDateRange(4L, start, end)).containsExactly(exception);
    }
}
