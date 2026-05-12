package com.tess.repository;

import com.tess.entity.Employer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployerRepository extends JpaRepository<Employer, Long> {
    Optional<Employer> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    @Query("SELECT e FROM Employer e WHERE " +
           "LOWER(e.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.industry) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Employer> searchEmployers(@Param("query") String query, Pageable pageable);
}
