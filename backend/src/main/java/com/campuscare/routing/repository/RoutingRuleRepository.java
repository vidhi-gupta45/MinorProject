package com.campuscare.routing.repository;

import com.campuscare.routing.entity.RoutingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoutingRuleRepository extends JpaRepository<RoutingRule, Long> {
    Optional<RoutingRule> findByDepartmentIdAndCategoryIdAndActiveTrue(Long departmentId, Long categoryId);
    List<RoutingRule> findAllByDepartmentIdAndActiveTrue(Long departmentId);
    List<RoutingRule> findAllByDepartmentId(Long departmentId);
    boolean existsByDepartmentIdAndCategoryIdAndPriorityCondition(Long departmentId, Long categoryId, String priorityCondition);
}
