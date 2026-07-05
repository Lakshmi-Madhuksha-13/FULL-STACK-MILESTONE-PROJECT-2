package com.veltech.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class UserEmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendWelcomeEmail(String to, String userName) {
        if (mailSender == null) {
            System.out.println("[User Email Mock]: Sending welcome email to " + to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("🚀 Welcome to Technical Fest 2026!");

            String htmlContent = "<html><body style='font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 40px;'>" +
                    "<div style='max-width: 600px; margin: auto; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155;'>" +
                    "<div style='background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 40px; text-align: center;'>" +
                    "<h1 style='margin: 0; font-size: 2.5rem; letter-spacing: -1px;'>NEXUS INITIALIZED</h1>" +
                    "<p style='opacity: 0.8; font-weight: bold;'>Account Activation Successful</p>" +
                    "</div>" +
                    "<div style='padding: 40px;'>" +
                    "<h2 style='color: #8b5cf6;'>Hello " + userName + ",</h2>" +
                    "<p style='line-height: 1.6; font-size: 1.1rem;'>Welcome to the official Technical Fest ecosystem! Your identity has been successfully registered in our secure cloud registry.</p>" +
                    "<p style='line-height: 1.6; font-size: 1.1rem;'>You now have full access to:</p>" +
                    "<ul style='line-height: 2; font-size: 1rem; color: #94a3b8;'>" +
                    "<li>⚡ Instant Event Bookings</li>" +
                    "<li>💎 Exclusive NFT-style Digital Passports</li>" +
                    "<li>🤝 Squad Finder & Networking</li>" +
                    "<li>💰 Reward Coins for every participation</li>" +
                    "</ul>" +
                    "<div style='margin-top: 40px; text-align: center;'>" +
                    "<a href='http://localhost:8080/login' style='background: #8b5cf6; color: white; padding: 15px 35px; border-radius: 12px; text-decoration: none; font-weight: 900; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);'>LAUNCH PORTAL 🚀</a>" +
                    "</div>" +
                    "</div>" +
                    "<div style='background: #0f172a; padding: 20px; text-align: center; font-size: 0.8rem; color: #475569;'>" +
                    "This is an automated system notification. Please do not reply.<br/>" +
                    "© 2026 Nexus Technical Fest. All rights reserved." +
                    "</div>" +
                    "</div>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("[User Email Service]: Welcome email dispatched to " + to);
        } catch (Exception e) {
            System.err.println("[User Email Service]: Failed to dispatch welcome email: " + e.getMessage());
        }
    }
}
