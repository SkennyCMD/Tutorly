package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.dto.DashboardNoteCreateDTO;
import com.tutorly.app.backend_api.entity.Admin;
import com.tutorly.app.backend_api.entity.DashboardNote;
import com.tutorly.app.backend_api.entity.User;
import com.tutorly.app.backend_api.repository.AdminRepository;
import com.tutorly.app.backend_api.repository.DashboardNoteRepository;
import com.tutorly.app.backend_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link DashboardNoteService}: the read methods are a thin
 * pass-through to {@link DashboardNoteRepository}; createNote has real
 * validation logic (content, expiration, admin existence).
 */
@ExtendWith(MockitoExtension.class)
class DashboardNoteServiceTest {

    @Mock
    private DashboardNoteRepository dashboardNoteRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DashboardNoteService dashboardNoteService;

    private Admin admin;

    @BeforeEach
    void setUp() {
        admin = new Admin("admin@tutorly.test", "hashedPassword123", "admin.one");
        admin.setId(1L);
    }

    @Test
    void getAllNotes_delegatesToRepository() {
        DashboardNote note = new DashboardNote("## Reminder", LocalDateTime.now(), LocalDateTime.now().plusDays(7), admin);
        when(dashboardNoteRepository.findAll()).thenReturn(List.of(note));

        assertThat(dashboardNoteService.getAllNotes()).containsExactly(note);
    }

    @Test
    void getNoteById_delegatesToRepository() {
        DashboardNote note = new DashboardNote("## Reminder", LocalDateTime.now(), LocalDateTime.now().plusDays(7), admin);
        note.setId(5L);
        when(dashboardNoteRepository.findById(5L)).thenReturn(Optional.of(note));

        assertThat(dashboardNoteService.getNoteById(5L)).contains(note);
    }

    @Test
    void getNotesByUser_delegatesToRepository() {
        DashboardNote note = new DashboardNote("## Reminder", LocalDateTime.now(), LocalDateTime.now().plusDays(7), admin);
        when(dashboardNoteRepository.findByRecipients_Id(10L)).thenReturn(List.of(note));

        assertThat(dashboardNoteService.getNotesByUser(10L)).containsExactly(note);
    }

    @Test
    void createNote_valid_savesWithNowAsCreation() {
        LocalDateTime expiration = LocalDateTime.now().plusDays(7);
        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findByRoleIn(List.of("STAFF", "GENERIC"))).thenReturn(List.of());
        when(dashboardNoteRepository.save(any(DashboardNote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("## This week\n\nReview chapter 3.", expiration, 1L);
        DashboardNote result = dashboardNoteService.createNote(dto);

        assertThat(result.getContent()).isEqualTo("## This week\n\nReview chapter 3.");
        assertThat(result.getExpiration()).isEqualTo(expiration);
        assertThat(result.getAdmin()).isEqualTo(admin);
        assertThat(result.getCreation()).isNotNull();
    }

    @Test
    void createNote_valid_distributesToEveryStaffAndGenericUser() {
        User staff = new User("staff.one", "hashedPassword123", "ACTIVE", "STAFF");
        staff.setId(10L);
        User generic = new User("tutor.one", "hashedPassword123", "ACTIVE", "GENERIC");
        generic.setId(11L);

        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findByRoleIn(List.of("STAFF", "GENERIC"))).thenReturn(List.of(staff, generic));
        when(dashboardNoteRepository.save(any(DashboardNote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("Reminder", LocalDateTime.now().plusDays(7), 1L);
        DashboardNote result = dashboardNoteService.createNote(dto);

        assertThat(result.getRecipients()).containsExactlyInAnyOrder(staff, generic);
    }

    @Test
    void createNote_blankContent_throwsAndDoesNotSave() {
        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("   ", LocalDateTime.now().plusDays(7), 1L);

        assertThatThrownBy(() -> dashboardNoteService.createNote(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(dashboardNoteRepository, never()).save(any());
    }

    @Test
    void createNote_missingExpiration_throwsAndDoesNotSave() {
        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("Reminder", null, 1L);

        assertThatThrownBy(() -> dashboardNoteService.createNote(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(dashboardNoteRepository, never()).save(any());
    }

    @Test
    void createNote_pastExpiration_throwsAndDoesNotSave() {
        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("Reminder", LocalDateTime.now().minusDays(1), 1L);

        assertThatThrownBy(() -> dashboardNoteService.createNote(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(dashboardNoteRepository, never()).save(any());
    }

    @Test
    void createNote_adminNotFound_throwsAndDoesNotSave() {
        when(adminRepository.findById(99L)).thenReturn(Optional.empty());
        DashboardNoteCreateDTO dto = new DashboardNoteCreateDTO("Reminder", LocalDateTime.now().plusDays(7), 99L);

        assertThatThrownBy(() -> dashboardNoteService.createNote(dto))
                .isInstanceOf(IllegalArgumentException.class);
        verify(dashboardNoteRepository, never()).save(any());
    }
}
