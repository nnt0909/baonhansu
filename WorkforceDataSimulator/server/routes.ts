import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema } from "@shared/schema";
import ExcelJS from "exceljs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get recent reports
  app.get("/api/reports/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const reports = await storage.getRecentReports(limit);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent reports" });
    }
  });

  // Get reports by date
  app.get("/api/reports/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const reports = await storage.getReportsByDate(date);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports by date" });
    }
  });

  // Create or update a report
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.updateReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create report" });
      }
    }
  });

  // Export reports to Excel
  app.get("/api/reports/export", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Báo Cáo Nhân Sự");

      // Define department name mapping
      const departmentNames: Record<string, string> = {
        "det-gon-x3": "Dệt gòn x3",
        "chan-1-kim": "Chần 1 Kim",
        "cat-tu-dong": "Cắt tự động",
        "vo-nhung": "Vô Nhung",
        "dong-nut-gan-nhan": "Đóng nút+ gắn nhãn",
        "vo-gon-tam": "Vô gòn Tấm",
        "sua-do": "Sửa đồ",
        "dong-goi": "Đóng Gói",
        "kiem-pham": "Kiểm Phẩm",
        "bao-bien": "Bao Biên",
        "tro-li-tap-vu-khac": "Trợ lí, tạp vụ, khác...",
        "quan-li": "Quản lí",
        "van-phong": "Văn Phòng"
      };

      // Add headers
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Bộ Phận", key: "department", width: 20 },
        { header: "Ngày", key: "date", width: 15 },
        { header: "Số Lượng Nhân Viên", key: "soLuongNhanVien", width: 20 },
        { header: "Hộ Sản", key: "hoSan", width: 15 },
        { header: "Phép Khác", key: "phepKhac", width: 15 },
        { header: "Thực Tế Làm", key: "thucTeLam", width: 15 },
        { header: "Trực Tiếp", key: "trucTiep", width: 15 },
        { header: "Gián Tiếp", key: "gianTiep", width: 15 },
        { header: "Cho Mượn", key: "choMuon", width: 15 },
        { header: "Số Người Tăng Ca", key: "soNguoiTangCa", width: 20 },
        { header: "Số Lượng Điện Thoại", key: "soLuongDienThoai", width: 20 }
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE3F2FD" }
      };

      // Add data rows
      reports.forEach(report => {
        worksheet.addRow({
          ...report,
          department: departmentNames[report.department] || report.department
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.eachCell) {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 10 ? 10 : maxLength + 2;
        }
      });

      // Set response headers for file download
      const fileName = `bao-cao-nhan-su-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ message: "Failed to export Excel file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
