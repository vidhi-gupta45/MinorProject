package com.campuscare.issue.repository;

import com.campuscare.issue.entity.IssueSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IssueSequenceRepository extends JpaRepository<IssueSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM IssueSequence s WHERE s.sequenceYear = :year")
    Optional<IssueSequence> findBySequenceYearForUpdate(@Param("year") Integer year);

    @Modifying
    @Query(value = "INSERT INTO issue_sequences (sequence_year, current_val) VALUES (:year, 1) ON DUPLICATE KEY UPDATE current_val = current_val + 1", nativeQuery = true)
    void incrementSequenceNative(@Param("year") Integer year);

    @Query(value = "SELECT current_val FROM issue_sequences WHERE sequence_year = :year", nativeQuery = true)
    Optional<Long> getCurrentValNative(@Param("year") Integer year);
}
