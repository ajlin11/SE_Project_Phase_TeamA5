package com.tess.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private Long id;
    private Long senderId;
    private String senderFullName;
    private Long receiverId;
    private String receiverFullName;
    private String content;
    private boolean read;
    private LocalDateTime sentAt;
}
