package com.veltech.bookingservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendTicketEmail(String to, String userName, String eventName, String ticketId, String venue, String dateTime) {
        if (mailSender == null) {
            System.out.println("[Email Mock]: Sending ticket to " + to);
            System.out.println("Ticket ID: " + ticketId + " | Event: " + eventName);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("🎟️ Your Entry Pass: " + eventName);

            String htmlContent = "<html><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>" +
                    "<div style='max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>" +
                    "<div style='background: #1e1b4b; color: white; padding: 30px; text-align: center;'>" +
                    "<h1 style='margin: 0;'>TECHNICAL FEST 2026</h1>" +
                    "<p style='opacity: 0.8;'>Official Entry Pass</p>" +
                    "</div>" +
                    "<div style='padding: 30px;'>" +
                    "<h2>Hello " + userName + ",</h2>" +
                    "<p>Your registration for <strong>" + eventName + "</strong> is confirmed! Here are your ticket details:</p>" +
                    "<table style='width: 100%; margin-top: 20px; border-collapse: collapse;'>" +
                    "<tr><td style='padding: 10px; border-bottom: 1px solid #eee;'><strong>Ticket ID:</strong></td><td style='padding: 10px; border-bottom: 1px solid #eee;'>TF-" + ticketId + "</td></tr>" +
                    "<tr><td style='padding: 10px; border-bottom: 1px solid #eee;'><strong>Venue:</strong></td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" + venue + "</td></tr>" +
                    "<tr><td style='padding: 10px; border-bottom: 1px solid #eee;'><strong>Date/Time:</strong></td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" + dateTime + "</td></tr>" +
                    "</table>" +
                    "<div style='margin-top: 30px; text-align: center;'>" +
                    "<p style='font-size: 0.9rem; color: #666;'>Please present this email or the QR code in your dashboard at the registration desk.</p>" +
                    "</div>" +
                    "</div>" +
                    "<div style='background: #f8fafc; padding: 20px; text-align: center; font-size: 0.8rem; color: #94a3b8;'>" +
                    "© 2026 Technical Fest Management System. All rights reserved." +
                    "</div>" +
                    "</div>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("[Email Service]: Ticket dispatched to " + to);
        } catch (Exception e) {
            System.err.println("[Email Service]: Failed to dispatch ticket: " + e.getMessage());
        }
    }
}
