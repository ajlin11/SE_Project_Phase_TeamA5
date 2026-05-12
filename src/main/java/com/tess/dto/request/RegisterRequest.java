package com.tess.dto.request;

import com.tess.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    private String phone;

    // Student-specific fields
    private Integer age;
    private String university;
    private String faculty;
    private String major;
    private Integer yearOfStudy;
    private Boolean activeStudent;

    // Employer-specific fields
    private String companyName;
    private String industry;
    private String website;
    private String address;
    private String city;
}
