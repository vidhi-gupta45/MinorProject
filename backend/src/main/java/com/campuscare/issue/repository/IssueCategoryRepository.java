package com.campuscare.issue.repository;

import com.campuscare.issue.entity.IssueCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IssueCategoryRepository extends JpaRepository<IssueCategory, Long> {
    Optional<IssueCategory> findByCode(String code);
    boolean existsByCode(String code);
    List<IssueCategory> findAllByActiveTrue();
    List<IssueCategory> findAllByOrderByIdAsc();
}
