package com.tess.service.impl;

import com.tess.dto.request.MessageRequest;
import com.tess.dto.response.MessageResponse;
import com.tess.entity.Message;
import com.tess.entity.User;
import com.tess.enums.NotificationType;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.BadRequestException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.MessageRepository;
import com.tess.repository.UserRepository;
import com.tess.security.UserDetailsImpl;
import com.tess.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Transactional
    public MessageResponse sendMessage(MessageRequest request) {
        UserDetailsImpl current = getCurrentUser();
        if (current.getId().equals(request.getReceiverId())) {
            throw new BadRequestException("Cannot send a message to yourself");
        }

        User sender = userRepository.findById(current.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", current.getId()));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getReceiverId()));

        if (!receiver.isActive()) {
            throw new BadRequestException("Cannot send message to an inactive user");
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .read(false)
                .build();

        message = messageRepository.save(message);
        MessageResponse response = toResponse(message);

        // Push real-time via WebSocket
        messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),
                "/queue/messages",
                response
        );

        // In-app notification for unread messages
        notificationService.sendNotification(
                receiver.getId(),
                NotificationType.MESSAGE_RECEIVED,
                sender.getFullName() + " sent you a message",
                message.getId(),
                "MESSAGE"
        );

        return response;
    }

    public List<MessageResponse> getConversation(Long otherUserId) {
        UserDetailsImpl current = getCurrentUser();
        return messageRepository
                .findConversation(current.getId(), otherUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Page<MessageResponse> getConversationPaged(Long otherUserId, Pageable pageable) {
        UserDetailsImpl current = getCurrentUser();
        return messageRepository
                .findConversationPaged(current.getId(), otherUserId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public void markConversationAsRead(Long otherUserId) {
        UserDetailsImpl current = getCurrentUser();
        messageRepository.markMessagesAsRead(otherUserId, current.getId());
    }

    public long getUnreadCount() {
        UserDetailsImpl current = getCurrentUser();
        return messageRepository.countByReceiverIdAndReadFalse(current.getId());
    }

    public List<Long> getConversationPartners() {
        UserDetailsImpl current = getCurrentUser();
        return messageRepository.findConversationPartnerIds(current.getId());
    }

    private MessageResponse toResponse(Message msg) {
        MessageResponse r = new MessageResponse();
        r.setId(msg.getId());
        r.setSenderId(msg.getSender().getId());
        r.setSenderFullName(msg.getSender().getFullName());
        r.setReceiverId(msg.getReceiver().getId());
        r.setReceiverFullName(msg.getReceiver().getFullName());
        r.setContent(msg.getContent());
        r.setRead(msg.isRead());
        r.setSentAt(msg.getSentAt());
        return r;
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
