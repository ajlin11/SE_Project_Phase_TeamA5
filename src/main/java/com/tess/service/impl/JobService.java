package com.tess.service.impl;

import com.tess.dto.request.JobRequest;
import com.tess.dto.response.JobResponse;
import com.tess.entity.Employer;
import com.tess.entity.Job;
import com.tess.entity.Student;
import com.tess.enums.JobStatus;
import com.tess.enums.Role;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.BadRequestException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.ApplicationRepository;
import com.tess.repository.JobRepository;
import com.tess.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final EmployerService employerService;
    private final ApplicationRepository applicationRepository;
    private final JobMatchingService jobMatchingService;

    @Transactional
    public Job createJob(JobRequest request) {
        UserDetailsImpl current = getCurrentUser();
        Employer employer = employerService.getEmployerByUserId(current.getId());

        Job job = Job.builder()
                .employer(employer)
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .hourlyRate(request.getHourlyRate())
                .hoursPerWeek(request.getHoursPerWeek())
                .status(request.getStatus() != null ? request.getStatus() : JobStatus.DRAFT)
                .requiredSkills(request.getRequiredSkills() != null ? request.getRequiredSkills() : List.of())
                .workDays(request.getWorkDays() != null ? request.getWorkDays() : List.of())
                .shiftStartTime(request.getShiftStartTime())
                .shiftEndTime(request.getShiftEndTime())
                .applicationDeadline(request.getApplicationDeadline())
                .maxApplicants(request.getMaxApplicants())
                .build();

        return jobRepository.save(job);
    }

    @Transactional
    public Job updateJob(Long jobId, JobRequest request) {
        Job job = getJobById(jobId);
        assertEmployerOwnsJob(job);

        if (job.getStatus() == JobStatus.EXPIRED) {
            throw new BadRequestException("Cannot update an expired job");
        }

        if (request.getTitle() != null)       job.setTitle(request.getTitle());
        if (request.getDescription() != null) job.setDescription(request.getDescription());
        if (request.getLocation() != null)    job.setLocation(request.getLocation());
        if (request.getHourlyRate() != null)  job.setHourlyRate(request.getHourlyRate());
        if (request.getHoursPerWeek() != null) job.setHoursPerWeek(request.getHoursPerWeek());
        if (request.getStatus() != null)      job.setStatus(request.getStatus());
        if (request.getRequiredSkills() != null) job.setRequiredSkills(request.getRequiredSkills());
        if (request.getWorkDays() != null)    job.setWorkDays(request.getWorkDays());
        if (request.getShiftStartTime() != null) job.setShiftStartTime(request.getShiftStartTime());
        if (request.getShiftEndTime() != null)   job.setShiftEndTime(request.getShiftEndTime());
        if (request.getApplicationDeadline() != null) job.setApplicationDeadline(request.getApplicationDeadline());
        if (request.getMaxApplicants() != null) job.setMaxApplicants(request.getMaxApplicants());

        return jobRepository.save(job);
    }

    @Transactional
    public void deleteJob(Long jobId) {
        Job job = getJobById(jobId);
        assertEmployerOwnsJob(job);
        jobRepository.delete(job);
    }

    @Transactional
    public Job publishJob(Long jobId) {
        Job job = getJobById(jobId);
        assertEmployerOwnsJob(job);
        if (job.getStatus() != JobStatus.DRAFT && job.getStatus() != JobStatus.CLOSED) {
            throw new BadRequestException("Only draft or closed jobs can be published");
        }
        job.setStatus(JobStatus.ACTIVE);
        return jobRepository.save(job);
    }

    @Transactional
    public Job closeJob(Long jobId) {
        Job job = getJobById(jobId);
        assertEmployerOwnsJob(job);
        job.setStatus(JobStatus.CLOSED);
        return jobRepository.save(job);
    }

    public Job getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
    }

    public Page<Job> getAllActiveJobs(Pageable pageable) {
        return jobRepository.findByStatus(JobStatus.ACTIVE, pageable);
    }

    public Page<Job> searchJobs(String query, Pageable pageable) {
        return jobRepository.searchActiveJobs(query, pageable);
    }

    public Page<Job> getJobsByEmployer(Long employerId, Pageable pageable) {
        return jobRepository.findByEmployerId(employerId, pageable);
    }

    public Page<Job> getMyJobs(Pageable pageable) {
        UserDetailsImpl current = getCurrentUser();
        Employer employer = employerService.getEmployerByUserId(current.getId());
        return jobRepository.findByEmployerId(employer.getId(), pageable);
    }

    public Page<Job> getMatchingJobsForStudent(Student student, Pageable pageable) {
        return jobMatchingService.getMatchingJobsForStudent(student, pageable);
    }

    public JobResponse toResponse(Job job, Long currentStudentId) {
        JobResponse response = new JobResponse();
        response.setId(job.getId());
        response.setTitle(job.getTitle());
        response.setDescription(job.getDescription());
        response.setLocation(job.getLocation());
        response.setHourlyRate(job.getHourlyRate());
        response.setHoursPerWeek(job.getHoursPerWeek());
        response.setStatus(job.getStatus());
        response.setRequiredSkills(job.getRequiredSkills());
        response.setWorkDays(job.getWorkDays());
        response.setShiftStartTime(job.getShiftStartTime());
        response.setShiftEndTime(job.getShiftEndTime());
        response.setApplicationDeadline(job.getApplicationDeadline());
        response.setMaxApplicants(job.getMaxApplicants());
        response.setCreatedAt(job.getCreatedAt());
        response.setUpdatedAt(job.getUpdatedAt());
        response.setEmployerId(job.getEmployer().getId());
        response.setCompanyName(job.getEmployer().getCompanyName());
        response.setIndustry(job.getEmployer().getIndustry());
        response.setApplicationCount(applicationRepository.countByJobId(job.getId()));
        if (currentStudentId != null) {
            response.setAlreadyApplied(
                    applicationRepository.existsByStudentIdAndJobId(currentStudentId, job.getId()));
        }
        return response;
    }

    // Auto-expire jobs past their deadline every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void expireDeadlinedJobs() {
        List<Job> activeJobs = jobRepository.findByStatus(JobStatus.ACTIVE, Pageable.unpaged()).getContent();
        activeJobs.stream()
                .filter(j -> j.getApplicationDeadline() != null &&
                             j.getApplicationDeadline().isBefore(LocalDateTime.now()))
                .forEach(j -> {
                    j.setStatus(JobStatus.EXPIRED);
                    jobRepository.save(j);
                });
    }

    private void assertEmployerOwnsJob(Job job) {
        UserDetailsImpl current = getCurrentUser();
        if (!job.getEmployer().getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not own this job posting");
        }
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
