"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Users,
  ShieldCheck,
  Briefcase,
  Wallet,
  TrendingDown,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const baseSalary = 2340000;

const ten = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const payrollRows = [
  {
    id: 1,
    name: "Ng. Thị Nhật Kiều",
    role: "Hiệu trưởng",
    type: "bien-che",
    salaryCoefficient: 3.96,
    positionAllowance: 0.5,
    regionAllowance: 0.5,
    senioritySupport: 0,
    preferentialAllowance: 3.122,
    teachingSeniorityPercent: 0.18,
    teachingSeniorityValue: 0.803,
    totalCoefficient: 8.885,
    grossSalary: 20790900,
    insuranceDeduction: 1306494,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 19484406,
    status: "active",
  },
  {
    id: 2,
    name: "Vũ Thị Duyên",
    role: "Phó hiệu trưởng",
    type: "bien-che",
    salaryCoefficient: 3.96,
    positionAllowance: 0.35,
    regionAllowance: 0.5,
    senioritySupport: 0,
    preferentialAllowance: 3.087,
    teachingSeniorityPercent: 0.18,
    teachingSeniorityValue: 0.866,
    totalCoefficient: 8.763,
    grossSalary: 20505420,
    insuranceDeduction: 1321194,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 19184226,
    status: "active",
  },
  {
    id: 3,
    name: "Lê Thị Hoa",
    role: "Phó hiệu trưởng",
    type: "bien-che",
    salaryCoefficient: 3.34,
    positionAllowance: 0.35,
    regionAllowance: 0.5,
    senioritySupport: 0,
    preferentialAllowance: 2.583,
    teachingSeniorityPercent: 0.13,
    teachingSeniorityValue: 0.544,
    totalCoefficient: 7.317,
    grossSalary: 17121780,
    insuranceDeduction: 1088850,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 16032930,
    status: "active",
  },
  {
    id: 4,
    name: "Nguyễn Thị Lan",
    role: "Giáo viên",
    type: "bien-che",
    salaryCoefficient: 4.89,
    positionAllowance: 0,
    regionAllowance: 0.5,
    senioritySupport: 0.245,
    preferentialAllowance: 3.944,
    teachingSeniorityPercent: 0.17,
    teachingSeniorityValue: 0.916,
    totalCoefficient: 10.495,
    grossSalary: 24558300,
    insuranceDeduction: 1408039,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 23150261,
    status: "active",
  },
  {
    id: 5,
    name: "Đoàn Thị Phương",
    role: "Giáo viên",
    type: "bien-che",
    salaryCoefficient: 4.89,
    positionAllowance: 0.2,
    regionAllowance: 0.5,
    senioritySupport: 0,
    preferentialAllowance: 2.795,
    teachingSeniorityPercent: 0.29,
    teachingSeniorityValue: 1.62,
    totalCoefficient: 10.005,
    grossSalary: 23411700,
    insuranceDeduction: 1677690,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 21734010,
    status: "active",
  },
  {
    id: 6,
    name: "Đinh Thị Huyền Anh",
    role: "Giáo viên HĐ",
    type: "hop-dong",
    salaryCoefficient: 0,
    positionAllowance: 0,
    regionAllowance: 0,
    senioritySupport: 0,
    preferentialAllowance: 0,
    teachingSeniorityPercent: 0,
    teachingSeniorityValue: 0,
    totalCoefficient: 0,
    grossSalary: 8000000,
    insuranceDeduction: 1184000,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 6816000,
    status: "active",
  },
  {
    id: 7,
    name: "Vũ Thị Hoàng Kiểu",
    role: "Giáo viên HĐ",
    type: "hop-dong",
    salaryCoefficient: 0,
    positionAllowance: 0,
    regionAllowance: 0,
    senioritySupport: 0,
    preferentialAllowance: 0,
    teachingSeniorityPercent: 0,
    teachingSeniorityValue: 0,
    totalCoefficient: 0,
    grossSalary: 8000000,
    insuranceDeduction: 1184000,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 6816000,
    status: "active",
  },
  {
    id: 8,
    name: "Lê Thị Mỹ Linh",
    role: "Giáo viên HĐ",
    type: "hop-dong",
    salaryCoefficient: 0,
    positionAllowance: 0,
    regionAllowance: 0,
    senioritySupport: 0,
    preferentialAllowance: 0,
    teachingSeniorityPercent: 0,
    teachingSeniorityValue: 0,
    totalCoefficient: 0,
    grossSalary: 8000000,
    insuranceDeduction: 1184000,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 6816000,
    status: "active",
  },
  {
    id: 9,
    name: "Bảo vệ mẫu",
    role: "Bảo vệ",
    type: "bao-ve",
    salaryCoefficient: 0,
    positionAllowance: 0,
    regionAllowance: 0,
    senioritySupport: 0,
    preferentialAllowance: 0,
    teachingSeniorityPercent: 0,
    teachingSeniorityValue: 0,
    totalCoefficient: 0,
    grossSalary: 6500000,
    insuranceDeduction: 0,
    otherDeduction: 0,
    sickOrMaternityDeduction: 0,
    netSalary: 6500000,
    status: "draft",
  },
];

const categoryMeta = {
  all: { label: "Tất cả", tone: "bg-stone-900 text-white" },
  "bien-che": { label: "Biên chế", tone: "bg-emerald-50 text-emerald-700" },
  "hop-dong": { label: "Giáo viên HĐ", tone: "bg-amber-50 text-amber-700" },
  "bao-ve": { label: "Bảo vệ", tone: "bg-sky-50 text-sky-700" },
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: any;
}) {
  return (
    <Card className="rounded-3xl border-stone-200 bg-white/80 shadow-sm backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              {value}
            </p>
            <p className="mt-1 text-sm text-stone-500">{sub}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <Icon className="h-5 w-5 text-stone-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalaryDashboardPage() {
  const [tab, setTab] = useState<"all" | "bien-che" | "hop-dong" | "bao-ve">(
    "all",
  );
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number>(1);

  const filtered = useMemo(() => {
    return payrollRows.filter((row) => {
      const matchTab = tab === "all" ? true : row.type === tab;
      const q = keyword.trim().toLowerCase();
      const matchKeyword =
        q.length === 0
          ? true
          : row.name.toLowerCase().includes(q) ||
            row.role.toLowerCase().includes(q);
      return matchTab && matchKeyword;
    });
  }, [keyword, tab]);

  const selected =
    filtered.find((item) => item.id === selectedId) ||
    filtered[0] ||
    payrollRows[0];

  const stats = useMemo(() => {
    const source =
      tab === "all" ? payrollRows : payrollRows.filter((x) => x.type === tab);
    const gross = source.reduce((sum, row) => sum + row.grossSalary, 0);
    const insurance = source.reduce(
      (sum, row) => sum + row.insuranceDeduction,
      0,
    );
    const other = source.reduce(
      (sum, row) => sum + row.otherDeduction + row.sickOrMaternityDeduction,
      0,
    );
    const net = source.reduce((sum, row) => sum + row.netSalary, 0);
    return {
      count: source.length,
      gross,
      insurance,
      other,
      net,
    };
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]"
        >
          <Card className="overflow-hidden rounded-[28px] border-stone-200 bg-stone-900 text-white shadow-xl">
            <CardContent className="p-6 md:p-7">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-stone-200">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Dashboard lương tháng 03/2026
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Giao diện quản lý lương trường học theo nhóm nhân sự
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300 md:text-base">
                    UI này tách rõ biên chế, giáo viên hợp đồng và bảo vệ; đồng
                    thời chuẩn bị sẵn cấu trúc để tính hệ số, phụ cấp, các khoản
                    trừ lương, BHXH và phiếu khấu trừ riêng.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:w-[320px]">
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                      MLCS
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {money(baseSalary)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                      Nhân sự
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{stats.count}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p className="text-sm text-stone-500">Gợi ý workflow</p>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div className="rounded-2xl bg-stone-50 p-3">
                    1. Chọn nhóm nhân sự → role → profile lương
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-3">
                    2. Nhập hệ số, phụ cấp, ngày nghỉ, khoản trừ
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-3">
                    3. Hệ thống tự tính tổng hệ số, thành tiền, thực nhận
                  </div>
                </div>
              </div>
              <Button className="mt-6 h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800">
                Tạo phiếu lương tháng mới
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng quỹ lương"
            value={money(stats.gross)}
            sub="Trước mọi khoản khấu trừ"
            icon={Wallet}
          />
          <StatCard
            title="Khấu trừ BHXH"
            value={money(stats.insurance)}
            sub="Áp dụng tự động theo profile"
            icon={ShieldCheck}
          />
          <StatCard
            title="Khấu trừ khác"
            value={money(stats.other)}
            sub="Ốm đau, thai sản, phiếu riêng"
            icon={TrendingDown}
          />
          <StatCard
            title="Thực nhận"
            value={money(stats.net)}
            sub="Sau toàn bộ khoản trừ"
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
                    Filter theo nhóm lương để sau này map đúng profile tính
                    toán.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative min-w-[240px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Tìm theo tên hoặc chức vụ"
                      className="h-11 rounded-2xl border-stone-200 bg-stone-50 pl-10"
                    />
                  </div>

                  <Tabs
                    value={tab}
                    onValueChange={(value) => setTab(value as any)}
                  >
                    <TabsList className="h-11 rounded-2xl bg-stone-100 p-1">
                      <TabsTrigger value="all" className="rounded-xl">
                        Tất cả
                      </TabsTrigger>
                      <TabsTrigger value="bien-che" className="rounded-xl">
                        Biên chế
                      </TabsTrigger>
                      <TabsTrigger value="hop-dong" className="rounded-xl">
                        GV HĐ
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
                      <th className="px-5 py-4 font-medium">Tổng hệ số</th>
                      <th className="px-5 py-4 font-medium">Lương gross</th>
                      <th className="px-5 py-4 font-medium">Khấu trừ</th>
                      <th className="px-5 py-4 font-medium">Thực nhận</th>
                      <th className="px-5 py-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const deduction =
                        row.insuranceDeduction +
                        row.otherDeduction +
                        row.sickOrMaternityDeduction;
                      const active = selected?.id === row.id;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`cursor-pointer border-b border-stone-100 transition hover:bg-stone-50 ${
                            active ? "bg-stone-50" : ""
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-stone-900">
                                {row.name}
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                {row.role}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="secondary"
                              className={`rounded-full ${categoryMeta[row.type as keyof typeof categoryMeta].tone}`}
                            >
                              {
                                categoryMeta[
                                  row.type as keyof typeof categoryMeta
                                ].label
                              }
                            </Badge>
                          </td>
                          <td className="px-5 py-4 font-medium">
                            {row.totalCoefficient
                              ? row.totalCoefficient.toFixed(3)
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            {money(row.grossSalary)}
                          </td>
                          <td className="px-5 py-4 text-rose-600">
                            {money(deduction)}
                          </td>
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {money(row.netSalary)}
                          </td>
                          <td className="px-5 py-4 text-right text-stone-400">
                            <ChevronRight className="ml-auto h-4 w-4" />
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
              <CardTitle className="text-xl">Chi tiết hồ sơ lương</CardTitle>
              <p className="text-sm text-stone-500">
                Panel này là tiền đề cho form create/edit sau này.
              </p>
            </CardHeader>

            <CardContent className="p-6">
              {selected ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-900">
                          {selected.name}
                        </h3>
                        <p className="mt-1 text-sm text-stone-500">
                          {selected.role}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`rounded-full ${categoryMeta[selected.type as keyof typeof categoryMeta].tone}`}
                      >
                        {
                          categoryMeta[
                            selected.type as keyof typeof categoryMeta
                          ].label
                        }
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Hệ số lương</p>
                      <p className="mt-2 text-lg font-semibold">
                        {selected.salaryCoefficient || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Phụ cấp chức vụ</p>
                      <p className="mt-2 text-lg font-semibold">
                        {selected.positionAllowance || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Khu vực</p>
                      <p className="mt-2 text-lg font-semibold">
                        {selected.regionAllowance || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-stone-500">Ưu đãi / thâm niên</p>
                      <p className="mt-2 text-lg font-semibold">
                        {selected.preferentialAllowance
                          ? selected.preferentialAllowance.toFixed(3)
                          : "—"}
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
                        Auto-calc preview
                      </Badge>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Tổng hệ số</span>
                        <span className="font-medium">
                          {selected.totalCoefficient
                            ? selected.totalCoefficient.toFixed(3)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Lương gross</span>
                        <span className="font-medium">
                          {money(selected.grossSalary)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-rose-600">
                        <span>BHXH / BHYT / BHTN</span>
                        <span className="font-medium">
                          -{money(selected.insuranceDeduction)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-rose-600">
                        <span>Ốm đau / thai sản / khấu trừ khác</span>
                        <span className="font-medium">
                          -
                          {money(
                            selected.otherDeduction +
                              selected.sickOrMaternityDeduction,
                          )}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-stone-300 pt-3">
                        <div className="flex items-center justify-between text-base">
                          <span className="font-medium text-stone-900">
                            Thực nhận
                          </span>
                          <span className="font-semibold text-stone-900">
                            {money(selected.netSalary)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-stone-900 p-4 text-stone-100">
                    <p className="text-sm text-stone-300">
                      Hướng mở rộng tiếp theo
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6">
                      <li>• Form nhập hàng loạt theo profile role.</li>
                      <li>• Phiếu trừ lương riêng cho từng người.</li>
                      <li>
                        • Lịch sử chốt lương theo tháng và export Excel/PDF.
                      </li>
                    </ul>
                  </div>
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
              <CardTitle className="text-xl">
                Định hướng module sau dashboard
              </CardTitle>
              <p className="text-sm text-stone-500">
                Để web này thay thế dần cách nhập Excel thủ công.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Profile lương",
                  desc: "Mỗi role map tới một profile hệ số / phụ cấp mặc định để nhập nhanh.",
                },
                {
                  title: "Phiếu khấu trừ",
                  desc: "Các khoản trừ ngoài BHXH không sửa thẳng trong bảng chính mà đi qua phiếu riêng.",
                },
                {
                  title: "Chốt tháng",
                  desc: "Tạo snapshot bảng lương tháng để khóa dữ liệu và xuất báo cáo.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl bg-stone-50 p-5">
                  <h4 className="font-semibold text-stone-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Role đang hỗ trợ</CardTitle>
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
      </div>
    </div>
  );
}
