import { Request, Response, NextFunction } from "express";

// ตรวจสอบการล็อกอินของผู้ใช้
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// ตรวจสอบสิทธิ์ Admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user as any).role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Forbidden" });
};