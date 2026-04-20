package com.veltech.eventservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String eventName;
    private String department;
    private String dateTime;
    private String venue;
    private Double price;
    private Integer totalTickets;
    private Integer availableTickets;

    public Event() {
    }

    public Event(String eventName, String department, String dateTime, String venue, Double price, Integer totalTickets, Integer availableTickets) {
        this.eventName = eventName;
        this.department = department;
        this.dateTime = dateTime;
        this.venue = venue;
        this.price = price;
        this.totalTickets = totalTickets;
        this.availableTickets = availableTickets;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDateTime() { return dateTime; }
    public void setDateTime(String dateTime) { this.dateTime = dateTime; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getTotalTickets() { return totalTickets; }
    public void setTotalTickets(Integer totalTickets) { this.totalTickets = totalTickets; }

    public Integer getAvailableTickets() { return availableTickets; }
    public void setAvailableTickets(Integer availableTickets) { this.availableTickets = availableTickets; }
}
