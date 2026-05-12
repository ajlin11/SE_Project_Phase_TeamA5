package com.tess.dto.response;

import com.tess.enums.InterviewStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InterviewResponse {
    private Long id;
    private Long applicationId;
    private String meetingLink;
    private String roomId;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private InterviewStatus status;
    private String notes;
    private LocalDateTime createdAt;

    // Parties
    private String studentFullName;
    private String employerCompanyName;
    private String jobTitle;
}
