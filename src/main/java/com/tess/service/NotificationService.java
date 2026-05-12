package com.tess.service;

import com.tess.dto.response.NotificationResponse;
import com.tess.entity.Notification;
import com.tess.entity.User;
import com.tess.enums.NotificationType;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.NotificationRepository;
import com.tess.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ModelMapper modelMapper;

    @Transactional
    public Notification sendNotification(Long recipientId, NotificationType type,
                                          String message, Long referenceId, String referenceType) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User", recipientId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Push real-time notification via WebSocket
        try {
            NotificationResponse response = modelMapper.map(saved, NotificationResponse.class);
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/notifications",
                    response
            );
        } catch (Exception e) {
            log.warn("Could not push WebSocket notification to user {}: {}", recipientId, e.getMessage());
        }

        return saved;
    }

    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(n -> modelMapper.map(n, NotificationResponse.class));
    }

    public Page<NotificationResponse> getUnreadNotifications(Long userId, Pageable pageable) {
        return notificationRepository
                .findByRecipientIdAndReadOrderByCreatedAtDesc(userId, false, pageable)
                .map(n -> modelMapper.map(n, NotificationResponse.class));
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.markAsRead(notificationId, userId);
    }
}
