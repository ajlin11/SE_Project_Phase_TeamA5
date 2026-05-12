package com.tess.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tess.enums.AvailabilityDay;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "availabilities")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AvailabilityDay dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    // If true, this slot is a class (busy). If false, it is free.
    @Column(nullable = false)
    @Builder.Default
    private boolean isBusy = false;

    private String description; // e.g., "Software Engineering class"
}
