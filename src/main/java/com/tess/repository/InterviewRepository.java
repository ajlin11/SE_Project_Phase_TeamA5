package com.tess.repository;

import com.tess.entity.Interview;
import com.tess.enums.InterviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    Optional<Interview> findByApplicationId(Long applicationId);

    Optional<Interview> findByRoomId(String roomId);

    @Query("SELECT i FROM Interview i WHERE i.application.student.id = :studentId")
    Page<Interview> findByStudentId(@Param("studentId") Long studentId, Pageable pageable);

    @Query("SELECT i FROM Interview i WHERE i.application.job.employer.id = :employerId")
    Page<Interview> findByEmployerId(@Param("employerId") Long employerId, Pageable pageable);

    @Query("SELECT i FROM Interview i WHERE i.status = 'SCHEDULED' " +
           "AND i.scheduledAt BETWEEN :start AND :end")
    List<Interview> findUpcomingInterviews(@Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);

    @Query("SELECT i FROM Interview i WHERE i.application.student.user.id = :userId")
    Page<Interview> findByStudentUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT i FROM Interview i WHERE i.application.job.employer.user.id = :userId")
    Page<Interview> findByEmployerUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT i FROM Interview i WHERE i.application.student.id = :studentId " +
           "AND i.status = :status")
    Page<Interview> findByStudentIdAndStatus(@Param("studentId") Long studentId,
                                              @Param("status") InterviewStatus status,
                                              Pageable pageable);
}
