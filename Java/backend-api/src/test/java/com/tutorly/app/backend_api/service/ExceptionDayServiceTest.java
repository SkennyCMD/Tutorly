package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.ExceptionDayCreateDTO;
import com.tutorly.app.backend_api.entity.ExceptionDay;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.ExceptionDayRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
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
 * Unit tests for {@link ExceptionDayService}: the read methods are a thin
 * pass-through to {@link ExceptionDayRepository}; createExceptionDay has real
 * validation logic (type, present/absent time rules, tutor existence) and
 * always persists with the entity's default "pending" status.
 */
@ExtendWith(MockitoExtension.class)
class ExceptionDayServiceTest {

    @Mock
    private ExceptionDayRepository exceptionDayRepository;

    @Mock
    private UserRepository userRepository;

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

    @Test
    void createExceptionDay_validAbsent_savesAndReturnsPending() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(tutor));
        when(exceptionDayRepository.save(any(ExceptionDay.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(LocalDate.of(2026, 12, 24), "absent", null, null, 4L);
        ExceptionDay result = exceptionDayService.createExceptionDay(dto);

        assertThat(result.getType()).isEqualTo("absent");
        assertThat(result.getStatus()).isEqualTo("pending");
        assertThat(result.getTutor()).isEqualTo(tutor);
    }

    @Test
    void createExceptionDay_validPresent_savesWithTimes() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(tutor));
        when(exceptionDayRepository.save(any(ExceptionDay.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(
                LocalDate.of(2026, 12, 24), "present", LocalTime.of(14, 0), LocalTime.of(16, 0), 4L);
        ExceptionDay result = exceptionDayService.createExceptionDay(dto);

        assertThat(result.getStartTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(result.getEndTime()).isEqualTo(LocalTime.of(16, 0));
    }

    @Test
    void createExceptionDay_invalidType_throwsAndDoesNotSave() {
        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(LocalDate.of(2026, 12, 24), "bogus", null, null, 4L);

        assertThatThrownBy(() -> exceptionDayService.createExceptionDay(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }

    @Test
    void createExceptionDay_presentWithoutTimes_throwsAndDoesNotSave() {
        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(LocalDate.of(2026, 12, 24), "present", null, null, 4L);

        assertThatThrownBy(() -> exceptionDayService.createExceptionDay(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }

    @Test
    void createExceptionDay_absentWithTimes_throwsAndDoesNotSave() {
        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(
                LocalDate.of(2026, 12, 24), "absent", LocalTime.of(9, 0), LocalTime.of(10, 0), 4L);

        assertThatThrownBy(() -> exceptionDayService.createExceptionDay(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }

    @Test
    void createExceptionDay_tutorNotFound_throwsAndDoesNotSave() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(LocalDate.of(2026, 12, 24), "absent", null, null, 99L);

        assertThatThrownBy(() -> exceptionDayService.createExceptionDay(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }

    @Test
    void approveExceptionDay_valid_setsStatusAndStaff() {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor);
        exception.setId(7L);
        User staff = new User("staff.one", "hashedPassword123", "ACTIVE", "STAFF");
        staff.setId(1L);
        when(exceptionDayRepository.findById(7L)).thenReturn(Optional.of(exception));
        when(userRepository.findById(1L)).thenReturn(Optional.of(staff));
        when(exceptionDayRepository.save(any(ExceptionDay.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExceptionDay result = exceptionDayService.approveExceptionDay(7L, 1L);

        assertThat(result.getStatus()).isEqualTo("approved");
        assertThat(result.getStaff()).isEqualTo(staff);
    }

    @Test
    void approveExceptionDay_exceptionNotFound_throwsAndDoesNotSave() {
        when(exceptionDayRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exceptionDayService.approveExceptionDay(99L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }

    @Test
    void approveExceptionDay_staffNotFound_throwsAndDoesNotSave() {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor);
        exception.setId(7L);
        when(exceptionDayRepository.findById(7L)).thenReturn(Optional.of(exception));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exceptionDayService.approveExceptionDay(7L, 99L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }

    @Test
    void refuseExceptionDay_valid_setsStatusAndStaff() {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor);
        exception.setId(7L);
        User staff = new User("staff.one", "hashedPassword123", "ACTIVE", "STAFF");
        staff.setId(1L);
        when(exceptionDayRepository.findById(7L)).thenReturn(Optional.of(exception));
        when(userRepository.findById(1L)).thenReturn(Optional.of(staff));
        when(exceptionDayRepository.save(any(ExceptionDay.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExceptionDay result = exceptionDayService.refuseExceptionDay(7L, 1L);

        assertThat(result.getStatus()).isEqualTo("refused");
        assertThat(result.getStaff()).isEqualTo(staff);
    }

    @Test
    void refuseExceptionDay_exceptionNotFound_throwsAndDoesNotSave() {
        when(exceptionDayRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exceptionDayService.refuseExceptionDay(99L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(exceptionDayRepository, never()).save(any());
    }
}
