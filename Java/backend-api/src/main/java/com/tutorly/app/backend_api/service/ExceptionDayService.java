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
 * Service layer for ExceptionDay entity: reading, submitting a new request,
 * and STAFF reviewing (approving/refusing) a pending one - see
 * {@link com.tutorly.app.backend_api.controller.ExceptionDayController}.
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

    /**
     * Approves a pending exception day, recording which STAFF member reviewed it.
     *
     * @param id      The exception day ID
     * @param staffId The reviewing STAFF member's ID
     * @return The updated exception (status "approved")
     * @throws IllegalArgumentException if the exception or the staff member doesn't exist
     */
    public ExceptionDay approveExceptionDay(Long id, Long staffId) {
        return reviewExceptionDay(id, staffId, "approved");
    }

    /**
     * Refuses a pending exception day, recording which STAFF member reviewed it.
     *
     * @param id      The exception day ID
     * @param staffId The reviewing STAFF member's ID
     * @return The updated exception (status "refused")
     * @throws IllegalArgumentException if the exception or the staff member doesn't exist
     */
    public ExceptionDay refuseExceptionDay(Long id, Long staffId) {
        return reviewExceptionDay(id, staffId, "refused");
    }

    private ExceptionDay reviewExceptionDay(Long id, Long staffId, String newStatus) {
        ExceptionDay exceptionDay = exceptionDayRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exception day not found with ID: " + id));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found with ID: " + staffId));

        exceptionDay.setStatus(newStatus);
        exceptionDay.setStaff(staff);
        return exceptionDayRepository.save(exceptionDay);
    }
}
