package com.campuscare.user.repository;

import com.campuscare.user.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    Optional<Department> findByDepartmentCode(String departmentCode);
    List<Department> findAllByActiveTrue();
    boolean existsByDepartmentCode(String departmentCode);
}
