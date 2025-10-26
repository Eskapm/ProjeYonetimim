import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// İş Grupları enum
export const isGrubuEnum = [
  "Kaba İmalat",
  "İnce İmalat",
  "Mekanik Tesisat",
  "Elektrik Tesisat",
  "Çevre Düzenlemesi ve Altyapı",
  "Genel Giderler ve Endirekt Giderler"
] as const;

// Rayiç Grupları enum
export const rayicGrubuEnum = [
  "Malzeme",
  "İşçilik",
  "Makine Ekipman",
  "Paket",
  "Genel Giderler ve Endirekt Giderler"
] as const;

// Proje durumları
export const projectStatusEnum = ["Planlama", "Devam Ediyor", "Tamamlandı", "Askıda"] as const;

// Görev durumları
export const taskStatusEnum = ["Bekliyor", "Devam Ediyor", "Tamamlandı", "İptal"] as const;

// İşlem tipleri
export const transactionTypeEnum = ["Gelir", "Gider"] as const;

// Fatura tipleri
export const invoiceTypeEnum = ["Alış", "Satış"] as const;

// Fatura durumları
export const invoiceStatusEnum = ["Ödenmedi", "Kısmi Ödendi", "Ödendi"] as const;

// Projeler tablosu
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location"),
  area: decimal("area", { precision: 10, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("Planlama"),
  description: text("description"),
  notes: text("notes"),
  customerId: varchar("customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Müşteriler tablosu
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Taşeronlar tablosu
export const subcontractors = pgTable("subcontractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  specialty: text("specialty"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubcontractorSchema = createInsertSchema(subcontractors).omit({
  id: true,
  createdAt: true,
});

export type InsertSubcontractor = z.infer<typeof insertSubcontractorSchema>;
export type Subcontractor = typeof subcontractors.$inferSelect;

// Gelir/Gider işlemleri tablosu
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
  isGrubu: text("is_grubu").notNull(),
  rayicGrubu: text("rayic_grubu").notNull(),
  invoiceNumber: text("invoice_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Extended type for transactions with project information
export interface TransactionWithProject extends Transaction {
  projectName: string;
}

// Faturalar tablosu
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull(),
  type: text("type").notNull(), // Alış veya Satış
  projectId: varchar("project_id"), // Optional - fatura bir projeye bağlı olabilir
  customerId: varchar("customer_id"), // Satış faturası için müşteri
  subcontractorId: varchar("subcontractor_id"), // Alış faturası için taşeron
  date: date("date").notNull(),
  dueDate: date("due_date"), // Vade tarihi
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(), // KDV hariç tutar
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20"), // KDV oranı (%)
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull(), // KDV tutarı
  total: decimal("total", { precision: 12, scale: 2 }).notNull(), // KDV dahil toplam
  status: text("status").notNull().default("Ödenmedi"), // Ödeme durumu
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"), // Ödenen tutar
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// İş programı görevleri tablosu
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("Bekliyor"),
  responsible: text("responsible"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Bütçe kalemleri tablosu
export const budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  isGrubu: text("is_grubu").notNull(),
  rayicGrubu: text("rayic_grubu").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
});

export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Public user type (without password) - safe to send to client
export type PublicUser = Omit<User, "password">;

// Puantaj (Günlük işçi çalışma kayıtları) tablosu
export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  date: date("date").notNull(),
  isGrubu: text("is_grubu").notNull(),
  workerCount: integer("worker_count").notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({
  id: true,
  createdAt: true,
});

export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheets.$inferSelect;

// Şantiye Defteri (Günlük şantiye raporları) tablosu
export const siteDiary = pgTable("site_diary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  date: date("date").notNull(),
  weather: text("weather"),
  workDone: text("work_done").notNull(),
  materialsUsed: text("materials_used"),
  totalWorkers: integer("total_workers"),
  issues: text("issues"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSiteDiarySchema = createInsertSchema(siteDiary).omit({
  id: true,
  createdAt: true,
});

export type InsertSiteDiary = z.infer<typeof insertSiteDiarySchema>;
export type SiteDiary = typeof siteDiary.$inferSelect;
