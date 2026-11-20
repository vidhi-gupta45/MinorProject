package com.campuscare.issue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "issue_sequences")
public class IssueSequence {

    @Id
    @Column(name = "sequence_year")
    private Integer sequenceYear;

    @Column(name = "current_val", nullable = false)
    private Long currentVal;

    public IssueSequence() {}

    public IssueSequence(Integer sequenceYear, Long currentVal) {
        this.sequenceYear = sequenceYear;
        this.currentVal = currentVal;
    }

    public Integer getSequenceYear() {
        return sequenceYear;
    }

    public void setSequenceYear(Integer sequenceYear) {
        this.sequenceYear = sequenceYear;
    }

    public Long getCurrentVal() {
        return currentVal;
    }

    public void setCurrentVal(Long currentVal) {
        this.currentVal = currentVal;
    }
}
