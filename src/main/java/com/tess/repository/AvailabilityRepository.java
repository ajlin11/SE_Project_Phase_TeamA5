package com.tess.repository;

import com.tess.entity.Availability;
import com.tess.enums.AvailabilityDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    List<Availability> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);
    List<Availability> findByStudentIdAndDayOfWeek(Long studentId, AvailabilityDay day);
}
