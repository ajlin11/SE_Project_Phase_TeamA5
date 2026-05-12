package com.tess.controller;

import com.tess.dto.request.ApplicationRequest;
import com.tess.dto.response.ApiResponse;
import com.tess.dto.response.ApplicationResponse;
import com.tess.entity.Application;
import com.tess.enums.ApplicationStatus;
import com.tess.service.impl.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Job application lifecycle management")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Submit a job application")
    public ResponseEntity<ApiResponse<ApplicationResponse>> apply(
            @Valid @RequestBody ApplicationRequest request) {
        Application app = applicationService.apply(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(applicationService.toResponse(app), "Application submitted"));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get all my applications (student)")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getMyApplications(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getMyApplications(pageable)));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Get all applications for a job (employer)")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getByJob(
            @PathVariable Long jobId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getApplicationsForJob(jobId, pageable)));
    }

    @GetMapping("/{applicationId}")
    @Operation(summary = "Get a single application by ID")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getById(@PathVariable Long applicationId) {
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.toResponse(applicationService.getById(applicationId))));
    }

    @PatchMapping("/{applicationId}/status")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Accept or reject an application (ACCEPTED | REJECTED)")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateStatus(
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> body) {

        ApplicationStatus status = ApplicationStatus.valueOf(body.get("status").toUpperCase());
        String note = body.get("note");
        Application updated = applicationService.updateStatus(applicationId, status, note);
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.toResponse(updated),
                "Application status updated to " + status));
    }
}
