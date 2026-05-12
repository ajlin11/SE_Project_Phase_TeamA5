package com.tess.controller;

import com.tess.dto.response.ApiResponse;
import com.tess.dto.response.JobResponse;
import com.tess.entity.Job;
import com.tess.entity.User;
import com.tess.enums.Role;
import com.tess.service.impl.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import com.tess.service.impl.JobService;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin dashboard and platform management")
public class AdminController {

    private final AdminService adminService;
    private final JobService jobService;

    // ---------- Dashboard ----------

    @GetMapping("/stats")
    @Operation(summary = "Get platform statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboardStats()));
    }

    // ---------- User Management ----------

    @GetMapping("/users")
    @Operation(summary = "List all users with pagination")
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers(pageable)));
    }

    @GetMapping("/users/role/{role}")
    @Operation(summary = "List users by role (STUDENT | EMPLOYER | ADMIN)")
    public ResponseEntity<ApiResponse<Page<User>>> getUsersByRole(
            @PathVariable Role role,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsersByRole(role, pageable)));
    }

    @GetMapping("/users/search")
    @Operation(summary = "Search users by name or email")
    public ResponseEntity<ApiResponse<Page<User>>> searchUsers(
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.searchUsers(query, pageable)));
    }

    @PostMapping("/users/{userId}/toggle-active")
    @Operation(summary = "Activate or deactivate a user account")
    public ResponseEntity<ApiResponse<User>> toggleActivation(@PathVariable Long userId) {
        User user = adminService.toggleUserActivation(userId);
        String msg = user.isActive() ? "User reactivated" : "User deactivated";
        return ResponseEntity.ok(ApiResponse.success(user, msg));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Permanently delete a user account")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted permanently"));
    }

    @PostMapping("/students/{studentId}/verify")
    @Operation(summary = "Verify a student account")
    public ResponseEntity<ApiResponse<User>> verifyStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.verifyStudent(studentId), "Student verified"));
    }

    @PostMapping("/employers/{employerId}/verify")
    @Operation(summary = "Verify an employer account")
    public ResponseEntity<ApiResponse<User>> verifyEmployer(@PathVariable Long employerId) {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.verifyEmployer(employerId), "Employer verified"));
    }

    // ---------- Job Management ----------

    @GetMapping("/jobs")
    @Operation(summary = "List all job postings")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getAllJobs(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Job> jobs = adminService.getAllJobs(pageable);
        Page<JobResponse> response = jobs.map(j -> jobService.toResponse(j, null));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/jobs/{jobId}/remove")
    @Operation(summary = "Remove (close) an inappropriate job posting")
    public ResponseEntity<ApiResponse<Void>> removeJob(@PathVariable Long jobId) {
        adminService.removeJob(jobId);
        return ResponseEntity.ok(ApiResponse.success(null, "Job removed"));
    }
}
