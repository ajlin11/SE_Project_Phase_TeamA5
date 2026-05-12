package com.tess.repository;

import com.tess.entity.Application;
import com.tess.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Page<Application> findByStudentId(Long studentId, Pageable pageable);

    Page<Application> findByStudentIdAndStatus(Long studentId, ApplicationStatus status, Pageable pageable);

    Page<Application> findByJobId(Long jobId, Pageable pageable);

    Page<Application> findByJobIdAndStatus(Long jobId, ApplicationStatus status, Pageable pageable);

    Optional<Application> findByStudentIdAndJobId(Long studentId, Long jobId);

    boolean existsByStudentIdAndJobId(Long studentId, Long jobId);

    @Query("SELECT a FROM Application a WHERE a.job.employer.id = :employerId")
    Page<Application> findByEmployerId(@Param("employerId") Long employerId, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.job.employer.id = :employerId AND a.status = :status")
    Page<Application> findByEmployerIdAndStatus(@Param("employerId") Long employerId,
                                                 @Param("status") ApplicationStatus status,
                                                 Pageable pageable);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.student.id = :studentId")
    long countByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.employer.id = :employerId")
    long countByEmployerId(@Param("employerId") Long employerId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.id = :jobId")
    long countByJobId(@Param("jobId") Long jobId);

    List<Application> findByJobIdAndStatus(Long jobId, ApplicationStatus status);
}
