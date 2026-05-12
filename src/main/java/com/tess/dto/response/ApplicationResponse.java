package com.tess.dto.response;

import com.tess.enums.ApplicationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationResponse {
    private Long id;
    private ApplicationStatus status;
    private String coverLetter;
    private String employerNote;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    // Job info
    private Long jobId;
    private String jobTitle;
    private String companyName;

    // Student info
    private Long studentId;
    private String studentFullName;
    private String studentEmail;
    private String studentUniversity;

    // Interview info (if scheduled)
    private InterviewResponse interview;
}
