package com.tess;

import com.tess.entity.Availability;
import com.tess.entity.Job;
import com.tess.entity.Student;
import com.tess.enums.AvailabilityDay;
import com.tess.enums.JobStatus;
import com.tess.repository.AvailabilityRepository;
import com.tess.repository.JobRepository;
import com.tess.service.impl.JobMatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class JobMatchingServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private AvailabilityRepository availabilityRepository;

    @InjectMocks
    private JobMatchingService jobMatchingService;

    private Student student;
    private Job job;

    @BeforeEach
    void setup() {
        student = new Student();
        student.setId(1L);
        student.setSkills(List.of("Java", "React"));

        job = new Job();
        job.setId(1L);
        job.setStatus(JobStatus.ACTIVE);
        job.setWorkDays(List.of(AvailabilityDay.MONDAY));
        job.setShiftStartTime(LocalTime.of(14, 0));
        job.setShiftEndTime(LocalTime.of(18, 0));
        job.setRequiredSkills(List.of("Java"));
    }

    @Test
    void noConflict_whenStudentFreeOnJobDay() {
        Availability busy = Availability.builder()
                .dayOfWeek(AvailabilityDay.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .isBusy(true)
                .build();

        boolean conflict = jobMatchingService.hasScheduleConflict(job, List.of(busy));
        assertThat(conflict).isFalse();
    }

    @Test
    void conflict_whenStudentBusyDuringJobShift() {
        Availability busy = Availability.builder()
                .dayOfWeek(AvailabilityDay.MONDAY)
                .startTime(LocalTime.of(13, 0))
                .endTime(LocalTime.of(17, 0))
                .isBusy(true)
                .build();

        boolean conflict = jobMatchingService.hasScheduleConflict(job, List.of(busy));
        assertThat(conflict).isTrue();
    }

    @Test
    void skillMatch_whenStudentHasRequiredSkill() {
        boolean match = jobMatchingService.hasSkillMatch(job, List.of("Java", "Python"));
        assertThat(match).isTrue();
    }

    @Test
    void noSkillMatch_whenStudentLacksRequiredSkill() {
        boolean match = jobMatchingService.hasSkillMatch(job, List.of("Python", "Django"));
        assertThat(match).isFalse();
    }

    @Test
    void compatibilityScore_perfectMatch() {
        // no conflict + skill match + active = 100
        // Uses availabilityRepository mock (returns empty = no conflict)
        org.mockito.Mockito.when(availabilityRepository.findByStudentId(1L)).thenReturn(List.of());

        int score = jobMatchingService.calculateCompatibilityScore(student, job);
        // 50 (no conflict) + 40 (1/1 skill match) + 10 (active) = 100
        assertThat(score).isEqualTo(100);
    }
}
