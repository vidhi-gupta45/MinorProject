package com.campuscare.notification.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:notifications@campuscare.edu}")
    private String fromEmail;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendNotificationEmail(
            String toEmail,
            String recipientName,
            String subject,
            String headline,
            String messageBody,
            String issueId,
            String actionUrl
    ) {
        if (!emailEnabled || mailSender == null) {
            log.info("[EMAIL DEV SIMULATOR] To: <{}> | Subject: [{}] | Issue: [{}] | Message: {}",
                    toEmail, subject, issueId, messageBody);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, "CampusCare Notifications");
            helper.setTo(toEmail);
            helper.setSubject(subject);

            String html = buildEmailHtml(recipientName, headline, messageBody, issueId, actionUrl);
            helper.setText(html, true);

            mailSender.send(mimeMessage);
            log.info("Email dispatched successfully to: {}", toEmail);
        } catch (Exception ex) {
            log.warn("Failed to dispatch email to {}. Fallback logging: {}", toEmail, ex.getMessage());
        }
    }

    private String buildEmailHtml(
            String recipientName,
            String headline,
            String messageBody,
            String issueId,
            String actionUrl
    ) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                        .header { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff; padding: 24px; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
                        .content { padding: 24px; line-height: 1.6; }
                        .headline { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
                        .issue-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: bold; font-size: 13px; margin-bottom: 16px; border: 1px solid #bfdbfe; }
                        .body-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #334155; margin-bottom: 20px; }
                        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
                        .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>CampusCare</h1>
                            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Smart Campus Issue Reporting & Resolution Platform</p>
                        </div>
                        <div class="content">
                            <p>Hello <strong>%s</strong>,</p>
                            <div class="headline">%s</div>
                            %s
                            <div class="body-card">
                                %s
                            </div>
                            <div style="margin-top: 24px;">
                                <a href="%s" class="btn">View Issue in CampusCare</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p style="margin: 0;">This is an automated notification from CampusCare. Please do not reply directly to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                recipientName,
                headline,
                issueId != null && !issueId.isBlank() ? "<div class=\"issue-badge\">Issue " + issueId + "</div>" : "",
                messageBody.replace("\n", "<br>"),
                actionUrl != null && !actionUrl.isBlank() ? actionUrl : "http://localhost:5173"
        );
    }
}
