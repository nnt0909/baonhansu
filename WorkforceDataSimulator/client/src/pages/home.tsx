import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChartLine, FileText, History, Layers, FileSpreadsheet, RefreshCw, User, Eye, Download, CheckCircle, LogOut, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertReportSchema, type Report } from "@shared/schema";
import { z } from "zod";

// Department options
const departments = [
  { value: "det-gon-x3", label: "Dệt gòn x3" },
  { value: "chan-1-kim", label: "Chần 1 Kim" },
  { value: "cat-tu-dong", label: "Cắt tự động" },
  { value: "vo-nhung", label: "Vô Nhung" },
  { value: "dong-nut-gan-nhan", label: "Đóng nút+ gắn nhãn" },
  { value: "vo-gon-tam", label: "Vô gòn Tấm" },
  { value: "sua-do", label: "Sửa đồ" },
  { value: "dong-goi", label: "Đóng Gói" },
  { value: "kiem-pham", label: "Kiểm Phẩm" },
  { value: "bao-bien", label: "Bao Biên" },
  { value: "tro-li-tap-vu-khac", label: "Trợ lí, tạp vụ, khác..." },
  { value: "quan-li", label: "Quản lí" }
];

const formSchema = insertReportSchema.extend({
  date: z.string().min(1, "Ngày báo cáo là bắt buộc"),
  department: z.string().min(1, "Bộ phận là bắt buộc")
});

export default function Home() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("authenticated");
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [setLocation]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department: "",
      date: today,
      soLuongNhanVien: 0,
      hoSan: 0,
      phepKhac: 0,
      thucTeLam: 0,
      trucTiep: 0,
      gianTiep: 0,
      choMuon: 0,
      soNguoiTangCa: 0,
      soLuongDienThoai: 0
    }
  });

  // Fetch recent reports
  const { data: recentReports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports/recent"]
  });

  // Fetch filtered reports by date
  const { data: filteredReports = [], isLoading: isFilterLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports/date", filterDate],
    enabled: !!filterDate,
    queryFn: async () => {
      if (!filterDate) return [];
      const response = await fetch(`/api/reports/date/${filterDate}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    }
  });

  // Submit report mutation
  const submitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/reports", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccessModal(true);
      form.reset({
        department: "",
        date: today,
        soLuongNhanVien: 0,
        hoSan: 0,
        phepKhac: 0,
        thucTeLam: 0,
        trucTiep: 0,
        gianTiep: 0,
        choMuon: 0,
        soNguoiTangCa: 0,
        soLuongDienThoai: 0
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể gửi báo cáo. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  // Export Excel mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/reports/export", {
        method: "GET",
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-nhan-su-${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "File Excel đã được tải xuống!"
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xuất file Excel. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    submitMutation.mutate(data);
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc muốn xóa tất cả dữ liệu đã nhập?")) {
      form.reset({
        department: "",
        date: today,
        soLuongNhanVien: 0,
        hoSan: 0,
        phepKhac: 0,
        thucTeLam: 0,
        trucTiep: 0,
        gianTiep: 0,
        choMuon: 0,
        soNguoiTangCa: 0,
        soLuongDienThoai: 0
      });
    }
  };

  const getDepartmentLabel = (value: string) => {
    return departments.find(dept => dept.value === value)?.label || value;
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("username");
    setLocation("/login");
  };

  const displayReports = filterDate ? filteredReports : recentReports;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChartLine className="text-blue-600 text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Hệ Thống Báo Cáo Nhân Sự</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{sessionStorage.getItem("username") || "Người dùng"}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Form */}
        <Card className="mb-8">
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center text-lg">
              <FileText className="text-blue-600 mr-2" />
              Báo Cáo Nhân Sự Hàng Ngày
            </CardTitle>
            <p className="text-sm text-gray-600">Vui lòng điền đầy đủ thông tin báo cáo cho bộ phận của bạn</p>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Department and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Bộ Phận <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="-- Chọn bộ phận --" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.value} value={dept.value}>
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày Báo Cáo</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Employee Numbers Grid */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Thông Tin Nhân Sự</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="soLuongNhanVien"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số Lượng Nhân Viên</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hoSan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hộ Sản</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phepKhac"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phép Khác</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="thucTeLam"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thực Tế Làm</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trucTiep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trực Tiếp</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gianTiep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gián Tiếp</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="choMuon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cho Mượn</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="soNguoiTangCa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số Người Tăng Ca</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="soLuongDienThoai"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số Lượng Điện Thoại</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Layers className="mr-2 h-4 w-4" />
                        Gửi Báo Cáo
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => exportMutation.mutate()}
                    disabled={exportMutation.isPending}
                  >
                    {exportMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Đang xuất...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Xuất Excel
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                    onClick={handleReset}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Làm Mới
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Data Filter and Reports */}
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                <History className="text-blue-600 mr-2" />
                {filterDate ? `Báo Cáo Ngày ${filterDate}` : "Báo Cáo Gần Đây"}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    placeholder="Lọc theo ngày"
                    className="w-40"
                  />
                  {filterDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterDate("")}
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bộ Phận</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>SL Nhân Viên</TableHead>
                    <TableHead>Hộ Sản</TableHead>
                    <TableHead>Phép Khác</TableHead>
                    <TableHead>Thực Tế Làm</TableHead>
                    <TableHead>Trực Tiếp</TableHead>
                    <TableHead>Gián Tiếp</TableHead>
                    <TableHead>Cho Mượn</TableHead>
                    <TableHead>Tăng Ca</TableHead>
                    <TableHead>SL Điện Thoại</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isLoading || isFilterLoading) ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : displayReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        {filterDate ? "Không có dữ liệu cho ngày này" : "Chưa có báo cáo nào"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {getDepartmentLabel(report.department)}
                        </TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.soLuongNhanVien}</TableCell>
                        <TableCell>{report.hoSan}</TableCell>
                        <TableCell>{report.phepKhac}</TableCell>
                        <TableCell>{report.thucTeLam}</TableCell>
                        <TableCell>{report.trucTiep}</TableCell>
                        <TableCell>{report.gianTiep}</TableCell>
                        <TableCell>{report.choMuon}</TableCell>
                        <TableCell>{report.soNguoiTangCa}</TableCell>
                        <TableCell>{report.soLuongDienThoai}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle>Báo Cáo Thành Công!</DialogTitle>
            <DialogDescription>
              Dữ liệu đã được lưu vào hệ thống.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={() => setShowSuccessModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
