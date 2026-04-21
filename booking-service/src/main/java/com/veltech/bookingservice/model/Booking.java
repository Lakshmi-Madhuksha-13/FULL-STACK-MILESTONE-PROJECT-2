package com.veltech.bookingservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long eventId;
    private Integer ticketsBooked;
    private Double totalAmount;
    @Column(length = 2000)
    private String attendeeDetails; 
    
    // 🏦 FINANCIAL STATUS FIELD
    private String status = "CONFIRMED"; // CONFIRMED, CANCELLED, REFUNDED

    public Booking() {
    }

    public Booking(Long userId, Long eventId, Integer ticketsBooked, Double totalAmount, String attendeeDetails) {
        this.userId = userId;
        this.eventId = eventId;
        this.ticketsBooked = ticketsBooked;
        this.totalAmount = totalAmount;
        this.attendeeDetails = attendeeDetails;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public Integer getTicketsBooked() { return ticketsBooked; }
    public void setTicketsBooked(Integer ticketsBooked) { this.ticketsBooked = ticketsBooked; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getAttendeeDetails() { return attendeeDetails; }
    public void setAttendeeDetails(String attendeeDetails) { this.attendeeDetails = attendeeDetails; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
