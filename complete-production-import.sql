-- =================================================================
-- COMPLETE DATA IMPORT SCRIPT สำหรับ Production Database
-- วิธีใช้: รันใน Production Database หลังจาก Schema Sync แล้ว
-- =================================================================

-- 1. เพิ่มข้อมูล USERS ทั้งหมด (6 คน)
INSERT INTO users (id, username, email, password, full_name, role, balance, created_at, updated_at) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$uQHAWCHYsiaPApuNOxlTvePKWZplzAbQb/jSZkjJYMisVoDvV2dt2', NULL, 'admin', '999673.9880000001', '2025-09-23 05:15:11.270596', '2025-09-23 05:15:11.270596'),
(2, 'testuser', 'test@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'ผู้ใช้ทดสอบ', 'user', '10000', '2025-09-23 05:37:07.463662', '2025-09-23 05:37:07.463662'),
(3, 'pooruser', 'poor@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'ผู้ใช้ยากจน', 'user', '500', '2025-09-23 05:37:08.376615', '2025-09-23 05:37:08.376615'),
(4, 'somchai', 'somchai@example.com', '$2b$10$3pNMHR.TDra/cmurXq/1wevZfY7IqaMqkbCDyvRdyBYCqLJHwK7tO', NULL, 'user', '0', '2025-09-23 07:46:42.810884', '2025-09-23 07:46:42.810884'),
(5, 'agent', 'agent@example.com', '$2b$10$uQHAWCHYsiaPApuNOxlTvePKWZplzAbQb/jSZkjJYMisVoDvV2dt2', NULL, 'agent', '500000', '2025-09-24 07:36:12.064647', '2025-09-24 07:36:12.064647'),
(6, 'agant', 'agant@gmail.com', '$2b$10$1hgqJXF5o8DcM0q7oak3/.GA40Zfz6GlrpKG9dQexwLjbFAl8fnMe', NULL, 'agent', '0', '2025-09-24 07:40:00.920224', '2025-09-24 07:40:00.920224')
ON CONFLICT (username) DO NOTHING;

-- 2. เพิ่มข้อมูล SETTINGS ทั้งหมด (7 รายการ)
INSERT INTO settings (id, key, value, created_at, updated_at) VALUES
(1, 'trade_fee_percentage', '"2.5"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:34.898'),
(2, 'withdrawal_fee_percentage', '"0.1"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:34.949'),
(3, 'min_deposit_amount', '"250"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:34.989'),
(4, 'min_withdrawal_amount', '"150"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:35.029'),
(5, 'allow_trading', '"true"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:35.069'),
(6, 'allow_registrations', '"true"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:35.109'),
(7, 'maintenance_mode', '"false"', '2025-09-23 05:48:02.879048', '2025-09-23 05:58:35.148')
ON CONFLICT (id) DO NOTHING;

-- 3. เพิ่มข้อมูล BANK ACCOUNTS (1 รายการ)
INSERT INTO bank_accounts (id, user_id, bank_name, account_number, account_name, is_default, created_at, updated_at) VALUES
(1, 1, 'กสิกรไทย', '1231231231230.', '123120.', true, '2025-09-24 07:20:02.909878', '2025-09-24 07:20:19.286')
ON CONFLICT (id) DO NOTHING;

-- 4. เพิ่มข้อมูล TRADES ทั้งหมด (20 trades)
INSERT INTO trades (id, user_id, crypto_id, entry_price, amount, direction, duration, status, result, predetermined_result, profit_percentage, created_at, closed_at, end_time) VALUES
(1, 1, 'bitcoin', '112839', '100', 'up', 60, 'completed', 'win', 'win', '30', '2025-09-23 05:39:26.071009', '2025-09-23 05:40:52.54', NULL),
(2, 1, 'bitcoin', '112896', '10', 'up', 60, 'completed', 'lose', 'lose', '30', '2025-09-23 05:43:39.09734', '2025-09-23 05:44:39.033', NULL),
(3, 1, 'hyperliquid', '48.41', '10', 'up', 60, 'completed', 'win', NULL, '30', '2025-09-23 07:28:18.231908', '2025-09-23 07:34:25.473', NULL),
(4, 1, 'bitcoin', '113039', '0.01', 'up', 60, 'completed', 'lose', NULL, '30', '2025-09-23 07:29:04.834539', '2025-09-23 07:30:33.183', NULL),
(5, 1, 'ethena-usde', '1.002', '100', 'up', 60, 'completed', 'lose', NULL, '30', '2025-09-23 07:48:08.548023', '2025-09-23 07:49:13.407', NULL),
(6, 1, 'bitcoin', '113054', '50', 'up', 60, 'completed', 'win', NULL, '30', '2025-09-23 07:53:09.883914', '2025-09-23 07:54:09.395', NULL),
(7, 1, 'bitcoin', '113116', '10', 'up', 60, 'completed', 'win', NULL, '30', '2025-09-23 08:17:25.371333', '2025-09-23 08:18:26.125', NULL),
(8, 1, 'bitcoin', '113004', '100', 'up', 60, 'completed', 'win', NULL, '30', '2025-09-23 12:00:43.756719', '2025-09-23 12:01:46.289', NULL),
(9, 1, 'cardano', '0.823061', '100', 'up', 60, 'completed', 'lose', NULL, '30', '2025-09-23 12:21:32.85262', '2025-09-23 12:22:36.561', NULL),
(10, 1, 'bitcoin', '112575', '100', 'up', 60, 'completed', 'lose', NULL, '30', '2025-09-24 06:43:04.736272', '2025-09-24 06:44:08.919', NULL),
(11, 1, 'bitcoin', '112605', '0.01', 'up', 60, 'completed', 'win', NULL, '30', '2025-09-24 06:46:33.443081', '2025-09-24 06:47:38.101', NULL),
(12, 1, 'bitcoin', '112610', '0.01', 'up', 60, 'completed', 'lose', NULL, '30', '2025-09-24 06:56:52.792836', '2025-09-24 06:57:56.414', NULL),
(13, 1, 'tether', '1', '0.01', 'up', 60, 'completed', 'lose', 'win', '30', '2025-09-24 06:58:08.683081', '2025-09-24 06:59:11.436', NULL),
(14, 1, 'bitcoin', '112613', '100', 'down', 60, 'completed', 'lose', 'lose', '30', '2025-09-24 07:00:58.479787', '2025-09-24 07:02:03.068', NULL),
(15, 1, 'bitcoin', '112658', '10', 'up', 60, 'completed', 'lose', 'win', '30', '2025-09-24 07:04:38.287235', '2025-09-24 07:05:42.758', NULL),
(16, 1, 'bitcoin', '112658', '0.01', 'up', 60, 'completed', 'win', 'win', '30', '2025-09-24 07:07:40.204998', '2025-09-24 07:08:42.856', NULL),
(17, 1, 'bitcoin', '112658', '0.01', 'down', 60, 'completed', 'lose', 'win', '30', '2025-09-24 07:09:12.355204', '2025-09-24 07:10:12.986', NULL),
(18, 1, 'bitcoin', '112664', '0.01', 'up', 60, 'completed', 'lose', 'lose', '30', '2025-09-24 07:12:49.06696', '2025-09-24 07:13:53.601', NULL),
(19, 1, 'bitcoin', '112664', '0.01', 'up', 60, 'completed', 'lose', 'lose', '30', '2025-09-24 07:14:07.801981', '2025-09-24 07:15:08.608', NULL),
(20, 1, 'bitcoin', '112664', '0.01', 'up', 60, 'completed', 'win', 'win', '30', '2025-09-24 07:15:22.161621', '2025-09-24 07:16:23.605', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. เพิ่มข้อมูล TRANSACTIONS (1 transaction)
INSERT INTO transactions (id, user_id, type, amount, status, method, bank_name, bank_account, payment_proof, note, created_at, updated_at) VALUES
(1, 1, 'deposit', '100', 'frozen', 'bank', NULL, NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlwAAAE7CAIAAACHZ8iY...', NULL, '2025-09-24 07:16:59.45702', '2025-09-24 07:17:16.566')
ON CONFLICT (id) DO NOTHING;

-- 6. ตั้งค่า Sequence Values ให้ถูกต้อง
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM settings));
SELECT setval('bank_accounts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bank_accounts));
SELECT setval('trades_id_seq', (SELECT COALESCE(MAX(id), 1) FROM trades));
SELECT setval('transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transactions));

-- 7. ตรวจสอบข้อมูลที่ Import เสร็จแล้ว
SELECT 'IMPORT SUMMARY' as section, '' as details
UNION ALL
SELECT 'Users imported:', CAST(COUNT(*) as TEXT) FROM users
UNION ALL  
SELECT 'Settings imported:', CAST(COUNT(*) as TEXT) FROM settings
UNION ALL
SELECT 'Bank accounts imported:', CAST(COUNT(*) as TEXT) FROM bank_accounts
UNION ALL
SELECT 'Trades imported:', CAST(COUNT(*) as TEXT) FROM trades
UNION ALL
SELECT 'Transactions imported:', CAST(COUNT(*) as TEXT) FROM transactions
UNION ALL
SELECT '', ''
UNION ALL
SELECT 'Admin credentials:', 'admin / admin@bigone'
UNION ALL
SELECT 'Agent credentials:', 'agent / admin@bigone'
UNION ALL
SELECT 'Trading enabled:', (SELECT value FROM settings WHERE key = 'allow_trading')
UNION ALL
SELECT 'Registration enabled:', (SELECT value FROM settings WHERE key = 'allow_registrations');