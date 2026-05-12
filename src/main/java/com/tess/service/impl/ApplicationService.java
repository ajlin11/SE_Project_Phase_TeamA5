package com.tess.service.impl;

import com.tess.dto.request.ApplicationRequest;
import com.tess.dto.response.ApplicationResponse;
import com.tess.dto.response.InterviewResponse;
import com.tess.entity.*;
import com.tess.enums.ApplicationStatus;
import com.tess.enums.NotificationType;
import com.tess.enums.Role;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.BadRequestException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.ApplicationRepository;
import com.tess.security.UserDetailsImpl;
import com.tess.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StudentService studentService;
    private final JobService jobService;
    private final NotificationService notificationService;
    private final JobMatchingService jobMatchingService;

    @Transactional
    public Application apply(ApplicationRequest request) {
        UserDetailsImpl current = getCurrentUser();
        Student student = studentService.getStudentByUserId(current.getId());
        Job job = jobService.getJobById(request.getJobId());

        if (applicationRepository.existsByStudentIdAndJobId(student.getId(), job.getId())) {
            throw new BadRequestException("You have already applied for this job");
        }

        if (job.getStatus() != com.tess.enums.JobStatus.ACTIVE) {
            throw new BadRequestException("This job is no longer accepting applications");
        }

        // Warn about schedule conflict (do not block but flag)
        java.util.List<Availability> busySlots = new java.util.ArrayList<>();
        // let the matching service use the student's slots from DB internally
        boolean conflict = jobMatchingService.hasScheduleConflict(
                job, busySlots); // already filtered in matching, but double-check here if needed

        Application application = Application.builder()
                .student(student)
                .job(job)
                .status(ApplicationStatus.PENDING)
                .coverLetter(request.getCoverLetter())
                .build();

        application = applicationRepository.save(application);

        // Notify employer
        notificationService.sendNotification(
                job.getEmployer().getUser().getId(),
                NotificationType.APPLICATION_SUBMITTED,
                student.getUser().getFullName() + " applied for: " + job.getTitle(),
                application.getId(),
                "APPLICATION"
        );

        return application;
    }

    @Transactional
    public Application updateStatus(Long applicationId, ApplicationStatus newStatus, String employerNote) {
        Application application = getById(applicationId);
        UserDetailsImpl current = getCurrentUser();

        // Only employer who owns the job can change status
        if (!application.getJob().getEmployer().getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not have permission to update this application");
        }

        ApplicationStatus current_status = application.getStatus();

        // State machine transitions from state diagram
        switch (newStatus) {
            case ACCEPTED -> {
                if (current_status != ApplicationStatus.PENDING) {
                    throw new BadRequestException("Only pending applications can be accepted");
                }
                application.setStatus(ApplicationStatus.ACCEPTED);
                notificationService.sendNotification(
                        application.getStudent().getUser().getId(),
                        NotificationType.APPLICATION_ACCEPTED,
                        "Your application for '" + application.getJob().getTitle() + "' was accepted!",
                        applicationId, "APPLICATION"
                );
            }
            case REJECTED -> {
                if (current_status != ApplicationStatus.PENDING && current_status != ApplicationStatus.ACCEPTED) {
                    throw new BadRequestException("Cannot reject a " + current_status + " application");
                }
                application.setStatus(ApplicationStatus.REJECTED);
                if (employerNote != null) application.setEmployerNote(employerNote);
                notificationService.sendNotification(
                        application.getStudent().getUser().getId(),
                        NotificationType.APPLICATION_REJECTED,
                        "Your application for '" + application.getJob().getTitle() + "' was not successful.",
                        applicationId, "APPLICATION"
                );
            }
            case COMPLETED -> {
                if (current_status != ApplicationStatus.ACCEPTED) {
                    throw new BadRequestException("Only accepted applications can be completed");
                }
                application.setStatus(ApplicationStatus.COMPLETED);
            }
            default -> throw new BadRequestException("Invalid status transition to: " + newStatus);
        }

        return applicationRepository.save(application);
    }

    public Application getById(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
    }

    public Page<ApplicationResponse> getMyApplications(Pageable pageable) {
        UserDetailsImpl current = getCurrentUser();
        Student student = studentService.getStudentByUserId(current.getId());
        return applicationRepository.findByStudentId(student.getId(), pageable)
                .map(this::toResponse);
    }

    public Page<ApplicationResponse> getApplicationsForJob(Long jobId, Pageable pageable) {
        UserDetailsImpl current = getCurrentUser();
        Job job = jobService.getJobById(jobId);
        if (!job.getEmployer().getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not own this job posting");
        }
        return applicationRepository.findByJobId(jobId, pageable).map(this::toResponse);
    }

    public Page<ApplicationResponse> getMyEmployerApplications(Pageable pageable) {
        UserDetailsImpl current = getCurrentUser();
        com.tess.entity.Employer employer = null;
        // Resolved via employer service in controller
        return applicationRepository.findByEmployerId(current.getId(), pageable).map(this::toResponse);
    }

    public ApplicationResponse toResponse(Application app) {
        ApplicationResponse r = new ApplicationResponse();
        r.setId(app.getId());
        r.setStatus(app.getStatus());
        r.setCoverLetter(app.getCoverLetter());
        r.setEmployerNote(app.getEmployerNote());
        r.setAppliedAt(app.getAppliedAt());
        r.setUpdatedAt(app.getUpdatedAt());

        r.setJobId(app.getJob().getId());
        r.setJobTitle(app.getJob().getTitle());
        r.setCompanyName(app.getJob().getEmployer().getCompanyName());

        r.setStudentId(app.getStudent().getId());
        r.setStudentFullName(app.getStudent().getUser().getFullName());
        r.setStudentEmail(app.getStudent().getUser().getEmail());
        r.setStudentUniversity(app.getStudent().getUniversity());

        if (app.getInterview() != null) {
            InterviewResponse ir = new InterviewResponse();
            Interview iv = app.getInterview();
            ir.setId(iv.getId());
            ir.setApplicationId(app.getId());
            ir.setMeetingLink(iv.getMeetingLink());
            ir.setRoomId(iv.getRoomId());
            ir.setScheduledAt(iv.getScheduledAt());
            ir.setDurationMinutes(iv.getDurationMinutes());
            ir.setStatus(iv.getStatus());
            ir.setNotes(iv.getNotes());
            ir.setCreatedAt(iv.getCreatedAt());
            r.setInterview(ir);
        }

        return r;
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
