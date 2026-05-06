package com.veltech.bookingservice.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.veltech.bookingservice.model.Booking;
import com.veltech.bookingservice.model.Waitlist;
import com.veltech.bookingservice.repository.BookingRepository;
import com.veltech.bookingservice.repository.WaitlistRepository;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class BookingController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private WaitlistRepository waitlistRepository;
    @Autowired private RestTemplate restTemplate;

    // ─── BOOK TICKET ────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> bookTicket(@RequestBody Booking booking) {
        try {
            // 🛡️ ROLE SECURITY: Prevent Admins/Volunteers from booking
            String userServiceUrl = "http://user-service/api/users/" + booking.getUserId();
            try {
                java.util.Map user = restTemplate.getForObject(userServiceUrl, java.util.Map.class);
                if (user != null) {
                    String role = (String) user.get("role");
                    if ("ADMIN".equalsIgnoreCase(role) || "VOLUNTEER".equalsIgnoreCase(role)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Privileged accounts cannot book tickets.");
                    }
                }
            } catch (Exception e) { /* Fallback to allow if user-service is down or assume user */ }

            String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/reduce?slots=" + booking.getTicketsBooked();
            ResponseEntity<String> response = restTemplate.postForEntity(eventServiceUrl, null, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                booking.setStatus("CONFIRMED");
                Booking saved = bookingRepository.save(booking);

                String userServiceUrl = "http://user-service/api/users/notifications";
                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", saved.getUserId());
                notification.put("message", "🎉 BOOKING_CONFIRMED: Your entry pass TF-" + saved.getId() + " for Event #" + saved.getEventId() + " is confirmed and ready!");
                try { restTemplate.postForEntity(userServiceUrl, notification, Object.class); } catch (Exception ignored) {}

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

    // ─── GET BY USER ─────────────────────────────────────────
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getBookingHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingRepository.findByUserId(userId));
    }

    // ─── GET ALL ─────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    // ─── UPDATE REFUND STATUS ───────────────────────────────
    @PutMapping("/{id}/refund-status")
    public ResponseEntity<?> updateRefundStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String newRefundStatus = request.get("refundStatus");
        return bookingRepository.findById(id).map(booking -> {
            booking.setRefundStatus(newRefundStatus);
            if (newRefundStatus.equals("REFUNDED")) {
                booking.setStatus("REFUNDED");
            }
            Booking saved = bookingRepository.save(booking);
            
            // Notify User
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", booking.getUserId());
            notification.put("message", "REFUND_UPDATE: Your refund status for Ticket TF-" + booking.getId() + " is now " + newRefundStatus);
            try { restTemplate.postForEntity(userServiceUrl, notification, Object.class); } catch (Exception ignored) {}

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── REQUEST REFUND (User) ──────────────────────────────
    @PutMapping("/{id}/refund-request")
    public ResponseEntity<?> requestRefund(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("CANCELLED");
            booking.setRefundStatus("REQUESTED");
            booking.setCancelledAt(java.time.LocalDateTime.now());
            Booking saved = bookingRepository.save(booking);
            
            // Notify Admin via Global Notification
            String userServiceUrl = "http://user-service/api/users/notifications/global";
            java.util.Map<String, String> global = new java.util.HashMap<>();
            global.put("message", "REFUND_REQUEST: User " + booking.getUserId() + " requested a refund for Ticket TF-" + booking.getId());
            try { restTemplate.postForEntity(userServiceUrl, global, Object.class); } catch (Exception ignored) {}

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── UPDATE STATUS ───────────────────────────────────────
    @jakarta.transaction.Transactional
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String newStatus = request.get("status");
        if (newStatus == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Status is missing");

        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(newStatus.toUpperCase());
            
            // 🛡️ INTERNAL LOGIC FOR SPECIAL STATUSES
            if ("CANCELLED".equals(newStatus.toUpperCase())) {
                booking.setRefundStatus("REQUESTED");
            } else if ("REFUNDED".equals(newStatus.toUpperCase())) {
                booking.setRefundStatus("REFUNDED");
            } else if ("ADMITTED".equals(newStatus.toUpperCase())) {
                booking.setUsedFlag(true);
            }

            Booking saved = bookingRepository.save(booking);

            // 📣 NOTIFICATIONS (Non-blocking)
            try {
                String userServiceUrl = "http://user-service/api/users/notifications";
                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", booking.getUserId());
                
                String message = "STATUS_UPDATE: Your ticket TF-" + id + " status changed to " + newStatus;
                if ("CANCELLED".equals(newStatus.toUpperCase())) message = "BOOKING_REVOKED: Your entry pass TF-" + id + " was cancelled by Admin.";
                else if ("REFUNDED".equals(newStatus.toUpperCase())) message = "REFUND_SUCCESS: Your payment for TF-" + id + " has been reversed.";
                else if ("ADMITTED".equals(newStatus.toUpperCase())) message = "ENTRY_GRANTED: Welcome to the Nexus! Your ticket TF-" + id + " is verified.";
                
                notification.put("message", message);
                restTemplate.postForEntity(userServiceUrl, notification, Object.class);
            } catch (Exception e) { /* Logged but non-fatal */ }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking TF-" + id + " not found"));
    }

    // ─── CANCEL BOOKING (triggers waitlist) ──────────────────
    @jakarta.transaction.Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId() + "/tickets?count=" + (-booking.getTicketsBooked());
            try { restTemplate.exchange(eventServiceUrl, org.springframework.http.HttpMethod.PUT, null, String.class); } catch(Exception ignored) {}

            booking.setStatus("CANCELLED");
            booking.setRefundStatus("REQUESTED");
            booking.setCancelledAt(java.time.LocalDateTime.now());
            bookingRepository.save(booking);

            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", booking.getUserId());
            notification.put("message", "🚫 BOOKING_CANCELLED: You cancelled your entry pass for Event #" + booking.getEventId() + ". Your refund is being processed.");
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}

            java.util.Map<String, String> global = new java.util.HashMap<>();
            global.put("message", "CANCELLATION: Ticket TF-" + booking.getId() + " was cancelled by the User.");
            try { restTemplate.postForEntity(userServiceUrl + "/global", global, Object.class); } catch (Exception ignored) {}

            // Process waitlist — notify first waiter
            processWaitlistForEvent(booking.getEventId(), userServiceUrl);

            return ResponseEntity.ok("State Transitioned to CANCELLED");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found"));
    }

    // ─── RESTORE BOOKING ─────────────────────────────────────
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

    // ─── ADD REVIEW ──────────────────────────────────────────
    @PutMapping("/{id}/review")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody java.util.Map<String, Object> request) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setRating((Integer) request.get("rating"));
            booking.setReview((String) request.get("review"));
            return ResponseEntity.ok(bookingRepository.save(booking));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── WAITLIST: JOIN ──────────────────────────────────────
    @PostMapping("/waitlist")
    public ResponseEntity<?> joinWaitlist(@RequestBody Waitlist entry) {
        if (waitlistRepository.existsByUserIdAndEventIdAndStatus(entry.getUserId(), entry.getEventId(), "WAITING")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Already on waitlist for this event.");
        }
        entry.setStatus("WAITING");
        entry.setJoinedAt(java.time.LocalDateTime.now());
        long pos = waitlistRepository.findByEventIdAndStatusOrderByJoinedAtAsc(entry.getEventId(), "WAITING").size() + 1;
        entry.setPosition((int) pos);
        Waitlist saved = waitlistRepository.save(entry);

        String userServiceUrl = "http://user-service/api/users/notifications";
        java.util.Map<String, Object> notification = new java.util.HashMap<>();
        notification.put("userId", saved.getUserId());
        notification.put("message", "⏳ WAITLIST_JOINED: You're #" + pos + " on the waitlist for Event #" + saved.getEventId() + ". We'll notify you instantly when a spot opens!");
        try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}

        return ResponseEntity.ok(saved);
    }

    // ─── WAITLIST: GET ALL (Admin) ───────────────────────────
    @GetMapping("/waitlist")
    public ResponseEntity<List<Waitlist>> getAllWaitlist() {
        return ResponseEntity.ok(waitlistRepository.findAll());
    }

    // ─── WAITLIST: GET BY USER ───────────────────────────────
    @GetMapping("/waitlist/user/{userId}")
    public ResponseEntity<List<Waitlist>> getUserWaitlist(@PathVariable Long userId) {
        return ResponseEntity.ok(waitlistRepository.findByUserIdOrderByJoinedAtAsc(userId));
    }

    // ─── WAITLIST: GET BY EVENT ──────────────────────────────
    @GetMapping("/waitlist/event/{eventId}")
    public ResponseEntity<List<Waitlist>> getEventWaitlist(@PathVariable Long eventId) {
        return ResponseEntity.ok(waitlistRepository.findByEventIdAndStatusOrderByJoinedAtAsc(eventId, "WAITING"));
    }

    // ─── WAITLIST: LEAVE ─────────────────────────────────────
    @DeleteMapping("/waitlist/{id}")
    public ResponseEntity<?> leaveWaitlist(@PathVariable Long id) {
        return waitlistRepository.findById(id).map(entry -> {
            entry.setStatus("EXPIRED");
            waitlistRepository.save(entry);
            return ResponseEntity.ok("Removed from waitlist.");
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── WAITLIST: CONFIRM (Admin) ───────────────────────────
    @PutMapping("/waitlist/{id}/confirm")
    public ResponseEntity<?> confirmWaitlist(@PathVariable Long id) {
        return waitlistRepository.findById(id).map(entry -> {
            entry.setStatus("CONFIRMED");
            Waitlist saved = waitlistRepository.save(entry);
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", saved.getUserId());
            notification.put("message", "🎉 WAITLIST_CONFIRMED: Your waitlist for Event #" + saved.getEventId() + " has been manually confirmed by Admin! Complete your payment.");
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── INTERNAL: Process waitlist on slot opening ──────────
    private void processWaitlistForEvent(Long eventId, String userServiceUrl) {
        List<Waitlist> waiting = waitlistRepository.findByEventIdAndStatusOrderByJoinedAtAsc(eventId, "WAITING");
        if (!waiting.isEmpty()) {
            Waitlist next = waiting.get(0);
            next.setStatus("CONFIRMED");
            waitlistRepository.save(next);
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", next.getUserId());
            notification.put("message", "🎉 WAITLIST_CONFIRMED: A spot opened for Event #" + eventId + "! Your waitlist is now CONFIRMED. Complete your payment within 24 hours.");
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}
        }
    }

    // ─── UPDATE REFUND STATUS (Admin) ────────────────────────
    @PutMapping("/{id}/refund")
    public ResponseEntity<?> updateRefundStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        return bookingRepository.findById(id).map(booking -> {
            String newRefundStatus = request.get("refundStatus");
            booking.setRefundStatus(newRefundStatus);
            if ("REFUNDED".equals(newRefundStatus)) {
                booking.setStatus("REFUNDED");
            }
            Booking saved = bookingRepository.save(booking);
            
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", booking.getUserId());
            notification.put("message", "💸 REFUND_UPDATE: Your refund for Booking TF-" + booking.getId() + " is now " + newRefundStatus + ".");
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch(Exception ignored) {}
            
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── PREVIEW TICKET (Step 1) ────────────────────────────
    @GetMapping("/preview-ticket/{id}")
    public ResponseEntity<?> previewTicket(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            java.util.Map<String, Object> details = new java.util.HashMap<>();
            
            // 🛡️ INITIAL FALLBACKS
            String name = "Nexus Guest";
            String email = "REGISTRY SECURE";
            String dept = "GENERAL";
            String eventName = "Official Nexus Event";
            String venue = "Nexus Grounds";
            String dateTime = "SCHEDULED";
            String status = "PENDING ⏳";
            boolean actionable = true;

            // 🛡️ DATA EXTRACTION (ATTENDEES)
            try {
                if (booking.getAttendeeDetails() != null && !booking.getAttendeeDetails().isEmpty()) {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    java.util.List<java.util.Map<String, String>> attendees = mapper.readValue(
                        booking.getAttendeeDetails(), 
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, String>>>(){}
                    );
                    if (!attendees.isEmpty()) {
                        java.util.Map<String, String> first = attendees.get(0);
                        if (first.get("name") != null) name = first.get("name");
                        if (first.get("email") != null) email = first.get("email");
                        if (first.get("department") != null) dept = first.get("department");
                    }
                }
            } catch (Exception e) { System.err.println("JSON Parse Fail: " + e.getMessage()); }

            // 🛡️ STATUS LOGIC
            String bStatus = booking.getStatus() != null ? booking.getStatus().toUpperCase() : "CONFIRMED";
            if (Boolean.TRUE.equals(booking.getUsedFlag()) || "ADMITTED".equals(bStatus)) {
                status = "ADMITTED ✅";
                actionable = false;
            } else if ("REJECTED".equals(bStatus)) {
                status = "REJECTED ❌";
                actionable = true;
            } else if ("CANCELLED".equals(bStatus) || "REFUNDED".equals(bStatus)) {
                status = "INVALID 🚫";
                actionable = false;
            }

            // 🛡️ EVENT SYNC
            try {
                String eventServiceUrl = "http://event-service/api/events/" + booking.getEventId();
                java.util.Map event = restTemplate.getForObject(eventServiceUrl, java.util.Map.class);
                if (event != null) {
                    if (event.get("eventName") != null) eventName = (String) event.get("eventName");
                    if (event.get("venue") != null) venue = (String) event.get("venue");
                    if (event.get("dateTime") != null) dateTime = (String) event.get("dateTime");
                }
            } catch (Exception e) { System.err.println("Event Sync Fail: " + e.getMessage()); }

            // 🛡️ FINAL MAP ASSEMBLY (Guaranteed Keys)
            details.put("ticketId", id.toString());
            details.put("userName", name);
            details.put("userEmail", email);
            details.put("userDept", dept);
            details.put("eventName", eventName);
            details.put("venue", venue);
            details.put("dateTime", dateTime);
            details.put("status", status);
            details.put("isActionable", actionable);
            details.put("seatNumber", booking.getSeatNumber() != null ? booking.getSeatNumber() : "GENERAL");
            details.put("price", booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);

            return ResponseEntity.ok(details);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ticket TF-" + id + " Not Found"));
    }

    // ─── VERIFY/ADMIT TICKET (Step 2) ────────────────────────
    @GetMapping("/admit-ticket/{id}")
    public ResponseEntity<?> verifyTicket(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setUsedFlag(true);
            booking.setStatus("ADMITTED");
            Booking saved = bookingRepository.save(booking);

            // 🎁 REWARD: Add 50 Nexus Coins for participation
            try {
                String userServiceUrl = "http://user-service/api/users/" + saved.getUserId() + "/coins";
                java.util.Map<String, Integer> coinsRequest = new java.util.HashMap<>();
                coinsRequest.put("coins", 50);
                restTemplate.put(userServiceUrl, coinsRequest);
            } catch (Exception e) { System.err.println("Coin Reward Fail: " + e.getMessage()); }

            // 📣 NOTIFICATION
            try {
                String userServiceUrl = "http://user-service/api/users/notifications";
                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", saved.getUserId());
                notification.put("message", "🌟 ENTRY GRANTED: Welcome to the Nexus! You've earned 50 Coins for attending Event #" + saved.getEventId() + ". Your certificate is now ready!");
                restTemplate.postForObject(userServiceUrl, notification, Object.class);
            } catch (Exception e) {}

            return ResponseEntity.ok("Participant Admitted ✅");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not Found"));
    }

    // ─── REJECT TICKET ───────────────────────────────────────
    @GetMapping("/reject-ticket/{id}")
    public ResponseEntity<?> rejectTicket(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("REJECTED");
            bookingRepository.save(booking);

            // 📣 NOTIFICATION
            try {
                String userServiceUrl = "http://user-service/api/users/notifications";
                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", booking.getUserId());
                notification.put("message", "⚠️ SECURITY ALERT: Your entry pass TF-" + id + " was rejected at the gate. Contact support for clearance.");
                restTemplate.postForObject(userServiceUrl, notification, Object.class);
            } catch (Exception e) {}

            return ResponseEntity.ok("Participant Rejected ❌");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not Found"));
    }

    // ─── UPDATE SEAT ─────────────────────────────────────────
    @PutMapping("/{id}/update-seat")
    public ResponseEntity<?> updateSeat(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setSeatNumber(request.get("seatNumber"));
            return ResponseEntity.ok(bookingRepository.save(booking));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── SQUAD FINDER ───────────────────────────────────────
    @Autowired private com.veltech.bookingservice.repository.SquadRepository squadRepository;

    @PostMapping("/squads")
    public ResponseEntity<?> createSquad(@RequestBody Squad squad) {
        squad.setStatus("OPEN");
        squad.setMembers(squad.getCreatorId().toString());
        return ResponseEntity.ok(squadRepository.save(squad));
    }

    @GetMapping("/squads/event/{eventId}")
    public ResponseEntity<List<Squad>> getEventSquads(@PathVariable Long eventId) {
        return ResponseEntity.ok(squadRepository.findByEventIdAndStatus(eventId, "OPEN"));
    }

    @PutMapping("/squads/{id}/join")
    public ResponseEntity<?> joinSquad(@PathVariable Long id, @RequestBody java.util.Map<String, Long> request) {
        Long userId = request.get("userId");
        return squadRepository.findById(id).map(squad -> {
            String members = squad.getMembers();
            if (java.util.Arrays.asList(members.split(",")).contains(userId.toString())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Already in squad.");
            }
            if (squad.getMembers().split(",").length >= squad.getMaxMembers()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Squad is full.");
            }
            squad.setMembers(members + "," + userId);
            if (squad.getMembers().split(",").length >= squad.getMaxMembers()) {
                squad.setStatus("FULL");
            }
            Squad saved = squadRepository.save(squad);
            
            // Notify Creator
            String userServiceUrl = "http://user-service/api/users/notifications";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("userId", squad.getCreatorId());
            notification.put("message", "🤝 SQUAD_UPDATE: A new member joined your squad '" + squad.getTeamName() + "'!");
            try { restTemplate.postForObject(userServiceUrl, notification, Object.class); } catch (Exception ignored) {}

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── FLASH COUPONS ───────────────────────────────────────
    @Autowired private com.veltech.bookingservice.repository.CouponRepository couponRepository;

    @PostMapping("/flash-coupon")
    public ResponseEntity<?> triggerFlashCoupon(@RequestBody java.util.Map<String, Object> request) {
        String code = "FLASH-" + (request.get("code") != null ? request.get("code") : (int)(Math.random()*9000+1000));
        Double discount = Double.parseDouble(request.get("discount").toString());
        
        Coupon flash = new Coupon(code, discount);
        couponRepository.save(flash);

        // Broadcast to all users via User Service
        String userServiceUrl = "http://user-service/api/users/notifications/global";
        java.util.Map<String, String> broadcast = new java.util.HashMap<>();
        broadcast.put("message", "⚡ FLASH SALE: Use code " + code + " for " + discount + "% OFF on all events! Hurry, limited slots!");
        try { restTemplate.postForEntity(userServiceUrl, broadcast, Object.class); } catch (Exception ignored) {}

        return ResponseEntity.ok(flash);
    }
}
