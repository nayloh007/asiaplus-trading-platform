import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";

// Define user type for TypeScript
declare global {
  namespace Express {
    interface User {
      id: number;
      role: string;
      [key: string]: any;
    }
  }
}
// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const backupDir = path.join(process.cwd(), "backups");

// สร้างโฟลเดอร์สำหรับเก็บไฟล์สำรองข้อมูลถ้ายังไม่มี
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// ตั้งค่า Multer สำหรับรับไฟล์อัปโหลด
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, backupDir);
    },
    filename: (req, file, cb) => {
      cb(null, `restore-${Date.now()}.sql`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 50MB
});

// สำหรับตรวจสอบและจัดการข้อมูลการตั้งค่า
const settingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  allowRegistrations: z.boolean().optional(),
  allowTrading: z.boolean().optional(),
  siteName: z.string().optional(),
  tradeFeePercentage: z.number().min(0).max(100).optional(),
  withdrawalFeePercentage: z.number().min(0).max(100).optional(),
  minDepositAmount: z.number().min(0).optional(),
  minWithdrawalAmount: z.number().min(0).optional(),
  tradeDurations: z.array(z.number()).optional(),
  autoBackup: z.boolean().optional(),
  backupFrequency: z.enum(["hourly", "daily", "weekly", "monthly"]).optional(),
  // ข้อมูลบัญชีธนาคาร
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  // ข้อมูลพร้อมเพย์
  promptpay_number: z.string().optional(),
  promptpay_tax_id: z.string().optional(),
  promptpay_name: z.string().optional(),
});

export function registerSettingsRoutes(app: Express) {
  // สร้างสำรองข้อมูล
  app.post("/api/admin/settings/backup", async (req: Request, res: Response) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${timestamp}.sql`;
      const filePath = path.join(backupDir, filename);

      // สร้างคำสั่ง pg_dump
      const dumpProcess = spawn("pg_dump", [
        "--dbname=" + process.env.DATABASE_URL,
        "--format=custom",
        "--file=" + filePath,
      ]);

      dumpProcess.stderr.on("data", (data) => {
        console.error(`pg_dump stderr: ${data}`);
      });

      dumpProcess.on("close", (code) => {
        if (code === 0) {
          res.json({
            success: true,
            message: "สำรองข้อมูลสำเร็จ",
            filename,
            timestamp: new Date(),
          });
        } else {
          res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการสำรองข้อมูล",
          });
        }
      });
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการสำรองข้อมูล",
      });
    }
  });

  // ดาวน์โหลดไฟล์สำรองข้อมูล
  app.get("/api/admin/settings/backups/:filename", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    try {
      const filePath = path.join(backupDir, req.params.filename);
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({
          success: false,
          message: "ไม่พบไฟล์สำรองข้อมูล",
        });
      }
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์สำรองข้อมูล",
      });
    }
  });

  // กู้คืนฐานข้อมูล
  app.post("/api/admin/settings/restore", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    upload.single("backup")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์",
          error: err.message
        });
      }

      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "กรุณาอัปโหลดไฟล์สำรองข้อมูล",
          });
        }

        const filePath = req.file.path;

        // ทำการคืนค่าข้อมูลด้วย pg_restore
        const restoreProcess = spawn("pg_restore", [
          "--dbname=" + process.env.DATABASE_URL,
          "--clean",
          "--if-exists",
          filePath,
        ]);

        let errorOutput = "";
        restoreProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
          console.error(`pg_restore stderr: ${data}`);
        });

        restoreProcess.on("close", (code) => {
          if (code === 0 || (errorOutput && errorOutput.includes("no matching relations"))) {
            res.json({
              success: true,
              message: "กู้คืนข้อมูลสำเร็จ",
              timestamp: new Date(),
            });
          } else {
            res.status(500).json({
              success: false,
              message: "เกิดข้อผิดพลาดในการกู้คืนข้อมูล",
              error: errorOutput,
            });
          }
        });
      } catch (error) {
        console.error("Restore error:", error);
        res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการกู้คืนข้อมูล",
        });
      }
    });
  });

  // บันทึกการตั้งค่า
  app.post("/api/admin/settings", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const result = settingsSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "ข้อมูลการตั้งค่าไม่ถูกต้อง",
          errors: result.error.format(),
        });
      }
      
      const data = result.data;
      
      // บันทึกการตั้งค่าบัญชีธนาคารและพร้อมเพย์ลงในฐานข้อมูล
      const pool = new (await import('pg')).Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      // รายการตั้งค่าที่จะบันทึก
      const bankSettings = [
        { key: 'bank_name', value: data.bank_name },
        { key: 'bank_account_number', value: data.bank_account_number },
        { key: 'bank_account_name', value: data.bank_account_name },
        { key: 'promptpay_number', value: data.promptpay_number },
        { key: 'promptpay_tax_id', value: data.promptpay_tax_id },
        { key: 'promptpay_name', value: data.promptpay_name },
      ];
      
      // อัปเดตทีละรายการ
      for (const setting of bankSettings) {
        if (setting.value) {
          // UPSERT - อัปเดตถ้ามีอยู่แล้ว หรือเพิ่มใหม่ถ้ายังไม่มี
          await pool.query(
            `INSERT INTO settings (key, value, updated_at) 
             VALUES ($1, $2::jsonb, NOW()) 
             ON CONFLICT (key) 
             DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
            [setting.key, JSON.stringify(setting.value)]
          );
        }
      }
      
      await pool.end();
      
      res.json({
        success: true,
        message: "บันทึกการตั้งค่าสำเร็จ",
        settings: data,
      });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า",
      });
    }
  });
  
  // บันทึกการตั้งค่าบัญชีธนาคารและพร้อมเพย์
  app.post("/api/admin/deposit-accounts", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // ตรวจสอบข้อมูล
      const depositAccountSchema = z.object({
        bank: z.object({
          name: z.string().min(1, "โปรดระบุชื่อธนาคาร"),
          accountNumber: z.string().min(1, "โปรดระบุเลขที่บัญชี"),
          accountName: z.string().min(1, "โปรดระบุชื่อบัญชี"),
        }),
        promptpay: z.object({
          number: z.string(),
          taxId: z.string(),
          name: z.string().min(1, "โปรดระบุชื่อบัญชีพร้อมเพย์"),
        }),
      });
      
      const result = depositAccountSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "ข้อมูลบัญชีไม่ถูกต้อง",
          errors: result.error.format(),
        });
      }
      
      const data = result.data;
      
      // ตรวจสอบโหมดการทำงาน: in-memory หรือ database
      if (process.env.NODE_ENV === 'development') {
        // ใช้งานใน Memory Storage
        const { memoryStorage } = await import('./memory-storage');
        
        // บันทึกข้อมูลในโหมด in-memory
        await memoryStorage.saveDepositAccounts(data);
        
        console.log("บันทึกข้อมูลบัญชีธนาคารในโหมด in-memory:", data);
      } else {
        // บันทึกการตั้งค่าลงในฐานข้อมูล
        const { pool } = await import('./db');
        
        // รายการตั้งค่าที่จะบันทึก
        const settings = [
          { key: 'bank_name', value: data.bank.name },
          { key: 'bank_account_number', value: data.bank.accountNumber },
          { key: 'bank_account_name', value: data.bank.accountName },
          { key: 'promptpay_number', value: data.promptpay.number },
          { key: 'promptpay_tax_id', value: data.promptpay.taxId },
          { key: 'promptpay_name', value: data.promptpay.name },
        ];
        
        // อัปเดตทีละรายการ
        for (const setting of settings) {
          // UPSERT - อัปเดตถ้ามีอยู่แล้ว หรือเพิ่มใหม่ถ้ายังไม่มี
          await pool.query(
            `INSERT INTO settings (key, value, updated_at) 
             VALUES ($1, $2::text, NOW()) 
             ON CONFLICT (key) 
             DO UPDATE SET value = $2::text, updated_at = NOW()`,
            [setting.key, setting.value]
          );
        }
      }
      
      res.json({
        success: true,
        message: "บันทึกข้อมูลบัญชีสำหรับฝากเงินสำเร็จ",
      });
    } catch (error) {
      console.error("Deposit accounts update error:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลบัญชี",
      });
    }
  });

  // ดึงการตั้งค่าทั้งหมด
  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // ดึงข้อมูลจากตาราง settings
      // ใช้ pool ที่มีอยู่แล้วจาก server/db.ts
      const { pool } = await import('./db');
      
      const result = await pool.query('SELECT key, value FROM settings');
      
      // แปลงข้อมูลจาก DB เป็น object
      const dbSettings = result.rows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {} as Record<string, string>);
      
      // จำลองการตั้งค่าเริ่มต้น
      const settings = {
        maintenanceMode: false,
        maintenanceMessage: "ระบบกำลังปิดปรับปรุงชั่วคราว กรุณากลับมาใหม่ในภายหลัง",
        allowRegistrations: true,
        allowTrading: true,
        siteName: "Bitkub",
        tradeFeePercentage: 0.2,
        withdrawalFeePercentage: 0.1,
        minDepositAmount: 100,
        minWithdrawalAmount: 100,
        tradeDurations: [60, 180, 300, 600],
        autoBackup: true,
        backupFrequency: "daily",
        // เพิ่มข้อมูลบัญชีธนาคารและพร้อมเพย์จาก DB
        bank_name: dbSettings.bank_name || "",
        bank_account_number: dbSettings.bank_account_number || "",
        bank_account_name: dbSettings.bank_account_name || "",
        promptpay_number: dbSettings.promptpay_number || "",
        promptpay_tax_id: dbSettings.promptpay_tax_id || "",
        promptpay_name: dbSettings.promptpay_name || "",
      };
      
      // ไม่ต้อง end pool เพราะเป็น shared pool
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า",
      });
    }
  });
  
  // ดึงข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับการฝากเงิน (สำหรับผู้ใช้ทั่วไป)
  app.get("/api/deposit-accounts", async (req: Request, res: Response) => {
    try {
      let depositAccounts;
      
      // ตรวจสอบโหมดการทำงาน: SQLite หรือ PostgreSQL
      const useSqlite = process.env.USE_SQLITE === 'true';
      
      if (useSqlite || process.env.NODE_ENV === 'development') {
        // ใช้งานใน Memory Storage สำหรับ development หรือ SQLite
        const { memoryStorage } = await import('./memory-storage');
        
        // ดึงข้อมูลจาก in-memory storage
        depositAccounts = await memoryStorage.getDepositAccounts();
        
        console.log("ดึงข้อมูลบัญชีธนาคารจากโหมด in-memory:", depositAccounts);
      } else {
        // ใช้ PostgreSQL pool สำหรับ production
        const { pool } = await import('./db');
        
        // ตรวจสอบว่า pool มีค่าหรือไม่
        if (!pool) {
          console.error('Database pool is not initialized, falling back to memory storage');
          // Fallback to memory storage if pool is not available
          const { memoryStorage } = await import('./memory-storage');
          depositAccounts = await memoryStorage.getDepositAccounts();
          console.log("ดึงข้อมูลบัญชีธนาคารจากโหมด fallback in-memory:", depositAccounts);
        } else {
        
        const result = await pool.query('SELECT key, value FROM settings WHERE key IN (\'bank_name\', \'bank_account_number\', \'bank_account_name\', \'promptpay_number\', \'promptpay_tax_id\', \'promptpay_name\')');
        
        // แปลงข้อมูลจาก DB เป็น object
        const dbSettings = result.rows.reduce((acc: any, row: any) => {
          acc[row.key] = row.value;
          return acc;
        }, {} as Record<string, string>);
        
        depositAccounts = {
          bank: {
            name: dbSettings.bank_name || "",
            accountNumber: dbSettings.bank_account_number || "",
            accountName: dbSettings.bank_account_name || "",
          },
          promptpay: {
            number: dbSettings.promptpay_number || "",
            taxId: dbSettings.promptpay_tax_id || "",
            name: dbSettings.promptpay_name || "",
          }
        };
        
        console.log("ดึงข้อมูลบัญชีธนาคารจากฐานข้อมูล:", depositAccounts);
        }
      }
      
      // ส่งข้อมูลไปยังผู้ใช้
      res.json(depositAccounts);
    } catch (error) {
      console.error("Error fetching deposit accounts:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูลบัญชีสำหรับฝากเงิน",
      });
    }
  });
  
  // เรียกดูรายชื่อไฟล์สำรองข้อมูลทั้งหมด
  app.get("/api/admin/settings/backups", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(backupDir)) {
        return res.json([]);
      }
      
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .map(file => {
          const stats = fs.statSync(path.join(backupDir, file));
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.ctime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
      res.json(files);
    } catch (error) {
      console.error("Error listing backups:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงรายการไฟล์สำรองข้อมูล",
      });
    }
  });
}