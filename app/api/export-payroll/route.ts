import { NextRequest } from "next/server";
import ExcelJS from "exceljs";

type InsuranceMode = "percent" | "fixed" | "auto-hd";

type PayrollEmployee = {
  id: string;
  name: string;
  role: string;
  employeeType: "bien_che" | "hop_dong" | "bao_ve";
  salaryBase: number;
  salaryCoefficient: number;
  positionAllowance: number;
  regionAllowance: number;
  responsibilityAllowance: number;
  preferentialAllowance: number;
  seniorityAllowance: number;
  teachingSeniorityPercent: number;
  teachingSeniorityValue: number;
  grossSalary: number;
  sickDeduction: number;
  otherDeduction: number;
  insuranceMode: InsuranceMode;
  insurancePercent?: number;
  insuranceFixedAmount?: number;
  order?: number;
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
];

function roleSortIndex(role: string): number {
  const r = role.toLowerCase().replace(/\s+/g, "-");
  const i = ROLE_EXCEL_ORDER.indexOf(r);
  if (i !== -1) return i;
  const byLabel: Record<string, number> = {
    "hiệu trưởng": 0,
    "phó hiệu trưởng": 1,
    "giáo viên": 2,
    "kế toán": 3,
    "văn thư": 4,
    "giáo viên hđ": 5,
    "bảo vệ": 6,
  };
  return byLabel[String(role).toLowerCase()] ?? 999;
}

function getInsuranceAmount(emp: PayrollEmployee) {
  if (emp.insuranceMode === "fixed") {
    return emp.insuranceFixedAmount ?? 0;
  }
  if (emp.insuranceMode === "auto-hd") {
    return (emp.employeeType === "hop_dong" || emp.employeeType === "bao_ve")
      ? 3_700_000 * 0.32
      : 0;
  }

  const percent = emp.insurancePercent ?? 0;
  if (emp.employeeType === "bien_che") {
    const insuranceBaseCoefficient =
      (emp.salaryCoefficient || 0) +
      (emp.positionAllowance || 0) +
      (emp.responsibilityAllowance || 0) +
      (emp.teachingSeniorityValue || 0);

    return insuranceBaseCoefficient * emp.salaryBase * percent;
  }

  return (emp.grossSalary || 0) * percent;
}

function getTotalCoefficient(emp: PayrollEmployee) {
  if (emp.employeeType !== "bien_che") return 0;

  return (
    (emp.salaryCoefficient || 0) +
    (emp.positionAllowance || 0) +
    (emp.regionAllowance || 0) +
    (emp.responsibilityAllowance || 0) +
    (emp.preferentialAllowance || 0) +
    (emp.seniorityAllowance || 0) +
    (emp.teachingSeniorityValue || 0)
  );
}

function getThanhTien(emp: PayrollEmployee) {
  if (emp.employeeType === "bien_che") {
    return getTotalCoefficient(emp) * emp.salaryBase;
  }
  return emp.grossSalary || 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const employees: PayrollEmployee[] = body.employees ?? [];
  const month = body.month ?? 3;
  const year = body.year ?? 2026;
  const salaryBase = body.salaryBase ?? 2340000;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Bảng lương");

  ws.properties.defaultRowHeight = 22;
  ws.views = [{ showGridLines: true }];

  ws.columns = [
    { key: "A", width: 8 },
    { key: "B", width: 28 },
    { key: "C", width: 16 },
    { key: "D", width: 12 },
    { key: "E", width: 12 },
    { key: "F", width: 12 },
    { key: "G", width: 12 },
    { key: "H", width: 16 },
    { key: "I", width: 10 },
    { key: "J", width: 10 },
    { key: "K", width: 16 },
    { key: "L", width: 12 },
    { key: "M", width: 16 },
    { key: "N", width: 18 },
    { key: "O", width: 18 },
  ];

  // Title
  ws.mergeCells("A3:O3");
  ws.getCell("A3").value = `BẢNG LƯƠNG THÁNG ${String(month).padStart(2, "0")} NĂM ${year} ( MLCS ${Math.round(
    salaryBase / 1000
  ).toLocaleString("vi-VN")} )`;
  ws.getCell("A3").font = { bold: true, size: 14 };
  ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };

  // Header structure
  ws.mergeCells("A5:A8");
  ws.mergeCells("B5:B8");
  ws.mergeCells("C5:C8");
  ws.mergeCells("D5:M6");
  ws.mergeCells("N5:N8");
  ws.mergeCells("O5:O7");

  ws.getCell("A5").value = "TT";
  ws.getCell("B5").value = "Họ và tên";
  ws.getCell("C5").value = "Cấp bậc\nchức vụ";
  ws.getCell("D5").value = "LƯƠNG HỆ SỐ";
  ws.getCell("N5").value = "Trừ ốm đau, NS, DSPHSK";
  ws.getCell("O5").value = "Các khoản trừ lương";

  ws.getCell("D7").value = "Hệ số lương";
  ws.getCell("E7").value = "Phụ cấp CV";
  ws.getCell("F7").value = "Khu vực";
  ws.getCell("G7").value = "PCTNVK";
  ws.getCell("H7").value = "PC ưu đãi";
  ws.getCell("I7").value = "PC TN'";
  ws.getCell("J7").value = "% TNNG";
  ws.getCell("K7").value = "Thâm niên nhà giáo";
  ws.getCell("L7").value = "Cộng hệ số";
  ws.getCell("M7").value = "Thành tiền";
  ws.getCell("O8").value = "BHXH, BHYT, BHTN / khoản trừ khác";

  // Merge sub headers where needed
  ws.mergeCells("D7:D8");
  ws.mergeCells("E7:E8");
  ws.mergeCells("F7:F8");
  ws.mergeCells("G7:G8");
  ws.mergeCells("H7:H8");
  ws.mergeCells("I7:I8");
  ws.mergeCells("J7:J8");
  ws.mergeCells("K7:K8");
  ws.mergeCells("L7:L8");
  ws.mergeCells("M7:M8");

  const headerRows = [5, 6, 7, 8];
  for (const rowNum of headerRows) {
    const row = ws.getRow(rowNum);
    row.height = 26;
    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" },
      };
    });
  }

  const sorted = [...employees].sort(
    (a, b) =>
      roleSortIndex(a.role) - roleSortIndex(b.role) ||
      (a.order ?? 9999) - (b.order ?? 9999)
  );

  let currentRow = 9;

  // Optional section title row
  ws.getCell(`A${currentRow}`).value = "I";
  ws.getCell(`B${currentRow}`).value = "Tổng hợp nhân sự";
  ws.getRow(currentRow).font = { bold: true };
  currentRow++;

  for (let i = 0; i < sorted.length; i++) {
    const emp = sorted[i];
    const rowNumber = currentRow + i;

    const totalCoefficient = getTotalCoefficient(emp);
    const thanhTien = getThanhTien(emp);
    const insurance = getInsuranceAmount(emp);
    const deductionN = emp.sickDeduction || 0;
    const deductionO = insurance + (emp.otherDeduction || 0);

    ws.getCell(`A${rowNumber}`).value = i + 1;
    ws.getCell(`B${rowNumber}`).value = emp.name;
    ws.getCell(`C${rowNumber}`).value = emp.role;

    ws.getCell(`D${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.salaryCoefficient || 0 : 0;
    ws.getCell(`E${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.positionAllowance || 0 : 0;
    ws.getCell(`F${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.regionAllowance || 0 : 0;
    ws.getCell(`G${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.responsibilityAllowance || 0 : 0;
    ws.getCell(`H${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.preferentialAllowance || 0 : 0;
    ws.getCell(`I${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.seniorityAllowance || 0 : 0;
    ws.getCell(`J${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.teachingSeniorityPercent || 0 : 0;
    ws.getCell(`K${rowNumber}`).value =
      emp.employeeType === "bien_che" ? emp.teachingSeniorityValue || 0 : 0;
    ws.getCell(`L${rowNumber}`).value = totalCoefficient;
    ws.getCell(`M${rowNumber}`).value = thanhTien;
    ws.getCell(`N${rowNumber}`).value = deductionN;
    ws.getCell(`O${rowNumber}`).value = deductionO;
  }

  const dataStartRow = 10;
  const dataEndRow = currentRow + sorted.length - 1;
  const totalRow = dataEndRow + 1;

  ws.getCell(`A${totalRow}`).value = "TỔNG CỘNG";
  ws.mergeCells(`A${totalRow}:C${totalRow}`);

  for (const col of ["D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "O"]) {
    ws.getCell(`${col}${totalRow}`).value = {
      formula: `SUM(${col}${dataStartRow}:${col}${dataEndRow})`,
    };
  }

  // Number format
  for (let r = dataStartRow; r <= totalRow; r++) {
    for (const col of ["D", "E", "F", "G", "H", "I", "K", "L"]) {
      ws.getCell(`${col}${r}`).numFmt = "0.000";
    }
    ws.getCell(`J${r}`).numFmt = "0%";
    for (const col of ["M", "N", "O"]) {
      ws.getCell(`${col}${r}`).numFmt = "#,##0";
    }
  }

  // Borders & alignment
  for (let r = 5; r <= totalRow; r++) {
    for (let c = 1; c <= 15; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (r >= dataStartRow) {
        cell.alignment = {
          vertical: "middle",
          horizontal: c === 2 ? "left" : "center",
        };
      }
    }
  }

  ws.getRow(totalRow).font = { bold: true };
  ws.getRow(totalRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF7F7F7" },
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bang-luong-thang-${month}-${year}.xlsx"`,
    },
  });
}