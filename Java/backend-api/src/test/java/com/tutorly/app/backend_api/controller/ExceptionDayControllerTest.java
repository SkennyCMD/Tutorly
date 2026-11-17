package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.ExceptionDayCreateDTO;
import com.tutorly.app.backend_api.dto.ExceptionDayReviewDTO;
import com.tutorly.app.backend_api.entity.ExceptionDay;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.ExceptionDayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link ExceptionDayController}: the four GET endpoints,
 * plus createExceptionDay's success/validation-error branches.
 */
@WebMvcTest(ExceptionDayController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class ExceptionDayControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ExceptionDayService exceptionDayService;

    private User tutor() {
        User u = new User("tutor1", "hashedPassword123", "ACTIVE", "GENERIC");
        u.setId(4L);
        return u;
    }

    @Test
    void getAllExceptionDays_returns200WithList() throws Exception {
        when(exceptionDayService.getAllExceptionDays()).thenReturn(List.of(new ExceptionDay()));

        mockMvc.perform(get("/api/exception-days").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void getExceptionDayById_found_returns200() throws Exception {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        exception.setId(7L);
        when(exceptionDayService.getExceptionDayById(7L)).thenReturn(Optional.of(exception));

        mockMvc.perform(get("/api/exception-days/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("absent"))
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.tutorId").value(4));
    }

    @Test
    void getExceptionDayById_notFound_returns404() throws Exception {
        when(exceptionDayService.getExceptionDayById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/exception-days/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void getExceptionDaysByTutor_returns200WithList() throws Exception {
        ExceptionDay exception = new ExceptionDay(
                LocalDate.of(2026, 11, 20), "present", LocalTime.of(14, 0), LocalTime.of(16, 0), tutor());
        when(exceptionDayService.getExceptionDaysByTutor(4L)).thenReturn(List.of(exception));

        mockMvc.perform(get("/api/exception-days/tutor/4").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("present"));
    }

    @Test
    void getExceptionDaysByTutorAndRange_returns200WithList() throws Exception {
        when(exceptionDayService.getExceptionDaysByTutorAndDateRange(
                eq(4L), any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of());

        mockMvc.perform(get("/api/exception-days/tutor/4/range")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .param("start", "2026-11-17")
                        .param("end", "2026-11-23"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(0)));
    }

    @Test
    void createExceptionDay_valid_returns201() throws Exception {
        ExceptionDay saved = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        saved.setId(7L);
        when(exceptionDayService.createExceptionDay(any())).thenReturn(saved);

        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(LocalDate.of(2026, 12, 24), "absent", null, null, 4L);

        mockMvc.perform(post("/api/exception-days")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("pending"));
    }

    @Test
    void createExceptionDay_invalid_returns400() throws Exception {
        when(exceptionDayService.createExceptionDay(any()))
                .thenThrow(new IllegalArgumentException("type must be 'present' or 'absent'"));

        ExceptionDayCreateDTO dto = new ExceptionDayCreateDTO(LocalDate.of(2026, 12, 24), "bogus", null, null, 4L);

        mockMvc.perform(post("/api/exception-days")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void approveExceptionDay_found_returns200() throws Exception {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        exception.setId(7L);
        when(exceptionDayService.getExceptionDayById(7L)).thenReturn(Optional.of(exception));

        ExceptionDay approved = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        approved.setId(7L);
        approved.setStatus("approved");
        when(exceptionDayService.approveExceptionDay(7L, 1L)).thenReturn(approved);

        mockMvc.perform(put("/api/exception-days/7/approve")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExceptionDayReviewDTO(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"));
    }

    @Test
    void approveExceptionDay_notFound_returns404() throws Exception {
        when(exceptionDayService.getExceptionDayById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/exception-days/99/approve")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExceptionDayReviewDTO(1L))))
                .andExpect(status().isNotFound());
    }

    @Test
    void approveExceptionDay_invalidStaff_returns400() throws Exception {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        exception.setId(7L);
        when(exceptionDayService.getExceptionDayById(7L)).thenReturn(Optional.of(exception));
        when(exceptionDayService.approveExceptionDay(7L, 99L))
                .thenThrow(new IllegalArgumentException("Staff member not found with ID: 99"));

        mockMvc.perform(put("/api/exception-days/7/approve")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExceptionDayReviewDTO(99L))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refuseExceptionDay_found_returns200() throws Exception {
        ExceptionDay exception = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        exception.setId(7L);
        when(exceptionDayService.getExceptionDayById(7L)).thenReturn(Optional.of(exception));

        ExceptionDay refused = new ExceptionDay(LocalDate.of(2026, 12, 24), "absent", null, null, tutor());
        refused.setId(7L);
        refused.setStatus("refused");
        when(exceptionDayService.refuseExceptionDay(7L, 1L)).thenReturn(refused);

        mockMvc.perform(put("/api/exception-days/7/refuse")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExceptionDayReviewDTO(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("refused"));
    }

    @Test
    void refuseExceptionDay_notFound_returns404() throws Exception {
        when(exceptionDayService.getExceptionDayById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/exception-days/99/refuse")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExceptionDayReviewDTO(1L))))
                .andExpect(status().isNotFound());
    }
}
