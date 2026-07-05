package com.veltech.bookingservice.repository;

import com.veltech.bookingservice.model.Squad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SquadRepository extends JpaRepository<Squad, Long> {
    List<Squad> findByEventIdAndStatus(Long eventId, String status);
    List<Squad> findByCreatorId(Long creatorId);
}
