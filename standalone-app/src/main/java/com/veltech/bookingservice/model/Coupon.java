package com.veltech.bookingservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "coupons")
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code;
    private Double discountPercent;
    private Boolean active = true;

    public Coupon() {}
    public Coupon(String code, Double discountPercent) {
        this.code = code;
        this.discountPercent = discountPercent;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
