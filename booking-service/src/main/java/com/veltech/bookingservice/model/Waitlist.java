package com.veltech.bookingservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waitlist")
public class Waitlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long eventId;
    private Integer ticketsRequested;
    private Double expectedAmount;
    @Column(length = 2000)
    private String attendeeDetails;
    private String status = "WAITING"; // WAITING, CONFIRMED, EXPIRED
    private LocalDateTime joinedAt = LocalDateTime.now();
    private Integer position;

    public Waitlist() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public Integer getTicketsRequested() { return ticketsRequested; }
    public void setTicketsRequested(Integer ticketsRequested) { this.ticketsRequested = ticketsRequested; }
    public Double getExpectedAmount() { return expectedAmount; }
    public void setExpectedAmount(Double expectedAmount) { this.expectedAmount = expectedAmount; }
    public String getAttendeeDetails() { return attendeeDetails; }
    public void setAttendeeDetails(String attendeeDetails) { this.attendeeDetails = attendeeDetails; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
