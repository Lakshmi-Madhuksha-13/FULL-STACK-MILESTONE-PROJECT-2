package com.veltech.eventservice.controller;

import com.veltech.eventservice.model.Event;
import com.veltech.eventservice.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin("*")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        Optional<Event> event = eventRepository.findById(id);
        return event.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Event> addEvent(@RequestBody Event event) {
        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.ok(savedEvent);
    }

    @PutMapping("/{id}/tickets")
    public ResponseEntity<?> updateTickets(@PathVariable Long id, @RequestParam int count) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            if (event.getAvailableTickets() >= count) {
                event.setAvailableTickets(event.getAvailableTickets() - count);
                eventRepository.save(event);
                return ResponseEntity.ok("Tickets updated successfully");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Not enough tickets available");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Event not found");
    }
    @Autowired
    private org.springframework.web.client.RestTemplate restTemplate;

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event eventDetails) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            boolean changed = !event.getVenue().equals(eventDetails.getVenue()) || !event.getDateTime().equals(eventDetails.getDateTime());
            
            event.setEventName(eventDetails.getEventName());
            event.setDepartment(eventDetails.getDepartment());
            event.setDateTime(eventDetails.getDateTime());
            event.setVenue(eventDetails.getVenue());
            event.setPrice(eventDetails.getPrice());
            event.setTotalTickets(eventDetails.getTotalTickets());
            event.setAvailableTickets(eventDetails.getAvailableTickets());
            Event updated = eventRepository.save(event);

            if (changed) {
                notifyAttendees(id, "Event update: " + event.getEventName() + " details have been changed by Admin.");
            }
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        if (eventRepository.findById(id).isPresent()) {
            String name = eventRepository.findById(id).get().getEventName();
            notifyAttendees(id, "CANCELLATION: The event '" + name + "' has been cancelled by the administrator.");
            eventRepository.deleteById(id);
            return ResponseEntity.ok("Event deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Event not found");
    }

    private void notifyAttendees(Long eventId, String message) {
        try {
            // Get all bookings for this event
            ResponseEntity<List> bookingsResponse = restTemplate.getForEntity("http://booking-service/api/bookings/event/" + eventId, List.class);
            List<java.util.Map<String, Object>> bookings = bookingsResponse.getBody();
            if (bookings != null) {
                for (java.util.Map<String, Object> booking : bookings) {
                    java.util.Map<String, Object> notification = new java.util.HashMap<>();
                    notification.put("userId", booking.get("userId"));
                    notification.put("message", message);
                    restTemplate.postForObject("http://user-service/api/users/notifications", notification, Object.class);
                }
            }
        } catch (Exception e) {}
    }
}
