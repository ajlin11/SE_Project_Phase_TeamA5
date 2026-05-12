package com.tess.controller;

import com.tess.dto.request.MessageRequest;
import com.tess.dto.response.ApiResponse;
import com.tess.dto.response.MessageResponse;
import com.tess.service.impl.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Real-time and REST messaging between users")
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    @Operation(summary = "Send a message via REST (also pushes via WebSocket)")
    public ResponseEntity<ApiResponse<MessageResponse>> send(
            @Valid @RequestBody MessageRequest request) {
        MessageResponse response = messageService.sendMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Message sent"));
    }

    @GetMapping("/conversation/{userId}")
    @Operation(summary = "Get full conversation with a user (flat list)")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversation(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(messageService.getConversation(userId)));
    }

    @GetMapping("/conversation/{userId}/paged")
    @Operation(summary = "Get conversation with a user (paginated)")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getConversationPaged(
            @PathVariable Long userId,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getConversationPaged(userId, pageable)));
    }

    @PostMapping("/conversation/{userId}/read")
    @Operation(summary = "Mark all messages from a user as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long userId) {
        messageService.markConversationAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Messages marked as read"));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread message count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("unreadCount", messageService.getUnreadCount())));
    }

    @GetMapping("/partners")
    @Operation(summary = "Get list of user IDs you have conversations with")
    public ResponseEntity<ApiResponse<List<Long>>> getConversationPartners() {
        return ResponseEntity.ok(ApiResponse.success(messageService.getConversationPartners()));
    }

    /**
     * WebSocket endpoint: client sends to /app/chat.send
     * Server forwards to /user/{receiverEmail}/queue/messages
     */
    @MessageMapping("/chat.send")
    public void handleWebSocketMessage(@Payload MessageRequest request,
                                        SimpMessageHeaderAccessor headerAccessor) {
        // Authentication is available in headerAccessor.getUser()
        messageService.sendMessage(request);
    }
}
