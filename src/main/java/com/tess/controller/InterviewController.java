package com.tess.controller;

import com.tess.dto.request.InterviewRequest;
import com.tess.dto.response.ApiResponse;
import com.tess.dto.response.InterviewResponse;
import com.tess.service.impl.InterviewService;
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

@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
@Tag(name = "Interviews", description = "Virtual interview scheduling and management")
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Schedule an interview for an accepted application")
    public ResponseEntity<ApiResponse<InterviewResponse>> schedule(
            @Valid @RequestBody InterviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(interviewService.toResponse(
                        interviewService.scheduleInterview(request)), "Interview scheduled"));
    }

    @PutMapping("/{interviewId}/reschedule")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Reschedule a scheduled interview")
    public ResponseEntity<ApiResponse<InterviewResponse>> reschedule(
            @PathVariable Long interviewId,
            @Valid @RequestBody InterviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                interviewService.toResponse(interviewService.rescheduleInterview(interviewId, request)),
                "Interview rescheduled"));
    }

    @PostMapping("/{interviewId}/cancel")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Cancel a scheduled interview")
    public ResponseEntity<ApiResponse<InterviewResponse>> cancel(@PathVariable Long interviewId) {
        return ResponseEntity.ok(ApiResponse.success(
                interviewService.toResponse(interviewService.cancelInterview(interviewId)),
                "Interview cancelled"));
    }

    @PostMapping("/{interviewId}/start")
    @Operation(summary = "Mark interview as ongoing (called when room is joined)")
    public ResponseEntity<ApiResponse<InterviewResponse>> start(@PathVariable Long interviewId) {
        return ResponseEntity.ok(ApiResponse.success(
                interviewService.toResponse(interviewService.startInterview(interviewId)),
                "Interview started"));
    }

    @PostMapping("/{interviewId}/complete")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Mark interview as completed")
    public ResponseEntity<ApiResponse<InterviewResponse>> complete(@PathVariable Long interviewId) {
        return ResponseEntity.ok(ApiResponse.success(
                interviewService.toResponse(interviewService.completeInterview(interviewId)),
                "Interview completed"));
    }

    @GetMapping("/{interviewId}")
    @Operation(summary = "Get interview details by ID")
    public ResponseEntity<ApiResponse<InterviewResponse>> getById(@PathVariable Long interviewId) {
        return ResponseEntity.ok(ApiResponse.success(
                interviewService.toResponse(interviewService.getById(interviewId))));
    }

    @GetMapping("/room/{roomId}")
    @Operation(summary = "Get interview details by room ID (used when joining)")
    public ResponseEntity<ApiResponse<InterviewResponse>> getByRoom(@PathVariable String roomId) {
        return ResponseEntity.ok(ApiResponse.success(
                interviewService.toResponse(interviewService.getByRoomId(roomId))));
    }

    @GetMapping("/my")
    @Operation(summary = "Get all my interviews (student or employer)")
    public ResponseEntity<ApiResponse<Page<InterviewResponse>>> getMyInterviews(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getMyInterviews(pageable)));
    }
}
