import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProjectSchema, insertCustomerSchema, insertSubcontractorSchema, insertTransactionSchema, insertSiteDiarySchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).send("Projeler yüklenirken hata oluştu");
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).send("Proje bulunamadı");
      }
      res.json(project);
    } catch (error) {
      res.status(500).send("Proje yüklenirken hata oluştu");
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).send(error.message || "Geçersiz proje verisi");
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).send("Proje bulunamadı");
      }
      res.json(project);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz proje verisi");
      }
      res.status(500).send("Proje güncellenirken hata oluştu");
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).send("Proje bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Proje silinirken hata oluştu");
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).send("Müşteriler yüklenirken hata oluştu");
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).send(error.message || "Geçersiz müşteri verisi");
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) {
        return res.status(404).send("Müşteri bulunamadı");
      }
      res.json(customer);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz müşteri verisi");
      }
      res.status(500).send("Müşteri güncellenirken hata oluştu");
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).send("Müşteri bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Müşteri silinirken hata oluştu");
    }
  });

  // Subcontractor routes
  app.get("/api/subcontractors", async (req, res) => {
    try {
      const subcontractors = await storage.getSubcontractors();
      res.json(subcontractors);
    } catch (error) {
      res.status(500).send("Taşeronlar yüklenirken hata oluştu");
    }
  });

  app.post("/api/subcontractors", async (req, res) => {
    try {
      const validatedData = insertSubcontractorSchema.parse(req.body);
      const subcontractor = await storage.createSubcontractor(validatedData);
      res.status(201).json(subcontractor);
    } catch (error: any) {
      res.status(400).send(error.message || "Geçersiz taşeron verisi");
    }
  });

  app.patch("/api/subcontractors/:id", async (req, res) => {
    try {
      const validatedData = insertSubcontractorSchema.partial().parse(req.body);
      const subcontractor = await storage.updateSubcontractor(req.params.id, validatedData);
      if (!subcontractor) {
        return res.status(404).send("Taşeron bulunamadı");
      }
      res.json(subcontractor);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz taşeron verisi");
      }
      res.status(500).send("Taşeron güncellenirken hata oluştu");
    }
  });

  app.delete("/api/subcontractors/:id", async (req, res) => {
    try {
      const success = await storage.deleteSubcontractor(req.params.id);
      if (!success) {
        return res.status(404).send("Taşeron bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Taşeron silinirken hata oluştu");
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).send("İşlemler yüklenirken hata oluştu");
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).send(error.message || "Geçersiz işlem verisi");
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, validatedData);
      if (!transaction) {
        return res.status(404).send("İşlem bulunamadı");
      }
      res.json(transaction);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz işlem verisi");
      }
      res.status(500).send("İşlem güncellenirken hata oluştu");
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const success = await storage.deleteTransaction(req.params.id);
      if (!success) {
        return res.status(404).send("İşlem bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("İşlem silinirken hata oluştu");
    }
  });

  // Site Diary routes
  app.get("/api/site-diary", async (req, res) => {
    try {
      const entries = await storage.getSiteDiaryEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).send("Şantiye defteri yüklenirken hata oluştu");
    }
  });

  app.post("/api/site-diary", async (req, res) => {
    try {
      const validatedData = insertSiteDiarySchema.parse(req.body);
      const entry = await storage.createSiteDiaryEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).send(error.message || "Geçersiz şantiye defteri verisi");
    }
  });

  app.patch("/api/site-diary/:id", async (req, res) => {
    try {
      const validatedData = insertSiteDiarySchema.partial().parse(req.body);
      const entry = await storage.updateSiteDiaryEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).send("Şantiye defteri kaydı bulunamadı");
      }
      res.json(entry);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz şantiye defteri verisi");
      }
      res.status(500).send("Şantiye defteri güncellenirken hata oluştu");
    }
  });

  app.delete("/api/site-diary/:id", async (req, res) => {
    try {
      const success = await storage.deleteSiteDiaryEntry(req.params.id);
      if (!success) {
        return res.status(404).send("Şantiye defteri kaydı bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Şantiye defteri silinirken hata oluştu");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
