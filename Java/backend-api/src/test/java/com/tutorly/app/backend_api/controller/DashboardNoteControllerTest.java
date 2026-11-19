package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.DashboardNoteCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.DashboardNote;
import com.tutorly.app.backend_api.service.DashboardNoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link DashboardNoteController}: the two GET endpoints,
 * plus createNote's success/validation-error branches.
 */
@WebMvcTest(DashboardNoteController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class DashboardNoteControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DashboardNoteService dashboardNoteService;

    private Admin admin() {
        Admin a = new Admin("admin@tutorly.test", "hashedPassword123", "admin.one");
        a.setId(1L);
        return a;
    }

    @Test
    void getAllNotes_returns200WithList() throws Exception {
        when(dashboardNoteService.getAllNotes()).thenReturn(List.of(new DashboardNote()));

        mockMvc.perform(get("/api/dashboard-notes").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void getNoteById_found_returns200() throws Exception {
        DashboardNote note = new DashboardNote("## Reminder", LocalDateTime.now(), LocalDateTime.now().plusDays(7), admin());
        note.setId(5L);
        when(dashboardNoteService.getNoteById(5L)).thenReturn(Optional.of(note));

        mockMvc.perform(get("/api/dashboard-notes/5").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminId").value(1));
    }

    @Test
    void getNoteById_notFound_returns404() throws Exception {
        when(dashboardNoteService.getNoteById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/dashboard-notes/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void createNote_valid_returns201() throws Exception {
        DashboardNote saved = new DashboardNote("## Reminder", LocalDateTime.now(), LocalDateTime.now().plusDays(7), admin());
        saved.setId(5L);
        when(dashboardNoteService.createNote(any())).thenReturn(saved);

        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("## Reminder", LocalDateTime.now().plusDays(7), 1L);

        mockMvc.perform(post("/api/dashboard-notes")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    void createNote_invalid_returns400() throws Exception {
        when(dashboardNoteService.createNote(any()))
                .thenThrow(new IllegalArgumentException("content is required"));

        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("   ", LocalDateTime.now().plusDays(7), 1L);

        mockMvc.perform(post("/api/dashboard-notes")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }
}
