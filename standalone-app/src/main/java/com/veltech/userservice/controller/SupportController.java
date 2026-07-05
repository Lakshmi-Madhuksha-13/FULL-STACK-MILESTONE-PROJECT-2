package com.veltech.userservice.controller;

import com.veltech.userservice.model.SupportMessage;
import com.veltech.userservice.repository.SupportMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support")
@CrossOrigin("*")
public class SupportController {

    @Autowired
    private SupportMessageRepository repository;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody SupportMessage message) {
        return ResponseEntity.ok(repository.save(message));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<?> getHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(repository.findByUserIdOrderByTimestampAsc(userId));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(repository.findAllByOrderByTimestampAsc());
    }
}
