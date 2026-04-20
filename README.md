# Technical Fest Ticket Booking System (Microservices)

A professional, full-stack distributed system designed to manage collegiate technical festivals, track live ticket inventory, and handle multi-attendee registrations. Built with a modern Microservices architecture using Spring Boot and React.

## 🏛️ System Architecture

The project follows a decoupled Microservices pattern for high scalability and modularity:

*   **Eureka Server (Port 8761):** Acts as the Service Registry, allowing all microservices to discover and communicate with each other dynamically.
*   **User Service (Port 8081):** Manages user authentication, profile roles (USER/ADMIN), and hosts the **Notification Engine** for real-time user alerts.
*   **Event Service (Port 8082):** Maintains the directory of technical fests and manages live ticket inventory across different colleges/locations.
*   **Booking Service (Port 8083):** Processes transactions, handles multi-attendee data (serialized JSON), and communicates with the Event Service for inventory updates.
*   **React Frontend (Port 5173):** A premium, glassmorphism-styled landing page and dashboard system with real-time notification polling.

## 🚀 Key Features

*   **Multi-Attendee Booking:** Allows users to book 1-10 tickets at once, capturing unique names, emails, and departments for every individual attendee.
*   **Live Notification Engine:** Automatically alerts users on their dashboard when an Admin modifies event logistics (Venue/Time) or cancels a booking.
*   **Dynamic Inventory:** Real-time tracking of `availableTickets`. Tickets are automatically restored to the pool if a booking is cancelled by an Admin.
*   **Premium UI/UX:** Dark-mode aesthetic featuring hover-reactive event cards, success modals with digital tickets, and unified notification badges.
*   **Admin Control Panel:** Dedicated dashboard for event CRUD operations, user management, and visibility into the global booking log.

## 🛠️ Technology Stack

*   **Backend:** Java 17+, Spring Boot 3.x, Spring Data JPA, Hibernate.
*   **Inter-Service Communication:** Spring Cloud Netflix Eureka, RestTemplate (Load-Balanced).
*   **Frontend:** React JS (Vite), Axios, React Router, Vanilla CSS (Glassmorphism).
*   **Database:** MySQL 8.0.
*   **Tools:** Maven, Git, Postman.

## 🏃 Running the Project

### Prerequisites:
1.  **MySQL:** Running on `localhost:3306` with credentials `root/root`.
2.  **Database:** Create a schema named `ticket_booking`.

### Startup Order:
1.  Start `eureka-server` (Wait for dashboard at [http://localhost:8761](http://localhost:8761))
2.  Start `user-service`, `event-service`, and `booking-service` in any order.
3.  Navigate to `frontend/` and run `npm install` followed by `npm run dev`.

---

## 📸 Presentation Content
For your PPT/Presentation, focus on the **Cross-Service Notification** flow and the **Multi-Attendee State Management** in the React frontend as the primary technical highlights.

Developed for the **Full Stack Milestone Project 2**.
