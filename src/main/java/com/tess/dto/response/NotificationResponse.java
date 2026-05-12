package com.tess.dto.response;

import com.tess.enums.NotificationType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String message;
    private boolean read;
    private Long referenceId;
    private String referenceType;
    private LocalDateTime createdAt;
}
