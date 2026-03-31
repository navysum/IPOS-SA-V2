package com.infopharma.ipos_sa.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.disabled:false}")
    private boolean disabled;

    @Value("${app.mail.from:noreply@infopharma.co.uk}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send a PU application outcome email.
     * When {@code app.mail.disabled=true} the message is only logged (safe for demo without SMTP).
     */
    public void sendPUApplicationOutcome(String toEmail, String companyName, boolean approved, String notes) {
        String subject;
        String body;

        if (approved) {
            subject = "InfoPharma IPOS-SA: Commercial Membership Application Approved";
            body = "Dear " + companyName + ",\n\n"
                + "We are pleased to inform you that your application for commercial membership "
                + "with InfoPharma Ltd has been APPROVED.\n\n"
                + "Your IPOS-SA access credentials will be provided separately by your account manager.\n\n"
                + (notes != null && !notes.isBlank() ? "Notes: " + notes + "\n\n" : "")
                + "If you have any questions, please contact us at accounts@infopharma.co.uk.\n\n"
                + "Yours sincerely,\nDirector of Operations\nInfoPharma Ltd";
        } else {
            subject = "InfoPharma IPOS-SA: Commercial Membership Application — Decision";
            body = "Dear " + companyName + ",\n\n"
                + "Thank you for your application for commercial membership with InfoPharma Ltd.\n\n"
                + "After careful consideration, we regret to inform you that your application "
                + "has NOT been approved at this time.\n\n"
                + (notes != null && !notes.isBlank() ? "Reason: " + notes + "\n\n" : "")
                + "If you believe this decision is in error or wish to discuss further, "
                + "please contact us at accounts@infopharma.co.uk.\n\n"
                + "Yours sincerely,\nDirector of Operations\nInfoPharma Ltd";
        }

        if (disabled) {
            log.info("MAIL (disabled — would send to {}): subject='{}'\n{}", toEmail, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {} for PU application outcome: {}", toEmail, approved ? "APPROVED" : "REJECTED");
        } catch (Exception e) {
            // Log but do not fail the request — email delivery is best-effort
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
