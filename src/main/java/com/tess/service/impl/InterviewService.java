package com.tess.service.impl;

import com.tess.dto.request.InterviewRequest;
import com.tess.dto.response.InterviewResponse;
import com.tess.entity.Application;
import com.tess.entity.Interview;
import com.tess.enums.ApplicationStatus;
import com.tess.enums.InterviewStatus;
import com.tess.enums.NotificationType;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.BadRequestException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.InterviewRepository;
import com.tess.security.UserDetailsImpl;
import com.tess.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationService applicationService;
    private final NotificationService notificationService;

    @Transactional
    public Interview scheduleInterview(InterviewRequest request) {
        UserDetailsImpl current = getCurrentUser();
        Application application = applicationService.getById(request.getApplicationId());

        // Only the employer who owns the job can schedule
        if (!application.getJob().getEmployer().getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not have permission to schedule this interview");
        }

        if (application.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new BadRequestException("Application must be accepted before scheduling an interview");
        }

        if (interviewRepository.findByApplicationId(application.getId()).isPresent()) {
            throw new BadRequestException("An interview is already scheduled for this application");
        }

        String roomId = UUID.randomUUID().toString();
        String meetingLink = buildMeetingLink(roomId);

        Interview interview = Interview.builder()
                .application(application)
                .roomId(roomId)
                .meetingLink(meetingLink)
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 30)
                .status(InterviewStatus.SCHEDULED)
                .notes(request.getNotes())
                .build();

        interview = interviewRepository.save(interview);

        // Notify student
        notificationService.sendNotification(
                application.getStudent().getUser().getId(),
                NotificationType.INTERVIEW_SCHEDULED,
                "Interview scheduled for '" + application.getJob().getTitle() +
                "' on " + request.getScheduledAt() + ". Link: " + meetingLink,
                interview.getId(),
                "INTERVIEW"
        );

        log.info("Interview scheduled: room={}, scheduled={}", roomId, request.getScheduledAt());
        return interview;
    }

    @Transactional
    public Interview rescheduleInterview(Long interviewId, InterviewRequest request) {
        Interview interview = getById(interviewId);
        assertEmployerOwns(interview);

        if (interview.getStatus() != InterviewStatus.SCHEDULED) {
            throw new BadRequestException("Only scheduled interviews can be rescheduled");
        }

        interview.setScheduledAt(request.getScheduledAt());
        if (request.getDurationMinutes() != null) {
            interview.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getNotes() != null) {
            interview.setNotes(request.getNotes());
        }

        Interview saved = interviewRepository.save(interview);

        notificationService.sendNotification(
                interview.getApplication().getStudent().getUser().getId(),
                NotificationType.INTERVIEW_SCHEDULED,
                "Your interview for '" + interview.getApplication().getJob().getTitle() +
                "' has been rescheduled to " + request.getScheduledAt(),
                interviewId, "INTERVIEW"
        );

        return saved;
    }

    @Transactional
    public Interview cancelInterview(Long interviewId) {
        Interview interview = getById(interviewId);
        assertEmployerOwns(interview);

        if (interview.getStatus() != InterviewStatus.SCHEDULED) {
            throw new BadRequestException("Only scheduled interviews can be cancelled");
        }

        interview.setStatus(InterviewStatus.CANCELLED);
        Interview saved = interviewRepository.save(interview);

        notificationService.sendNotification(
                interview.getApplication().getStudent().getUser().getId(),
                NotificationType.INTERVIEW_CANCELLED,
                "Your interview for '" + interview.getApplication().getJob().getTitle() + "' has been cancelled.",
                interviewId, "INTERVIEW"
        );

        return saved;
    }

    @Transactional
    public Interview startInterview(Long interviewId) {
        Interview interview = getById(interviewId);
        assertParticipant(interview);
        if (interview.getStatus() != InterviewStatus.SCHEDULED) {
            throw new BadRequestException("Interview is not in SCHEDULED state");
        }
        interview.setStatus(InterviewStatus.ONGOING);
        return interviewRepository.save(interview);
    }

    @Transactional
    public Interview completeInterview(Long interviewId) {
        Interview interview = getById(interviewId);
        assertEmployerOwns(interview);
        if (interview.getStatus() != InterviewStatus.ONGOING) {
            throw new BadRequestException("Interview is not ongoing");
        }
        interview.setStatus(InterviewStatus.COMPLETED);
        // Also mark the application as completed
        Application app = interview.getApplication();
        app.setStatus(ApplicationStatus.COMPLETED);
        interviewRepository.save(interview);
        return interview;
    }

    public Interview getById(Long interviewId) {
        return interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview", interviewId));
    }

    public Interview getByRoomId(String roomId) {
        return interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview room not found: " + roomId));
    }

    public Page<InterviewResponse> getMyInterviews(Pageable pageable) {
        UserDetailsImpl current = getCurrentUser();
        String role = current.getRole();
        Page<Interview> interviews;
        if ("STUDENT".equals(role)) {
            // Find student profile by user ID first
            interviews = interviewRepository.findByStudentUserId(current.getId(), pageable);
        } else {
            // Find employer profile by user ID first
            interviews = interviewRepository.findByEmployerUserId(current.getId(), pageable);
        }
        return interviews.map(this::toResponse);
    }

    public InterviewResponse toResponse(Interview iv) {
        InterviewResponse r = new InterviewResponse();
        r.setId(iv.getId());
        r.setApplicationId(iv.getApplication().getId());
        r.setMeetingLink(iv.getMeetingLink());
        r.setRoomId(iv.getRoomId());
        r.setScheduledAt(iv.getScheduledAt());
        r.setDurationMinutes(iv.getDurationMinutes());
        r.setStatus(iv.getStatus());
        r.setNotes(iv.getNotes());
        r.setCreatedAt(iv.getCreatedAt());
        r.setStudentFullName(iv.getApplication().getStudent().getUser().getFullName());
        r.setEmployerCompanyName(iv.getApplication().getJob().getEmployer().getCompanyName());
        r.setJobTitle(iv.getApplication().getJob().getTitle());
        return r;
    }

    private String buildMeetingLink(String roomId) {
        return "http://localhost:3001/interview/room/" + roomId;
    }

    private void assertEmployerOwns(Interview interview) {
        UserDetailsImpl current = getCurrentUser();
        if (!interview.getApplication().getJob().getEmployer().getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not have permission for this interview");
        }
    }

    private void assertParticipant(Interview interview) {
        UserDetailsImpl current = getCurrentUser();
        Long employerUserId = interview.getApplication().getJob().getEmployer().getUser().getId();
        Long studentUserId = interview.getApplication().getStudent().getUser().getId();
        if (!current.getId().equals(employerUserId) && !current.getId().equals(studentUserId)) {
            throw new AccessDeniedException("You are not a participant in this interview");
        }
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
