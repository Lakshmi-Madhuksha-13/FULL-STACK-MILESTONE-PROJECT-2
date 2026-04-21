package com.veltech.bookingservice.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
        // Assume price calculation logic happens here or at frontend, we will trust frontend amount for now
        // But we must update tickets in Event service
        String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + booking.getTicketsBooked();
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    eventServiceUrl, 
                    org.springframework.http.HttpMethod.PUT, 
                    null, 
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                Booking savedBooking = bookingRepository.save(booking);
                return ResponseEntity.ok(savedBooking);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to book tickets. Not enough availability.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error communicating with Event Service: " + e.getMessage());
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
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        return bookingRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<Booking>> getBookingsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(bookingRepository.findByEventId(eventId));
    }

    @jakarta.transaction.Transactional
    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            // Restore tickets in Event service
            String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + (-booking.getTicketsBooked());
            restTemplate.exchange(eventServiceUrl, org.springframework.http.HttpMethod.PUT, null, String.class);
            
            // Notify User with a Rich Snapshot
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", booking.getUserId());
            
            // Build Snapshot Message
            String snapshot = String.format(
                "BOOKING_SNAPSHOT|ID: #TF-%d | Event: %s | Cost: ₹%.2f | Slots: %d | Attendees: %s",
                id, 
                "Event #" + booking.getEventId(), // Controller doesn't have name, frontend will resolve or we can hardcode
                booking.getTotalAmount(),
                booking.getTicketsBooked(),
                booking.getAttendeeDetails() // This contains JSON string of names
            );
            
            notification.put("message", snapshot);
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception e) {}

            bookingRepository.delete(booking);
            return ResponseEntity.ok("Booking Snapshot Archived and Cancelled");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found"));
    }
}
