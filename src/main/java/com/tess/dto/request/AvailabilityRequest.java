package com.tess.dto.request;

import com.tess.enums.AvailabilityDay;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class AvailabilityRequest {

    @NotNull(message = "Day of week is required")
    private AvailabilityDay dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private boolean isBusy;
    private String description;
}
