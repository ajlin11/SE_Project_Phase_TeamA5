package com.tess.dto.response;

import com.tess.enums.AvailabilityDay;
import com.tess.enums.JobStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class JobResponse {
    private Long id;
    private String title;
    private String description;
    private String location;
    private Double hourlyRate;
    private Integer hoursPerWeek;
    private JobStatus status;
    private List<String> requiredSkills;
    private List<AvailabilityDay> workDays;
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    private LocalDateTime applicationDeadline;
    private Integer maxApplicants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Employer info
    private Long employerId;
    private String companyName;
    private String industry;

    private long applicationCount;
    private boolean alreadyApplied; // set based on current user context
}
