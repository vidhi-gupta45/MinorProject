package com.campuscare.user.repository;

import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findAllByDepartmentIdAndRole(Long departmentId, Role role);
    List<User> findAllByRole(Role role);
    List<User> findAllByDepartmentId(Long departmentId);
    long countByRole(Role role);

    @Query(value = "SELECT u FROM User u " +
           "LEFT JOIN FETCH u.department " +
           "WHERE (:role IS NULL OR u.role = :role) " +
           "AND (:departmentId IS NULL OR (u.department IS NOT NULL AND u.department.id = :departmentId)) " +
           "AND (:active IS NULL OR u.active = :active) " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.id DESC",
           countQuery = "SELECT count(u) FROM User u " +
           "WHERE (:role IS NULL OR u.role = :role) " +
           "AND (:departmentId IS NULL OR (u.department IS NOT NULL AND u.department.id = :departmentId)) " +
           "AND (:active IS NULL OR u.active = :active) " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findUsersFiltered(
            @Param("role") Role role,
            @Param("departmentId") Long departmentId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);
}
