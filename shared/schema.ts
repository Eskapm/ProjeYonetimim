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

// Gelir türleri (sadece Gelir işlemleri için)
export const incomeKindEnum = [
  "Avans Ödemesi",
  "Hakediş Ödemesi",
  "Teminat İadesi",
  "Fiyat Farkı"
] as const;

// Ödeme yöntemleri
export const paymentMethodEnum = [
  "Nakit",
  "Havale/EFT",
  "Çek",
  "Kredi Kartı"
] as const;

// Fatura tipleri
export const invoiceTypeEnum = ["Alış", "Satış"] as const;

// Fatura durumları
export const invoiceStatusEnum = ["Ödenmedi", "Kısmi Ödendi", "Ödendi"] as const;

// Sözleşme tipleri
export const contractTypeEnum = ["Anahtar Teslim", "Maliyet + Kar"] as const;

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
  advanceDeductionRate: decimal("advance_deduction_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// İletişim kişisi tipi
export interface ContactPerson {
  name: string;
  phone?: string;
  email?: string;
  title?: string; // Ünvan (Müdür, Şef, vb.)
}

// Müşteriler tablosu
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"), // Geriye uyumluluk için tutuldu
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  contacts: jsonb("contacts").$type<ContactPerson[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

const baseInsertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = baseInsertCustomerSchema.extend({
  contacts: z.array(z.object({
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    title: z.string().optional(),
  })).optional().default([]),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Taşeron/Tedarikçi türleri
export const supplierTypeEnum = ["Taşeron", "Tedarikçi"] as const;

// Taşeronlar ve Tedarikçiler tablosu
export const subcontractors = pgTable("subcontractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").default("Taşeron"), // Taşeron veya Tedarikçi
  contactPerson: text("contact_person"), // Geriye uyumluluk için tutuldu
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  specialty: text("specialty"),
  contacts: jsonb("contacts").$type<ContactPerson[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

const baseInsertSubcontractorSchema = createInsertSchema(subcontractors).omit({
  id: true,
  createdAt: true,
});

export const insertSubcontractorSchema = baseInsertSubcontractorSchema.extend({
  type: z.string().optional().default("Taşeron"),
  contacts: z.array(z.object({
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    title: z.string().optional(),
  })).optional().default([]),
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
  // Gider için kategoriler (Gelir için opsiyonel)
  isGrubu: text("is_grubu"),
  rayicGrubu: text("rayic_grubu"),
  invoiceNumber: text("invoice_number"),
  // Gider için taşeron/tedarikçi bağlantısı
  subcontractorId: varchar("subcontractor_id"),
  // Hangi hakedişe dahil edildiği (gider için)
  progressPaymentId: varchar("progress_payment_id"),
  // Gelir için yeni alanlar
  incomeKind: text("income_kind"), // Avans, Hakediş, Teminat İadesi, Fiyat Farkı
  customerId: varchar("customer_id"), // Gelir için müşteri bağlantısı
  linkedProgressPaymentId: varchar("linked_progress_payment_id"), // Hakediş ödemesi için bağlantı
  paymentMethod: text("payment_method"), // Nakit, Havale/EFT, Çek, Kredi Kartı
  checkDueDate: date("check_due_date"), // Çek için vade tarihi
  receiptNumber: text("receipt_number"), // Makbuz numarası
  // Fatura bağlantısı (çift yönlü entegrasyon)
  linkedInvoiceId: varchar("linked_invoice_id"), // Bağlı fatura ID'si
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  subcontractorId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  linkedProgressPaymentId: z.string().nullable().optional(),
  isGrubu: z.string().nullable().optional(),
  rayicGrubu: z.string().nullable().optional(),
  incomeKind: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  checkDueDate: z.string().nullable().optional(),
  receiptNumber: z.string().nullable().optional(),
  linkedInvoiceId: z.string().nullable().optional(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Extended type for transactions with project, subcontractor and customer information
export interface TransactionWithProject extends Transaction {
  projectName: string;
  subcontractorName?: string;
  customerName?: string;
  linkedProgressPaymentNumber?: number;
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
  // İşlem bağlantısı (çift yönlü entegrasyon)
  linkedTransactionId: varchar("linked_transaction_id"), // Bağlı işlem ID'si
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
}).extend({
  linkedTransactionId: z.string().nullable().optional(),
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
  fullName: text("full_name"),
  email: text("email").unique(),
  companyName: text("company_name"),
  country: text("country"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  companyName: true,
  country: true,
  city: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Public user type (without password) - safe to send to client
export type PublicUser = Omit<User, "password">;

// Kayıt formu için genişletilmiş şema
export const registerUserSchema = z.object({
  fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string(),
  companyName: z.string().optional(),
  country: z.string().min(1, "Ülke seçimi zorunludur"),
  city: z.string().min(1, "Şehir girilmesi zorunludur"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

export type RegisterUser = z.infer<typeof registerUserSchema>;

// Puantaj (Günlük işçi çalışma kayıtları) tablosu
export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  subcontractorId: varchar("subcontractor_id"),
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
  photos: text("photos").array(), // Yapılan işlerin fotoğrafları (URL'ler)
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

// Sözleşme durumları
export const contractStatusEnum = ["Taslak", "Aktif", "Tamamlandı", "İptal"] as const;

// Sözleşmeler tablosu
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  contractNumber: text("contract_number"), // Sözleşme numarası
  title: text("title").notNull(),
  contractType: text("contract_type"), // Anahtar Teslim, Maliyet + Kar
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  signDate: date("sign_date"), // İmza tarihi
  status: text("status").notNull().default("Taslak"),
  advancePaymentRate: decimal("advance_payment_rate", { precision: 5, scale: 2 }).default("0"),
  retentionRate: decimal("retention_rate", { precision: 5, scale: 2 }).default("0"), // Teminat kesinti oranı
  description: text("description"),
  terms: text("terms"), // Sözleşme maddeleri
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Ödeme planı durumları
export const paymentPlanStatusEnum = ["Bekliyor", "Ödendi", "Gecikmiş", "İptal"] as const;

// Ödeme planı tablosu
export const paymentPlans = pgTable("payment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  contractId: varchar("contract_id"), // Opsiyonel sözleşme bağlantısı
  title: text("title").notNull(),
  type: text("type").notNull(), // Gelir veya Gider
  plannedAmount: decimal("planned_amount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }).default("0"),
  plannedDate: date("planned_date").notNull(),
  actualDate: date("actual_date"),
  status: text("status").notNull().default("Bekliyor"),
  description: text("description"),
  transactionId: varchar("transaction_id"), // Gerçekleşen ödeme ile bağlantı
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({
  id: true,
  createdAt: true,
});

export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;
export type PaymentPlan = typeof paymentPlans.$inferSelect;

// Döküman kategorileri
export const documentCategoryEnum = [
  "Sözleşme",
  "Proje",
  "Hakediş",
  "Fatura",
  "Teknik Çizim",
  "Fotoğraf",
  "Rapor",
  "Diğer"
] as const;

// Dökümanlar tablosu
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Diğer"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"), // pdf, jpg, png, doc, etc.
  fileSize: integer("file_size"), // Bytes
  description: text("description"),
  uploadedBy: varchar("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
