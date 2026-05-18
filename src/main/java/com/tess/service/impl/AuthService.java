package com.tess.service.impl;

import com.tess.dto.request.LoginRequest;
import com.tess.dto.request.RegisterRequest;
import com.tess.dto.response.AuthResponse;
import com.tess.entity.Employer;
import com.tess.entity.Student;
import com.tess.entity.User;
import com.tess.enums.Role;
import com.tess.exception.BadRequestException;
import com.tess.repository.EmployerRepository;
import com.tess.repository.StudentRepository;
import com.tess.repository.UserRepository;
import com.tess.security.JwtUtils;
import com.tess.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final EmployerRepository employerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use: " + request.getEmail());
        }

        // Validate student institutional email
        if (request.getRole() == Role.STUDENT) {
            validateStudentRegistration(request);
        }

        if (request.getRole() == Role.EMPLOYER) {
            validateEmployerRegistration(request);
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phone(request.getPhone())
                .active(true)
                .build();

        user = userRepository.save(user);

        Long profileId = null;

        if (request.getRole() == Role.STUDENT) {
            Student student = Student.builder()
                    .user(user)
                    .age(request.getAge())
                    .university(request.getUniversity())
                    .faculty(request.getFaculty())
                    .major(request.getMajor())
                    .yearOfStudy(request.getYearOfStudy())
                    .activeStudent(request.getActiveStudent() != null ? request.getActiveStudent() : true)
                    .build();
            student = studentRepository.save(student);
            profileId = student.getId();
        } else if (request.getRole() == Role.EMPLOYER) {
            Employer employer = Employer.builder()
                    .user(user)
                    .companyName(request.getCompanyName())
                    .industry(request.getIndustry())
                    .website(request.getWebsite())
                    .address(request.getAddress())
                    .city(request.getCity())
                    .build();
            employer = employerRepository.save(employer);
            profileId = employer.getId();
        }

        String accessToken = jwtUtils.generateTokenFromEmail(user.getEmail(), user.getId(), user.getRole().name());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getId(), user.getRole().name());

        return buildAuthResponse(user, accessToken, refreshToken, profileId);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String accessToken = jwtUtils.generateToken(authentication);
        String refreshToken = jwtUtils.generateRefreshToken(
                userDetails.getEmail(), userDetails.getId(), userDetails.getRole());

        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        Long profileId = null;
        if (user.getRole() == Role.STUDENT) {
            profileId = studentRepository.findByUserId(user.getId())
                    .map(Student::getId).orElse(null);
        } else if (user.getRole() == Role.EMPLOYER) {
            profileId = employerRepository.findByUserId(user.getId())
                    .map(Employer::getId).orElse(null);
        }

        return buildAuthResponse(user, accessToken, refreshToken, profileId);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtils.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        String email = jwtUtils.getEmailFromToken(refreshToken);
        Long userId = jwtUtils.getUserIdFromToken(refreshToken);
        String role = jwtUtils.getRoleFromToken(refreshToken);

        String newAccessToken = jwtUtils.generateTokenFromEmail(email, userId, role);
        String newRefreshToken = jwtUtils.generateRefreshToken(email, userId, role);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Long profileId = null;
        if (user.getRole() == Role.STUDENT) {
            profileId = studentRepository.findByUserId(user.getId()).map(Student::getId).orElse(null);
        } else if (user.getRole() == Role.EMPLOYER) {
            profileId = employerRepository.findByUserId(user.getId()).map(Employer::getId).orElse(null);
        }

        return buildAuthResponse(user, newAccessToken, newRefreshToken, profileId);
    }

    private void validateStudentRegistration(RegisterRequest request) {
        if (request.getAge() == null || request.getAge() < 16 || request.getAge() > 30) {
            throw new BadRequestException("Student age must be between 16 and 30");
        }
        if (request.getUniversity() == null || request.getUniversity().isBlank()) {
            throw new BadRequestException("University is required for student registration");
        }
        if (Boolean.FALSE.equals(request.getActiveStudent())) {
            throw new BadRequestException("You must be an active student to register");
        }
        // Validate student institutional email
        String email = request.getEmail().toLowerCase();
        if (!email.contains(".edu") && !email.contains(".info")) {
            throw new BadRequestException(
                    "Students must register with an institutional email address (.edu or .info)"
            );
        }
    }

    private void validateEmployerRegistration(RegisterRequest request) {
        if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
            throw new BadRequestException("Company name is required for employer registration");
        }
    }

    private AuthResponse buildAuthResponse(User user, String accessToken,
                                            String refreshToken, Long profileId) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .profileId(profileId)
                .build();
    }
}
