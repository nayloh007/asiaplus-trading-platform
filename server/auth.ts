import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import MemoryStore from "memorystore";
import type { User as UserType } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      fullName: string | null;
      displayName: string | null;
      phoneNumber: string | null;
      avatarUrl: string | null;
      role: string;
      balance: string;
      createdAt: string;
      updatedAt: string;
    }
  }
}

// ฟังก์ชันเข้ารหัสรหัสผ่านใช้ bcrypt เหมือนกับในไฟล์ server/index.ts
async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// ฟังก์ชันเปรียบเทียบรหัสผ่านด้วย bcrypt
async function comparePasswords(supplied: string, stored: string) {
  try {
    return await bcrypt.compare(supplied, stored);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const MemoryStoreSession = MemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "crypto-trade-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // ล้างเซสชันที่หมดอายุทุก 24 ชั่วโมง
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: false, // Temporarily disable secure for testing
      httpOnly: true,
      sameSite: "lax", // Change to lax for better compatibility
    }
  };

  // Trust proxy for production deployment platforms like Render
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", true);
  }
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, {
            ...user,
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
            updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
          });
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, {
          ...user,
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
          updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
        });
      } else {
        done(null, user);
      }
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        balance: "0", // Ensure new users start with 0 baht
      });

      // Create a sanitized version without password
      const userWithoutPassword = {
        ...user,
        password: undefined,
      };

      req.login({
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
      }, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Create a sanitized version without password
        const userWithoutPassword = {
          ...user,
          password: undefined,
        };
        
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Create a sanitized version without password
    const userWithoutPassword = {
      ...req.user,
      password: undefined,
    };
    
    res.json(userWithoutPassword);
  });
}
