package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.AvailabilityCreateDTO;
import com.tutorly.app.backend_api.entity.Availability;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.AvailabilityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link AvailabilityController}: the three GET endpoints,
 * plus createAvailability's success/validation-error branches.
 */
@WebMvcTest(AvailabilityController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class AvailabilityControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AvailabilityService availabilityService;

    private User tutor() {
        User u = new User("tutor1", "hashedPassword123", "ACTIVE", "GENERIC");
        u.setId(4L);
        return u;
    }

    @Test
    void getAllAvailability_returns200WithList() throws Exception {
        when(availabilityService.getAllAvailability()).thenReturn(List.of(new Availability()));

        mockMvc.perform(get("/api/availability").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void getAvailabilityById_found_returns200() throws Exception {
        Availability slot = new Availability(1, LocalTime.of(9, 0), LocalTime.of(12, 0), tutor());
        slot.setId(7L);
        when(availabilityService.getAvailabilityById(7L)).thenReturn(Optional.of(slot));

        mockMvc.perform(get("/api/availability/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekDay").value(1))
                .andExpect(jsonPath("$.tutorId").value(4));
    }

    @Test
    void getAvailabilityById_notFound_returns404() throws Exception {
        when(availabilityService.getAvailabilityById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/availability/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAvailabilityByTutor_returns200WithList() throws Exception {
        Availability slot = new Availability(3, LocalTime.of(10, 0), LocalTime.of(13, 0), tutor());
        when(availabilityService.getAvailabilityByTutor(4L)).thenReturn(List.of(slot));

        mockMvc.perform(get("/api/availability/tutor/4").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].weekDay").value(3));
    }

    @Test
    void createAvailability_valid_returns201() throws Exception {
        Availability saved = new Availability(1, LocalTime.of(9, 0), LocalTime.of(12, 0), tutor());
        saved.setId(7L);
        when(availabilityService.createAvailability(any())).thenReturn(saved);

        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(9, 0), LocalTime.of(12, 0), 4L);

        mockMvc.perform(post("/api/availability")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void createAvailability_invalid_returns400() throws Exception {
        when(availabilityService.createAvailability(any()))
                .thenThrow(new IllegalArgumentException("endTime must be after startTime"));

        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(12, 0), LocalTime.of(9, 0), 4L);

        mockMvc.perform(post("/api/availability")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAvailability_valid_returns200() throws Exception {
        Availability updated = new Availability(3, LocalTime.of(14, 0), LocalTime.of(16, 0), tutor());
        updated.setId(7L);
        when(availabilityService.updateAvailability(eq(7L), any())).thenReturn(updated);

        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(3, LocalTime.of(14, 0), LocalTime.of(16, 0), 4L);

        mockMvc.perform(put("/api/availability/7")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekDay").value(3));
    }

    @Test
    void updateAvailability_notFound_returns404() throws Exception {
        when(availabilityService.updateAvailability(eq(404L), any()))
                .thenThrow(new IllegalArgumentException("Availability slot not found with ID: 404"));

        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(9, 0), LocalTime.of(12, 0), 4L);

        mockMvc.perform(put("/api/availability/404")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateAvailability_invalidTimes_returns400() throws Exception {
        when(availabilityService.updateAvailability(eq(7L), any()))
                .thenThrow(new IllegalArgumentException("endTime must be after startTime"));

        AvailabilityCreateDTO dto = new AvailabilityCreateDTO(1, LocalTime.of(12, 0), LocalTime.of(9, 0), 4L);

        mockMvc.perform(put("/api/availability/7")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteAvailability_found_returns204() throws Exception {
        Availability slot = new Availability(1, LocalTime.of(9, 0), LocalTime.of(12, 0), tutor());
        slot.setId(7L);
        when(availabilityService.getAvailabilityById(7L)).thenReturn(Optional.of(slot));

        mockMvc.perform(delete("/api/availability/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteAvailability_notFound_returns404() throws Exception {
        when(availabilityService.getAvailabilityById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/availability/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }
}
