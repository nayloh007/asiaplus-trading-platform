import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import crypto, { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// This implementation matches the one in create-admin.js
async function comparePasswords(supplied: string, stored: string) {
  return new Promise<boolean>((resolve) => {
    try {
      // Check if stored password has the expected format
      if (!stored || !stored.includes('.')) {
        console.error('Stored password format is invalid:', stored);
        resolve(false);
        return;
      }
      
      const [hash, salt] = stored.split(".");
      if (!hash || !salt) {
        console.error('Invalid password parts:', { hash, salt });
        resolve(false);
        return;
      }
      
      // Use the callback version to safely handle the comparison
      scrypt(supplied, salt, 64, (err, derivedKey) => {
        if (err) {
          console.error('Error in scrypt:', err);
          resolve(false);
          return;
        }
        
        try {
          const storedBuf = Buffer.from(hash, 'hex');
          const result = timingSafeEqual(storedBuf, derivedKey);
          resolve(result);
        } catch (error) {
          console.error('Error comparing buffers:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error comparing passwords:', error);
      resolve(false);
    }
  });
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "crypto-trade-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
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
          return done(null, user);
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
      done(null, user);
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

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
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
