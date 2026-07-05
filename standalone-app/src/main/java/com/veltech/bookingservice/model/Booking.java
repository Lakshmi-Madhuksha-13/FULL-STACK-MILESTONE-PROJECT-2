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
    private String status = "CONFIRMED"; // CONFIRMED, CANCELLED, REFUNDED, ADMITTED
    
    // 💸 REFUND TRACKING
    private String refundStatus = "NONE"; // NONE, REQUESTED, PROCESSING, APPROVED, REJECTED, REFUNDED
    
    private Integer rating;
    private String review;
    private java.time.LocalDateTime cancelledAt;
    
    // 💺 NEW FIELDS FOR UPGRADE
    private String seatNumber;
    private Boolean usedFlag = false;

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

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public String getRefundStatus() { return refundStatus; }
    public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }

    public java.time.LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(java.time.LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public Boolean getUsedFlag() { return usedFlag; }
    public void setUsedFlag(Boolean usedFlag) { this.usedFlag = usedFlag; }
}
