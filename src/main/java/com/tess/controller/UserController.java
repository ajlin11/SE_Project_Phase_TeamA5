package com.tess.controller;

import com.tess.dto.response.ApiResponse;
import com.tess.entity.User;
import com.tess.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public ApiResponse<List<User>> search(@RequestParam String query) {
        return ApiResponse.success(
                userRepository.searchUsers(query, PageRequest.of(0, 20)).getContent()
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<User> getById(@PathVariable Long id) {
        return ApiResponse.success(
                userRepository.findById(id).orElse(null)
        );
    }
}
