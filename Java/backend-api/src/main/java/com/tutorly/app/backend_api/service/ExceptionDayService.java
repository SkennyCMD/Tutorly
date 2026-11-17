package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.ExceptionDayCreateDTO;
import com.tutorly.app.backend_api.entity.ExceptionDay;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.ExceptionDayRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for ExceptionDay entity. Mostly read-only, plus submitting a
 * new request - see {@link com.tutorly.app.backend_api.controller.ExceptionDayController}.
 * There's no approve/refuse action yet (STAFF reviewing a request), so every
 * exception created here stays "pending" until that's built.
 */
@Service
public class ExceptionDayService {

    @Autowired
    private ExceptionDayRepository exceptionDayRepository;

    @Autowired
    private UserRepository userRepository;

    public List<ExceptionDay> getAllExceptionDays() {
        return exceptionDayRepository.findAll();
    }

    public Optional<ExceptionDay> getExceptionDayById(Long id) {
        return exceptionDayRepository.findById(id);
    }

    public List<ExceptionDay> getExceptionDaysByTutor(Long tutorId) {
        return exceptionDayRepository.findByTutor_Id(tutorId);
    }

    public List<ExceptionDay> getExceptionDaysByTutorAndDateRange(Long tutorId, LocalDate start, LocalDate end) {
        return exceptionDayRepository.findByTutor_IdAndDayBetween(tutorId, start, end);
    }

    /**
     * Creates a new exception day request from a DTO with a plain tutor ID.
     * Always saved with the entity's default "pending" status and no reviewing
     * staff member, regardless of who's calling - there is deliberately no way
     * to create an already-approved/refused exception through this method.
     *
     * @param dto The exception data to create
     * @return The created exception (status "pending")
     * @throws IllegalArgumentException if type/times are invalid or the tutor doesn't exist
     */
    public ExceptionDay createExceptionDay(ExceptionDayCreateDTO dto) {
        if (dto.getDay() == null) {
            throw new IllegalArgumentException("day is required");
        }
        if (!"present".equals(dto.getType()) && !"absent".equals(dto.getType())) {
            throw new IllegalArgumentException("type must be 'present' or 'absent'");
        }

        boolean isPresent = "present".equals(dto.getType());
        if (isPresent && (dto.getStartTime() == null || dto.getEndTime() == null || !dto.getEndTime().isAfter(dto.getStartTime()))) {
            throw new IllegalArgumentException("a 'present' exception requires endTime after startTime");
        }
        if (!isPresent && (dto.getStartTime() != null || dto.getEndTime() != null)) {
            throw new IllegalArgumentException("an 'absent' exception cannot have a startTime/endTime");
        }

        User tutor = userRepository.findById(dto.getTutorId())
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found with ID: " + dto.getTutorId()));

        ExceptionDay exceptionDay = new ExceptionDay(dto.getDay(), dto.getType(), dto.getStartTime(), dto.getEndTime(), tutor);
        return exceptionDayRepository.save(exceptionDay);
    }
}
