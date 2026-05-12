package com.tess.service.impl;

import com.tess.dto.request.AvailabilityRequest;
import com.tess.dto.response.ApiResponse;
import com.tess.entity.Availability;
import com.tess.entity.Student;
import com.tess.entity.User;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.BadRequestException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.AvailabilityRepository;
import com.tess.repository.StudentRepository;
import com.tess.repository.UserRepository;
import com.tess.security.UserDetailsImpl;
import com.tess.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;
    private final FileStorageService fileStorageService;
    private final ModelMapper modelMapper;

    public Student getStudentByUserId(Long userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userId));
    }

    public Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
    }

    @Transactional
    public Student updateProfile(Long studentId, Map<String, Object> updates) {
        Student student = getStudentById(studentId);
        assertOwnership(student);

        updates.forEach((key, value) -> {
            switch (key) {
                case "bio"          -> student.setBio((String) value);
                case "faculty"      -> student.setFaculty((String) value);
                case "major"        -> student.setMajor((String) value);
                case "yearOfStudy"  -> student.setYearOfStudy((Integer) value);
                case "phone"        -> student.getUser().setPhone((String) value);
                case "firstName"    -> student.getUser().setFirstName((String) value);
                case "lastName"     -> student.getUser().setLastName((String) value);
            }
        });
        return studentRepository.save(student);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Student updateSkills(Long studentId, List<String> skills) {
        Student student = getStudentById(studentId);
        assertOwnership(student);
        student.getSkills().clear();
        student.getSkills().addAll(skills);
        return studentRepository.save(student);
    }

    @Transactional
    public Student uploadCv(Long studentId, MultipartFile file) {
        Student student = getStudentById(studentId);
        assertOwnership(student);

        // Delete old CV if exists
        if (student.getCvPath() != null) {
            fileStorageService.deleteFile(student.getCvPath());
        }

        String path = fileStorageService.storeCv(file);
        student.setCvPath(path);
        return studentRepository.save(student);
    }

    @Transactional
    public Student uploadStudentId(Long studentId, MultipartFile file) {
        Student student = getStudentById(studentId);
        assertOwnership(student);

        if (student.getStudentIdPath() != null) {
            fileStorageService.deleteFile(student.getStudentIdPath());
        }

        String path = fileStorageService.storeStudentId(file);
        student.setStudentIdPath(path);
        return studentRepository.save(student);
    }

    // ---------- Availability ----------

    @Transactional
    public List<Availability> replaceAvailability(Long studentId, List<AvailabilityRequest> requests) {
        Student student = getStudentById(studentId);
        assertOwnership(student);

        availabilityRepository.deleteByStudentId(studentId);

        List<Availability> slots = requests.stream().map(req -> {
            if (req.getEndTime().isBefore(req.getStartTime()) ||
                req.getEndTime().equals(req.getStartTime())) {
                throw new BadRequestException("End time must be after start time");
            }
            return Availability.builder()
                    .student(student)
                    .dayOfWeek(req.getDayOfWeek())
                    .startTime(req.getStartTime())
                    .endTime(req.getEndTime())
                    .isBusy(req.isBusy())
                    .description(req.getDescription())
                    .build();
        }).toList();

        return availabilityRepository.saveAll(slots);
    }

    public List<Availability> getAvailability(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student", studentId);
        }
        return availabilityRepository.findByStudentId(studentId);
    }

    @Transactional
    public void deleteAvailabilitySlot(Long studentId, Long slotId) {
        Student student = getStudentById(studentId);
        assertOwnership(student);
        Availability slot = availabilityRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability slot", slotId));
        if (!slot.getStudent().getId().equals(studentId)) {
            throw new AccessDeniedException("This slot does not belong to you");
        }
        availabilityRepository.delete(slot);
    }

    // ---------- Helpers ----------

    private void assertOwnership(Student student) {
        UserDetailsImpl current = getCurrentUser();
        if (!student.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You can only modify your own profile");
        }
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
