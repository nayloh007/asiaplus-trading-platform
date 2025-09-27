import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json({ limit: '10mb' })); // เพิ่มขนาด limit เป็น 10mb
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // เพิ่มขนาด limit เป็น 10mb

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    try {
      // ตรวจสอบว่าสามารถแปลงเป็น JSON ได้หรือไม่ก่อนที่จะบันทึก
      const jsonString = JSON.stringify(bodyJson);
      capturedJsonResponse = JSON.parse(jsonString);
    } catch (error) {
      // ถ้าไม่สามารถแปลงเป็น JSON ได้ ให้เก็บเฉพาะข้อความอธิบายความผิดพลาด
      capturedJsonResponse = { message: 'Response contains circular structure or non-serializable values' };
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ฟังก์ชันสำหรับสร้างผู้ใช้แอดมิน
async function createAdminUser() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // ตรวจสอบว่ามีผู้ใช้แอดมินอยู่แล้วหรือไม่
      const existingAdmin = await storage.getUserByUsername('admin');
      if (existingAdmin) {
        console.log('Admin user already exists');
        return;
      }

      // เข้ารหัสรหัสผ่าน
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin@bigone', salt);
      
      // สร้างข้อมูลผู้ใช้แอดมิน
      const adminUser = {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin' as const,
        balance: '1000000',
      };
      
      // บันทึกผู้ใช้แอดมิน
      const newUser = await storage.createUser(adminUser);
      console.log('Admin user created successfully:', newUser.username);
      return; // สำเร็จแล้ว ออกจาก loop
    } catch (error) {
      retryCount++;
      console.error(`Error creating admin user (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        console.error('Failed to create admin user after maximum retries. The application will continue without admin user.');
        console.error('You can create admin user manually later using the API or database.');
        return;
      }
      
      // รอ 2 วินาทีก่อน retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

(async () => {
  // สร้างผู้ใช้แอดมินเมื่อเริ่มแอปพลิเคชัน
  await createAdminUser();
  
  const server = await registerRoutes(app);
  
  // Setup WebSocket
  setupWebSocket(server);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable (default 5000 for development)
  // Bind to 0.0.0.0 for production deployment on Render
  // This ensures proper port binding for cloud deployment platforms
  const port = process.env.PORT || 5000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  server.listen(port, host, () => {
    log(`serving on port ${port} (${host})`);
  });
})();
