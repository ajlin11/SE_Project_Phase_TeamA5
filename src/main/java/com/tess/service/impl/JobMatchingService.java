package com.tess.service.impl;

import com.tess.entity.Availability;
import com.tess.entity.Job;
import com.tess.entity.Student;
import com.tess.enums.AvailabilityDay;
import com.tess.enums.JobStatus;
import com.tess.repository.AvailabilityRepository;
import com.tess.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMatchingService {

    private final JobRepository jobRepository;
    private final AvailabilityRepository availabilityRepository;

    /**
     * Core matching algorithm:
     * Returns jobs whose working schedule does NOT conflict with the student's busy slots.
     * A conflict occurs when the job's work day and time overlap with any busy availability slot.
     * Bonus: jobs requiring skills the student has are ranked higher.
     */
    public Page<Job> getMatchingJobsForStudent(Student student, Pageable pageable) {
        List<Availability> busySlots = availabilityRepository.findByStudentId(student.getId())
                .stream()
                .filter(Availability::isBusy)
                .toList();

        // If no schedule defined, return all active jobs
        if (busySlots.isEmpty()) {
            return jobRepository.findByStatus(JobStatus.ACTIVE, pageable);
        }

        List<Job> allActiveJobs = jobRepository.findByStatus(JobStatus.ACTIVE, Pageable.unpaged()).getContent();
        List<Job> matchingJobs = new ArrayList<>();
        List<Job> skillMatchJobs = new ArrayList<>();

        for (Job job : allActiveJobs) {
            if (!hasScheduleConflict(job, busySlots)) {
                if (hasSkillMatch(job, student.getSkills())) {
                    skillMatchJobs.add(job); // higher priority
                } else {
                    matchingJobs.add(job);
                }
            }
        }

        // Skill matches first
        List<Job> ranked = new ArrayList<>(skillMatchJobs);
        ranked.addAll(matchingJobs);

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), ranked.size());
        List<Job> pageContent = start >= ranked.size() ? List.of() : ranked.subList(start, end);

        return new PageImpl<>(pageContent, pageable, ranked.size());
    }

    /**
     * Checks if a job's work days and shift hours conflict with any of the student's busy slots.
     */
    public boolean hasScheduleConflict(Job job, List<Availability> busySlots) {
        if (job.getWorkDays() == null || job.getWorkDays().isEmpty()) return false;
        if (job.getShiftStartTime() == null || job.getShiftEndTime() == null) return false;

        for (AvailabilityDay workDay : job.getWorkDays()) {
            for (Availability busy : busySlots) {
                if (busy.getDayOfWeek() == workDay) {
                    if (timesOverlap(job.getShiftStartTime(), job.getShiftEndTime(),
                                     busy.getStartTime(), busy.getEndTime())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Returns true if [start1, end1) overlaps with [start2, end2).
     */
    private boolean timesOverlap(LocalTime start1, LocalTime end1,
                                   LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    /**
     * Returns true if at least one of the job's required skills matches the student's skills.
     */
    public boolean hasSkillMatch(Job job, List<String> studentSkills) {
        if (job.getRequiredSkills() == null || job.getRequiredSkills().isEmpty()) return false;
        if (studentSkills == null || studentSkills.isEmpty()) return false;
        List<String> normalizedStudentSkills = studentSkills.stream()
                .map(String::toLowerCase).toList();
        return job.getRequiredSkills().stream()
                .map(String::toLowerCase)
                .anyMatch(normalizedStudentSkills::contains);
    }

    /**
     * Calculate a compatibility score (0-100) between a student and a job.
     */
    public int calculateCompatibilityScore(Student student, Job job) {
        int score = 0;
        List<Availability> busySlots = availabilityRepository.findByStudentId(student.getId())
                .stream().filter(Availability::isBusy).toList();

        // No schedule conflict: 50 points
        if (!hasScheduleConflict(job, busySlots)) {
            score += 50;
        }

        // Skill match: up to 40 points
        if (job.getRequiredSkills() != null && student.getSkills() != null) {
            long matched = job.getRequiredSkills().stream()
                    .map(String::toLowerCase)
                    .filter(s -> student.getSkills().stream()
                            .map(String::toLowerCase)
                            .anyMatch(s::equals))
                    .count();
            if (!job.getRequiredSkills().isEmpty()) {
                score += (int) ((matched * 40.0) / job.getRequiredSkills().size());
            }
        }

        // Job is active: 10 points
        if (job.getStatus() == JobStatus.ACTIVE) {
            score += 10;
        }

        return Math.min(score, 100);
    }
}
