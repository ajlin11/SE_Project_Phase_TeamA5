package com.tess.service.impl;

import com.tess.entity.Employer;
import com.tess.exception.AccessDeniedException;
import com.tess.exception.ResourceNotFoundException;
import com.tess.repository.EmployerRepository;
import com.tess.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmployerService {

    private final EmployerRepository employerRepository;

    public Employer getEmployerByUserId(Long userId) {
        return employerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found for user: " + userId));
    }

    public Employer getEmployerById(Long employerId) {
        return employerRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));
    }

    @Transactional
    public Employer updateProfile(Long employerId, Map<String, Object> updates) {
        Employer employer = getEmployerById(employerId);
        assertOwnership(employer);

        updates.forEach((key, value) -> {
            switch (key) {
                case "companyName"        -> employer.setCompanyName((String) value);
                case "companyDescription" -> employer.setCompanyDescription((String) value);
                case "industry"           -> employer.setIndustry((String) value);
                case "website"            -> employer.setWebsite((String) value);
                case "address"            -> employer.setAddress((String) value);
                case "city"               -> employer.setCity((String) value);
                case "phone"              -> employer.getUser().setPhone((String) value);
            }
        });
        return employerRepository.save(employer);
    }

    private void assertOwnership(Employer employer) {
        UserDetailsImpl current = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        if (!employer.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You can only modify your own profile");
        }
    }
}
