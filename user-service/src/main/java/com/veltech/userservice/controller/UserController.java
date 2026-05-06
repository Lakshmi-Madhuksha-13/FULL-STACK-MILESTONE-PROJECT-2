package com.veltech.userservice.controller;

import com.veltech.userservice.model.User;
import com.veltech.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
        if (user.getCoins() == null) {
            user.setCoins(100); // Initial balance
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

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String name = request.get("name");
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            return ResponseEntity.ok(userOptional.get());
        } else {
            User newUser = new User(name, email, "GOOGLE_AUTH", "USER", "Not Specified", "Not Specified");
            if(newUser.getCoins() == null) newUser.setCoins(100);
            return ResponseEntity.ok(userRepository.save(newUser));
        }
    }

    @PutMapping("/{id}/coins")
    public ResponseEntity<?> updateCoins(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> request) {
        return userRepository.findById(id).map(user -> {
            Integer addedCoins = request.get("coins");
            int current = user.getCoins() != null ? user.getCoins() : 100;
            int newTotal = current + addedCoins;
            user.setCoins(newTotal);

            // 🚀 UPGRADATION LOGIC
            if (newTotal > 1000) user.setTier("LEGEND");
            else if (newTotal > 500) user.setTier("ELITE");
            else if (newTotal > 200) user.setTier("PRO");
            else user.setTier("ROOKIE");

            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/rank")
    public ResponseEntity<?> getUserRank(@PathVariable Long id) {
        List<User> all = userRepository.findAll().stream()
                .peek(u -> { if(u.getCoins() == null) u.setCoins(0); })
                .sorted((a, b) -> b.getCoins().compareTo(a.getCoins()))
                .toList();
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(id)) return ResponseEntity.ok(i + 1);
        }
        return ResponseEntity.ok(0);
    }
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .peek(u -> { if(u.getCoins() == null) u.setCoins(0); })
                .sorted((a, b) -> b.getCoins().compareTo(a.getCoins()))
                .limit(10).toList());
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

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{userId}/notifications")
    public ResponseEntity<?> getNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByTimestampDesc(userId));
    }

    @GetMapping("/notifications/all")
    public ResponseEntity<?> getAllNotifications() {
        return ResponseEntity.ok(notificationRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp")));
    }

    @PostMapping("/notifications")
    public ResponseEntity<?> createNotification(@RequestBody com.veltech.userservice.model.Notification notification) {
        notification.setRead(false);
        com.veltech.userservice.model.Notification saved = notificationRepository.save(notification);
        messagingTemplate.convertAndSend("/topic/notifications/" + notification.getUserId(), saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/notifications/global")
    public ResponseEntity<?> createGlobalNotification(@RequestBody java.util.Map<String, String> request) {
        String message = request.get("message");
        com.veltech.userservice.model.Notification globalNote = new com.veltech.userservice.model.Notification(0L, message);
        notificationRepository.save(globalNote);
        messagingTemplate.convertAndSend("/topic/global", request);
        return ResponseEntity.ok().build();
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

    @PostMapping("/{id}/quest")
    public ResponseEntity<?> redeemQuest(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String questCode = request.get("questCode");
        if (questCode == null || questCode.isEmpty()) return ResponseEntity.badRequest().body("Invalid Quest Code.");

        return userRepository.findById(id).map(user -> {
            String used = user.getUsedQuests() != null ? user.getUsedQuests() : "";
            if (java.util.Arrays.asList(used.split(",")).contains(questCode)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Quest already completed.");
            }

            // Award logic based on quest type
            int bonus = 50; 
            if (questCode.startsWith("S-")) bonus = 150; // Sponsor quests
            else if (questCode.startsWith("M-")) bonus = 250; // Master quests

            user.setCoins((user.getCoins() != null ? user.getCoins() : 0) + bonus);
            user.setUsedQuests(used.isEmpty() ? questCode : used + "," + questCode);

            // Tier Update
            int newTotal = user.getCoins();
            if (newTotal > 1000) user.setTier("LEGEND");
            else if (newTotal > 500) user.setTier("ELITE");
            else if (newTotal > 200) user.setTier("PRO");

            User saved = userRepository.save(user);
            
            // Notify User
            com.veltech.userservice.model.Notification n = new com.veltech.userservice.model.Notification(id, "🎖️ QUEST COMPLETED: You earned " + bonus + " Coins for " + questCode + "! Your tier is now " + user.getTier());
            notificationRepository.save(n);
            messagingTemplate.convertAndSend("/topic/notifications/" + id, n);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reset-password")
}
