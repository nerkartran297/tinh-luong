"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Plus, X, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABELS: Record<string, string> = {
  "hieu-truong": "Hiệu trưởng",
  "pho-hieu-truong": "Phó hiệu trưởng",
  "giao-vien": "Giáo viên",
  "ke-toan": "Kế toán",
  "van-thu": "Văn thư",
  "bao-ve": "Bảo vệ",
  "giao-vien-hop-dong": "Giáo viên HĐ",
};

const nhanLoai: Record<string, { nhan: string; mau: string }> = {
  "bien-che": { nhan: "Biên chế", mau: "bg-emerald-50 text-emerald-700" },
  "hop-dong": { nhan: "Giáo viên HĐ", mau: "bg-amber-50 text-amber-700" },
  "bao-ve": { nhan: "Bảo vệ", mau: "bg-sky-50 text-sky-700" },
};

function roleLabel(slug: string) {
  return ROLE_LABELS[slug] ?? slug;
}

function dinhDangTien(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v ?? 0);
}

type ProfileForm = {
  salaryBase: number;
  salaryCoefficient: number;
  positionAllowance: number;
  regionAllowance: number;
  pctnvk: number;
  preferentialAllowance: number;
  seniorityAllowance: number;
  teachingSeniorityPercent: number;
  insuranceMode: "percent" | "fixed" | "auto-hd";
  insurancePercent: number;
  insuranceFixedAmount: number;
  grossSalaryOverride: number;
  sickDeduction: number;
  note: string;
};

const defaultProfile: ProfileForm = {
  salaryBase: 2340000,
  salaryCoefficient: 0,
  positionAllowance: 0,
  regionAllowance: 0,
  pctnvk: 0,
  preferentialAllowance: 0,
  seniorityAllowance: 0,
  teachingSeniorityPercent: 0,
  insuranceMode: "percent",
  insurancePercent: 0,
  insuranceFixedAmount: 0,
  grossSalaryOverride: 0,
  sickDeduction: 0,
  note: "",
};

type Employee = {
  _id: string;
  fullName: string;
  employeeCode: string;
  role: string;
  employeeType: string;
};

type DeductionVoucher = {
  _id: string;
  title: string;
  amount: number;
  reason: string;
  month: number;
  year: number;
  status: string;
  effectiveDate: string;
};

type ProfilePayload = ProfileForm & {
  teachingSeniorityValue?: number;
  totalCoefficient?: number;
  grossSalary?: number;
  insuranceAmount?: number;
  netSalary?: number;
};

function toForm(p: ProfilePayload | null): ProfileForm {
  if (!p) return { ...defaultProfile };
  return {
    salaryBase: Number(p.salaryBase) || defaultProfile.salaryBase,
    salaryCoefficient: Number(p.salaryCoefficient) ?? 0,
    positionAllowance: Number(p.positionAllowance) ?? 0,
    regionAllowance: Number(p.regionAllowance) ?? 0,
    pctnvk: Number(p.pctnvk) ?? 0,
    preferentialAllowance: Number(p.preferentialAllowance) ?? 0,
    seniorityAllowance: Number(p.seniorityAllowance) ?? 0,
    teachingSeniorityPercent: Number(p.teachingSeniorityPercent) ?? 0,
    insuranceMode: p.insuranceMode === "fixed" ? "fixed" : p.insuranceMode === "auto-hd" ? "auto-hd" : "percent",
    insurancePercent: Number(p.insurancePercent) ?? 0,
    insuranceFixedAmount: Number(p.insuranceFixedAmount) ?? 0,
    grossSalaryOverride: Number(p.grossSalaryOverride) ?? 0,
    sickDeduction: Number(p.sickDeduction) ?? 0,
    note: typeof p.note === "string" ? p.note : "",
  };
}

export default function EmployeeEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [form, setForm] = useState<ProfileForm>(defaultProfile);
  const [displayStrs, setDisplayStrs] = useState<
    Partial<Record<string, string>>
  >({});
  const [preferentialPercent, setPreferentialPercent] = useState<0 | 50 | 70>(
    50,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deductionsList, setDeductionsList] = useState<DeductionVoucher[]>([]);
  const [loadingDeductions, setLoadingDeductions] = useState(false);
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [deductionSubmitting, setDeductionSubmitting] = useState(false);
  const [newDeduction, setNewDeduction] = useState({
    title: "",
    amount: "",
    reason: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [empRes, profileRes] = await Promise.all([
          fetch(`/api/employees/${id}`, { credentials: "include" }),
          fetch(`/api/employees/${id}/payroll-profile`, {
            credentials: "include",
          }),
        ]);
        const empData = await empRes.json();
        const profileData = await profileRes.json();
        if (empData?.success && empData?.data) setEmployee(empData.data);
        else setError(empData?.message || "Không tải được hồ sơ.");
        if (profileData?.success && profileData?.data != null) {
          setProfile(profileData.data);
          const nextForm = toForm(profileData.data);
          setForm(nextForm);
          const base =
            (nextForm.salaryCoefficient ?? 0) +
            (nextForm.positionAllowance ?? 0) +
            (nextForm.pctnvk ?? 0);
          const val50 = 0.5 * base;
          const val70 = 0.7 * base;
          const stored = nextForm.preferentialAllowance ?? 0;
          const d0 = Math.abs(stored - 0);
          const d50 = Math.abs(stored - val50);
          const d70 = Math.abs(stored - val70);
          setPreferentialPercent(
            d0 <= d50 && d0 <= d70 ? 0 : d50 <= d70 ? 50 : 70,
          );
          setDisplayStrs({
            salaryCoefficient:
              nextForm.salaryCoefficient === 0
                ? ""
                : String(nextForm.salaryCoefficient),
            positionAllowance:
              nextForm.positionAllowance === 0
                ? ""
                : String(nextForm.positionAllowance),
            regionAllowance:
              nextForm.regionAllowance === 0
                ? ""
                : String(nextForm.regionAllowance),
            pctnvk: nextForm.pctnvk === 0 ? "" : String(nextForm.pctnvk),
            seniorityAllowance:
              nextForm.seniorityAllowance === 0
                ? ""
                : String(nextForm.seniorityAllowance),
            teachingSeniorityPercent:
              nextForm.teachingSeniorityPercent == null
                ? ""
                : String(nextForm.teachingSeniorityPercent * 100),
            insurancePercent:
              nextForm.insurancePercent == null
                ? ""
                : String(nextForm.insurancePercent * 100),
          });
        } else {
          setForm(toForm(null));
          setPreferentialPercent(50);
          setDisplayStrs({});
        }
      } catch {
        setError("Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function fetchDeductions() {
    if (!id) return;
    setLoadingDeductions(true);
    fetch(`/api/employees/${id}/deductions`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.data)) {
          setDeductionsList(data.data);
        } else {
          setDeductionsList([]);
        }
      })
      .catch(() => setDeductionsList([]))
      .finally(() => setLoadingDeductions(false));
  }

  useEffect(() => {
    if (!id) return;
    fetchDeductions();
  }, [id]);

  async function refetchProfile() {
    if (!id) return;
    try {
      const profileRes = await fetch(`/api/employees/${id}/payroll-profile`, {
        credentials: "include",
      });
      const profileData = await profileRes.json();
      if (profileData?.success && profileData?.data != null) {
        setProfile(profileData.data);
      }
    } catch {
      // ignore
    }
  }

  function openDeductionModal() {
    const now = new Date();
    setNewDeduction({
      title: "",
      amount: "",
      reason: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      effectiveDate: now.toISOString().slice(0, 10),
    });
    setDeductionModalOpen(true);
  }

  async function submitNewDeduction() {
    const title = newDeduction.title.trim();
    const amount = parseInt(String(newDeduction.amount).replace(/\D/g, ""), 10);
    if (!title || Number.isNaN(amount) || amount < 0) return;
    if (!id) return;
    setDeductionSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${id}/deductions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          amount,
          reason: newDeduction.reason.trim() || undefined,
          month: newDeduction.month,
          year: newDeduction.year,
          effectiveDate: new Date(newDeduction.effectiveDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDeductionModalOpen(false);
        fetchDeductions();
        refetchProfile();
      } else {
        setError(data?.message || "Tạo phiếu khấu trừ thất bại.");
      }
    } catch {
      setError("Lỗi kết nối.");
    } finally {
      setDeductionSubmitting(false);
    }
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/employees/${id}/payroll-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          salaryBase: form.salaryBase,
          salaryCoefficient: form.salaryCoefficient,
          positionAllowance: form.positionAllowance,
          regionAllowance: form.regionAllowance,
          pctnvk: form.pctnvk,
          preferentialAllowance: form.preferentialAllowance,
          seniorityAllowance: form.seniorityAllowance,
          teachingSeniorityPercent: form.teachingSeniorityPercent,
          insuranceMode: form.insuranceMode,
          insurancePercent: form.insurancePercent,
          insuranceFixedAmount: form.insuranceFixedAmount,
          grossSalaryOverride: form.grossSalaryOverride || undefined,
          sickDeduction: form.sickDeduction,
          note: form.note || undefined,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.data) {
        setProfile(data.data);
        const nextForm = toForm(data.data);
        setForm(nextForm);
        const base =
          (nextForm.salaryCoefficient ?? 0) +
          (nextForm.positionAllowance ?? 0) +
          (nextForm.pctnvk ?? 0);
        const val50 = 0.5 * base;
        const val70 = 0.7 * base;
        const stored = nextForm.preferentialAllowance ?? 0;
        const d0 = Math.abs(stored - 0);
        const d50 = Math.abs(stored - val50);
        const d70 = Math.abs(stored - val70);
        setPreferentialPercent(
          d0 <= d50 && d0 <= d70 ? 0 : d50 <= d70 ? 50 : 70,
        );
        setDisplayStrs({
          salaryCoefficient:
            nextForm.salaryCoefficient === 0
              ? ""
              : String(nextForm.salaryCoefficient),
          positionAllowance:
            nextForm.positionAllowance === 0
              ? ""
              : String(nextForm.positionAllowance),
          regionAllowance:
            nextForm.regionAllowance === 0
              ? ""
              : String(nextForm.regionAllowance),
          pctnvk: nextForm.pctnvk === 0 ? "" : String(nextForm.pctnvk),
          seniorityAllowance:
            nextForm.seniorityAllowance === 0
              ? ""
              : String(nextForm.seniorityAllowance),
          teachingSeniorityPercent:
            nextForm.teachingSeniorityPercent == null
              ? ""
              : String(nextForm.teachingSeniorityPercent * 100),
          insurancePercent:
            nextForm.insurancePercent == null
              ? ""
              : String(nextForm.insurancePercent * 100),
        });
      } else {
        setError(data?.message || "Lưu thất bại.");
      }
    } catch {
      setError("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (
        preferentialPercent != null &&
        (key === "salaryCoefficient" ||
          key === "positionAllowance" ||
          key === "pctnvk")
      ) {
        const base =
          (next.salaryCoefficient ?? 0) +
          (next.positionAllowance ?? 0) +
          (next.pctnvk ?? 0);
        next.preferentialAllowance = (preferentialPercent / 100) * base;
      }
      return next;
    });
  }

  function updateDecimal(
    key:
      | "salaryCoefficient"
      | "positionAllowance"
      | "regionAllowance"
      | "pctnvk"
      | "seniorityAllowance",
    raw: string,
  ) {
    setDisplayStrs((s) => ({ ...s, [key]: raw }));
    const n = raw === "" ? 0 : parseFloat(raw);
    if (raw === "" || !Number.isNaN(n)) {
      update(key, raw === "" ? 0 : n);
    }
  }

  function updatePercent(
    key: "teachingSeniorityPercent" | "insurancePercent",
    raw: string,
  ) {
    setDisplayStrs((s) => ({ ...s, [key]: raw }));
    const n = raw === "" ? 0 : parseFloat(raw);
    if (raw === "" || !Number.isNaN(n)) {
      update(key, raw === "" ? 0 : n / 100);
    }
  }

  function setPreferentialAndUpdate(p: 0 | 50 | 70) {
    setPreferentialPercent(p);
    const base =
      (form.salaryCoefficient ?? 0) +
      (form.positionAllowance ?? 0) +
      (form.pctnvk ?? 0);
    update("preferentialAllowance", (p / 100) * base);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f3ee]">
        <p className="text-stone-500">Đang tải...</p>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-[#f6f3ee] p-6">
        <p className="text-rose-600">
          {error || "Không tìm thấy người lao động."}
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4 rounded-2xl">
            Về bảng điều khiển
          </Button>
        </Link>
      </div>
    );
  }

  const empType = (employee?.employeeType as string) ?? "";
  const isBienChe = empType === "bien-che";
  const computed = profile
    ? {
        teachingSeniorityValue: profile.teachingSeniorityValue ?? 0,
        totalCoefficient: profile.totalCoefficient ?? 0,
        grossSalary: profile.grossSalary ?? 0,
        insuranceAmount: profile.insuranceAmount ?? 0,
        otherDeduction:
          (profile as { otherDeduction?: number }).otherDeduction ?? 0,
        netSalary: profile.netSalary ?? 0,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      <div className="w-full px-4 py-6 md:px-6 lg:px-8">
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-4 -ml-3 rounded-2xl text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại bảng điều khiển
          </Button>
        </Link>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Chỉnh sửa hồ sơ người lao động
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Cấu hình lương, phụ cấp, BHXH. Các ô tính toán (cộng hệ số, thành
              tiền, thực nhận) cập nhật sau khi lưu.
            </p>
          </div>
          <Button
            className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu hồ sơ lương"}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.4fr_1fr]">
          {/* Thông tin cơ bản */}
          <Card className="rounded-2xl border-stone-200 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-stone-500">Họ tên</p>
                <p className="font-medium text-stone-900">
                  {employee?.fullName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Chức vụ</p>
                <p className="font-medium">
                  {employee ? roleLabel(employee.role) : "—"}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Mã NV</p>
                <p className="font-medium">{employee?.employeeCode ?? "—"}</p>
              </div>
              <div>
                <p className="text-stone-500">Loại hồ sơ</p>
                {employee && (
                  <Badge
                    variant="secondary"
                    className={`rounded-full ${nhanLoai[empType]?.mau ?? ""}`}
                  >
                    {nhanLoai[empType]?.nhan ?? empType}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hồ sơ lương - form */}
          <Card className="rounded-2xl border-stone-200 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl">Hồ sơ lương</CardTitle>
              <p className="text-sm text-stone-500">
                Chỉnh các hệ số, phụ cấp, BHXH. Với biên chế: dùng lương cơ bản
                × cộng hệ số. Với HĐ/bảo vệ: có thể nhập trực tiếp lương gộp.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Lương cơ bản (VNĐ)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.salaryBase || ""}
                    onChange={(e) =>
                      update("salaryBase", Number(e.target.value) || 0)
                    }
                    className="rounded-xl"
                  />
                </div>

                {isBienChe && (
                  <>
                    <div className="space-y-2">
                      <Label>Hệ số lương</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayStrs.salaryCoefficient ??
                          (form.salaryCoefficient === 0
                            ? ""
                            : String(form.salaryCoefficient))
                        }
                        onChange={(e) =>
                          updateDecimal("salaryCoefficient", e.target.value)
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phụ cấp chức vụ</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayStrs.positionAllowance ??
                          (form.positionAllowance === 0
                            ? ""
                            : String(form.positionAllowance))
                        }
                        onChange={(e) =>
                          updateDecimal("positionAllowance", e.target.value)
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phụ cấp khu vực</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayStrs.regionAllowance ??
                          (form.regionAllowance === 0
                            ? ""
                            : String(form.regionAllowance))
                        }
                        onChange={(e) =>
                          updateDecimal("regionAllowance", e.target.value)
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PCTNVK</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayStrs.pctnvk ??
                          (form.pctnvk === 0 ? "" : String(form.pctnvk))
                        }
                        onChange={(e) =>
                          updateDecimal("pctnvk", e.target.value)
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phụ cấp ưu đãi</Label>
                      {(() => {
                        const base =
                          (form.salaryCoefficient ?? 0) +
                          (form.positionAllowance ?? 0) +
                          (form.pctnvk ?? 0);
                        const preview0 = (0 * base).toFixed(4);
                        const preview50 = (0.5 * base).toFixed(4);
                        const preview70 = (0.7 * base).toFixed(4);
                        return (
                          <Select
                            value={String(preferentialPercent)}
                            onValueChange={(v) =>
                              setPreferentialAndUpdate(
                                v === "0" ? 0 : v === "70" ? 70 : 50,
                              )
                            }
                          >
                            <SelectTrigger className="w-full rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0% — {preview0}</SelectItem>
                              <SelectItem value="50">
                                50% — {preview50}
                              </SelectItem>
                              <SelectItem value="70">
                                70% — {preview70}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>
                    <div className="space-y-2">
                      <Label>Phụ cấp thâm niên</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayStrs.seniorityAllowance ??
                          (form.seniorityAllowance === 0
                            ? ""
                            : String(form.seniorityAllowance))
                        }
                        onChange={(e) =>
                          updateDecimal("seniorityAllowance", e.target.value)
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>% TNNG (ví dụ 18 hoặc 10.5%)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayStrs.teachingSeniorityPercent ??
                          (form.teachingSeniorityPercent == null
                            ? ""
                            : String(form.teachingSeniorityPercent * 100))
                        }
                        onChange={(e) =>
                          updatePercent(
                            "teachingSeniorityPercent",
                            e.target.value,
                          )
                        }
                        className="rounded-xl"
                      />
                    </div>
                  </>
                )}

                {!isBienChe && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>
                      Lương gộp (VNĐ) — nhập trực nếu không dùng hệ số
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.grossSalaryOverride || ""}
                      onChange={(e) =>
                        update(
                          "grossSalaryOverride",
                          Number(e.target.value) || 0,
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Trừ ốm đau, nghỉ sinh (VNĐ)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sickDeduction || ""}
                    onChange={(e) =>
                      update("sickDeduction", Number(e.target.value) || 0)
                    }
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Cách tính BHXH</Label>
                  <RadioGroup
                    value={form.insuranceMode}
                    onValueChange={(v) =>
                      update("insuranceMode", v as "percent" | "fixed" | "auto-hd")
                    }
                    className="flex flex-wrap gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="percent" />
                      <span>Theo % lương</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="fixed" />
                      <span>Số tiền cố định</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="auto-hd" />
                      <span>Tự động HĐ (3.700.000 × 32% = 1.184.000 VND)</span>
                    </label>
                  </RadioGroup>
                  {form.insuranceMode === "auto-hd" && !isBienChe && (
                    <p className="text-xs text-stone-500">
                      Áp dụng cho giáo viên HĐ và bảo vệ: mức BHXH cố định 1.184.000 VND/tháng.
                    </p>
                  )}
                  {form.insuranceMode === "auto-hd" && isBienChe && (
                    <p className="text-xs text-stone-500">
                      Biên chế chọn &quot;Tự động HĐ&quot; sẽ không trừ BHXH (0). Chỉ HĐ/bảo vệ mới dùng mức 1.184.000 VND.
                    </p>
                  )}
                </div>
                {form.insuranceMode === "percent" ? (
                  <div className="space-y-2">
                    <Label>% BHXH (ví dụ 10.5%)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={
                        displayStrs.insurancePercent ??
                        (form.insurancePercent == null
                          ? ""
                          : String(form.insurancePercent * 100))
                      }
                      onChange={(e) =>
                        updatePercent("insurancePercent", e.target.value)
                      }
                      className="rounded-xl"
                    />
                  </div>
                ) : form.insuranceMode === "fixed" ? (
                  <div className="space-y-2">
                    <Label>Số tiền BHXH cố định (VNĐ)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.insuranceFixedAmount || ""}
                      onChange={(e) =>
                        update(
                          "insuranceFixedAmount",
                          Number(e.target.value) || 0,
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                ) : null}

                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label>Ghi chú</Label>
                  <Input
                    value={form.note}
                    onChange={(e) => update("note", e.target.value)}
                    className="rounded-xl"
                    placeholder="Tùy chọn"
                  />
                </div>
              </div>

              {/* Xem trước tính lương (sau khi đã có profile / sau khi lưu) */}
              {computed && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <p className="mb-4 font-medium text-stone-900">
                    Tổng hợp tính lương (xem trước)
                  </p>
                  <div className="space-y-3 text-sm">
                    {isBienChe && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Hệ số TNNG</span>
                          <span className="font-medium">
                            {computed.teachingSeniorityValue.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Cộng hệ số</span>
                          <span className="font-medium">
                            {computed.totalCoefficient.toFixed(4)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-500">
                        Thành tiền / Lương gộp
                      </span>
                      <span className="font-medium">
                        {dinhDangTien(computed.grossSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>BHXH / BHYT / BHTN</span>
                      <span className="font-medium">
                        -{dinhDangTien(computed.insuranceAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Trừ ốm đau, nghỉ sinh</span>
                      <span className="font-medium">
                        -{dinhDangTien(form.sickDeduction)}
                      </span>
                    </div>
                    {computed.otherDeduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Trừ các khoản khác (phiếu khấu trừ)</span>
                        <span className="font-medium">
                          -{dinhDangTien(computed.otherDeduction)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-stone-300 pt-3">
                      <div className="flex justify-between text-base font-medium text-stone-900">
                        <span>Tổng tiền lương thực nhận</span>
                        <span>{dinhDangTien(computed.netSalary)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    Các giá trị trên cập nhật theo hồ sơ đã lưu. Nhấn &quot;Lưu
                    hồ sơ lương&quot; để áp dụng thay đổi.
                  </p>
                </div>
              )}

              {!profile && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                  Chưa có hồ sơ lương. Điền các ô trên và nhấn &quot;Lưu hồ sơ
                  lương&quot; để tạo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Phiếu khấu trừ */}
          <Card className="rounded-2xl border-stone-200 bg-white/90 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Phiếu khấu trừ
                </CardTitle>
                <p className="text-sm text-stone-500 mt-1">
                  Các khoản khấu trừ ngoài BHXH. Chỉ xem tại đây; thêm mới bằng
                  nút bên dưới.
                </p>
              </div>
              <Button
                type="button"
                className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 gap-2"
                onClick={openDeductionModal}
              >
                <Plus className="h-4 w-4" />
                Thêm phiếu khấu trừ
              </Button>
            </CardHeader>
            <CardContent>
              {loadingDeductions ? (
                <p className="text-sm text-stone-500">Đang tải...</p>
              ) : deductionsList.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Chưa có phiếu khấu trừ nào.
                </p>
              ) : (
                <ul className="space-y-3">
                  {deductionsList.map((d) => (
                    <li
                      key={d._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-stone-900">{d.title}</p>
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
            </CardContent>
          </Card>
        </div>

        {/* Modal thêm phiếu khấu trừ */}
        {deductionModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !deductionSubmitting && setDeductionModalOpen(false)}
          >
            <Card
              className="w-full max-w-md rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Thêm phiếu khấu trừ</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() =>
                    !deductionSubmitting && setDeductionModalOpen(false)
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề phiếu</Label>
                  <Input
                    value={newDeduction.title}
                    onChange={(e) =>
                      setNewDeduction((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Ví dụ: Khấu trừ tạm ứng"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số tiền (VNĐ)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={newDeduction.amount}
                    onChange={(e) =>
                      setNewDeduction((p) => ({
                        ...p,
                        amount: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="500000"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lý do (tùy chọn)</Label>
                  <Input
                    value={newDeduction.reason}
                    onChange={(e) =>
                      setNewDeduction((p) => ({ ...p, reason: e.target.value }))
                    }
                    placeholder="Ghi chú ngắn"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tháng</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={newDeduction.month}
                      onChange={(e) =>
                        setNewDeduction((p) => ({
                          ...p,
                          month: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Năm</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={newDeduction.year}
                      onChange={(e) =>
                        setNewDeduction((p) => ({
                          ...p,
                          year:
                            parseInt(e.target.value, 10) ||
                            new Date().getFullYear(),
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ngày hiệu lực</Label>
                  <Input
                    type="date"
                    value={newDeduction.effectiveDate}
                    onChange={(e) =>
                      setNewDeduction((p) => ({
                        ...p,
                        effectiveDate: e.target.value,
                      }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() =>
                      !deductionSubmitting && setDeductionModalOpen(false)
                    }
                    disabled={deductionSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-stone-900 text-white hover:bg-stone-800"
                    onClick={submitNewDeduction}
                    disabled={
                      deductionSubmitting ||
                      !newDeduction.title.trim() ||
                      !newDeduction.amount.replace(/\D/g, "")
                    }
                  >
                    {deductionSubmitting ? "Đang tạo..." : "Tạo phiếu"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
