import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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
export const taskStatusEnum = ["Beklemede", "Devam Ediyor", "Tamamlandı", "İptal"] as const;

// İşlem tipleri
export const transactionTypeEnum = ["Gelir", "Gider"] as const;

// Fatura tipleri
export const invoiceTypeEnum = ["Alış", "Satış"] as const;

// Fatura durumları
export const invoiceStatusEnum = ["Ödenmedi", "Kısmi Ödendi", "Ödendi"] as const;

// Sözleşme tipleri
export const contractTypeEnum = ["Anahtar Teslim", "Maliyet + Kar Marjı"] as const;

// Hakediş durumları
export const progressPaymentStatusEnum = ["Bekliyor", "Kısmi Ödendi", "Ödendi"] as const;

// Bütçe kalemi durumları
export const budgetItemStatusEnum = ["Başlamadı", "Devam Ediyor", "Tamamlandı"] as const;

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
  contractType: text("contract_type"),
  contractAmount: decimal("contract_amount", { precision: 15, scale: 2 }),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }),
  advancePayment: decimal("advance_payment", { precision: 15, scale: 2 }).default("0"),
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
  progressPaymentId: varchar("progress_payment_id"), // Hangi hakedişe dahil edildiği
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
  projectId: varchar("project_id"), // Nullable - görev projeye bağlı olmayabilir
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  status: text("status").notNull().default("Beklemede"), // Beklemede, Devam Ediyor, Tamamlandı, İptal
  priority: text("priority").default("Orta"), // Düşük, Orta, Yüksek, Acil
  progress: integer("progress").notNull().default(0), // 0-100 arası ilerleme yüzdesi
  assignedTo: text("assigned_to"),
  checklist: jsonb("checklist").default(sql`'[]'::jsonb`), // Alt görevler [{id: string, text: string, completed: boolean}]
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskPriorityEnum = ["Düşük", "Orta", "Yüksek", "Acil"] as const;

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Checklist item type
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// Bütçe kalemleri tablosu
export const budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  isGrubu: text("is_grubu").notNull(),
  rayicGrubu: text("rayic_grubu").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("Başlamadı"),
  progress: integer("progress").notNull().default(0), // 0-100 arası yüzde
  actualQuantity: decimal("actual_quantity", { precision: 10, scale: 2 }),
  actualUnitPrice: decimal("actual_unit_price", { precision: 12, scale: 2 }),
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

// Hakediş (Progress Payments) tablosu
export const progressPayments = pgTable("progress_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  paymentNumber: integer("payment_number").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  workCompleted: text("work_completed"),
  transactionIds: jsonb("transaction_ids").default(sql`'[]'::jsonb`), // Seçilen gider transaction ID'leri
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  contractorFeeRate: decimal("contractor_fee_rate", { precision: 5, scale: 2 }).default("0"),
  grossAmount: decimal("gross_amount", { precision: 15, scale: 2 }),
  advanceDeductionRate: decimal("advance_deduction_rate", { precision: 5, scale: 2 }).default("0"),
  advanceDeduction: decimal("advance_deduction", { precision: 15, scale: 2 }).default("0"),
  netPayment: decimal("net_payment", { precision: 15, scale: 2 }),
  receivedAmount: decimal("received_amount", { precision: 15, scale: 2 }).default("0"),
  status: text("status").notNull().default("Bekliyor"),
  dueDate: date("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgressPaymentSchema = createInsertSchema(progressPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertProgressPayment = z.infer<typeof insertProgressPaymentSchema>;
export type ProgressPayment = typeof progressPayments.$inferSelect;
