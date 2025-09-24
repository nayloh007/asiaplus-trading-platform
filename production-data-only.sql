-- SQL สำหรับ Production Database (หลังจาก schema sync แล้ว)

-- 1. เพิ่ม Admin User
INSERT INTO users (username, email, password, role, balance, created_at, updated_at) VALUES
('admin', 'admin@example.com', '$2b$10$uQHAWCHYsiaPApuNOxlTvePKWZplzAbQb/jSZkjJYMisVoDvV2dt2', 'admin', '1000000', NOW(), NOW()),
('agent', 'agent@example.com', '$2b$10$uQHAWCHYsiaPApuNOxlTvePKWZplzAbQb/jSZkjJYMisVoDvV2dt2', 'agent', '500000', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- 2. เพิ่ม System Settings 
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('trade_fee_percentage', '"2.5"', NOW(), NOW()),
('withdrawal_fee_percentage', '"0.1"', NOW(), NOW()),
('min_deposit_amount', '"250"', NOW(), NOW()),
('min_withdrawal_amount', '"150"', NOW(), NOW()),
('allow_trading', '"true"', NOW(), NOW()),
('allow_registrations', '"true"', NOW(), NOW()),
('maintenance_mode', '"false"', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = EXCLUDED.updated_at;

-- 3. ตรวจสอบข้อมูลที่เพิ่มแล้ว
SELECT 'Admin Users:' as type, COUNT(*) as count FROM users WHERE role IN ('admin', 'agent')
UNION ALL
SELECT 'Settings:' as type, COUNT(*) as count FROM settings;