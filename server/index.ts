import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { memoryStorage } from "./memory-storage";
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
    capturedJsonResponse = bodyJson;
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
  try {
    // ตรวจสอบว่ามีผู้ใช้แอดมินอยู่แล้วหรือไม่
    const existingAdmin = await memoryStorage.getUserByUsername('admin');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // สร้างข้อมูลผู้ใช้แอดมิน
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: 'admin',
      balance: '1000000',
    };
    
    // บันทึกผู้ใช้แอดมิน
    const newUser = await memoryStorage.createUser(adminUser);
    console.log('Admin user created successfully:', newUser.username);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

(async () => {
  // สร้างผู้ใช้แอดมินเมื่อเริ่มแอปพลิเคชัน
  await createAdminUser();
  
  const server = await registerRoutes(app);

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
