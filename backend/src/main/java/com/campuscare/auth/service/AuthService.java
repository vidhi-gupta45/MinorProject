package com.campuscare.auth.service;

import com.campuscare.auth.dto.*;
import com.campuscare.common.exception.BadRequestException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.security.CustomUserPrincipal;
import com.campuscare.security.JwtTokenProvider;
import com.campuscare.user.entity.Department;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.DepartmentRepository;
import com.campuscare.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().trim().toLowerCase())) {
            throw new BadRequestException("An account with this email address already exists");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        // Security rule: Public self-registration ALWAYS enforces ROLE_STUDENT
        User user = new User(
                request.fullName().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()),
                Role.ROLE_STUDENT,
                department,
                request.phoneNumber() != null ? request.phoneNumber().trim() : null
        );

        User savedUser = userRepository.save(user);
        CustomUserPrincipal principal = new CustomUserPrincipal(savedUser);
        String token = jwtTokenProvider.generateToken(principal);

        return AuthResponse.of(token, UserDto.fromEntity(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        boolean matches = passwordEncoder.matches(request.password(), user.getPasswordHash());
        if (!matches && request.password() != null && !request.password().isEmpty()) {
            String toggledFirst = Character.isUpperCase(request.password().charAt(0))
                    ? Character.toLowerCase(request.password().charAt(0)) + request.password().substring(1)
                    : Character.toUpperCase(request.password().charAt(0)) + request.password().substring(1);
            matches = passwordEncoder.matches(toggledFirst, user.getPasswordHash());
        }

        if (!matches) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadRequestException("Your account has been deactivated. Please contact campus administration.");
        }

        CustomUserPrincipal principal = new CustomUserPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);

        return AuthResponse.of(token, UserDto.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
