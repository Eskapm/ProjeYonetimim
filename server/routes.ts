import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProjectSchema, insertCustomerSchema, insertSubcontractorSchema, insertTransactionSchema, insertSiteDiarySchema, insertTimesheetSchema, insertInvoiceSchema, insertProgressPaymentSchema, insertTaskSchema, insertBudgetItemSchema } from "@shared/schema";
import { ZodError } from "zod";

// Authentication middleware - Giriş yapmayan kullanıcıları engeller
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Giriş yapmanız gerekiyor");
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).send("Projeler yüklenirken hata oluştu");
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
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

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz proje verisi");
      }
      res.status(500).send("Proje oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
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
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).send("Müşteriler yüklenirken hata oluştu");
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz müşteri verisi");
      }
      res.status(500).send("Müşteri oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
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
  app.get("/api/subcontractors", requireAuth, async (req, res) => {
    try {
      const subcontractors = await storage.getSubcontractors();
      res.json(subcontractors);
    } catch (error) {
      res.status(500).send("Taşeronlar yüklenirken hata oluştu");
    }
  });

  app.post("/api/subcontractors", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSubcontractorSchema.parse(req.body);
      const subcontractor = await storage.createSubcontractor(validatedData);
      res.status(201).json(subcontractor);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz taşeron verisi");
      }
      res.status(500).send("Taşeron oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/subcontractors/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/subcontractors/:id", requireAuth, async (req, res) => {
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
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).send("İşlemler yüklenirken hata oluştu");
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz işlem verisi");
      }
      res.status(500).send("İşlem oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
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
  app.get("/api/site-diary", requireAuth, async (req, res) => {
    try {
      const entries = await storage.getSiteDiaryEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).send("Şantiye defteri yüklenirken hata oluştu");
    }
  });

  app.post("/api/site-diary", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSiteDiarySchema.parse(req.body);
      const entry = await storage.createSiteDiaryEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz şantiye defteri verisi");
      }
      res.status(500).send("Şantiye defteri oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/site-diary/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/site-diary/:id", requireAuth, async (req, res) => {
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

  // Timesheet (Puantaj) routes
  app.get("/api/timesheets", requireAuth, async (req, res) => {
    try {
      const timesheets = await storage.getTimesheets();
      res.json(timesheets);
    } catch (error) {
      res.status(500).send("Puantaj kayıtları yüklenirken hata oluştu");
    }
  });

  app.post("/api/timesheets", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTimesheetSchema.parse(req.body);
      const timesheet = await storage.createTimesheet(validatedData);
      res.status(201).json(timesheet);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz puantaj verisi");
      }
      res.status(500).send("Puantaj kaydı oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/timesheets/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTimesheetSchema.partial().parse(req.body);
      const timesheet = await storage.updateTimesheet(req.params.id, validatedData);
      if (!timesheet) {
        return res.status(404).send("Puantaj kaydı bulunamadı");
      }
      res.json(timesheet);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz puantaj verisi");
      }
      res.status(500).send("Puantaj kaydı güncellenirken hata oluştu");
    }
  });

  app.delete("/api/timesheets/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteTimesheet(req.params.id);
      if (!success) {
        return res.status(404).send("Puantaj kaydı bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Puantaj kaydı silinirken hata oluştu");
    }
  });

  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).send("Faturalar yüklenirken hata oluştu");
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      if (error instanceof ZodError) {
        console.error("Invoice validation error:", error.errors);
        return res.status(400).send(error.message || "Geçersiz fatura verisi");
      }
      console.error("Invoice creation error:", error);
      res.status(500).send("Fatura oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).send("Fatura bulunamadı");
      }
      res.json(invoice);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz fatura verisi");
      }
      res.status(500).send("Fatura güncellenirken hata oluştu");
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).send("Fatura bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Fatura silinirken hata oluştu");
    }
  });

  // Task routes (İş Programı Görevleri)
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).send("Görevler yüklenirken hata oluştu");
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        console.error("Task validation error:", error.errors);
        return res.status(400).send(error.message || "Geçersiz görev verisi");
      }
      console.error("Task creation error:", error);
      res.status(500).send("Görev oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).send("Görev bulunamadı");
      }
      res.json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz görev verisi");
      }
      res.status(500).send("Görev güncellenirken hata oluştu");
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).send("Görev bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Görev silinirken hata oluştu");
    }
  });

  // Progress Payment routes (Hakediş)
  app.get("/api/progress-payments", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getProgressPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).send("Hakediş kayıtları yüklenirken hata oluştu");
    }
  });

  app.post("/api/progress-payments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProgressPaymentSchema.parse(req.body);
      const payment = await storage.createProgressPayment(validatedData);
      res.status(201).json(payment);
    } catch (error: any) {
      if (error instanceof ZodError) {
        console.error("Progress payment validation error:", error.errors);
        return res.status(400).send(error.message || "Geçersiz hakediş verisi");
      }
      console.error("Progress payment creation error:", error);
      res.status(500).send("Hakediş oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/progress-payments/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProgressPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateProgressPayment(req.params.id, validatedData);
      if (!payment) {
        return res.status(404).send("Hakediş bulunamadı");
      }
      res.json(payment);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz hakediş verisi");
      }
      res.status(500).send("Hakediş güncellenirken hata oluştu");
    }
  });

  app.delete("/api/progress-payments/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteProgressPayment(req.params.id);
      if (!success) {
        return res.status(404).send("Hakediş bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Hakediş silinirken hata oluştu");
    }
  });

  // Budget Item routes
  app.get("/api/budget-items", requireAuth, async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const items = await storage.getBudgetItems(projectId);
      res.json(items);
    } catch (error) {
      res.status(500).send("Bütçe kalemleri yüklenirken hata oluştu");
    }
  });

  app.get("/api/budget-items/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getBudgetItem(req.params.id);
      if (!item) {
        return res.status(404).send("Bütçe kalemi bulunamadı");
      }
      res.json(item);
    } catch (error) {
      res.status(500).send("Bütçe kalemi yüklenirken hata oluştu");
    }
  });

  app.post("/api/budget-items", requireAuth, async (req, res) => {
    try {
      const validatedData = insertBudgetItemSchema.parse(req.body);
      const item = await storage.createBudgetItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz bütçe kalemi verisi");
      }
      res.status(500).send("Bütçe kalemi oluşturulurken hata oluştu");
    }
  });

  app.patch("/api/budget-items/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertBudgetItemSchema.partial().parse(req.body);
      const item = await storage.updateBudgetItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).send("Bütçe kalemi bulunamadı");
      }
      res.json(item);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).send(error.message || "Geçersiz bütçe kalemi verisi");
      }
      res.status(500).send("Bütçe kalemi güncellenirken hata oluştu");
    }
  });

  app.delete("/api/budget-items/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteBudgetItem(req.params.id);
      if (!success) {
        return res.status(404).send("Bütçe kalemi bulunamadı");
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Bütçe kalemi silinirken hata oluştu");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
