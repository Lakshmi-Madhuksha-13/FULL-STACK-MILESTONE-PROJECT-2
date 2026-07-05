package com.veltech.bookingservice.controller;

import java.util.*;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import jakarta.transaction.Transactional;

import com.veltech.bookingservice.model.Booking;
import com.veltech.bookingservice.model.Waitlist;
import com.veltech.bookingservice.model.Squad;
import com.veltech.bookingservice.model.Coupon;
import com.veltech.bookingservice.repository.BookingRepository;
import com.veltech.bookingservice.repository.WaitlistRepository;
import com.veltech.bookingservice.repository.SquadRepository;
import com.veltech.bookingservice.repository.CouponRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class BookingController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private WaitlistRepository waitlistRepository;
    @Autowired private SquadRepository squadRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private RestTemplate restTemplate;
    @Autowired private com.veltech.bookingservice.service.EmailService emailService;

    // ─── BOOK TICKET ────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> bookTicket(@RequestBody Booking booking) {
        try {
            // 🛡️ ROLE SECURITY: Enabled for all roles for development testing
            /*
            String checkUrl = "http://user-service/api/users/" + booking.getUserId();
            try {
                Map user = restTemplate.getForObject(checkUrl, Map.class);
                if (user != null) {
                    String role = (String) user.get("role");
                    if ("ADMIN".equalsIgnoreCase(role) || "VOLUNTEER".equalsIgnoreCase(role)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Privileged accounts cannot book tickets.");
                    }
                }
            } catch (Exception e) { }
            */

            String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/reduce?slots=" + booking.getTicketsBooked();
            ResponseEntity<String> response = restTemplate.postForEntity(eventServiceUrl, null, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                booking.setStatus("CONFIRMED");
                Booking saved = bookingRepository.save(booking);

                String notifyUrl = "http://user-service/api/users/notifications";
                Map<String, Object> notification = new HashMap<>();
                notification.put("userId", saved.getUserId());
                notification.put("message", "🎉 BOOKING_CONFIRMED: Your entry pass TF-" + saved.getId() + " for Event #" + saved.getEventId() + " is confirmed!");
                try { restTemplate.postForEntity(notifyUrl, notification, Object.class); } catch (Exception ignored) {}

                Map<String, String> global = new HashMap<>();
                global.put("message", "NEW BOOKING: Ticket TF-" + saved.getId() + " issued for Event #" + saved.getEventId());
                try { restTemplate.postForEntity(notifyUrl + "/global", global, Object.class); } catch (Exception ignored) {}

                // 📧 DISPATCH TICKET EMAIL
                new Thread(() -> {
                    try {
                        String userUrl = "http://user-service/api/users/" + saved.getUserId();
                        Map userData = restTemplate.getForObject(userUrl, Map.class);
                        String eventUrl = "http://event-service/api/events/" + saved.getEventId();
                        Map eventData = restTemplate.getForObject(eventUrl, Map.class);
                        
                        if (userData != null && eventData != null) {
                            emailService.sendTicketEmail(
                                (String) userData.get("email"),
                                (String) userData.get("name"),
                                (String) eventData.get("eventName"),
                                saved.getId().toString(),
                                (String) eventData.get("venue"),
                                (String) eventData.get("dateTime")
                            );
                        }
                    } catch (Exception e) {
                        System.err.println("[Booking Nexus]: Email Dispatch Error: " + e.getMessage());
                    }
                }).start();

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

    @PutMapping("/{id}/refund-request")
    public ResponseEntity<?> requestRefund(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("CANCELLED");
            booking.setRefundStatus("REQUESTED");
            booking.setCancelledAt(LocalDateTime.now());
            Booking saved = bookingRepository.save(booking);
            
            new Thread(() -> {
                try {
                    String globalUrl = "http://user-service/api/users/notifications/global";
                    Map<String, String> global = new HashMap<>();
                    global.put("message", "REFUND_REQUEST: Ticket TF-" + saved.getId() + " cancelled by User " + saved.getUserId());
                    restTemplate.postForEntity(globalUrl, global, Object.class);
                } catch (Exception ignored) {}
            }).start();

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String newStatus = request.get("status");
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(newStatus.toUpperCase());
            if ("ADMITTED".equals(newStatus.toUpperCase())) booking.setUsedFlag(true);
            Booking saved = bookingRepository.save(booking);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            String eventUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + (-booking.getTicketsBooked());
            try { restTemplate.exchange(eventUrl, HttpMethod.PUT, null, String.class); } catch(Exception ignored) {}

            booking.setStatus("CANCELLED");
            booking.setRefundStatus("REQUESTED");
            booking.setCancelledAt(LocalDateTime.now());
            bookingRepository.save(booking);

            processWaitlistForEvent(booking.getEventId());

            return ResponseEntity.ok("State Transitioned to CANCELLED");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found"));
    }

    private void processWaitlistForEvent(Long eventId) {
        List<Waitlist> waiting = waitlistRepository.findByEventIdAndStatusOrderByJoinedAtAsc(eventId, "WAITING");
        if (!waiting.isEmpty()) {
            Waitlist next = waiting.get(0);
            next.setStatus("CONFIRMED");
            waitlistRepository.save(next);
            
            try {
                Map<String, Object> notification = new HashMap<>();
                notification.put("userId", next.getUserId());
                notification.put("message", "🎉 WAITLIST_CONFIRMED: A spot opened for Event #" + eventId + "!");
                restTemplate.postForObject("http://user-service/api/users/notifications", notification, Object.class);
            } catch (Exception ignored) {}
        }
    }

    @GetMapping("/preview-ticket/{id}")
    public ResponseEntity<?> previewTicket(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            Map<String, Object> details = new HashMap<>();
            details.put("ticketId", id.toString());
            details.put("status", booking.getStatus());
            details.put("seatNumber", booking.getSeatNumber() != null ? booking.getSeatNumber() : "GENERAL");
            
            try {
                if (booking.getAttendeeDetails() != null) {
                    ObjectMapper mapper = new ObjectMapper();
                    List<Map<String, String>> attendees = mapper.readValue(booking.getAttendeeDetails(), new TypeReference<List<Map<String, String>>>(){});
                    if (!attendees.isEmpty()) details.put("userName", attendees.get(0).get("name"));
                }
            } catch (Exception ignored) {}

            try {
                String eventUrl = "http://event-service/api/events/" + booking.getEventId();
                Map event = restTemplate.getForObject(eventUrl, Map.class);
                if (event != null) {
                    details.put("eventName", event.get("eventName"));
                    details.put("venue", event.get("venue"));
                    details.put("dateTime", event.get("dateTime"));
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok((Object) details);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not Found"));
    }

    @GetMapping("/admit-ticket/{id}")
    public ResponseEntity<?> admitTicket(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setUsedFlag(true);
            booking.setStatus("ADMITTED");
            bookingRepository.save(booking);
            return ResponseEntity.ok("Admitted ✅");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/squads")
    public ResponseEntity<?> createSquad(@RequestBody Squad squad) {
        squad.setStatus("OPEN");
        squad.setMembers(squad.getCreatorId().toString());
        return ResponseEntity.ok(squadRepository.save(squad));
    }

    @PutMapping("/squads/{id}/join")
    public ResponseEntity<?> joinSquad(@PathVariable Long id, @RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        return squadRepository.findById(id).map(squad -> {
            String members = squad.getMembers() == null ? "" : squad.getMembers();
            if (members.contains(userId.toString())) return ResponseEntity.status(HttpStatus.CONFLICT).body("Already in squad.");
            
            String[] memberList = members.isEmpty() ? new String[0] : members.split(",");
            if (memberList.length >= squad.getMaxMembers()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Squad is full.");
            
            squad.setMembers(members.isEmpty() ? userId.toString() : members + "," + userId);
            if (squad.getMembers().split(",").length >= squad.getMaxMembers()) squad.setStatus("FULL");
            
            return ResponseEntity.ok(squadRepository.save(squad));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/flash-coupon")
    public ResponseEntity<?> triggerFlashCoupon(@RequestBody Map<String, Object> request) {
        String code = "FLASH-" + (int)(Math.random()*9000+1000);
        Double discount = Double.parseDouble(request.get("discount").toString());
        Coupon flash = new Coupon(code, discount);
        return ResponseEntity.ok(couponRepository.save(flash));
    }
    
    @PostMapping("/waitlist")
    public ResponseEntity<?> joinWaitlist(@RequestBody Waitlist entry) {
        entry.setStatus("WAITING");
        entry.setJoinedAt(LocalDateTime.now());
        return ResponseEntity.ok(waitlistRepository.save(entry));
    }
}
