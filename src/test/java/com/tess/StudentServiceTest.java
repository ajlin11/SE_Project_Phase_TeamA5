package com.tess;

import com.tess.dto.request.AvailabilityRequest;
import com.tess.entity.Availability;
import com.tess.entity.Student;
import com.tess.entity.User;
import com.tess.enums.AvailabilityDay;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.BadRequestException;
import com.tess.repository.AvailabilityRepository;
import com.tess.repository.StudentRepository;
import com.tess.repository.UserRepository;
import com.tess.security.UserDetailsImpl;
import com.tess.service.FileStorageService;
import com.tess.service.impl.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudentService Availability Tests")
class StudentServiceTest {

    @Mock private StudentRepository studentRepository;
    @Mock private UserRepository userRepository;
    @Mock private AvailabilityRepository availabilityRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private org.modelmapper.ModelMapper modelMapper;

    @InjectMocks
    private StudentService studentService;

    private Student student;
    private User user;
    private UserDetailsImpl userDetails;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@epoka.edu.al");
        user.setFirstName("Test");
        user.setLastName("Student");

        student = new Student();
        student.setId(1L);
        student.setUser(user);
        student.setUniversity("Epoka University");
        student.setAge(20);
        student.setSkills(new ArrayList<>());
        student.setAvailabilities(new ArrayList<>());
        student.setApplications(new ArrayList<>());

        userDetails = UserDetailsImpl.build(
            com.tess.entity.User.builder()
                .id(1L).email("test@epoka.edu.al")
                .password("pass").role(com.tess.enums.Role.STUDENT)
                .firstName("Test").lastName("Student").active(true).build()
        );

        // Mock SecurityContext
        Authentication auth = mock(Authentication.class);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(userDetails);
        SecurityContextHolder.setContext(ctx);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    }

    // ─────────────────────────────────────────────────────────────
    // TC01 - Valid availability slot saved successfully
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC01 - Valid availability slot is saved successfully")
    void tc01_validAvailabilitySlotSaved() {
        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.MONDAY);
        req.setStartTime(LocalTime.of(9, 0));
        req.setEndTime(LocalTime.of(12, 0));
        req.setBusy(true);
        req.setDescription("Software Engineering");

        when(availabilityRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<Availability> result = studentService.replaceAvailability(1L, List.of(req));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDayOfWeek()).isEqualTo(AvailabilityDay.MONDAY);
        assertThat(result.get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.get(0).getEndTime()).isEqualTo(LocalTime.of(12, 0));
        assertThat(result.get(0).isBusy()).isTrue();
    }

    // ─────────────────────────────────────────────────────────────
    // TC02 - End time before start time rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC02 - Availability rejected when end time is before start time")
    void tc02_endTimeBeforeStartTimeRejected() {
        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.MONDAY);
        req.setStartTime(LocalTime.of(14, 0));
        req.setEndTime(LocalTime.of(10, 0)); // end before start
        req.setBusy(true);

        assertThatThrownBy(() -> studentService.replaceAvailability(1L, List.of(req)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("End time must be after start time");
    }

    // ─────────────────────────────────────────────────────────────
    // TC03 - Equal start and end time rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC03 - Availability rejected when start and end time are equal")
    void tc03_equalStartEndTimeRejected() {
        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.TUESDAY);
        req.setStartTime(LocalTime.of(10, 0));
        req.setEndTime(LocalTime.of(10, 0)); // same time
        req.setBusy(false);

        assertThatThrownBy(() -> studentService.replaceAvailability(1L, List.of(req)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("End time must be after start time");
    }

    // ─────────────────────────────────────────────────────────────
    // TC04 - Multiple slots saved correctly
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC04 - Multiple availability slots saved correctly")
    void tc04_multipleSlotsAllSaved() {
        AvailabilityRequest slot1 = new AvailabilityRequest();
        slot1.setDayOfWeek(AvailabilityDay.MONDAY);
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slot1.setBusy(true);

        AvailabilityRequest slot2 = new AvailabilityRequest();
        slot2.setDayOfWeek(AvailabilityDay.WEDNESDAY);
        slot2.setStartTime(LocalTime.of(14, 0));
        slot2.setEndTime(LocalTime.of(17, 0));
        slot2.setBusy(false);

        AvailabilityRequest slot3 = new AvailabilityRequest();
        slot3.setDayOfWeek(AvailabilityDay.FRIDAY);
        slot3.setStartTime(LocalTime.of(10, 0));
        slot3.setEndTime(LocalTime.of(12, 0));
        slot3.setBusy(true);

        when(availabilityRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<Availability> result = studentService.replaceAvailability(
                1L, List.of(slot1, slot2, slot3));

        assertThat(result).hasSize(3);
    }

    // ─────────────────────────────────────────────────────────────
    // TC05 - Old slots deleted before saving new ones
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC05 - Old availability slots are deleted before saving new ones")
    void tc05_oldSlotsDeletedBeforeNewOnes() {
        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.MONDAY);
        req.setStartTime(LocalTime.of(9, 0));
        req.setEndTime(LocalTime.of(12, 0));
        req.setBusy(true);

        when(availabilityRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        studentService.replaceAvailability(1L, List.of(req));

        // Verify old slots were deleted
        verify(availabilityRepository, times(1)).deleteByStudentId(1L);
    }

    // ─────────────────────────────────────────────────────────────
    // TC06 - Empty schedule clears all slots
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC06 - Saving empty schedule clears all existing slots")
    void tc06_emptyScheduleClearsAllSlots() {
        when(availabilityRepository.saveAll(anyList())).thenReturn(List.of());

        List<Availability> result = studentService.replaceAvailability(1L, List.of());

        assertThat(result).isEmpty();
        verify(availabilityRepository, times(1)).deleteByStudentId(1L);
    }

    // ─────────────────────────────────────────────────────────────
    // TC07 - Ownership check: different user cannot edit
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC07 - Access denied when different user tries to edit schedule")
    void tc07_ownershipCheckFails() {
        // Student belongs to user ID 99, but logged-in user is ID 1
        User differentUser = new User();
        differentUser.setId(99L);
        student.setUser(differentUser);

        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.MONDAY);
        req.setStartTime(LocalTime.of(9, 0));
        req.setEndTime(LocalTime.of(12, 0));
        req.setBusy(true);

        assertThatThrownBy(() -> studentService.replaceAvailability(1L, List.of(req)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("only modify your own profile");
    }

    // ─────────────────────────────────────────────────────────────
    // TC08 - isBusy flag correctly set to true
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC08 - isBusy flag is correctly set to true for class slots")
    void tc08_isBusyFlagSetToTrue() {
        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.THURSDAY);
        req.setStartTime(LocalTime.of(9, 0));
        req.setEndTime(LocalTime.of(11, 0));
        req.setBusy(true);
        req.setDescription("Database Systems");

        when(availabilityRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<Availability> result = studentService.replaceAvailability(1L, List.of(req));

        assertThat(result.get(0).isBusy()).isTrue();
        assertThat(result.get(0).getDescription()).isEqualTo("Database Systems");
    }

    // ─────────────────────────────────────────────────────────────
    // TC09 - isBusy flag correctly set to false for free slots
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC09 - isBusy flag is correctly set to false for free slots")
    void tc09_isBusyFlagSetToFalse() {
        AvailabilityRequest req = new AvailabilityRequest();
        req.setDayOfWeek(AvailabilityDay.FRIDAY);
        req.setStartTime(LocalTime.of(14, 0));
        req.setEndTime(LocalTime.of(18, 0));
        req.setBusy(false);

        when(availabilityRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<Availability> result = studentService.replaceAvailability(1L, List.of(req));

        assertThat(result.get(0).isBusy()).isFalse();
    }
}
