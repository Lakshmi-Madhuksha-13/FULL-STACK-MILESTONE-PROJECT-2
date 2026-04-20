package com.veltech.eventservice;

import com.veltech.eventservice.model.Event;
import com.veltech.eventservice.repository.EventRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Arrays;

@SpringBootApplication
public class EventServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventServiceApplication.class, args);
	}

	@Bean
	@org.springframework.cloud.client.loadbalancer.LoadBalanced
	public org.springframework.web.client.RestTemplate restTemplate() {
		return new org.springframework.web.client.RestTemplate();
	}

	@Bean
	public CommandLineRunner loadData(EventRepository repository) {
		return args -> {
			// Clear existing to ensure all 10 distinct events are loaded during this phase
			repository.deleteAll();
			
			repository.saveAll(Arrays.asList(
				new Event("Web3 & Blockchain Hackathon", "Computer Science", "2026-10-15 10:00 AM", "IIT Madras, Chennai - ICSR Auditorium", 500.00, 100, 100),
				new Event("CodeSprint 2026", "IT", "2026-11-01 08:00 AM", "IIT Delhi, New Delhi - Bharti Building", 250.00, 75, 75),
				new Event("AI/ML Global Summit", "Artificial Intelligence", "2026-11-12 11:30 AM", "IISc Bangalore, Bengaluru - J.N. Tata Hall", 1500.00, 200, 200),
				new Event("Cyber CTF (Capture The Flag)", "Cyber Security", "2026-12-05 09:00 AM", "IIT Bombay, Mumbai - Convocation Hall", 800.00, 50, 50),
				new Event("Cloud Natives Con", "Computer Science", "2026-12-10 02:00 PM", "NIT Trichy, Tiruchirappalli - SJ Hall", 100.00, 500, 500),
				new Event("Robo Wars Championship", "Mechanical", "2027-01-15 10:00 AM", "BITS Pilani, Hyderabad - Open Air Theatre", 2000.00, 150, 150),
				new Event("IoT Makerspace Expo", "Electronics", "2027-01-20 01:00 PM", "IIT Kharagpur, Kharagpur - Netaji Auditorium", 300.00, 40, 40),
				new Event("Data Science Bootcamp", "Data Science", "2027-02-10 09:00 AM", "NIT Surathkal, Mangalore - STEP Building", 600.00, 120, 120),
				new Event("AR/VR Game Jam", "Design & Media", "2027-03-05 03:00 PM", "VIT Vellore, Vellore - Anna Auditorium", 450.00, 60, 60),
				new Event("Quantum Computing Intro", "Physics & CS", "2027-04-12 11:00 AM", "Anna University, Chennai - Vivekananda Hall", 1200.00, 80, 80)
			));
		};
	}
}
