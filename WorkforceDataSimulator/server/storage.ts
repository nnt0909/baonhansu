import { users, reports, type User, type InsertUser, type Report, type InsertReport } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report methods
  getAllReports(): Promise<Report[]>;
  getReportsByDepartment(department: string): Promise<Report[]>;
  getReportsByDate(date: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(report: InsertReport): Promise<Report>;
  getRecentReports(limit?: number): Promise<Report[]>;
  getReportByDepartmentAndDate(department: string, date: string): Promise<Report | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.date));
  }

  async getReportsByDepartment(department: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.department, department))
      .orderBy(desc(reports.date));
  }

  async getReportsByDate(date: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.date, date))
      .orderBy(reports.department);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async updateReport(insertReport: InsertReport): Promise<Report> {
    // Check if report exists for this department and date
    const existingReport = await this.getReportByDepartmentAndDate(insertReport.department, insertReport.date);
    
    if (existingReport) {
      // Update existing report
      const [updatedReport] = await db
        .update(reports)
        .set(insertReport)
        .where(and(eq(reports.department, insertReport.department), eq(reports.date, insertReport.date)))
        .returning();
      return updatedReport;
    } else {
      // Create new report
      return this.createReport(insertReport);
    }
  }

  async getRecentReports(limit: number = 10): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.date))
      .limit(limit);
  }

  async getReportByDepartmentAndDate(department: string, date: string): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.department, department), eq(reports.date, date)));
    return report || undefined;
  }
}

export const storage = new DatabaseStorage();
