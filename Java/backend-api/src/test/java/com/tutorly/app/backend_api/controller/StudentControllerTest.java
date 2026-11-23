package com.tutorly.app.backend_api.controller;

import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.service.StudentService;
import com.tutorly.app.backend_api.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link StudentController}: {@code DELETE /api/students/{id}}
 * (erase/anonymize, not hard-delete - covers the idempotency contract: 404 /
 * 409 / 200, decided before {@link StudentService#eraseStudent(Student)} is
 * ever called), {@code PATCH /api/students/{id}/name} (rename, which loads
 * and mutates the managed entity directly rather than accepting a full
 * {@code Student} body - see that endpoint's own Javadoc for why), and
 * {@code POST /api/students/{id}/merge} (merge a duplicate student in, then
 * hard-delete it - validation only here, the actual merge logic is unit
 * tested directly against {@link StudentService#mergeStudents}).
 */
@WebMvcTest(StudentController.class)
@TestPropertySource(properties = "api.security.keys=test-api-key")
class StudentControllerTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private StudentService studentService;

    @MockitoBean
    private UserService userService;

    @Test
    void eraseStudent_studentDoesNotExist_returns404AndNeverErases() throws Exception {
        when(studentService.getStudentById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/students/99").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());

        verify(studentService, never()).eraseStudent(any(Student.class));
    }

    @Test
    void eraseStudent_alreadyAnonymized_returns409AndDoesNotReScramble() throws Exception {
        Student alreadyErased = new Student("Erased", "Student 7", "3A", null, "BLOCKED");
        alreadyErased.setId(7L);
        alreadyErased.setAnonymizedAt(LocalDateTime.now().minusDays(1));
        when(studentService.getStudentById(7L)).thenReturn(Optional.of(alreadyErased));

        mockMvc.perform(delete("/api/students/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isConflict());

        verify(studentService, never()).eraseStudent(any(Student.class));
    }

    @Test
    void eraseStudent_existsAndNotYetAnonymized_erasesAndReturns200() throws Exception {
        Student student = new Student("Marco", "Rossi", "3A", "Excellent in mathematics", "ACTIVE");
        student.setId(7L);
        User guest = new User("guest.parent", "hashedPassword123", "ACTIVE", "GUEST");
        guest.setId(42L);
        student.setUser(guest);
        when(studentService.getStudentById(7L)).thenReturn(Optional.of(student));

        Student erased = new Student("Erased", "Student 7", "3A", null, "BLOCKED");
        erased.setId(7L);
        erased.setUser(guest);
        erased.setAnonymizedAt(LocalDateTime.now());
        when(studentService.eraseStudent(student)).thenReturn(erased);

        mockMvc.perform(delete("/api/students/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Erased"))
                .andExpect(jsonPath("$.surname").value("Student 7"))
                .andExpect(jsonPath("$.status").value("BLOCKED"))
                .andExpect(jsonPath("$.userId").value(42));

        verify(studentService).eraseStudent(student);
    }

    @Test
    void eraseStudent_missingApiKey_isRejectedBeforeReachingTheController() throws Exception {
        mockMvc.perform(delete("/api/students/7"))
                .andExpect(status().isUnauthorized());

        verify(studentService, never()).getStudentById(any());
    }

    @Test
    void updateStudentName_blankName_returns400AndNeverSaves() throws Exception {
        StudentController.NameUpdateRequest request = new StudentController.NameUpdateRequest();
        request.setName("   ");
        request.setSurname("Rossi");

        mockMvc.perform(patch("/api/students/7/name")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(studentService, never()).saveStudent(any());
    }

    @Test
    void updateStudentName_blankSurname_returns400AndNeverSaves() throws Exception {
        StudentController.NameUpdateRequest request = new StudentController.NameUpdateRequest();
        request.setName("Mario");
        request.setSurname("");

        mockMvc.perform(patch("/api/students/7/name")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(studentService, never()).saveStudent(any());
    }

    @Test
    void updateStudentName_studentDoesNotExist_returns404() throws Exception {
        when(studentService.getStudentById(99L)).thenReturn(Optional.empty());

        StudentController.NameUpdateRequest request = new StudentController.NameUpdateRequest();
        request.setName("Mario");
        request.setSurname("Rossi");

        mockMvc.perform(patch("/api/students/99/name")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateStudentName_alreadyAnonymized_returns409AndDoesNotRename() throws Exception {
        Student erased = new Student("Erased", "Student 7", "3A", null, "BLOCKED");
        erased.setId(7L);
        erased.setAnonymizedAt(LocalDateTime.now().minusDays(1));
        when(studentService.getStudentById(7L)).thenReturn(Optional.of(erased));

        StudentController.NameUpdateRequest request = new StudentController.NameUpdateRequest();
        request.setName("Mario");
        request.setSurname("Rossi");

        mockMvc.perform(patch("/api/students/7/name")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());

        verify(studentService, never()).saveStudent(any());
    }

    @Test
    void updateStudentName_valid_renamesAndPreservesEveryOtherField() throws Exception {
        Student student = new Student("Marco", "Rossi", "3A", "Excellent in mathematics", "ACTIVE");
        student.setId(7L);
        User guest = new User("guest.parent", "hashedPassword123", "ACTIVE", "GUEST");
        guest.setId(42L);
        student.setUser(guest);
        when(studentService.getStudentById(7L)).thenReturn(Optional.of(student));
        when(studentService.saveStudent(student)).thenReturn(student);

        StudentController.NameUpdateRequest request = new StudentController.NameUpdateRequest();
        request.setName("  Luigi  ");
        request.setSurname("  Verdi  ");

        mockMvc.perform(patch("/api/students/7/name")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Luigi"))
                .andExpect(jsonPath("$.surname").value("Verdi"))
                .andExpect(jsonPath("$.studentClass").value("3A"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.userId").value(42));

        verify(studentService).saveStudent(student);
    }

    @Test
    void mergeStudent_missingMergeId_returns400AndNeverMerges() throws Exception {
        StudentController.MergeRequest request = new StudentController.MergeRequest();

        mockMvc.perform(post("/api/students/1/merge")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(studentService, never()).mergeStudents(any(), any());
    }

    @Test
    void mergeStudent_serviceRejects_returns400WithItsMessage() throws Exception {
        when(studentService.mergeStudents(1L, 2L))
                .thenThrow(new IllegalArgumentException("Student not found with ID: 2"));

        StudentController.MergeRequest request = new StudentController.MergeRequest();
        request.setMergeId(2L);

        mockMvc.perform(post("/api/students/1/merge")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$").value("Student not found with ID: 2"));
    }

    @Test
    void mergeStudent_valid_returns200WithTheKeptStudent() throws Exception {
        Student kept = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        kept.setId(1L);
        when(studentService.mergeStudents(1L, 2L)).thenReturn(kept);

        StudentController.MergeRequest request = new StudentController.MergeRequest();
        request.setMergeId(2L);

        mockMvc.perform(post("/api/students/1/merge")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(studentService).mergeStudents(1L, 2L);
    }

    @Test
    void getStudentById_neverSerializesLessonsPrenotationsTestsOrPacks() throws Exception {
        // Regression test for a leak where GET /api/students (and /{id}) sent every
        // student's full nested lesson/prenotation/test/pack history - including
        // actual grades - to any caller. @JsonIgnoreProperties(allowGetters = true)
        // on Student only blocked these fields on deserialization, not serialization.
        Student student = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        student.setId(7L);
        com.tutorly.app.backend_api.entity.Test test = new com.tutorly.app.backend_api.entity.Test();
        test.setMark(9.5);
        test.setSubject("Math");
        student.setTests(java.util.Set.of(test));
        when(studentService.getStudentById(7L)).thenReturn(Optional.of(student));

        mockMvc.perform(get("/api/students/7").header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Marco"))
                .andExpect(jsonPath("$.lessons").doesNotExist())
                .andExpect(jsonPath("$.prenotations").doesNotExist())
                .andExpect(jsonPath("$.tests").doesNotExist())
                .andExpect(jsonPath("$.packs").doesNotExist());
    }
}
