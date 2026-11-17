package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.ExceptionDay;
import com.tutorly.app.backend_api.repository.ExceptionDayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for ExceptionDay entity - read-only for now, since there's no
 * UI yet for a tutor to submit, or STAFF to approve/refuse, an exception.
 */
@Service
public class ExceptionDayService {

    @Autowired
    private ExceptionDayRepository exceptionDayRepository;

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
}
