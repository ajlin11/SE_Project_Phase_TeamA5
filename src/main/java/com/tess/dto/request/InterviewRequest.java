package com.tess.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InterviewRequest {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotNull(message = "Scheduled time is required")
    @Future(message = "Interview must be scheduled in the future")
    private LocalDateTime scheduledAt;

    private Integer durationMinutes;
    private String notes;
}
