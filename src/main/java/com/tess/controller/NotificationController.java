package com.tess.controller;

import com.tess.dto.response.ApiResponse;
import com.tess.dto.response.NotificationResponse;
import com.tess.entity.User;
import com.tess.enums.NotificationType;
import com.tess.enums.Role;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.UserRepository;
import java.util.List;
import com.tess.security.UserDetailsImpl;
import com.tess.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get all my notifications")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getAll(
            @AuthenticationPrincipal UserDetailsImpl current,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotifications(current.getId(), pageable)));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getUnread(
            @AuthenticationPrincipal UserDetailsImpl current,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUnreadNotifications(current.getId(), pageable)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl current) {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("count", notificationService.getUnreadCount(current.getId()))));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal UserDetailsImpl current) {
        notificationService.markAllAsRead(current.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl current) {
        notificationService.markAsRead(id, current.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PostMapping("/report")
    @Operation(summary = "Submit a report about a job or user")
    public ResponseEntity<ApiResponse<Void>> submitReport(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {

        // Find admin - get first user with ADMIN role
        List<User> admins = userRepository.findByRole(Role.ADMIN, Pageable.unpaged()).getContent();

        if (admins.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "Report received"));
        }

        User admin = admins.get(0);

        String reason = body.getOrDefault("reason", "No reason provided").toString();
        String description = body.getOrDefault("description", "").toString();
        String jobTitle = body.getOrDefault("jobTitle", "").toString();
        String reportType = body.getOrDefault("reportType", "JOB").toString();
        String studentName = body.getOrDefault("studentName", "").toString();
        String companyName = body.getOrDefault("companyName", "").toString();

        String message;
        if (reportType.equals("STUDENT")) {
            message = "🚩 REPORT — Student: " + studentName +
                    " | Job: " + jobTitle +
                    " | Reason: " + reason +
                    (description.isEmpty() ? "" : " | Details: " + description);
        } else if (reportType.equals("EMPLOYER")) {
            message = "🚩 REPORT — Employer: " + companyName +
                    " | Job: " + jobTitle +
                    " | Reason: " + reason +
                    (description.isEmpty() ? "" : " | Details: " + description);
        } else {
            message = "🚩 REPORT — Job: " + jobTitle +
                    " | Reason: " + reason +
                    (description.isEmpty() ? "" : " | Details: " + description);
        }

        notificationService.sendNotification(
                admin.getId(),
                NotificationType.MESSAGE_RECEIVED,
                message,
                currentUser.getId(),
                "USER"
        );

        return ResponseEntity.ok(ApiResponse.success(null, "Report submitted successfully"));
    }
}
