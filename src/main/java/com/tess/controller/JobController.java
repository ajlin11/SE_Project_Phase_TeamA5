package com.tess.controller;

import com.tess.dto.request.JobRequest;
import com.tess.dto.response.ApiResponse;
import com.tess.dto.response.JobResponse;
import com.tess.entity.Job;
import com.tess.entity.Student;
import com.tess.security.UserDetailsImpl;
import com.tess.service.impl.JobService;
import com.tess.service.impl.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job posting CRUD and matching")
public class JobController {

    private final JobService jobService;
    private final StudentService studentService;

    @GetMapping("/public/active")
    @Operation(summary = "Browse all active jobs (public, no auth needed)")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getActiveJobs(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<JobResponse> jobs = jobService.getAllActiveJobs(pageable)
                .map(j -> jobService.toResponse(j, null));
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/public/search")
    @Operation(summary = "Search active jobs by keyword")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> searchJobs(
            @RequestParam String query,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<JobResponse> jobs = jobService.searchJobs(query, pageable)
                .map(j -> jobService.toResponse(j, null));
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Get job details by ID")
    public ResponseEntity<ApiResponse<JobResponse>> getById(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl current) {
        Job job = jobService.getJobById(jobId);
        Long studentId = null;
        if (current != null && "STUDENT".equals(current.getRole())) {
            studentId = studentService.getStudentByUserId(current.getId()).getId();
        }
        return ResponseEntity.ok(ApiResponse.success(jobService.toResponse(job, studentId)));
    }

    @GetMapping("/matching")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get jobs matching student's schedule and skills")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getMatchingJobs(
            @AuthenticationPrincipal UserDetailsImpl current,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Student student = studentService.getStudentByUserId(current.getId());
        Page<JobResponse> jobs = jobService.getMatchingJobsForStudent(student, pageable)
                .map(j -> jobService.toResponse(j, student.getId()));
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/my-jobs")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Get all jobs posted by the current employer")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getMyJobs(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<JobResponse> jobs = jobService.getMyJobs(pageable)
                .map(j -> jobService.toResponse(j, null));
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Create a new job posting")
    public ResponseEntity<ApiResponse<JobResponse>> createJob(
            @Valid @RequestBody JobRequest request) {
        Job job = jobService.createJob(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(jobService.toResponse(job, null), "Job created"));
    }

    @PutMapping("/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Update a job posting")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable Long jobId,
            @Valid @RequestBody JobRequest request) {
        Job job = jobService.updateJob(jobId, request);
        return ResponseEntity.ok(ApiResponse.success(jobService.toResponse(job, null), "Job updated"));
    }

    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Delete a job posting")
    public ResponseEntity<ApiResponse<Void>> deleteJob(@PathVariable Long jobId) {
        jobService.deleteJob(jobId);
        return ResponseEntity.ok(ApiResponse.success(null, "Job deleted"));
    }

    @PostMapping("/{jobId}/publish")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Publish a draft job (makes it ACTIVE)")
    public ResponseEntity<ApiResponse<JobResponse>> publishJob(@PathVariable Long jobId) {
        Job job = jobService.publishJob(jobId);
        return ResponseEntity.ok(ApiResponse.success(jobService.toResponse(job, null), "Job published"));
    }

    @PostMapping("/{jobId}/close")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Close a job posting")
    public ResponseEntity<ApiResponse<JobResponse>> closeJob(@PathVariable Long jobId) {
        Job job = jobService.closeJob(jobId);
        return ResponseEntity.ok(ApiResponse.success(jobService.toResponse(job, null), "Job closed"));
    }
}
