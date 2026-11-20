package com.campuscare.issue.service;

import com.campuscare.issue.repository.IssueSequenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
public class IssueIdGenerator {

    private final IssueSequenceRepository sequenceRepository;

    public IssueIdGenerator(IssueSequenceRepository sequenceRepository) {
        this.sequenceRepository = sequenceRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextIssueId() {
        int currentYear = Year.now().getValue();
        sequenceRepository.incrementSequenceNative(currentYear);
        Long currentVal = sequenceRepository.getCurrentValNative(currentYear)
                .orElse(1L);

        return String.format("CC-%d-%05d", currentYear, currentVal);
    }
}
