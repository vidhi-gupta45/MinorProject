package com.campuscare.routing.service;

import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueHistory;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.repository.IssueHistoryRepository;
import com.campuscare.routing.entity.RoutingRule;
import com.campuscare.routing.repository.RoutingRuleRepository;
import com.campuscare.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RoutingEngineService {

    private static final Logger log = LoggerFactory.getLogger(RoutingEngineService.class);

    private final RoutingRuleRepository routingRuleRepository;
    private final IssueHistoryRepository historyRepository;

    public RoutingEngineService(
            RoutingRuleRepository routingRuleRepository,
            IssueHistoryRepository historyRepository) {
        this.routingRuleRepository = routingRuleRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional
    public void routeIssue(Issue issue) {
        Long deptId = issue.getDepartment().getId();
        Long categoryId = issue.getCategory().getId();

        Optional<RoutingRule> matchingRule = routingRuleRepository
                .findByDepartmentIdAndCategoryIdAndActiveTrue(deptId, categoryId);

        if (matchingRule.isPresent()) {
            User handler = matchingRule.get().getAssignee();
            if (handler.isActive()) {
                issue.setAssignedTo(handler);
                issue.setStatus(IssueStatus.ASSIGNED);

                IssueHistory history = new IssueHistory(
                        issue,
                        null,
                        "ROUTED",
                        IssueStatus.SUBMITTED.name(),
                        IssueStatus.ASSIGNED.name(),
                        null,
                        handler,
                        String.format("Automatically routed to %s based on category %s",
                                handler.getFullName(), issue.getCategory().getName())
                );
                historyRepository.save(history);
                issue.addHistory(history);

                log.info("Issue {} successfully routed to handler {} [{}]",
                        issue.getPublicIssueId(), handler.getEmail(), handler.getFullName());
                return;
            }
        }

        // Fallback: No active routing rule or handler inactive -> UNASSIGNED
        issue.setAssignedTo(null);
        issue.setStatus(IssueStatus.UNASSIGNED);

        IssueHistory unassignedHistory = new IssueHistory(
                issue,
                null,
                "ROUTED",
                IssueStatus.SUBMITTED.name(),
                IssueStatus.UNASSIGNED.name(),
                null,
                null,
                String.format("No active routing rule configured for category '%s'; placed in unassigned queue",
                        issue.getCategory().getName())
        );
        historyRepository.save(unassignedHistory);
        issue.addHistory(unassignedHistory);

        log.warn("Issue {} placed in UNASSIGNED queue (no matching active rule for dept: {}, category: {})",
                issue.getPublicIssueId(), issue.getDepartment().getDepartmentCode(), issue.getCategory().getCode());
    }
}
