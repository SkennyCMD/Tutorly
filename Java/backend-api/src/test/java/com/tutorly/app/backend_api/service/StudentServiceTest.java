package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.entity.Pack;
import com.tutorly.app.backend_api.entity.Prenotation;
import com.tutorly.app.backend_api.entity.Student;
import com.tutorly.app.backend_api.entity.Test;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.LessonRepository;
import com.tutorly.app.backend_api.repository.PackRepository;
import com.tutorly.app.backend_api.repository.PrenotationRepository;
import com.tutorly.app.backend_api.repository.StudentRepository;
import com.tutorly.app.backend_api.repository.TestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link StudentService}: {@link StudentService#eraseStudent}
 * (the GDPR-style anonymize-in-place erasure, replacing the old hard delete)
 * and {@link StudentService#mergeStudents} (a genuine hard delete for
 * cleaning up duplicate entries - reassigns every lesson/prenotation/test/pack
 * first, then deletes the duplicate outright).
 */
@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private PrenotationRepository prenotationRepository;

    @Mock
    private TestRepository testRepository;

    @Mock
    private PackRepository packRepository;

    @InjectMocks
    private StudentService studentService;

    private Student student;
    private User linkedGuest;

    @BeforeEach
    void setUp() {
        student = new Student("Marco", "Rossi", "3A", "Excellent in mathematics", "ACTIVE");
        student.setId(7L);

        linkedGuest = new User("guest.parent", "hashedPassword123", "ACTIVE", "GUEST");
        linkedGuest.setId(42L);
        student.setUser(linkedGuest);

        // Not every test below reaches a save() call (the merge-validation tests throw
        // before that point) - lenient() so those don't fail strict-stubbing checks.
        lenient().when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @org.junit.jupiter.api.Test
    void eraseStudent_scrubsIdentifyingFields() {
        Student erased = studentService.eraseStudent(student);

        assertThat(erased.getName()).isEqualTo("Erased");
        assertThat(erased.getSurname()).isEqualTo("Student 7");
        assertThat(erased.getDescription()).isNull();
        assertThat(erased.getStatus()).isEqualTo("BLOCKED");
    }

    @org.junit.jupiter.api.Test
    void eraseStudent_stampsAnonymizedAt() {
        LocalDateTime before = LocalDateTime.now();

        Student erased = studentService.eraseStudent(student);

        assertThat(erased.getAnonymizedAt())
                .isNotNull()
                .isAfterOrEqualTo(before);
    }

    @org.junit.jupiter.api.Test
    void eraseStudent_leavesClassUntouched() {
        Student erased = studentService.eraseStudent(student);

        assertThat(erased.getStudentClass()).isEqualTo("3A");
    }

    @org.junit.jupiter.api.Test
    void eraseStudent_leavesLinkedGuestAccountUntouched() {
        // A GUEST can be linked to more than one student, so erasing this student's own
        // data must never sever or scrub the guardian's account
        Student erased = studentService.eraseStudent(student);

        assertThat(erased.getUser()).isSameAs(linkedGuest);
        assertThat(erased.getUserId()).isEqualTo(42L);
    }

    @org.junit.jupiter.api.Test
    void eraseStudent_savesTheEntity() {
        studentService.eraseStudent(student);

        verify(studentRepository).save(student);
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_keepIdEqualsMergeId_throwsAndTouchesNothing() {
        assertThatThrownBy(() -> studentService.mergeStudents(7L, 7L))
                .isInstanceOf(IllegalArgumentException.class);

        verify(lessonRepository, never()).findByStudent_Id(any());
        verify(studentRepository, never()).delete(any());
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_keepNotFound_throwsAndDoesNotDelete() {
        when(studentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.mergeStudents(1L, 2L))
                .isInstanceOf(IllegalArgumentException.class);

        verify(studentRepository, never()).delete(any());
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_mergeNotFound_throwsAndDoesNotDelete() {
        Student keep = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        keep.setId(1L);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(keep));
        when(studentRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.mergeStudents(1L, 2L))
                .isInstanceOf(IllegalArgumentException.class);

        verify(studentRepository, never()).delete(any());
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_reassignsLessonsPrenotationsTestsAndPacks() {
        Student keep = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        keep.setId(1L);
        Student duplicate = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        duplicate.setId(2L);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(keep));
        when(studentRepository.findById(2L)).thenReturn(Optional.of(duplicate));

        Lesson lesson = new Lesson();
        lesson.setStudent(duplicate);
        when(lessonRepository.findByStudent_Id(2L)).thenReturn(List.of(lesson));

        Prenotation prenotation = new Prenotation();
        prenotation.setStudent(duplicate);
        when(prenotationRepository.findByStudent_Id(2L)).thenReturn(List.of(prenotation));

        Test test = new Test();
        test.setStudent(duplicate);
        when(testRepository.findByStudent_Id(2L)).thenReturn(List.of(test));

        Pack pack = new Pack();
        pack.setStudent(duplicate);
        when(packRepository.findByStudent_Id(2L)).thenReturn(List.of(pack));

        studentService.mergeStudents(1L, 2L);

        assertThat(lesson.getStudent()).isSameAs(keep);
        assertThat(prenotation.getStudent()).isSameAs(keep);
        assertThat(test.getStudent()).isSameAs(keep);
        assertThat(pack.getStudent()).isSameAs(keep);
        verify(lessonRepository).saveAll(List.of(lesson));
        verify(prenotationRepository).saveAll(List.of(prenotation));
        verify(testRepository).saveAll(List.of(test));
        verify(packRepository).saveAll(List.of(pack));
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_deletesTheDuplicate() {
        Student keep = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        keep.setId(1L);
        Student duplicate = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        duplicate.setId(2L);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(keep));
        when(studentRepository.findById(2L)).thenReturn(Optional.of(duplicate));
        when(lessonRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(prenotationRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(testRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(packRepository.findByStudent_Id(2L)).thenReturn(List.of());

        Student result = studentService.mergeStudents(1L, 2L);

        assertThat(result).isSameAs(keep);
        verify(studentRepository).delete(duplicate);
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_keepHasNoGuest_carriesOverDuplicatesGuestLink() {
        Student keep = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        keep.setId(1L);
        Student duplicate = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        duplicate.setId(2L);
        duplicate.setUser(linkedGuest);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(keep));
        when(studentRepository.findById(2L)).thenReturn(Optional.of(duplicate));
        when(lessonRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(prenotationRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(testRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(packRepository.findByStudent_Id(2L)).thenReturn(List.of());

        Student result = studentService.mergeStudents(1L, 2L);

        assertThat(result.getUser()).isSameAs(linkedGuest);
    }

    @org.junit.jupiter.api.Test
    void mergeStudents_keepAlreadyHasOwnGuest_doesNotOverwriteIt() {
        User keepsOwnGuest = new User("other.parent", "hashedPassword123", "ACTIVE", "GUEST");
        keepsOwnGuest.setId(99L);
        Student keep = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        keep.setId(1L);
        keep.setUser(keepsOwnGuest);
        Student duplicate = new Student("Marco", "Rossi", "3A", null, "ACTIVE");
        duplicate.setId(2L);
        duplicate.setUser(linkedGuest);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(keep));
        when(studentRepository.findById(2L)).thenReturn(Optional.of(duplicate));
        when(lessonRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(prenotationRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(testRepository.findByStudent_Id(2L)).thenReturn(List.of());
        when(packRepository.findByStudent_Id(2L)).thenReturn(List.of());

        Student result = studentService.mergeStudents(1L, 2L);

        assertThat(result.getUser()).isSameAs(keepsOwnGuest);
    }
}
