package com.tess.service.impl;

import com.tess.entity.Job;
import com.tess.entity.User;
import com.tess.enums.JobStatus;
import com.tess.enums.NotificationType;
import com.tess.enums.Role;
import com.tess.exception.BadRequestException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.*;
import com.tess.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final EmployerRepository employerRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final NotificationService notificationService;

    // ---------- User Management ----------

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Page<User> getUsersByRole(Role role, Pageable pageable) {
        return userRepository.findByRole(role, pageable);
    }

    public Page<User> searchUsers(String query, Pageable pageable) {
        return userRepository.searchUsers(query, pageable);
    }

    @Transactional
    public User toggleUserActivation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot deactivate an admin account");
        }

        user.setActive(!user.isActive());
        User saved = userRepository.save(user);

        if (!saved.isActive()) {
            notificationService.sendNotification(
                    saved.getId(),
                    NotificationType.ACCOUNT_DEACTIVATED,
                    "Your account has been deactivated by an administrator. Please contact support.",
                    userId, "USER"
            );
            log.info("Admin deactivated user: {}", userId);
        } else {
            log.info("Admin reactivated user: {}", userId);
        }

        return saved;
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot delete an admin account");
        }
        userRepository.delete(user);
        log.info("Admin deleted user: {}", userId);
    }

    @Transactional
    public User verifyStudent(Long userId) {
        var student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user: " + userId));
        student.setStudentVerified(true);
        return studentRepository.save(student).getUser();
    }

    @Transactional
    public User verifyEmployer(Long userId) {
        var employer = employerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer not found for user: " + userId));
        employer.setVerified(true);
        return employerRepository.save(employer).getUser();
    }

    // ---------- Job Management ----------

    public Page<Job> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable);
    }

    @Transactional
    public void removeJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        job.setStatus(JobStatus.CLOSED);
        jobRepository.save(job);
        log.info("Admin closed job: {}", jobId);
    }

    // ---------- Dashboard Stats ----------

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", userRepository.findByRole(Role.STUDENT, Pageable.unpaged()).getTotalElements());
        stats.put("totalEmployers", userRepository.findByRole(Role.EMPLOYER, Pageable.unpaged()).getTotalElements());
        stats.put("totalJobs", jobRepository.count());
        stats.put("activeJobs", jobRepository.findByStatus(JobStatus.ACTIVE, Pageable.unpaged()).getTotalElements());
        stats.put("totalApplications", applicationRepository.count());
        stats.put("totalInterviews", interviewRepository.count());
        return stats;
    }
}
