package com.campuscare.analytics.service;

import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.repository.IssueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.Writer;
import java.time.Instant;
import java.util.List;

@Service
public class CsvExportService {

    private final IssueRepository issueRepository;

    public CsvExportService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    @Transactional(readOnly = true)
    public void exportIssuesToCsv(
            Long departmentId,
            IssueStatus status,
            Instant startDate,
            Instant endDate,
            Writer writer) throws IOException {

        List<Issue> issues = issueRepository.findForReportExport(departmentId, status, startDate, endDate);

        // Header row
        writer.write("Public Issue ID,Title,Category,Department,Priority,Status,Location,Reporter Name,Reporter Email,Assigned Handler,Created At,Response Due,Resolution Due,Resolved At,Closed At,Overdue,Escalation Level\n");

        for (Issue issue : issues) {
            StringBuilder sb = new StringBuilder();
            sb.append(escape(issue.getPublicIssueId())).append(",");
            sb.append(escape(issue.getTitle())).append(",");
            sb.append(escape(issue.getCategory() != null ? issue.getCategory().getName() : "")).append(",");
            sb.append(escape(issue.getDepartment() != null ? issue.getDepartment().getName() : "")).append(",");
            sb.append(escape(issue.getPriority().name())).append(",");
            sb.append(escape(issue.getStatus().name())).append(",");
            sb.append(escape(issue.getLocation())).append(",");
            sb.append(escape(issue.getReporter() != null ? issue.getReporter().getFullName() : "")).append(",");
            sb.append(escape(issue.getReporter() != null ? issue.getReporter().getEmail() : "")).append(",");
            sb.append(escape(issue.getAssignedTo() != null ? issue.getAssignedTo().getFullName() : "UNASSIGNED")).append(",");
            sb.append(escape(formatInstant(issue.getCreatedAt()))).append(",");
            sb.append(escape(formatInstant(issue.getResponseDueAt()))).append(",");
            sb.append(escape(formatInstant(issue.getResolutionDueAt()))).append(",");
            sb.append(escape(formatInstant(issue.getResolvedAt()))).append(",");
            sb.append(escape(formatInstant(issue.getClosedAt()))).append(",");
            sb.append(issue.isOverdue() ? "YES" : "NO").append(",");
            sb.append(issue.getEscalationLevel()).append("\n");

            writer.write(sb.toString());
        }

        writer.flush();
    }

    private String escape(String value) {
        if (value == null) {
            return "\"\"";
        }
        String sanitized = value.replace("\"", "\"\"");
        return "\"" + sanitized + "\"";
    }

    private String formatInstant(Instant instant) {
        return instant != null ? instant.toString() : "";
    }
}
