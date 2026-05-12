package com.tess.repository;

import com.tess.entity.Job;
import com.tess.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    Page<Job> findByEmployerId(Long employerId, Pageable pageable);

    Page<Job> findByEmployerIdAndStatus(Long employerId, JobStatus status, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND (" +
           "LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(j.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(j.location) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Job> searchActiveJobs(@Param("query") String query, Pageable pageable);

    @Query("SELECT DISTINCT j FROM Job j JOIN j.requiredSkills sk " +
           "WHERE j.status = 'ACTIVE' AND LOWER(sk) IN :skills")
    Page<Job> findByRequiredSkills(@Param("skills") List<String> skills, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND " +
           "j.applicationDeadline > CURRENT_TIMESTAMP")
    Page<Job> findActiveNonExpiredJobs(Pageable pageable);

    @Query("SELECT COUNT(j) FROM Job j WHERE j.employer.id = :employerId")
    long countByEmployerId(@Param("employerId") Long employerId);
}
