import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Customer,
  type InsertCustomer,
  type Subcontractor,
  type InsertSubcontractor,
  type Transaction,
  type InsertTransaction,
  type SiteDiary,
  type InsertSiteDiary,
  type Timesheet,
  type InsertTimesheet,
  type Invoice,
  type InsertInvoice,
  type ProgressPayment,
  type InsertProgressPayment,
  type Task,
  type InsertTask,
  type BudgetItem,
  type InsertBudgetItem,
  users,
  projects,
  customers,
  subcontractors,
  transactions,
  siteDiary,
  timesheets,
  invoices,
  progressPayments,
  tasks,
  budgetItems,
} from "@shared/schema";
import session, { type Store } from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project methods
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Subcontractor methods
  getSubcontractors(): Promise<Subcontractor[]>;
  getSubcontractor(id: string): Promise<Subcontractor | undefined>;
  createSubcontractor(subcontractor: InsertSubcontractor): Promise<Subcontractor>;
  updateSubcontractor(id: string, subcontractor: Partial<InsertSubcontractor>): Promise<Subcontractor | undefined>;
  deleteSubcontractor(id: string): Promise<boolean>;

  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;

  // Site Diary methods
  getSiteDiaryEntries(): Promise<SiteDiary[]>;
  getSiteDiaryEntry(id: string): Promise<SiteDiary | undefined>;
  createSiteDiaryEntry(entry: InsertSiteDiary): Promise<SiteDiary>;
  updateSiteDiaryEntry(id: string, entry: Partial<InsertSiteDiary>): Promise<SiteDiary | undefined>;
  deleteSiteDiaryEntry(id: string): Promise<boolean>;

  // Timesheet methods
  getTimesheets(): Promise<Timesheet[]>;
  getTimesheet(id: string): Promise<Timesheet | undefined>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: string, timesheet: Partial<InsertTimesheet>): Promise<Timesheet | undefined>;
  deleteTimesheet(id: string): Promise<boolean>;

  // Invoice methods
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;

  // Progress Payment methods
  getProgressPayments(): Promise<ProgressPayment[]>;
  getProgressPayment(id: string): Promise<ProgressPayment | undefined>;
  createProgressPayment(payment: InsertProgressPayment): Promise<ProgressPayment>;
  updateProgressPayment(id: string, payment: Partial<InsertProgressPayment>): Promise<ProgressPayment | undefined>;
  deleteProgressPayment(id: string): Promise<boolean>;

  // Task methods
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Budget Item methods
  getBudgetItems(): Promise<BudgetItem[]>;
  getBudgetItem(id: string): Promise<BudgetItem | undefined>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: string, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined>;
  deleteBudgetItem(id: string): Promise<boolean>;

  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Subcontractor methods
  async getSubcontractors(): Promise<Subcontractor[]> {
    return await db.select().from(subcontractors);
  }

  async getSubcontractor(id: string): Promise<Subcontractor | undefined> {
    const [subcontractor] = await db.select().from(subcontractors).where(eq(subcontractors.id, id)).limit(1);
    return subcontractor;
  }

  async createSubcontractor(subcontractor: InsertSubcontractor): Promise<Subcontractor> {
    const [newSubcontractor] = await db.insert(subcontractors).values(subcontractor).returning();
    return newSubcontractor;
  }

  async updateSubcontractor(id: string, subcontractor: Partial<InsertSubcontractor>): Promise<Subcontractor | undefined> {
    const [updated] = await db.update(subcontractors).set(subcontractor).where(eq(subcontractors.id, id)).returning();
    return updated;
  }

  async deleteSubcontractor(id: string): Promise<boolean> {
    const result = await db.delete(subcontractors).where(eq(subcontractors.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Site Diary methods
  async getSiteDiaryEntries(): Promise<SiteDiary[]> {
    return await db.select().from(siteDiary);
  }

  async getSiteDiaryEntry(id: string): Promise<SiteDiary | undefined> {
    const [entry] = await db.select().from(siteDiary).where(eq(siteDiary.id, id)).limit(1);
    return entry;
  }

  async createSiteDiaryEntry(entry: InsertSiteDiary): Promise<SiteDiary> {
    const [newEntry] = await db.insert(siteDiary).values(entry).returning();
    return newEntry;
  }

  async updateSiteDiaryEntry(id: string, entry: Partial<InsertSiteDiary>): Promise<SiteDiary | undefined> {
    const [updated] = await db.update(siteDiary).set(entry).where(eq(siteDiary.id, id)).returning();
    return updated;
  }

  async deleteSiteDiaryEntry(id: string): Promise<boolean> {
    const result = await db.delete(siteDiary).where(eq(siteDiary.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Timesheet methods
  async getTimesheets(): Promise<Timesheet[]> {
    return await db.select().from(timesheets);
  }

  async getTimesheet(id: string): Promise<Timesheet | undefined> {
    const [timesheet] = await db.select().from(timesheets).where(eq(timesheets.id, id)).limit(1);
    return timesheet;
  }

  async createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet> {
    const [newTimesheet] = await db.insert(timesheets).values(timesheet).returning();
    return newTimesheet;
  }

  async updateTimesheet(id: string, timesheet: Partial<InsertTimesheet>): Promise<Timesheet | undefined> {
    const [updated] = await db.update(timesheets).set(timesheet).where(eq(timesheets.id, id)).returning();
    return updated;
  }

  async deleteTimesheet(id: string): Promise<boolean> {
    const result = await db.delete(timesheets).where(eq(timesheets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Progress Payment methods
  async getProgressPayments(): Promise<ProgressPayment[]> {
    return await db.select().from(progressPayments);
  }

  async getProgressPayment(id: string): Promise<ProgressPayment | undefined> {
    const [payment] = await db.select().from(progressPayments).where(eq(progressPayments.id, id)).limit(1);
    return payment;
  }

  async createProgressPayment(payment: InsertProgressPayment): Promise<ProgressPayment> {
    const [newPayment] = await db.insert(progressPayments).values(payment).returning();
    return newPayment;
  }

  async updateProgressPayment(id: string, payment: Partial<InsertProgressPayment>): Promise<ProgressPayment | undefined> {
    const [updated] = await db.update(progressPayments).set(payment).where(eq(progressPayments.id, id)).returning();
    return updated;
  }

  async deleteProgressPayment(id: string): Promise<boolean> {
    const result = await db.delete(progressPayments).where(eq(progressPayments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Budget Item methods
  async getBudgetItems(): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems);
  }

  async getBudgetItem(id: string): Promise<BudgetItem | undefined> {
    const [item] = await db.select().from(budgetItems).where(eq(budgetItems.id, id)).limit(1);
    return item;
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db.insert(budgetItems).values(item).returning();
    return newItem;
  }

  async updateBudgetItem(id: string, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const [updated] = await db.update(budgetItems).set(item).where(eq(budgetItems.id, id)).returning();
    return updated;
  }

  async deleteBudgetItem(id: string): Promise<boolean> {
    const result = await db.delete(budgetItems).where(eq(budgetItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
