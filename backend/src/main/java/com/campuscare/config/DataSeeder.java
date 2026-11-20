package com.campuscare.config;

import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueCategory;
import com.campuscare.issue.entity.IssuePriority;
import com.campuscare.issue.entity.IssueSequence;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.repository.IssueCategoryRepository;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.issue.repository.IssueSequenceRepository;
import com.campuscare.user.entity.Department;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.DepartmentRepository;
import com.campuscare.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.Year;
import java.util.List;

@Component
@Profile({"dev", "test"})
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final IssueCategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.campuscare.routing.repository.RoutingRuleRepository routingRuleRepository;
    private final com.campuscare.admin.service.AdminCategoryAndSlaService adminCategoryAndSlaService;
    private final IssueRepository issueRepository;
    private final IssueSequenceRepository sequenceRepository;
    private final Environment environment;

    public DataSeeder(
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            IssueCategoryRepository categoryRepository,
            PasswordEncoder passwordEncoder,
            com.campuscare.routing.repository.RoutingRuleRepository routingRuleRepository,
            com.campuscare.admin.service.AdminCategoryAndSlaService adminCategoryAndSlaService,
            IssueRepository issueRepository,
            IssueSequenceRepository sequenceRepository,
            Environment environment) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.routingRuleRepository = routingRuleRepository;
        this.adminCategoryAndSlaService = adminCategoryAndSlaService;
        this.issueRepository = issueRepository;
        this.sequenceRepository = sequenceRepository;
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        log.info("Starting CampusCare development data seeding...");

        // 1. Seed Departments
        Department cse = departmentRepository.findByDepartmentCode("CSE")
                .orElseGet(() -> departmentRepository.save(new Department("Computer Science & Engineering", "CSE")));
        
        departmentRepository.findByDepartmentCode("MECH")
                .orElseGet(() -> departmentRepository.save(new Department("Mechanical Engineering", "MECH")));

        departmentRepository.findByDepartmentCode("EE")
                .orElseGet(() -> departmentRepository.save(new Department("Electrical Engineering", "EE")));

        // 2. Seed Users across all 4 roles
        seedUser("System Administrator", "admin@campuscare.edu", "Admin@123", Role.ROLE_ADMIN, null, "9876543210");
        seedUser("Prof. HOD Sharma", "hod.cs@campuscare.edu", "Hod@123", Role.ROLE_HOD, cse, "9876543211");
        seedUser("Dr. Rajesh IT", "faculty.it@campuscare.edu", "Faculty@123", Role.ROLE_FACULTY, cse, "9876543212");
        seedUser("Mr. Suresh Maintenance", "faculty.maint@campuscare.edu", "Faculty@123", Role.ROLE_FACULTY, cse, "9876543213");
        seedUser("Alice Student", "student.alice@campuscare.edu", "Student@123", Role.ROLE_STUDENT, cse, "9876543214");
        seedUser("Student Demo", "student@campuscare.edu", "Student@123", Role.ROLE_STUDENT, cse, "9876543214");
        seedUser("Bob Student", "student.bob@campuscare.edu", "Student@123", Role.ROLE_STUDENT, cse, "9876543215");

        // 3. Seed Standard Categories
        List<IssueCategory> categories = List.of(
                new IssueCategory("ACADEMIC", "Academic Affairs", "Timetable, faculty coordination, attendance, syllabus queries"),
                new IssueCategory("INFRASTRUCTURE", "Campus Infrastructure", "Furniture, classrooms, doors, windows, structural repairs"),
                new IssueCategory("ELECTRICAL", "Electrical Maintenance", "Lighting, fans, air conditioning, power sockets, wiring"),
                new IssueCategory("IT_TECHNICAL", "IT & Lab Computers", "Wi-Fi, projectors, lab PCs, internet access, software licenses"),
                new IssueCategory("CLEANLINESS", "Housekeeping & Cleanliness", "Classroom cleanliness, washroom sanitation, dustbins, corridors"),
                new IssueCategory("LABORATORY", "Laboratory Equipment", "Damaged apparatus, chemicals, test benches, measurement equipment"),
                new IssueCategory("WATER_SANITATION", "Water & Sanitation", "Water coolers, plumbing, washroom taps, drinking water supply"),
                new IssueCategory("ADMINISTRATIVE", "Department Administrative", "Certificates, fee receipts, identity cards, department clearances"),
                new IssueCategory("OTHER", "Other Issues", "General or unclassified department issues")
        );

        for (IssueCategory cat : categories) {
            IssueCategory persistentCat = categoryRepository.findByCode(cat.getCode())
                    .orElseGet(() -> categoryRepository.save(cat));
            adminCategoryAndSlaService.seedDefaultSlaForCategory(persistentCat);
        }

        // 4. Seed Category Routing Rules for CSE
        User itHandler = userRepository.findByEmail("faculty.it@campuscare.edu").orElse(null);
        User maintHandler = userRepository.findByEmail("faculty.maint@campuscare.edu").orElse(null);

        if (itHandler != null && maintHandler != null) {
            seedRule(cse, "IT_TECHNICAL", itHandler);
            seedRule(cse, "ACADEMIC", itHandler);
            seedRule(cse, "LABORATORY", itHandler);

            seedRule(cse, "INFRASTRUCTURE", maintHandler);
            seedRule(cse, "ELECTRICAL", maintHandler);
            seedRule(cse, "CLEANLINESS", maintHandler);
            seedRule(cse, "WATER_SANITATION", maintHandler);
        }

        // 5. Seed Clean, Realistic Presentation Demo Issues (in dev profile)
        if (environment.matchesProfiles("dev")) {
            seedDemoIssues(cse, itHandler, maintHandler);
        }

        log.info("CampusCare development data seeding completed successfully.");
    }

    private void seedDemoIssues(Department cse, User itHandler, User maintHandler) {
        User alice = userRepository.findByEmail("student.alice@campuscare.edu").orElse(null);
        if (alice == null || itHandler == null || maintHandler == null) {
            return;
        }

        // If there are leftover test issues (> 3) or demo issues are missing, reset to a pristine, natural demo dataset
        if (issueRepository.count() > 3 || !issueRepository.findByPublicIssueId("CC-2026-00001").isPresent()) {
            log.info("Toning down dashboard issues to natural presentation demo dataset...");
            issueRepository.deleteAll();

            int currentYear = Year.now().getValue();
            sequenceRepository.save(new IssueSequence(currentYear, 3L));

            IssueCategory itCat = categoryRepository.findByCode("IT_TECHNICAL").orElse(null);
            IssueCategory elecCat = categoryRepository.findByCode("ELECTRICAL").orElse(null);
            IssueCategory labCat = categoryRepository.findByCode("LABORATORY").orElse(null);

            if (itCat == null || elecCat == null || labCat == null) {
                return;
            }

            Instant now = Instant.now();

            // Demo Issue 1: Assigned to Dr. Rajesh IT (Pending Acknowledgment)
            // Shows up in Handler's Pending Acknowledgment Queue to demo live acknowledgment.
            Issue issue1 = new Issue(
                    "CC-2026-00001",
                    "Wi-Fi connection drops in Seminar Hall B",
                    "Students attending technical sessions report frequent Wi-Fi disconnects on Access Point AP-03. Signal drops intermittently.",
                    itCat,
                    cse,
                    alice,
                    IssuePriority.HIGH,
                    "Seminar Hall B, 2nd Floor"
            );
            issue1.setAssignedTo(itHandler);
            issue1.setStatus(IssueStatus.ASSIGNED);
            issue1.setCreatedAt(now.minus(Duration.ofHours(2)));
            issue1.setUpdatedAt(now.minus(Duration.ofHours(2)));
            issue1.setResponseDueAt(now.plus(Duration.ofHours(6)));
            issue1.setResolutionDueAt(now.plus(Duration.ofHours(24)));
            issueRepository.save(issue1);

            // Demo Issue 2: In Progress with Mr. Suresh Maintenance
            // Demonstrates ongoing remediation with active timer.
            Issue issue2 = new Issue(
                    "CC-2026-00002",
                    "Projector ceiling display flickering in Lecture Hall 102",
                    "The ceiling projector blinks off for several seconds during multimedia lectures. Requires HDMI cable replacement or bulb inspection.",
                    elecCat,
                    cse,
                    alice,
                    IssuePriority.MEDIUM,
                    "Lecture Hall 102, Block A"
            );
            issue2.setAssignedTo(maintHandler);
            issue2.setStatus(IssueStatus.IN_PROGRESS);
            issue2.setAcknowledgedAt(now.minus(Duration.ofHours(3)));
            issue2.setCreatedAt(now.minus(Duration.ofHours(5)));
            issue2.setUpdatedAt(now.minus(Duration.ofHours(1)));
            issue2.setResponseDueAt(now.plus(Duration.ofHours(8)));
            issue2.setResolutionDueAt(now.plus(Duration.ofHours(36)));
            issueRepository.save(issue2);

            // Demo Issue 3: Resolved awaiting verification by Alice Student
            // Demonstrates student verifying resolution notes and confirming closure.
            Issue issue3 = new Issue(
                    "CC-2026-00003",
                    "Damaged Ethernet port at Computing Lab 3 terminal 14",
                    "RJ45 clip is broken on terminal 14 causing network disconnection whenever the cable is touched.",
                    labCat,
                    cse,
                    alice,
                    IssuePriority.LOW,
                    "Computing Lab 3, Workstation 14"
            );
            issue3.setAssignedTo(itHandler);
            issue3.setStatus(IssueStatus.RESOLVED);
            issue3.setAcknowledgedAt(now.minus(Duration.ofDays(1)));
            issue3.setResolvedAt(now.minus(Duration.ofHours(2)));
            issue3.setResolutionNotes("Crimped and replaced the RJ45 modular jack. Verified 1 Gbps link and full duplex connection.");
            issue3.setCreatedAt(now.minus(Duration.ofDays(1)));
            issue3.setUpdatedAt(now.minus(Duration.ofHours(2)));
            issueRepository.save(issue3);

            log.info("Seeded 3 realistic demo issues (ASSIGNED, IN_PROGRESS, RESOLVED) for college presentation.");
        }
    }

    private void seedRule(Department dept, String catCode, User assignee) {
        categoryRepository.findByCode(catCode).ifPresent(cat -> {
            if (!routingRuleRepository.existsByDepartmentIdAndCategoryIdAndPriorityCondition(dept.getId(), cat.getId(), "ALL")) {
                routingRuleRepository.save(new com.campuscare.routing.entity.RoutingRule(dept, cat, assignee, "ALL"));
            }
        });
    }

    private void seedUser(String fullName, String email, String password, Role role, Department dept, String phone) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User(fullName, email, passwordEncoder.encode(password), role, dept, phone);
            user.setActive(true);
            userRepository.save(user);
            log.info("Seeded user account: {} [{}]", email, role);
        } else {
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setActive(true);
            user.setRole(role);
            if (dept != null) {
                user.setDepartment(dept);
            }
            userRepository.save(user);
        }
    }
}
