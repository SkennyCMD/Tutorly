package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.dto.LessonCreateDTO;
import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.entity.Pack;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.LessonService;
import com.tutorly.app.backend_api.service.PackService;
import com.tutorly.app.backend_api.service.StudentService;
import com.tutorly.app.backend_api.service.UserService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link LessonController}. Covers the plain CRUD paths plus
 * the two interesting bits of behavior: the paginated-lessons endpoint's
 * hand-built JSON shape, and {@code createLesson}'s pack-auto-assignment
 * branch (delegates to {@link PackService} instead of {@link LessonService}
 * when an active pack with available hours exists).
 */
@WebMvcTest(LessonController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class LessonControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LessonService lessonService;

    @MockitoBean
    private UserService tutorService;

    @MockitoBean
    private StudentService studentService;

    @MockitoBean
    private PackService packService;

    private User tutor() {
        User t = new User("mario.rossi", "hashedPassword123", "ACTIVE", "GENERIC");
        t.setId(1L);
        return t;
    }

    private Student student() {
        Student s = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        s.setId(2L);
        return s;
    }

    @Test
    void getAllLessons_returns200WithList() throws Exception {
        Lesson lesson = new Lesson("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        when(lessonService.getAllLessons()).thenReturn(List.of(lesson));

        mockMvc.perform(get("/api/lessons").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void getLessonById_found_returns200() throws Exception {
        Lesson lesson = new Lesson("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        lesson.setId(10L);
        when(lessonService.getLessonById(10L)).thenReturn(Optional.of(lesson));

        mockMvc.perform(get("/api/lessons/10").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Algebra"));
    }

    @Test
    void getLessonById_notFound_returns404() throws Exception {
        when(lessonService.getLessonById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/lessons/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void getLessonsByTutorPaginated_buildsHandRolledJsonShape() throws Exception {
        Lesson older = new Lesson("Older", LocalDateTime.of(2026, 1, 1, 10, 0), LocalDateTime.of(2026, 1, 1, 11, 0), tutor(), student());
        older.setId(1L);
        Lesson newer = new Lesson("Newer", LocalDateTime.of(2026, 2, 1, 10, 0), LocalDateTime.of(2026, 2, 1, 11, 0), tutor(), student());
        newer.setId(2L);
        // Mutable list required: the controller sorts it in place
        when(lessonService.getLessonsByTutor(1L)).thenReturn(new ArrayList<>(List.of(older, newer)));

        mockMvc.perform(get("/api/lessons/tutor/1/paginated").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.offset").value(0))
                .andExpect(jsonPath("$.lessons", org.hamcrest.Matchers.hasSize(2)))
                // sorted most-recent-first
                .andExpect(jsonPath("$.lessons[0].description").value("Newer"))
                .andExpect(jsonPath("$.lessons[1].description").value("Older"));
    }

    @Test
    void createLesson_noActivePack_savesDirectlyViaLessonService() throws Exception {
        when(tutorService.getUserById(1L)).thenReturn(Optional.of(tutor()));
        when(studentService.getStudentById(2L)).thenReturn(Optional.of(student()));
        when(packService.findActivePackWithAvailableHours(eq(2L), any(LocalDateTime.class))).thenReturn(Optional.empty());

        Lesson saved = new Lesson("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        saved.setId(42L);
        when(lessonService.saveLesson(any(Lesson.class))).thenReturn(saved);

        LessonCreateDTO dto = new LessonCreateDTO("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 1L, 2L);

        mockMvc.perform(post("/api/lessons")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42));

        verify(packService, never()).assignLessonToPack(any(), any());
    }

    @Test
    void createLesson_activePackWithHours_delegatesToPackService() throws Exception {
        when(tutorService.getUserById(1L)).thenReturn(Optional.of(tutor()));
        when(studentService.getStudentById(2L)).thenReturn(Optional.of(student()));

        Pack pack = new Pack(LocalDateTime.now().minusDays(1), 10.0, null, student());
        pack.setId(7L);
        when(packService.findActivePackWithAvailableHours(eq(2L), any(LocalDateTime.class))).thenReturn(Optional.of(pack));

        Lesson saved = new Lesson("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        saved.setId(43L);
        when(packService.assignLessonToPack(eq(pack), any(Lesson.class))).thenReturn(saved);

        LessonCreateDTO dto = new LessonCreateDTO("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 1L, 2L);

        mockMvc.perform(post("/api/lessons")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(43));

        verify(lessonService, never()).saveLesson(any());
    }

    @Test
    void createLesson_tutorNotFound_returns400() throws Exception {
        when(tutorService.getUserById(99L)).thenReturn(Optional.empty());

        LessonCreateDTO dto = new LessonCreateDTO("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 99L, 2L);

        mockMvc.perform(post("/api/lessons")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Tutor not found with ID: 99"));
    }

    @Test
    void createLesson_studentNotFound_returns400() throws Exception {
        when(tutorService.getUserById(1L)).thenReturn(Optional.of(tutor()));
        when(studentService.getStudentById(99L)).thenReturn(Optional.empty());

        LessonCreateDTO dto = new LessonCreateDTO("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 1L, 99L);

        mockMvc.perform(post("/api/lessons")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Student not found with ID: 99"));
    }

    @Test
    void updateLesson_lessonNotFound_returns404() throws Exception {
        when(lessonService.getLessonById(99L)).thenReturn(Optional.empty());

        LessonCreateDTO dto = new LessonCreateDTO("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 1L, 2L);

        mockMvc.perform(put("/api/lessons/99")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateLesson_existsAndValid_returns200() throws Exception {
        Lesson existing = new Lesson("Old desc", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        existing.setId(10L);
        when(lessonService.getLessonById(10L)).thenReturn(Optional.of(existing));
        when(tutorService.getUserById(1L)).thenReturn(Optional.of(tutor()));
        when(studentService.getStudentById(2L)).thenReturn(Optional.of(student()));
        when(packService.findActivePackWithAvailableHours(eq(2L), any(LocalDateTime.class))).thenReturn(Optional.empty());
        when(lessonService.saveLesson(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonCreateDTO dto = new LessonCreateDTO("New desc", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 1L, 2L);

        mockMvc.perform(put("/api/lessons/10")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("New desc"));

        verify(packService, never()).assignLessonToPack(any(), any());
    }

    @Test
    void updateLesson_detachesFromCurrentPackBeforeCheckingAvailableHours() throws Exception {
        Pack oldPack = new Pack(LocalDateTime.now().minusDays(1), 10.0, null, student());
        oldPack.setId(5L);
        Lesson existing = new Lesson("Old desc", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        existing.setId(10L);
        existing.setPack(oldPack);
        when(lessonService.getLessonById(10L)).thenReturn(Optional.of(existing));
        when(tutorService.getUserById(1L)).thenReturn(Optional.of(tutor()));
        when(studentService.getStudentById(2L)).thenReturn(Optional.of(student()));
        when(packService.findActivePackWithAvailableHours(eq(2L), any(LocalDateTime.class))).thenReturn(Optional.empty());
        when(lessonService.saveLesson(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonCreateDTO dto = new LessonCreateDTO("New desc", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 1L, 2L);

        mockMvc.perform(put("/api/lessons/10")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        // The pack-availability check must run against a lesson already detached
        // from its old pack, otherwise the old pack's used-hours would still
        // count this lesson's pre-edit contribution.
        org.mockito.ArgumentCaptor<Lesson> savedCaptor = org.mockito.ArgumentCaptor.forClass(Lesson.class);
        verify(lessonService).saveLesson(savedCaptor.capture());
        org.junit.jupiter.api.Assertions.assertNull(savedCaptor.getValue().getPack());
    }

    @Test
    void updateLesson_activePackWithHours_delegatesToPackServiceWithDetachedLesson() throws Exception {
        Lesson existing = new Lesson("Old desc", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        existing.setId(10L);
        when(lessonService.getLessonById(10L)).thenReturn(Optional.of(existing));
        when(tutorService.getUserById(1L)).thenReturn(Optional.of(tutor()));
        when(studentService.getStudentById(2L)).thenReturn(Optional.of(student()));
        when(lessonService.saveLesson(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Pack pack = new Pack(LocalDateTime.now().minusDays(1), 10.0, null, student());
        pack.setId(7L);
        when(packService.findActivePackWithAvailableHours(eq(2L), any(LocalDateTime.class))).thenReturn(Optional.of(pack));

        Lesson splitResult = new Lesson("New desc", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        splitResult.setId(10L);
        splitResult.setPack(pack);
        when(packService.assignLessonToPack(eq(pack), any(Lesson.class))).thenReturn(splitResult);

        LessonCreateDTO dto = new LessonCreateDTO("New desc", LocalDateTime.now(), LocalDateTime.now().plusHours(3), 1L, 2L);

        mockMvc.perform(put("/api/lessons/10")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packId").value(7));

        verify(packService).assignLessonToPack(eq(pack), any(Lesson.class));
    }

    @Test
    void deleteLesson_notFound_returns404() throws Exception {
        when(lessonService.getLessonById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/lessons/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());

        verify(lessonService, never()).deleteLesson(any());
    }

    @Test
    void deleteLesson_found_returns204() throws Exception {
        Lesson existing = new Lesson("Algebra", LocalDateTime.now(), LocalDateTime.now().plusHours(1), tutor(), student());
        existing.setId(10L);
        when(lessonService.getLessonById(10L)).thenReturn(Optional.of(existing));

        mockMvc.perform(delete("/api/lessons/10").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNoContent());

        verify(lessonService).deleteLesson(10L);
    }
}
