package com.veltech.bookingservice.repository;

import com.veltech.bookingservice.model.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {
    List<Waitlist> findByUserIdOrderByJoinedAtAsc(Long userId);
    List<Waitlist> findByEventIdAndStatusOrderByJoinedAtAsc(Long eventId, String status);
    boolean existsByUserIdAndEventIdAndStatus(Long userId, Long eventId, String status);
}
