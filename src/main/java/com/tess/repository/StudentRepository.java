package com.tess.repository;

import com.tess.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    @Query("SELECT s FROM Student s JOIN s.user u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.university) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Student> searchStudents(@Param("query") String query, Pageable pageable);

    @Query("SELECT DISTINCT s FROM Student s JOIN s.skills sk WHERE LOWER(sk) IN :skills")
    Page<Student> findBySkills(@Param("skills") java.util.List<String> skills, Pageable pageable);
}
