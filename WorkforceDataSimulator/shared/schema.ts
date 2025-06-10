import { pgTable, text, serial, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(),
  date: date("date").notNull(),
  soLuongNhanVien: integer("so_luong_nhan_vien").default(0),
  hoSan: integer("ho_san").default(0),
  phepKhac: integer("phep_khac").default(0),
  thucTeLam: integer("thuc_te_lam").default(0),
  trucTiep: integer("truc_tiep").default(0),
  gianTiep: integer("gian_tiep").default(0),
  choMuon: integer("cho_muon").default(0),
  soNguoiTangCa: integer("so_nguoi_tang_ca").default(0),
  soLuongDienThoai: integer("so_luong_dien_thoai").default(0),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
