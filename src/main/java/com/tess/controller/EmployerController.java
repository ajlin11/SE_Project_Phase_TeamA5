package com.tess.controller;

import com.tess.dto.response.ApiResponse;
import com.tess.entity.Employer;
import com.tess.security.UserDetailsImpl;
import com.tess.service.impl.EmployerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/employers")
@RequiredArgsConstructor
@Tag(name = "Employers", description = "Employer profile management")
public class EmployerController {

    private final EmployerService employerService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Get my employer profile")
    public ResponseEntity<ApiResponse<Employer>> getMyProfile(
            @AuthenticationPrincipal UserDetailsImpl current) {
        Employer employer = employerService.getEmployerByUserId(current.getId());
        return ResponseEntity.ok(ApiResponse.success(employer));
    }

    @GetMapping("/{employerId}")
    @Operation(summary = "Get employer profile by ID")
    public ResponseEntity<ApiResponse<Employer>> getById(@PathVariable Long employerId) {
        return ResponseEntity.ok(ApiResponse.success(employerService.getEmployerById(employerId)));
    }

    @PatchMapping("/{employerId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(summary = "Update employer profile fields")
    public ResponseEntity<ApiResponse<Employer>> update(
            @PathVariable Long employerId,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(ApiResponse.success(
                employerService.updateProfile(employerId, updates), "Profile updated"));
    }
}
