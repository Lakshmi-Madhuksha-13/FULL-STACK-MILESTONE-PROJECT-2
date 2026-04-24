package com.veltech.bookingservice.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.veltech.bookingservice.model.Booking;
import com.veltech.bookingservice.repository.BookingRepository;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping
    public ResponseEntity<?> bookTicket(@RequestBody Booking booking) {
        String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + booking.getTicketsBooked();
        try {
            ResponseEntity<String> response = restTemplate.exchange(eventServiceUrl, org.springframework.http.HttpMethod.PUT, null, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                booking.setStatus("CONFIRMED");
                Booking saved = bookingRepository.save(booking);

                // Notify User
                String userServiceUrl = "http://user-service/api/users/notifications";
                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", saved.getUserId());
                notification.put("message", "BOOKING_CONFIRMED: Your entry pass for Event #" + saved.getEventId() + " is ready.");
                try { restTemplate.postForEntity(userServiceUrl, notification, Object.class); } catch (Exception ignored) {}

                // Global Notification
                java.util.Map<String, String> global = new java.util.HashMap<>();
                global.put("message", "NEW BOOKING: Ticket TF-" + saved.getId() + " issued for Event #" + saved.getEventId());
                try { restTemplate.postForEntity(userServiceUrl + "/global", global, Object.class); } catch (Exception ignored) {}

                return ResponseEntity.ok(saved);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Not enough availability.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Service communication error.");
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getBookingHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingRepository.findByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String newStatus = request.get("status");
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(newStatus);
            Booking saved = bookingRepository.save(booking);

            // Notify User
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", booking.getUserId());
            if (newStatus.equals("CANCELLED")) {
                notification.put("message", "BOOKING_CANCELLED: Your entry pass for Event #" + booking.getEventId() + " was cancelled by the ADMIN.");
            } else if (newStatus.equals("REFUNDED")) {
                notification.put("message", "REFUND_PROCESSED: Your refund for Event #" + booking.getEventId() + " has been processed.");
            } else if (newStatus.equals("ADMITTED")) {
                notification.put("message", "ACCESS_GRANTED: Your entry pass for Event #" + booking.getEventId() + " verified. Welcome!");
            } else {
                notification.put("message", "STATUS_UPDATE: Your booking status changed to " + newStatus);
            }
            try { restTemplate.postForEntity(userServiceUrl, notification, Object.class); } catch (Exception ignored) {}

            // Global Notification
            java.util.Map<String, String> global = new java.util.HashMap<>();
            global.put("message", "PASS VERIFIED: Ticket TF-" + saved.getId() + " is now " + newStatus);
            try { restTemplate.postForEntity(userServiceUrl + "/global", global, Object.class); } catch (Exception ignored) {}

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @jakarta.transaction.Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + (-booking.getTicketsBooked());
            try { restTemplate.exchange(eventServiceUrl, org.springframework.http.HttpMethod.PUT, null, String.class); } catch(Exception ignored) {}
            
            booking.setStatus("CANCELLED");
            Booking saved = bookingRepository.save(booking);
            
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", booking.getUserId());
            notification.put("message", "BOOKING_CANCELLED: You cancelled your entry pass for Event #" + booking.getEventId());
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}

            // Global Notification
            java.util.Map<String, String> global = new java.util.HashMap<>();
            global.put("message", "CANCELLATION: Ticket TF-" + saved.getId() + " was cancelled by the User.");
            try { restTemplate.postForEntity(userServiceUrl + "/global", global, Object.class); } catch (Exception ignored) {}

            return ResponseEntity.ok("State Transitioned to CANCELLED");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found"));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<?> restoreBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + booking.getTicketsBooked();
            try {
                ResponseEntity<String> response = restTemplate.exchange(eventServiceUrl, org.springframework.http.HttpMethod.PUT, null, String.class);
                if (response.getStatusCode() == HttpStatus.OK) {
                    booking.setStatus("CONFIRMED");
                    Booking saved = bookingRepository.save(booking);

                    String userServiceUrl = "http://user-service/api/users/notifications";
                    java.util.Map<String, Object> notification = new java.util.HashMap<>();
                    notification.put("userId", booking.getUserId());
                    notification.put("message", "BOOKING_RESTORED: Your entry pass for Event #" + booking.getEventId() + " was successfully restored.");
                    try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}

                    // Global Notification
                    java.util.Map<String, String> global = new java.util.HashMap<>();
                    global.put("message", "RESTORED: Ticket TF-" + saved.getId() + " has been reclaimed by the User.");
                    try { restTemplate.postForEntity(userServiceUrl + "/global", global, Object.class); } catch (Exception ignored) {}

                    return ResponseEntity.ok(saved);
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Not enough availability to restore.");
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Service communication error.");
            }
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found"));
    }
}
