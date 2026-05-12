package com.tess.dto.request;

import com.tess.enums.AvailabilityDay;
import com.tess.enums.JobStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class JobRequest {

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    private String description;

    private String location;
    private Double hourlyRate;
    private Integer hoursPerWeek;
    private List<String> requiredSkills;
    private List<AvailabilityDay> workDays;
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    private LocalDateTime applicationDeadline;
    private Integer maxApplicants;
    private JobStatus status;
}
