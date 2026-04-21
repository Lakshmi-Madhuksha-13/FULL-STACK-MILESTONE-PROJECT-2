package com.veltech.userservice.repository;

import com.veltech.userservice.model.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByUserIdOrderByTimestampAsc(Long userId);
    List<SupportMessage> findAllByOrderByTimestampAsc();
}
