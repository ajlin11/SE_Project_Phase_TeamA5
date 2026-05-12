package com.tess.repository;

import com.tess.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Get conversation between two users ordered by time
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("userId1") Long userId1,
                                    @Param("userId2") Long userId2);

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.sentAt ASC")
    Page<Message> findConversationPaged(@Param("userId1") Long userId1,
                                         @Param("userId2") Long userId2,
                                         Pageable pageable);

    // Get all distinct conversation partners for a user
    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver.id ELSE m.sender.id END " +
           "FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);

    long countByReceiverIdAndReadFalse(Long receiverId);

    @Modifying
    @Query("UPDATE Message m SET m.read = true WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.read = false")
    void markMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}
