package com.veltech.userservice.controller;

import com.veltech.userservice.model.User;
import com.veltech.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already registered");
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER"); // default role
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPassword().equals(loginRequest.getPassword())) {
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if(userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok("User deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }
    @Autowired
    private com.veltech.userservice.repository.NotificationRepository notificationRepository;

    @GetMapping("/{userId}/notifications")
    public ResponseEntity<?> getNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByTimestampDesc(userId));
    }

    @PostMapping("/notifications")
    public ResponseEntity<?> createNotification(@RequestBody com.veltech.userservice.model.Notification notification) {
        notification.setRead(false);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setName(userDetails.getName());
            user.setDepartment(userDetails.getDepartment());
            user.setCollege(userDetails.getCollege());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                user.setPassword(userDetails.getPassword());
            }
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");
        return userRepository.findByEmail(email).map(user -> {
            user.setPassword(newPassword);
            userRepository.save(user);
            return ResponseEntity.ok("Password reset successfully");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email not found"));
    }
}
