import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
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

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }
    console.warn("WARNING: Using default SESSION_SECRET in development. Set SESSION_SECRET environment variable for production.");
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS'de çalışırken true
      httpOnly: true, // JavaScript ile cookie'ye erişimi engelle
      sameSite: "lax", // CSRF koruması (lax daha uyumlu)
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 gün
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Kayıt sistemi - Sadece development ortamında aktif
  app.post("/api/register", async (req, res) => {
    // Production ortamında kayıt kapalı
    if (process.env.NODE_ENV === "production") {
      return res.status(403).send("Kayıt sistemi kapatılmıştır. Yönetici ile iletişime geçin.");
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).send("Kullanıcı adı ve şifre gereklidir.");
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).send("Bu kullanıcı adı zaten kullanılıyor.");
    }

    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      password: hashedPassword,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}
