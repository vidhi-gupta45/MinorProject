package com.campuscare.issue.repository;

import com.campuscare.issue.entity.IssuePriority;
import com.campuscare.issue.entity.SlaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {

    List<SlaPolicy> findAllByOrderByCategoryIdAscPriorityAsc();

    Optional<SlaPolicy> findByCategoryIdAndPriority(Long categoryId, IssuePriority priority);

    boolean existsByCategoryIdAndPriority(Long categoryId, IssuePriority priority);

    List<SlaPolicy> findAllByCategoryId(Long categoryId);
}
