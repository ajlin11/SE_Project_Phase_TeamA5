package com.tess.controller;

import com.tess.dto.request.AvailabilityRequest;
import com.tess.dto.response.ApiResponse;
import com.tess.entity.Availability;
import com.tess.entity.Student;
import com.tess.security.UserDetailsImpl;
import com.tess.service.impl.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
@Tag(name = "Students", description = "Student profile and availability management")
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my student profile")
    public ResponseEntity<ApiResponse<Student>> getMyProfile(
            @AuthenticationPrincipal UserDetailsImpl current) {
        Student student = studentService.getStudentByUserId(current.getId());
        return ResponseEntity.ok(ApiResponse.success(student));
    }

    @GetMapping("/{studentId}")
    @Operation(summary = "Get student profile by ID")
    public ResponseEntity<ApiResponse<Student>> getById(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStudentById(studentId)));
    }

    @PatchMapping("/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Update student profile fields")
    public ResponseEntity<ApiResponse<Student>> updateProfile(
            @PathVariable Long studentId,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(ApiResponse.success(
                studentService.updateProfile(studentId, updates), "Profile updated"));
    }

    @PutMapping("/{studentId}/skills")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Replace student skills list")
    public ResponseEntity<ApiResponse<Student>> updateSkills(
            @PathVariable Long studentId,
            @RequestBody List<String> skills) {
        return ResponseEntity.ok(ApiResponse.success(
                studentService.updateSkills(studentId, skills), "Skills updated"));
    }

    @PostMapping(value = "/{studentId}/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Upload or replace CV (PDF/Word, max 10MB)")
    public ResponseEntity<ApiResponse<Student>> uploadCv(
            @PathVariable Long studentId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(
                studentService.uploadCv(studentId, file), "CV uploaded successfully"));
    }

    @PostMapping(value = "/{studentId}/student-id", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Upload student ID for verification")
    public ResponseEntity<ApiResponse<Student>> uploadStudentId(
            @PathVariable Long studentId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(
                studentService.uploadStudentId(studentId, file), "Student ID uploaded"));
    }

    // ---------- Availability ----------

    @GetMapping("/{studentId}/availability")
    @Operation(summary = "Get student availability schedule")
    public ResponseEntity<ApiResponse<List<Availability>>> getAvailability(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getAvailability(studentId)));
    }

    @PutMapping("/{studentId}/availability")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Replace entire availability schedule")
    public ResponseEntity<ApiResponse<List<Availability>>> setAvailability(
            @PathVariable Long studentId,
            @Valid @RequestBody List<AvailabilityRequest> requests) {
        return ResponseEntity.ok(ApiResponse.success(
                studentService.replaceAvailability(studentId, requests),
                "Availability schedule updated"));
    }

    @DeleteMapping("/{studentId}/availability/{slotId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Delete a single availability slot")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(
            @PathVariable Long studentId,
            @PathVariable Long slotId) {
        studentService.deleteAvailabilitySlot(studentId, slotId);
        return ResponseEntity.ok(ApiResponse.success(null, "Slot deleted"));
    }
}
