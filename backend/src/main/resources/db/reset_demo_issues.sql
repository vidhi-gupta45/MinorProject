-- CampusCare: Clean & Realistic Demo Issues Reset Script
-- Run this in MySQL Workbench, CLI, or phpMyAdmin to immediately reset issues to 3 natural demo records.

USE campuscare;

-- 1. Clean existing issues (ON DELETE CASCADE will automatically clean child comments, histories, attachments, notifications)
DELETE FROM issues;

-- 2. Reset atomic issue sequence to 3 (so the next issue reported by student during the live demo becomes CC-YYYY-00004)
DELETE FROM issue_sequences;
INSERT INTO issue_sequences (sequence_year, current_val) VALUES (YEAR(CURRENT_DATE), 3);

-- 3. Retrieve IDs for CSE department, users, and categories
SET @cse_id = (SELECT id FROM departments WHERE department_code = 'CSE' LIMIT 1);
SET @alice_id = (SELECT id FROM users WHERE email = 'student.alice@campuscare.edu' LIMIT 1);
SET @it_handler_id = (SELECT id FROM users WHERE email = 'faculty.it@campuscare.edu' LIMIT 1);
SET @maint_handler_id = (SELECT id FROM users WHERE email = 'faculty.maint@campuscare.edu' LIMIT 1);
SET @it_cat_id = (SELECT id FROM issue_categories WHERE code = 'IT_TECHNICAL' LIMIT 1);
SET @elec_cat_id = (SELECT id FROM issue_categories WHERE code = 'ELECTRICAL' LIMIT 1);
SET @lab_cat_id = (SELECT id FROM issue_categories WHERE code = 'LABORATORY' LIMIT 1);

-- 4. Seed 3 balanced, natural demo issues:

-- Demo Issue 1: ASSIGNED (waiting for handler acknowledgment - Dr. Rajesh IT)
INSERT INTO issues (
    public_issue_id, title, description, category_id, department_id,
    reporter_id, assigned_to, status, priority, location,
    created_at, updated_at, response_due_at, resolution_due_at,
    reopen_count, escalation_level, is_overdue, version
) VALUES (
    CONCAT('CC-', YEAR(CURRENT_DATE), '-00001'),
    'Wi-Fi connection drops in Seminar Hall B',
    'Students attending technical presentations frequently lose Wi-Fi connection from Access Point AP-03. Signal drops intermittently.',
    @it_cat_id, @cse_id, @alice_id, @it_handler_id,
    'ASSIGNED', 'HIGH', 'Seminar Hall B, 2nd Floor',
    NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR,
    NOW() + INTERVAL 6 HOUR, NOW() + INTERVAL 24 HOUR,
    0, 0, 0, 0
);

-- Demo Issue 2: IN_PROGRESS (under active maintenance - Mr. Suresh Maintenance)
INSERT INTO issues (
    public_issue_id, title, description, category_id, department_id,
    reporter_id, assigned_to, status, priority, location,
    acknowledged_at, created_at, updated_at, response_due_at, resolution_due_at,
    reopen_count, escalation_level, is_overdue, version
) VALUES (
    CONCAT('CC-', YEAR(CURRENT_DATE), '-00002'),
    'Projector ceiling display flickering in Lecture Hall 102',
    'The ceiling projector blinks off for several seconds during multimedia lectures. Requires HDMI cable replacement or bulb inspection.',
    @elec_cat_id, @cse_id, @alice_id, @maint_handler_id,
    'IN_PROGRESS', 'MEDIUM', 'Lecture Hall 102, Block A',
    NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 1 HOUR,
    NOW() + INTERVAL 8 HOUR, NOW() + INTERVAL 36 HOUR,
    0, 0, 0, 0
);

-- Demo Issue 3: RESOLVED (fixed by IT, awaiting student Alice confirmation)
INSERT INTO issues (
    public_issue_id, title, description, category_id, department_id,
    reporter_id, assigned_to, status, priority, location,
    acknowledged_at, resolved_at, resolution_notes,
    created_at, updated_at,
    reopen_count, escalation_level, is_overdue, version
) VALUES (
    CONCAT('CC-', YEAR(CURRENT_DATE), '-00003'),
    'Damaged Ethernet port at Computing Lab 3 terminal 14',
    'RJ45 clip is broken on terminal 14 causing network disconnection whenever the cable is touched.',
    @lab_cat_id, @cse_id, @alice_id, @it_handler_id,
    'RESOLVED', 'LOW', 'Computing Lab 3, Workstation 14',
    NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 2 HOUR,
    'Crimped and replaced the RJ45 modular jack. Verified 1 Gbps link and full duplex connection.',
    NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 2 HOUR,
    0, 0, 0, 0
);
