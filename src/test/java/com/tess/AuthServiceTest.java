package com.tess;

import com.tess.dto.request.RegisterRequest;
import com.tess.entity.Employer;
import com.tess.entity.Student;
import com.tess.entity.User;
import com.tess.enums.Role;
import com.tess.exception.BadRequestException;
import com.tess.repository.EmployerRepository;
import com.tess.repository.StudentRepository;
import com.tess.repository.UserRepository;
import com.tess.security.JwtUtils;
import com.tess.service.impl.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Registration Tests")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validStudentRequest;
    private RegisterRequest validEmployerRequest;

    @BeforeEach
    void setUp() {
        // Valid student registration request
        validStudentRequest = new RegisterRequest();
        validStudentRequest.setFirstName("Edisa");
        validStudentRequest.setLastName("Ajdinolli");
        validStudentRequest.setEmail("eajdinolli23@epoka.edu.al");
        validStudentRequest.setPassword("password123");
        validStudentRequest.setRole(Role.STUDENT);
        validStudentRequest.setAge(20);
        validStudentRequest.setUniversity("Epoka University");
        validStudentRequest.setActiveStudent(true);

        // Valid employer registration request
        validEmployerRequest = new RegisterRequest();
        validEmployerRequest.setFirstName("Dea");
        validEmployerRequest.setLastName("Laci");
        validEmployerRequest.setEmail("dealaci23@epoka.edu.al");
        validEmployerRequest.setPassword("password123");
        validEmployerRequest.setRole(Role.EMPLOYER);
        validEmployerRequest.setCompanyName("TechCorp");

        // Lenient mocks — not all tests use all of these
        lenient().when(userRepository.existsByEmail(anyString())).thenReturn(false);
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");
        lenient().when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(1L);
            return u;
        });
        lenient().when(studentRepository.save(any(Student.class))).thenAnswer(i -> {
            Student s = i.getArgument(0);
            s.setId(1L);
            return s;
        });
        lenient().when(employerRepository.save(any(Employer.class))).thenAnswer(i -> {
            Employer e = i.getArgument(0);
            e.setId(1L);
            return e;
        });
        lenient().when(jwtUtils.generateTokenFromEmail(anyString(), any(), anyString()))
                .thenReturn("access-token");
        lenient().when(jwtUtils.generateRefreshToken(anyString(), any(), anyString()))
                .thenReturn("refresh-token");
    }

    // ─────────────────────────────────────────────────────────────
    // TC01 - Valid student registration succeeds
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC01 - Valid student registration completes successfully")
    void tc01_validStudentRegistration() {
        assertThatCode(() -> authService.register(validStudentRequest))
                .doesNotThrowAnyException();
    }

    // ─────────────────────────────────────────────────────────────
    // TC02 - Duplicate email rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC02 - Registration fails when email already exists")
    void tc02_duplicateEmailRejected() {
        when(userRepository.existsByEmail("eajdinolli23@epoka.edu.al")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validStudentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email is already in use");
    }

    // ─────────────────────────────────────────────────────────────
    // TC03 - Student age too young (below 16) rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC03 - Registration fails when student age is below 16")
    void tc03_ageTooYoungRejected() {
        validStudentRequest.setAge(14);

        assertThatThrownBy(() -> authService.register(validStudentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("age must be between 16 and 35");
    }

    // ─────────────────────────────────────────────────────────────
    // TC04 - Student age too old (above 35) rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC04 - Registration fails when student age is above 35")
    void tc04_ageTooOldRejected() {
        validStudentRequest.setAge(40);

        assertThatThrownBy(() -> authService.register(validStudentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("age must be between 16 and 35");
    }

    // ─────────────────────────────────────────────────────────────
    // TC05 - Boundary age 16 accepted
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC05 - Registration succeeds with minimum age of 16")
    void tc05_minimumAgeAccepted() {
        validStudentRequest.setAge(16);

        assertThatCode(() -> authService.register(validStudentRequest))
                .doesNotThrowAnyException();
    }

    // ─────────────────────────────────────────────────────────────
    // TC06 - Boundary age 35 accepted
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC06 - Registration succeeds with maximum age of 35")
    void tc06_maximumAgeAccepted() {
        validStudentRequest.setAge(35);

        assertThatCode(() -> authService.register(validStudentRequest))
                .doesNotThrowAnyException();
    }

    // ─────────────────────────────────────────────────────────────
    // TC07 - Missing university rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC07 - Registration fails when university is missing")
    void tc07_missingUniversityRejected() {
        validStudentRequest.setUniversity(null);

        assertThatThrownBy(() -> authService.register(validStudentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("University is required");
    }

    // ─────────────────────────────────────────────────────────────
    // TC08 - Non-active student rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC08 - Registration fails when student is not active")
    void tc08_nonActiveStudentRejected() {
        validStudentRequest.setActiveStudent(false);

        assertThatThrownBy(() -> authService.register(validStudentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must be an active student");
    }

    // ─────────────────────────────────────────────────────────────
    // TC09 - Valid employer registration succeeds
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC09 - Valid employer registration completes successfully")
    void tc09_validEmployerRegistration() {
        assertThatCode(() -> authService.register(validEmployerRequest))
                .doesNotThrowAnyException();
    }

    // ─────────────────────────────────────────────────────────────
    // TC10 - Employer missing company name rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC10 - Employer registration fails when company name is missing")
    void tc10_missingCompanyNameRejected() {
        validEmployerRequest.setCompanyName(null);

        assertThatThrownBy(() -> authService.register(validEmployerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Company name is required");
    }

    // ─────────────────────────────────────────────────────────────
    // TC11 - Blank company name rejected
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC11 - Employer registration fails when company name is blank")
    void tc11_blankCompanyNameRejected() {
        validEmployerRequest.setCompanyName("   ");

        assertThatThrownBy(() -> authService.register(validEmployerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Company name is required");
    }
}
