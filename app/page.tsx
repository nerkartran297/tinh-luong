"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  ShieldCheck,
  Briefcase,
  Wallet,
  TrendingDown,
  FileSpreadsheet,
  ChevronRight,
  Receipt,
  UserCog,
  ArrowLeft,
  Save,
  Calculator,
  CircleDollarSign,
  Download,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type LoaiNhanVien = "bien-che" | "hop-dong" | "bao-ve";

type PayrollRow = {
  employeeId: string;
  fullName: string;
  role: string;
  employeeType: LoaiNhanVien;
  salaryBase: number;
  salaryCoefficient: number;
  positionAllowance: number;
  regionAllowance: number;
  pctnvk: number;
  preferentialAllowance: number;
  seniorityAllowance: number;
  teachingSeniorityPercent: number;
  teachingSeniorityValue: number;
  totalCoefficient: number;
  grossSalary: number;
  sickDeduction: number;
  insuranceAmount: number;
  otherDeduction: number;
  netSalary: number;
  note?: string;
};

const ROLE_LABELS: Record<string, string> = {
  "hieu-truong": "Hiệu trưởng",
  "pho-hieu-truong": "Phó hiệu trưởng",
  "giao-vien": "Giáo viên",
  "ke-toan": "Kế toán",
  "van-thu": "Văn thư",
  "bao-ve": "Bảo vệ",
  "giao-vien-hop-dong": "Giáo viên HĐ",
};

/** Thứ tự chuẩn khi in Excel: Hiệu trưởng -> Phó HT -> GV -> Kế toán -> Văn thư -> GV HĐ -> Bảo vệ */
const ROLE_EXCEL_ORDER = [
  "hieu-truong",
  "pho-hieu-truong",
  "giao-vien",
  "ke-toan",
  "van-thu",
  "giao-vien-hop-dong",
  "bao-ve",
] as const;

function roleSortIndex(role: string): number {
  const i = ROLE_EXCEL_ORDER.indexOf(role as (typeof ROLE_EXCEL_ORDER)[number]);
  return i === -1 ? 999 : i;
}

function roleLabel(slug: string) {
  return ROLE_LABELS[slug] ?? slug;
}

const nhanLoai = {
  all: { nhan: "Tất cả", mau: "bg-stone-900 text-white" },
  "bien-che": { nhan: "Biên chế", mau: "bg-emerald-50 text-emerald-700" },
  "hop-dong": { nhan: "Giáo viên HĐ", mau: "bg-amber-50 text-amber-700" },
  "bao-ve": { nhan: "Bảo vệ", mau: "bg-sky-50 text-sky-700" },
};
function dinhDangTien(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v || 0);
}
function dinhDangSo(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(v || 0);
}
function TheThongKe({
  tieuDe,
  giaTri,
  phuDe,
  icon: Icon,
}: {
  tieuDe: string;
  giaTri: string;
  phuDe: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-3xl border-stone-200 bg-white/80 shadow-sm backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">{tieuDe}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              {giaTri}
            </p>
            <p className="mt-1 text-sm text-stone-500">{phuDe}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <Icon className="h-5 w-5 text-stone-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function OThongTin({
  nhan,
  giaTri,
  hauTo,
}: {
  nhan: string;
  giaTri: string | number;
  hauTo?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-stone-600">{nhan}</Label>
      <div className="flex h-11 items-center rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900">
        <span className="truncate">{giaTri}</span>
        {hauTo ? <span className="ml-2 text-stone-400">{hauTo}</span> : null}
      </div>
    </div>
  );
}
type KieuTrang = "bang-dieu-khien" | "ho-so-nhan-vien";
export default function Page() {
  const now = new Date();
  const [trang, setTrang] = useState<KieuTrang>("bang-dieu-khien");
  const [boLoc, setBoLoc] = useState<"all" | LoaiNhanVien>("all");
  const [tuKhoa, setTuKhoa] = useState("");
  const [idDangChon, setIdDangChon] = useState<string | null>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [salaryBaseDefault, setSalaryBaseDefault] = useState(2340000);
  const [salaryBaseInput, setSalaryBaseInput] = useState("");
  const [savingSalaryBase, setSavingSalaryBase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dangTaiExcel, setDangTaiExcel] = useState(false);
  const [deductionsForDetail, setDeductionsForDetail] = useState<
    {
      _id: string;
      title: string;
      amount: number;
      reason: string;
      month: number;
      year: number;
      status: string;
      effectiveDate: string;
    }[]
  >([]);
  const [loadingDeductions, setLoadingDeductions] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, previewRes] = await Promise.all([
        fetch("/api/settings", { credentials: "include" }),
        fetch(`/api/payroll/preview?month=${month}&year=${year}`, {
          credentials: "include",
        }),
      ]);
      const settingsData = settingsRes.ok ? await settingsRes.json() : {};
      const previewData = previewRes.ok ? await previewRes.json() : {};
      if (settingsData?.data?.salaryBaseDefault != null) {
        setSalaryBaseDefault(settingsData.data.salaryBaseDefault);
        setSalaryBaseInput(String(settingsData.data.salaryBaseDefault));
      } else {
        setSalaryBaseInput("2340000");
      }
      if (previewData?.data?.rows) {
        setRows(previewData.data.rows);
        if (!idDangChon && previewData.data.rows.length > 0) {
          setIdDangChon(previewData.data.rows[0].employeeId);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveSalaryBase() {
    const num = parseInt(salaryBaseInput.replace(/\D/g, ""), 10);
    if (Number.isNaN(num) || num < 0) return;
    setSavingSalaryBase(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salaryBaseDefault: num }),
        credentials: "include",
      });
      const data = await res.json();
      if (data?.data?.salaryBaseDefault != null) {
        setSalaryBaseDefault(data.data.salaryBaseDefault);
        setSalaryBaseInput(String(data.data.salaryBaseDefault));
        fetchData();
      }
    } finally {
      setSavingSalaryBase(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/sign-in";
  }

  const danhSachLoc = useMemo(() => {
    const filtered = rows.filter((nv) => {
      const hopLoai = boLoc === "all" ? true : nv.employeeType === boLoc;
      const q = tuKhoa.trim().toLowerCase();
      const hopTuKhoa =
        q.length === 0
          ? true
          : nv.fullName.toLowerCase().includes(q) ||
            roleLabel(nv.role).toLowerCase().includes(q);
      return hopLoai && hopTuKhoa;
    });
    return [...filtered].sort((a, b) => {
      const byRole = roleSortIndex(a.role) - roleSortIndex(b.role);
      if (byRole !== 0) return byRole;
      return a.fullName.localeCompare(b.fullName, "vi");
    });
  }, [boLoc, tuKhoa, rows]);

  const nhanVienDangChon =
    danhSachLoc.find((x) => x.employeeId === idDangChon) ??
    rows.find((x) => x.employeeId === idDangChon) ??
    rows[0];

  useEffect(() => {
    if (trang !== "ho-so-nhan-vien" || !nhanVienDangChon?.employeeId) {
      setDeductionsForDetail([]);
      return;
    }
    setLoadingDeductions(true);
    fetch(`/api/employees/${nhanVienDangChon.employeeId}/deductions`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.data)) {
          setDeductionsForDetail(data.data);
        } else {
          setDeductionsForDetail([]);
        }
      })
      .catch(() => setDeductionsForDetail([]))
      .finally(() => setLoadingDeductions(false));
  }, [trang, nhanVienDangChon?.employeeId]);

  const thongKe = useMemo(() => {
    const nguon =
      boLoc === "all" ? rows : rows.filter((x) => x.employeeType === boLoc);
    return {
      soNguoi: nguon.length,
      tongLuong: nguon.reduce((s, nv) => s + nv.grossSalary, 0),
      tongBaoHiem: nguon.reduce((s, nv) => s + nv.insuranceAmount, 0),
      tongKhauTruKhac: nguon.reduce(
        (s, nv) => s + nv.sickDeduction + nv.otherDeduction,
        0,
      ),
      tongThucNhan: nguon.reduce((s, nv) => s + nv.netSalary, 0),
    };
  }, [boLoc, rows]);

  function moHoSoNhanVien(employeeId: string) {
    setIdDangChon(employeeId);
    setTrang("ho-so-nhan-vien");
  }
  async function taiXuongExcel() {
    try {
      setDangTaiExcel(true);

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Bảng lương");

      ws.properties.defaultRowHeight = 24;
      ws.views = [{ showGridLines: true }];

      ws.columns = [
        { key: "A", width: 8 },
        { key: "B", width: 28 },
        { key: "C", width: 18 },
        { key: "D", width: 12 },
        { key: "E", width: 12 },
        { key: "F", width: 12 },
        { key: "G", width: 12 },
        { key: "H", width: 14 },
        { key: "I", width: 10 },
        { key: "J", width: 10 },
        { key: "K", width: 16 },
        { key: "L", width: 12 },
        { key: "M", width: 16 },
        { key: "N", width: 16 },
        { key: "O", width: 16 },
        { key: "P", width: 16 },
        { key: "Q", width: 18 },
        { key: "R", width: 16 },
      ];

      ws.mergeCells("A2:R2");
      ws.getCell("A2").value = "TRƯỜNG MẪU GIÁO - BẢNG LƯƠNG THÁNG 03 NĂM 2025";
      ws.getCell("A2").font = { bold: true, size: 14 };
      ws.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("A3:R3");
      ws.getCell("A3").value = `Mức lương cơ sở: ${dinhDangTien(
        salaryBaseDefault,
      )}`;
      ws.getCell("A3").alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      ws.getCell("A3").font = { italic: true, size: 11 };

      ws.mergeCells("A5:A8");
      ws.mergeCells("B5:B8");
      ws.mergeCells("C5:C8");
      ws.mergeCells("D5:M5");
      ws.mergeCells("F6:K6");
      ws.mergeCells("D6:D8");
      ws.mergeCells("E6:E8");
      ws.mergeCells("F7:F8");
      ws.mergeCells("G7:G8");
      ws.mergeCells("H7:H8");
      ws.mergeCells("I7:I8");
      ws.mergeCells("J7:J8");
      ws.mergeCells("K7:K8");
      ws.mergeCells("L6:L8");
      ws.mergeCells("M6:M8");
      ws.mergeCells("N5:N8");
      ws.mergeCells("O5:P6");
      ws.mergeCells("Q5:Q8");
      ws.mergeCells("R5:R8");
      ws.mergeCells("O7:O8");
      ws.mergeCells("P7:P8");

      ws.getCell("A5").value = "TT";
      ws.getCell("B5").value = "Họ và tên";
      ws.getCell("C5").value = "Cấp bậc\nchức vụ";
      ws.getCell("D5").value = "LƯƠNG HỆ SỐ";
      ws.getCell("N5").value = "Trừ ốm đau,\nNS, DSPHSK";
      ws.getCell("O5").value = "Các khoản trừ lương";
      ws.getCell("Q5").value = "Tổng tiền lương\nthực nhận";
      ws.getCell("R5").value = "Ghi chú";

      ws.getCell("D6").value = "Hệ số\nlương";
      ws.getCell("E6").value = "Phụ cấp\nCV";
      ws.getCell("F7").value = "Khu vực";
      ws.getCell("G7").value = "PCTNVK";
      ws.getCell("H7").value = "PC ưu đãi\n50%, 70%";
      ws.getCell("I7").value = "PC TN'";
      ws.getCell("J7").value = "%\nTNNG";
      ws.getCell("K7").value = "Thâm\nniên nhà\ngiáo";
      ws.getCell("L6").value = "Cộng hệ số";
      ws.getCell("M6").value = "Thành tiền";
      ws.getCell("O7").value = "BHXH, BHYT,\nBHTN 10.5%";
      ws.getCell("P7").value = "Trừ các khoản\nkhác";

      ws.getCell("F6").value = "Hệ số phụ cấp khác";

      [5, 6, 7, 8].forEach((r) => {
        const row = ws.getRow(r);
        row.height = 30;
        row.eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF3F4F6" },
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      const batDauDuLieu = 9;

      const danhSachChoExcel = [...danhSachLoc].sort(
        (a, b) => roleSortIndex(a.role) - roleSortIndex(b.role),
      );

      const bienCheRows: number[] = [];
      const hopDongRows: number[] = [];
      const baoVeRows: number[] = [];

      danhSachChoExcel.forEach((nv, idx) => {
        const r = batDauDuLieu + idx;
        if (nv.employeeType === "bien-che") bienCheRows.push(r);
        else if (nv.employeeType === "hop-dong") hopDongRows.push(r);
        else baoVeRows.push(r);

        const tongHeSo = nv.totalCoefficient;
        const thanhTien = nv.grossSalary;
        const baoHiem = nv.insuranceAmount;
        const truKhac = nv.otherDeduction || 0;
        const thucNhan = nv.netSalary;

        ws.getCell(`A${r}`).value = idx + 1;
        ws.getCell(`B${r}`).value = nv.fullName;
        ws.getCell(`C${r}`).value =
          nv.employeeType === "hop-dong" ? "Giáo viên HĐ" : roleLabel(nv.role);

        ws.getCell(`D${r}`).value =
          nv.employeeType === "bien-che" ? nv.salaryCoefficient : 0;
        ws.getCell(`E${r}`).value =
          nv.employeeType === "bien-che" ? nv.positionAllowance : 0;
        ws.getCell(`F${r}`).value =
          nv.employeeType === "bien-che" ? nv.regionAllowance : 0;
        ws.getCell(`G${r}`).value =
          nv.employeeType === "bien-che" ? nv.pctnvk : 0;
        ws.getCell(`H${r}`).value =
          nv.employeeType === "bien-che" ? nv.preferentialAllowance : 0;
        ws.getCell(`I${r}`).value =
          nv.employeeType === "bien-che" ? nv.seniorityAllowance : 0;
        ws.getCell(`J${r}`).value =
          nv.employeeType === "bien-che" ? nv.teachingSeniorityPercent : 0;
        ws.getCell(`K${r}`).value =
          nv.employeeType === "bien-che" ? nv.teachingSeniorityValue : 0;
        ws.getCell(`L${r}`).value = tongHeSo;
        ws.getCell(`M${r}`).value = thanhTien;
        ws.getCell(`N${r}`).value = nv.sickDeduction || 0;
        ws.getCell(`O${r}`).value = baoHiem;
        ws.getCell(`P${r}`).value = truKhac;
        ws.getCell(`Q${r}`).value = thucNhan;
        ws.getCell(`R${r}`).value = "";
      });

      const dataEndRow = batDauDuLieu + danhSachChoExcel.length - 1;
      const sumCols = [
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
      ];

      function sumRange(col: string, rowNums: number[]): string {
        if (rowNums.length === 0) return "0";
        const minR = Math.min(...rowNums);
        const maxR = Math.max(...rowNums);
        return `SUM(${col}${minR}:${col}${maxR})`;
      }

      let subtotalRow = dataEndRow + 1;

      if (bienCheRows.length > 0) {
        ws.mergeCells(`A${subtotalRow}:C${subtotalRow}`);
        ws.getCell(`A${subtotalRow}`).value = "Tổng cộng I (Biên chế)";
        sumCols.forEach((col) => {
          ws.getCell(`${col}${subtotalRow}`).value = {
            formula: sumRange(col, bienCheRows),
          };
        });
        ws.getRow(subtotalRow).font = { bold: true };
        ws.getRow(subtotalRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };
        subtotalRow++;
      }
      if (hopDongRows.length > 0) {
        ws.mergeCells(`A${subtotalRow}:C${subtotalRow}`);
        ws.getCell(`A${subtotalRow}`).value = "Tổng cộng II (Giáo viên HĐ)";
        sumCols.forEach((col) => {
          ws.getCell(`${col}${subtotalRow}`).value = {
            formula: sumRange(col, hopDongRows),
          };
        });
        ws.getRow(subtotalRow).font = { bold: true };
        ws.getRow(subtotalRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };
        subtotalRow++;
      }
      if (baoVeRows.length > 0) {
        ws.mergeCells(`A${subtotalRow}:C${subtotalRow}`);
        ws.getCell(`A${subtotalRow}`).value = "Tổng cộng III (Bảo vệ HĐ)";
        sumCols.forEach((col) => {
          ws.getCell(`${col}${subtotalRow}`).value = {
            formula: sumRange(col, baoVeRows),
          };
        });
        ws.getRow(subtotalRow).font = { bold: true };
        ws.getRow(subtotalRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };
        subtotalRow++;
      }

      const dongTong = subtotalRow;
      ws.mergeCells(`A${dongTong}:C${dongTong}`);
      ws.getCell(`A${dongTong}`).value = "TỔNG CỘNG";

      sumCols.forEach((col) => {
        ws.getCell(`${col}${dongTong}`).value = {
          formula: `SUM(${col}${batDauDuLieu}:${col}${dataEndRow})`,
        };
      });

      for (let r = 5; r <= dongTong; r++) {
        for (let c = 1; c <= 18; c++) {
          const cell = ws.getRow(r).getCell(c);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          if (r >= batDauDuLieu) {
            cell.alignment = {
              vertical: "middle",
              horizontal: c === 2 ? "left" : "center",
            };
          }
        }
      }

      for (let r = batDauDuLieu; r <= dongTong; r++) {
        ["D", "E", "F", "G", "H", "I", "K", "L"].forEach((col) => {
          ws.getCell(`${col}${r}`).numFmt = "0.0000";
        });

        ws.getCell(`J${r}`).numFmt = "0.0000%";

        ["M", "N", "O", "P", "Q"].forEach((col) => {
          ws.getCell(`${col}${r}`).numFmt = "#,##0";
        });
      }

      ws.getRow(dongTong).font = { bold: true };
      ws.getRow(dongTong).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF7F7F7" },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "bang-luong-thang-03-2025.xlsx");
    } finally {
      setDangTaiExcel(false);
    }
  }
  if (trang === "ho-so-nhan-vien" && nhanVienDangChon) {
    const nv = nhanVienDangChon;
    const luongGop = nv.grossSalary;
    const thucNhan = nv.netSalary;
    return (
      <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
        <div className="w-full px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => setTrang("bang-dieu-khien")}
                className="mb-3 -ml-3 rounded-2xl text-stone-600 hover:text-stone-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại bảng điều khiển
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight">
                Hồ sơ người lao động
              </h1>
              <p className="mt-2 text-sm text-stone-500">
                Chỉnh mọi hệ số lương, phụ cấp, % TNNG, lương cơ bản và tạo
                phiếu khấu trừ riêng cho từng người.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className={`rounded-full ${nhanLoai[nv.employeeType].mau}`}
              >
                {nhanLoai[nv.employeeType].nhan}
              </Badge>
              <Button
                className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800"
                onClick={taiXuongExcel}
                disabled={dangTaiExcel}
              >
                <Download className="mr-2 h-4 w-4" />
                {dangTaiExcel ? "Đang tạo Excel..." : "Tải xuống Excel"}
              </Button>
              <Button className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800">
                <Link
                  href={`/employee/${nv.employeeId}`}
                  className="flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" /> Chỉnh sửa hồ sơ
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
              <CardHeader className="border-b border-stone-100 pb-4">
                <CardTitle className="text-xl">
                  Thông tin người lao động
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-3xl bg-stone-900 p-5 text-white">
                  <p className="text-sm text-stone-300">Nhân sự đang xem</p>
                  <h2 className="mt-2 text-2xl font-semibold">{nv.fullName}</h2>
                  <p className="mt-1 text-sm text-stone-300">
                    {roleLabel(nv.role)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-stone-300">Lương gộp</p>
                      <p className="mt-1 font-semibold">
                        {dinhDangTien(luongGop)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-stone-300">Thực nhận</p>
                      <p className="mt-1 font-semibold">
                        {dinhDangTien(thucNhan)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <OThongTin nhan="Chức vụ" giaTri={roleLabel(nv.role)} />
                  <OThongTin
                    nhan="Loại hồ sơ"
                    giaTri={nhanLoai[nv.employeeType].nhan}
                  />
                  <OThongTin
                    nhan="% TNNG"
                    giaTri={
                      nv.teachingSeniorityPercent
                        ? nv.teachingSeniorityPercent * 100
                        : 0
                    }
                    hauTo="%"
                  />
                  <OThongTin
                    nhan="Hệ số TNNG"
                    giaTri={String(nv.teachingSeniorityValue ?? 0)}
                  />
                </div>
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
                    <Calculator className="h-4 w-4" /> Ghi chú logic
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    Với biên chế, người dùng có thể chỉnh lương cơ bản, hệ số
                    lương, phụ cấp, thâm niên và % TNNG. Với giáo viên hợp đồng
                    hoặc bảo vệ, tập trung vào lương và bảo hiểm xã hội theo %
                    hoặc theo số tiền cụ thể. Để chỉnh sửa, nhấn &quot;Chỉnh sửa
                    hồ sơ&quot; ở trên.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-stone-100 pb-4">
                  <CardTitle className="text-xl">
                    Thông tin lương (chỉ xem)
                  </CardTitle>
                  <p className="text-sm text-stone-500">
                    Hệ số, phụ cấp, BHXH và tổng hợp tính lương của người lao
                    động.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Lương cơ bản</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {dinhDangTien(nv.salaryBase)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Hệ số lương</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.salaryCoefficient
                          ? String(nv.salaryCoefficient)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Phụ cấp chức vụ</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.positionAllowance
                          ? String(nv.positionAllowance)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Phụ cấp khu vực</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.regionAllowance ? String(nv.regionAllowance) : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">PCTNVK</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.pctnvk ? String(nv.pctnvk) : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Phụ cấp ưu đãi</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.preferentialAllowance
                          ? nv.preferentialAllowance.toFixed(4)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Phụ cấp thâm niên</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.seniorityAllowance
                          ? String(nv.seniorityAllowance)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">% TNNG</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.teachingSeniorityPercent
                          ? `${(nv.teachingSeniorityPercent * 100).toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Hệ số TNNG</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.teachingSeniorityValue != null
                          ? nv.teachingSeniorityValue.toFixed(4)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Cộng hệ số</p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {nv.totalCoefficient
                          ? nv.totalCoefficient.toFixed(4)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                    <p className="mb-3 font-medium text-stone-900">
                      Tổng hợp tính lương
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-500">
                          Thành tiền / Lương gộp
                        </span>
                        <span className="font-medium">
                          {dinhDangTien(nv.grossSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>BHXH / BHYT / BHTN</span>
                        <span className="font-medium">
                          -{dinhDangTien(nv.insuranceAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Trừ ốm đau, nghỉ sinh</span>
                        <span className="font-medium">
                          -{dinhDangTien(nv.sickDeduction || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Trừ các khoản khác (phiếu khấu trừ)</span>
                        <span className="font-medium">
                          -{dinhDangTien(nv.otherDeduction || 0)}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-stone-300 pt-3">
                        <div className="flex justify-between font-medium text-stone-900">
                          <span>Tổng tiền lương thực nhận</span>
                          <span>{dinhDangTien(nv.netSalary)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-stone-100 pb-4">
                  <CardTitle className="text-xl">
                    Phiếu khấu trừ (chỉ xem)
                  </CardTitle>
                  <p className="text-sm text-stone-500">
                    Các phiếu khấu trừ áp dụng cho người lao động này. Để
                    thêm/sửa, mở trang chỉnh sửa.
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingDeductions ? (
                    <p className="text-sm text-stone-500">
                      Đang tải phiếu khấu trừ...
                    </p>
                  ) : deductionsForDetail.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      Chưa có phiếu khấu trừ nào.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {deductionsForDetail.map((d) => (
                        <li
                          key={d._id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-stone-900">
                              {d.title}
                            </p>
                            {d.reason ? (
                              <p className="mt-1 text-stone-500">{d.reason}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-stone-400">
                              Tháng {d.month}/{d.year}
                              {" · "}
                              {d.status === "applied"
                                ? "Đã áp dụng"
                                : d.status === "draft"
                                  ? "Nháp"
                                  : "Đã hủy"}
                            </p>
                          </div>
                          <span className="font-semibold text-rose-600">
                            -{dinhDangTien(d.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button className="mt-4 w-full rounded-2xl bg-stone-900 text-white hover:bg-stone-800">
                    <Link
                      href={`/employee/${nv.employeeId}`}
                      className="flex items-center justify-center gap-2 text-white"
                    >
                      Mở trang chỉnh sửa người lao động
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      <div className="w-full px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm text-stone-600">
              Mức lương cơ sở (VNĐ):
            </Label>
            <Input
              type="text"
              value={salaryBaseInput}
              onChange={(e) =>
                setSalaryBaseInput(e.target.value.replace(/\D/g, ""))
              }
              className="h-10 w-40 rounded-xl border-stone-200"
              placeholder="2340000"
            />
            <Button
              size="sm"
              className="rounded-xl bg-stone-800 hover:bg-stone-700"
              onClick={handleSaveSalaryBase}
              disabled={savingSalaryBase}
            >
              {savingSalaryBase ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-stone-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]"
            >
              <Card className="overflow-hidden rounded-[28px] border-stone-200 bg-stone-900 text-white shadow-xl">
                <CardContent className="p-6 md:p-7">
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-stone-200">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Bảng điều
                        khiển lương tháng 03/2025
                      </div>
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        Giao diện quản lý lương trường học theo nhóm nhân sự
                      </h1>
                      <p className="mt-3 text-sm leading-6 text-stone-300 md:text-base">
                        Có thể chỉnh hồ sơ biên chế, giáo viên hợp đồng, bảo vệ;
                        tự tính lương gộp, BHXH, khấu trừ khác, thực nhận và tải
                        xuống Excel gộp chung vào một sheet.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:w-[360px]">
                      <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                          Lương cơ sở
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {dinhDangTien(salaryBaseDefault)}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                          Nhân sự
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {thongKe.soNguoi}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <div>
                    <p className="text-sm text-stone-500">Gợi ý thao tác</p>
                    <div className="mt-4 space-y-3 text-sm text-stone-700">
                      <div className="rounded-2xl bg-stone-50 p-3">
                        1. Chọn nhân sự và chỉnh hồ sơ lương
                      </div>
                      <div className="rounded-2xl bg-stone-50 p-3">
                        2. Kiểm tra % TNNG, BHXH, khấu trừ
                      </div>
                      <div className="rounded-2xl bg-stone-50 p-3">
                        3. Tải xuống Excel theo đúng biểu mẫu
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <Button
                      onClick={() =>
                        nhanVienDangChon &&
                        moHoSoNhanVien(nhanVienDangChon.employeeId)
                      }
                      className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800"
                    >
                      Mở hồ sơ người lao động đang chọn
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 rounded-2xl border-stone-300 bg-white"
                      onClick={taiXuongExcel}
                      disabled={dangTaiExcel}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {dangTaiExcel ? "Đang tạo Excel..." : "Tải xuống Excel"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TheThongKe
                tieuDe="Tổng quỹ lương"
                giaTri={dinhDangTien(thongKe.tongLuong)}
                phuDe="Trước mọi khoản khấu trừ"
                icon={Wallet}
              />
              <TheThongKe
                tieuDe="Khấu trừ BHXH"
                giaTri={dinhDangTien(thongKe.tongBaoHiem)}
                phuDe="Áp dụng tự động theo hồ sơ"
                icon={ShieldCheck}
              />
              <TheThongKe
                tieuDe="Khấu trừ khác"
                giaTri={dinhDangTien(thongKe.tongKhauTruKhac)}
                phuDe="Ốm đau, nghỉ sinh, phiếu khấu trừ"
                icon={TrendingDown}
              />
              <TheThongKe
                tieuDe="Thực nhận"
                giaTri={dinhDangTien(thongKe.tongThucNhan)}
                phuDe="Sau toàn bộ khoản trừ"
                icon={Briefcase}
              />
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader className="gap-4 border-b border-stone-100 pb-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Danh sách nhân sự tháng 03
                      </CardTitle>
                      <p className="mt-1 text-sm text-stone-500">
                        Lọc theo nhóm nhân sự để xem bảng lương và mở hồ sơ
                        chỉnh sửa.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="relative min-w-[240px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <Input
                          value={tuKhoa}
                          onChange={(e) => setTuKhoa(e.target.value)}
                          placeholder="Tìm theo tên hoặc chức vụ"
                          className="h-11 rounded-2xl border-stone-200 bg-stone-50 pl-10"
                        />
                      </div>
                      <Tabs
                        value={boLoc}
                        onValueChange={(v) =>
                          setBoLoc(v as "all" | LoaiNhanVien)
                        }
                      >
                        <TabsList className="h-11 rounded-2xl bg-stone-100 p-1">
                          <TabsTrigger value="all" className="rounded-xl">
                            Tất cả
                          </TabsTrigger>
                          <TabsTrigger value="bien-che" className="rounded-xl">
                            Biên chế
                          </TabsTrigger>
                          <TabsTrigger value="hop-dong" className="rounded-xl">
                            Giáo viên HĐ
                          </TabsTrigger>
                          <TabsTrigger value="bao-ve" className="rounded-xl">
                            Bảo vệ
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 text-left text-stone-500">
                          <th className="px-5 py-4 font-medium">Nhân sự</th>
                          <th className="px-5 py-4 font-medium">Nhóm</th>
                          <th className="px-5 py-4 font-medium">Cộng hệ số</th>
                          <th className="px-5 py-4 font-medium">Thành tiền</th>
                          <th className="px-5 py-4 font-medium">
                            Trừ ốm đau, nghỉ sinh
                          </th>
                          <th className="px-5 py-4 font-medium">
                            BHXH, BHYT, BHTN
                          </th>
                          <th className="px-5 py-4 font-medium">
                            Trừ các khoản khác
                          </th>
                          <th className="px-5 py-4 font-medium">
                            Tổng tiền lương thực nhận
                          </th>
                          <th className="px-5 py-4 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {danhSachLoc.map((nv) => {
                          const dangChon =
                            nhanVienDangChon?.employeeId === nv.employeeId;
                          return (
                            <tr
                              key={nv.employeeId}
                              onClick={() => setIdDangChon(nv.employeeId)}
                              className={`cursor-pointer border-b border-stone-100 transition hover:bg-stone-50 ${dangChon ? "bg-stone-50" : ""}`}
                            >
                              <td className="px-5 py-4">
                                <div>
                                  <p className="font-medium text-stone-900">
                                    {nv.fullName}
                                  </p>
                                  <p className="mt-1 text-xs text-stone-500">
                                    {roleLabel(nv.role)}
                                  </p>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full ${nhanLoai[nv.employeeType].mau}`}
                                >
                                  {nhanLoai[nv.employeeType].nhan}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 font-medium">
                                {nv.totalCoefficient
                                  ? nv.totalCoefficient.toFixed(4)
                                  : "—"}
                              </td>
                              <td className="px-5 py-4">
                                {dinhDangTien(nv.grossSalary)}
                              </td>
                              <td className="px-5 py-4 text-rose-600">
                                {dinhDangTien(nv.sickDeduction || 0)}
                              </td>

                              <td className="px-5 py-4 text-rose-600">
                                {dinhDangTien(nv.insuranceAmount)}
                              </td>

                              <td className="px-5 py-4 text-rose-600">
                                {dinhDangTien(nv.otherDeduction || 0)}
                              </td>
                              <td className="px-5 py-4 font-medium text-stone-900">
                                {dinhDangTien(nv.netSalary)}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-xl text-stone-500 hover:text-stone-900"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moHoSoNhanVien(nv.employeeId);
                                  }}
                                >
                                  Mở hồ sơ
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-stone-100 pb-4">
                  <CardTitle className="text-xl">
                    Chi tiết hồ sơ lương
                  </CardTitle>
                  <p className="text-sm text-stone-500">
                    Hiển thị rõ % TNNG để người dùng biết vì sao ra hệ số đó.
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  {nhanVienDangChon ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-stone-900">
                            {nhanVienDangChon.fullName}
                          </h3>
                          <p className="mt-1 text-sm text-stone-500">
                            {roleLabel(nhanVienDangChon.role)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`rounded-full ${nhanLoai[nhanVienDangChon.employeeType].mau}`}
                        >
                          {nhanLoai[nhanVienDangChon.employeeType].nhan}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">Lương cơ bản</p>
                          <p className="mt-2 text-lg font-semibold">
                            {dinhDangTien(nhanVienDangChon.salaryBase)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">Hệ số lương</p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon.salaryCoefficient || "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">Phụ cấp chức vụ</p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon.positionAllowance || "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">Phụ cấp khu vực</p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon.regionAllowance || "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">
                            Phụ cấp ưu đãi / thâm niên
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon.preferentialAllowance
                              ? nhanVienDangChon.preferentialAllowance.toFixed(
                                  4,
                                )
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">% TNNG</p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon.teachingSeniorityPercent
                              ? `${(Number(nhanVienDangChon.teachingSeniorityPercent.toFixed(4)) * 100).toFixed(2)}%`
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">Hệ số TNNG</p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon.teachingSeniorityValue
                              ? nhanVienDangChon.teachingSeniorityValue.toFixed(
                                  4,
                                )
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-stone-50 p-4">
                          <p className="text-stone-500">Trạng thái hồ sơ</p>
                          <p className="mt-2 text-lg font-semibold">
                            {nhanVienDangChon ? "Đang dùng" : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <p className="font-medium text-stone-900">
                            Tổng hợp tính lương
                          </p>
                          <Badge
                            variant="outline"
                            className="rounded-full border-stone-300 text-stone-600"
                          >
                            Xem trước tự tính
                          </Badge>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Cộng hệ số</span>
                            <span className="font-medium">
                              {nhanVienDangChon.totalCoefficient
                                ? nhanVienDangChon.totalCoefficient.toFixed(4)
                                : "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Thành tiền</span>
                            <span className="font-medium">
                              {dinhDangTien(nhanVienDangChon.grossSalary)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-rose-600">
                            <span>BHXH / BHYT / BHTN</span>
                            <span className="font-medium">
                              -{dinhDangTien(nhanVienDangChon.insuranceAmount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-rose-600">
                            <span>Trừ ốm đau / nghỉ sinh</span>
                            <span className="font-medium">
                              -
                              {dinhDangTien(
                                nhanVienDangChon.sickDeduction || 0,
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-rose-600">
                            <span>Trừ các khoản khác</span>
                            <span className="font-medium">
                              -
                              {dinhDangTien(
                                nhanVienDangChon.otherDeduction || 0,
                              )}
                            </span>
                          </div>

                          <div className="border-t border-dashed border-stone-300 pt-3">
                            <div className="flex items-center justify-between text-base">
                              <span className="font-medium text-stone-900">
                                Tổng tiền lương thực nhận
                              </span>
                              <span className="font-semibold text-stone-900">
                                {dinhDangTien(nhanVienDangChon.netSalary)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="h-11 w-full rounded-2xl bg-stone-900 text-white hover:bg-stone-800"
                        onClick={() =>
                          nhanVienDangChon &&
                          moHoSoNhanVien(nhanVienDangChon.employeeId)
                        }
                      >
                        Mở hồ sơ người lao động để chỉnh sửa
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-stone-50 p-6 text-sm text-stone-500">
                      Không có dữ liệu phù hợp với bộ lọc hiện tại.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl">Định hướng mở rộng</CardTitle>
                  <p className="text-sm text-stone-500">
                    Sau dashboard này có thể nâng cấp thành hệ thống quản lý
                    lương thật.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      tieuDe: "Hồ sơ lương",
                      moTa: "Mỗi chức vụ có bộ hệ số và phụ cấp mặc định để nhập nhanh.",
                    },
                    {
                      tieuDe: "Phiếu khấu trừ",
                      moTa: "Các khoản trừ ngoài BHXH được quản lý bằng phiếu riêng.",
                    },
                    {
                      tieuDe: "Xuất Excel",
                      moTa: "Tải bảng lương gộp tất cả nhân sự vào một sheet theo biểu mẫu.",
                    },
                  ].map((item) => (
                    <div
                      key={item.tieuDe}
                      className="rounded-3xl bg-stone-50 p-5"
                    >
                      <h4 className="font-semibold text-stone-900">
                        {item.tieuDe}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {item.moTa}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">Nhóm chức vụ hỗ trợ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Hiệu trưởng",
                    "Phó hiệu trưởng",
                    "Giáo viên",
                    "Kế toán",
                    "Văn thư",
                    "Bảo vệ",
                    "Giáo viên HĐ",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm"
                    >
                      <span>{item}</span>
                      <Users className="h-4 w-4 text-stone-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
