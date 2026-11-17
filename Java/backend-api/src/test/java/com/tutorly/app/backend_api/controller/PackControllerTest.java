package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.PackCreateDTO;
import com.tutorly.app.backend_api.entity.Pack;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.service.PackService;
import com.tutorly.app.backend_api.service.StudentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link PackController}. The interesting bit is
 * {@code getPacksByStudent}'s hand-built response map: {@code unassignedHours}
 * and {@code firstUnassignedLessonStart} only get computed/included when the
 * pack is both open and fully used ({@code isFullAndOpen}) - otherwise
 * {@code unassignedHours} is hardcoded {@code 0.0} and the "start" key is
 * absent entirely, not null.
 */
@WebMvcTest(PackController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class PackControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PackService packService;

    @MockitoBean
    private StudentService studentService;

    private Student student() {
        Student s = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        s.setId(2L);
        return s;
    }

    @Test
    void getPackById_notFound_returns404() throws Exception {
        when(packService.getPackById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/packs/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPacksByStudent_notFullyUsed_omitsFirstUnassignedLessonStart() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        when(packService.getPacksByStudent(2L)).thenReturn(List.of(pack));
        when(packService.getUsedHours(pack)).thenReturn(3.0); // 3 of 10 hours used - not full

        mockMvc.perform(get("/api/packs/student/2").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usedHours").value(3.0))
                .andExpect(jsonPath("$[0].unassignedHours").value(0.0))
                .andExpect(jsonPath("$[0].checked").value("open"))
                .andExpect(jsonPath("$[0].firstUnassignedLessonStart").doesNotExist());

        verify(packService, never()).getHoursOutsidePack(any());
    }

    @Test
    void getPacksByStudent_fullAndOpen_includesUnassignedHoursAndFirstStart() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        LocalDateTime firstUnassigned = LocalDateTime.of(2026, 9, 20, 10, 0);
        when(packService.getPacksByStudent(2L)).thenReturn(List.of(pack));
        when(packService.getUsedHours(pack)).thenReturn(10.0); // fully used
        when(packService.getHoursOutsidePack(pack)).thenReturn(2.0);
        when(packService.getFirstUnassignedLessonStart(pack)).thenReturn(Optional.of(firstUnassigned));

        mockMvc.perform(get("/api/packs/student/2").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].unassignedHours").value(2.0))
                .andExpect(jsonPath("$[0].firstUnassignedLessonStart").exists());
    }

    @Test
    void getPacksByStudent_closedPack_neverComputesUnassignedHoursEvenIfFull() throws Exception {
        Pack closed = new Pack(LocalDateTime.now(), 10.0, LocalDate.now(), student());
        closed.setId(7L);
        when(packService.getPacksByStudent(2L)).thenReturn(List.of(closed));
        when(packService.getUsedHours(closed)).thenReturn(10.0); // fully used, but closed

        mockMvc.perform(get("/api/packs/student/2").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].unassignedHours").value(0.0));

        verify(packService, never()).getHoursOutsidePack(any());
    }

    @Test
    void createPack_studentNotFound_returns400() throws Exception {
        when(studentService.getStudentById(99L)).thenReturn(Optional.empty());

        PackCreateDTO dto = new PackCreateDTO(LocalDateTime.now(), 10.0, null, 99L);

        mockMvc.perform(post("/api/packs")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Student not found with ID: 99"));

        verify(packService, never()).savePack(any());
    }

    @Test
    void createPack_valid_savesAndRetroactivelyAssignsUnassignedLessons() throws Exception {
        when(studentService.getStudentById(2L)).thenReturn(Optional.of(student()));
        when(packService.savePack(any(Pack.class))).thenAnswer(invocation -> {
            Pack p = invocation.getArgument(0);
            p.setId(7L);
            return p;
        });

        PackCreateDTO dto = new PackCreateDTO(LocalDateTime.now(), 10.0, null, 2L);

        mockMvc.perform(post("/api/packs")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7));

        verify(packService).assignUnassignedLessonsSince(any(Pack.class));
    }

    @Test
    void updatePack_packNotFound_returns404() throws Exception {
        when(packService.getPackById(99L)).thenReturn(Optional.empty());

        PackCreateDTO dto = new PackCreateDTO(LocalDateTime.now(), 10.0, null, 2L);

        mockMvc.perform(put("/api/packs/99")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void closePack_notYetClosed_setsClosureToToday() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        pack.setChecked("closed");
        when(packService.getPackById(7L)).thenReturn(Optional.of(pack));
        when(packService.savePack(pack)).thenReturn(pack);

        mockMvc.perform(put("/api/packs/7/close").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closure").value(LocalDate.now().toString()));

        verify(packService).savePack(pack);
    }

    @Test
    void closePack_notCheckedYet_returns409AndDoesNotClose() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        when(packService.getPackById(7L)).thenReturn(Optional.of(pack));

        mockMvc.perform(put("/api/packs/7/close").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isConflict());

        verify(packService, never()).savePack(any());
    }

    @Test
    void closePack_alreadyClosed_isANoOpAndKeepsTheExistingClosureDate() throws Exception {
        LocalDate originalClosure = LocalDate.of(2026, 1, 1);
        Pack pack = new Pack(LocalDateTime.now(), 10.0, originalClosure, student());
        pack.setId(7L);
        when(packService.getPackById(7L)).thenReturn(Optional.of(pack));

        mockMvc.perform(put("/api/packs/7/close").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closure").value("2026-01-01"));

        verify(packService, never()).savePack(any());
    }

    @Test
    void closePack_notFound_returns404() throws Exception {
        when(packService.getPackById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/packs/99/close").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void markPackChecked_notYetChecked_setsCheckedToClosed() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        when(packService.getPackById(7L)).thenReturn(Optional.of(pack));
        when(packService.savePack(pack)).thenReturn(pack);

        mockMvc.perform(put("/api/packs/7/checked").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checked").value("closed"));

        verify(packService).savePack(pack);
    }

    @Test
    void markPackChecked_alreadyChecked_isANoOp() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        pack.setChecked("closed");
        when(packService.getPackById(7L)).thenReturn(Optional.of(pack));

        mockMvc.perform(put("/api/packs/7/checked").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checked").value("closed"));

        verify(packService, never()).savePack(any());
    }

    @Test
    void markPackChecked_notFound_returns404() throws Exception {
        when(packService.getPackById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/packs/99/checked").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletePack_found_returns204() throws Exception {
        Pack pack = new Pack(LocalDateTime.now(), 10.0, null, student());
        pack.setId(7L);
        when(packService.getPackById(7L)).thenReturn(Optional.of(pack));

        mockMvc.perform(delete("/api/packs/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNoContent());
    }

    @Test
    void deletePack_notFound_returns404() throws Exception {
        when(packService.getPackById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/packs/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }
}
