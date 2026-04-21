# 🚀 Technical Fest: Global Microservices Ticket System 🎟️

A world-class, "Gold Standard" technical fest booking ecosystem built with **Spring Boot Microservices** and **React**. This platform provides a seamless, high-fidelity experience for students to browse, book, and manage their festival journey.

## 🍱 Ecosystem Architecture
- **Eureka Server:** The central nervous system for service discovery.
- **User Service (8081):** Manages elite memberships, security, and real-time notifications.
- **Event Service (8082):** The global database for technical festivals and venue management.
- **Booking Service (8083):** Handles secure transactions and ticket ledger management.
- **Vite Frontend:** A premium, glassmorphic UI with dynamic dark/light modes.

## ✨ Elite Features
- **🌓 Adaptive Theme Engine:** Smooth transitions between Dark and Light modes.
- **📊 Live Pulse Leaderboard:** Real-time department ranking based on fest registrations.
- **🎟️ Digital Access Pass:** Premium tickets with scannable QR codes for authentication.
- **⏱️ Event Chronometer:** Dynamic real-time countdown to your next booked festival.
- **🎓 Certification Hub:** Automated generation of Digital Certificates with PDF export.
- **📅 Cloud Calendar Sync:** One-click sync to Google/Outlook calendars (.ics).
- **💳 Secure Checkout:** Integrated payment gateway simulation (UPI & Card).

## 🚀 Deployment & Installation
1. **Start MySQL:** Ensure your local database is active on port 3306.
2. **Launch Cluster:** Start Eureka Server followed by the User, Event, and Booking services.
3. **Frontend Boot:** 
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Cloud Ready:** The system is architected for instant deployment to Vercel and Render.

---
**Built with Precision. Engineered for Excellence.** 🏆
