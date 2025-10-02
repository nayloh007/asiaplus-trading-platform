# Asia Plus Trading Platform

ระบบเทรดดิ้งสำหรับ Asia Plus Securities พัฒนาด้วย React, TypeScript และ Node.js

## คุณสมบัติหลัก

- 🔐 ระบบล็อกอิน/สมัครสมาชิก
- 💰 ระบบกระเป๋าเงิน (ฝาก-ถอน)
- 📊 ระบบเทรดดิ้ง
- 🏦 จัดการบัญชีธนาคาร
- 👥 ระบบจัดการผู้ใช้ (Admin/Agent/User)
- 📈 แดชบอร์ดสำหรับแอดมิน
- 🎨 UI/UX ที่ทันสมัยและใช้งานง่าย

## เทคโนโลยีที่ใช้

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui Components
- React Query (TanStack Query)
- React Router

### Backend
- Node.js
- Express.js
- TypeScript
- SQLite / PostgreSQL
- Drizzle ORM
- Passport.js (Authentication)
- bcrypt (Password Hashing)

## การติดตั้งและรัน

### ข้อกำหนดเบื้องต้น
- Node.js 18+ 
- npm หรือ yarn

### ขั้นตอนการติดตั้ง

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd asiaplus2
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า environment variables**
   ```bash
   cp .env.example .env
   ```
   แก้ไขไฟล์ `.env` ตามความต้องการ

4. **รันโปรเจ็ค**
   
   **Development mode:**
   ```bash
   # รัน backend และ frontend พร้อมกัน
   npm run dev
   ```
   
   **หรือรันแยกกัน:**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend  
   npm run client
   ```

5. **เข้าใช้งาน**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## ข้อมูลการล็อกอิน (Default)

### Admin
- Username: `admin`
- Password: `admin@bigone`
- Email: `admin@example.com`

### Test Users (หลังจากใช้ Import Data)
- Username: `agent001` / Password: `agent123` (Agent)
- Username: `testuser1` / Password: `test123` (User)
- Username: `demo` / Password: `demo123` (User)

## โครงสร้างโปรเจ็ค

```
asiaplus2/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/         # หน้าต่างๆ
│   │   ├── hooks/         # Custom Hooks
│   │   └── lib/           # Utilities
├── server/                # Backend (Node.js)
│   ├── auth.ts           # Authentication
│   ├── routes.ts         # API Routes
│   ├── storage.ts        # Database Operations
│   └── index.ts          # Server Entry Point
├── shared/               # Shared Types & Schemas
└── database.db          # SQLite Database
```

## API Endpoints

### Authentication
- `POST /api/register` - สมัครสมาชิก
- `POST /api/login` - ล็อกอิน
- `POST /api/logout` - ล็อกเอาท์
- `GET /api/user` - ข้อมูลผู้ใช้ปัจจุบัน

### Trading
- `GET /api/trades` - รายการเทรด
- `POST /api/trades` - สร้างเทรดใหม่
- `PATCH /api/trades/:id` - อัพเดทเทรด

### Wallet
- `POST /api/wallet/deposit` - ฝากเงิน
- `POST /api/wallet/withdraw` - ถอนเงิน
- `GET /api/wallet/transactions` - ประวัติธุรกรรม

### Admin
- `GET /api/admin/users` - จัดการผู้ใช้
- `PATCH /api/admin/users/:id` - แก้ไขผู้ใช้
- `POST /api/admin/import-data` - นำเข้าข้อมูลทดสอบ

## การ Deploy

### Production Build
```bash
npm run build
```

### Environment Variables สำหรับ Production
```env
NODE_ENV=production
USE_SQLITE=true
SESSION_SECRET=your-super-secure-session-secret
ADMIN_PASSWORD=your-secure-admin-password
```

## การพัฒนา

### รัน Development Server
```bash
npm run dev
```

### Build สำหรับ Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

## ความปลอดภัย

⚠️ **สำคัญ**: ก่อน deploy ไปยัง production:

1. เปลี่ยนรหัสผ่าน admin เริ่มต้น
2. ตั้งค่า SESSION_SECRET ที่ปลอดภัย
3. ใช้ HTTPS
4. ตั้งค่า environment variables อย่างถูกต้อง
5. ลบข้อมูลทดสอบออก

## License

Private Project - Asia Plus Securities