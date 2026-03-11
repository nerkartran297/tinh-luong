"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgePlus,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FilePlus2,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const danhSachChucVu = [
  "Hiệu trưởng",
  "Phó hiệu trưởng",
  "Giáo viên",
  "Kế toán",
  "Văn thư",
  "Bảo vệ",
  "Giáo viên HĐ",
] as const;

const CHUCVU_TO_ROLE: Record<ChucVu, string> = {
  "Hiệu trưởng": "hieu-truong",
  "Phó hiệu trưởng": "pho-hieu-truong",
  "Giáo viên": "giao-vien",
  "Kế toán": "ke-toan",
  "Văn thư": "van-thu",
  "Bảo vệ": "bao-ve",
  "Giáo viên HĐ": "giao-vien-hop-dong",
};

type ChucVu = (typeof danhSachChucVu)[number];
type LoaiHoSo = "bien-che" | "hop-dong" | "bao-ve";
type GioiTinh = "nu" | "nam" | "khac";

type FormHoSoNhanVien = {
  hoTen: string;
  chucVu: ChucVu | "";
  loaiHoSo: LoaiHoSo | "";
  maNhanVien: string;
  soDienThoai: string;
  gioiTinh: GioiTinh;
  ngaySinh: string;
  ghiChu: string;
};

const trangThaiLoaiHoSo = {
  "bien-che": {
    nhan: "Biên chế",
    mau: "bg-emerald-50 text-emerald-700 border-emerald-200",
    moTa: "Dùng cho hiệu trưởng, phó hiệu trưởng, giáo viên, kế toán, văn thư thuộc biên chế.",
  },
  "hop-dong": {
    nhan: "Giáo viên hợp đồng",
    mau: "bg-amber-50 text-amber-700 border-amber-200",
    moTa: "Dùng cho giáo viên hợp đồng, sau đó vào trang chỉnh sửa để cấu hình lương và BHXH.",
  },
  "bao-ve": {
    nhan: "Bảo vệ",
    mau: "bg-sky-50 text-sky-700 border-sky-200",
    moTa: "Dùng cho bảo vệ, sau đó vào trang chỉnh sửa để thiết lập lương và BHXH linh hoạt.",
  },
};

const goiYTheoLoaiHoSo: Record<LoaiHoSo, string[]> = {
  "bien-che": [
    "Tên nhân viên",
    "Chức vụ",
    "Loại hồ sơ biên chế",
    "Mã nhân viên nếu có",
    "Sau khi tạo sẽ vào trang chỉnh hệ số lương và phụ cấp",
  ],
  "hop-dong": [
    "Tên giáo viên hợp đồng",
    "Chức vụ thường là Giáo viên HĐ",
    "Loại hồ sơ giáo viên hợp đồng",
    "Sau khi tạo sẽ vào trang chỉnh lương và BHXH",
  ],
  "bao-ve": [
    "Tên bảo vệ",
    "Chức vụ là Bảo vệ",
    "Loại hồ sơ bảo vệ",
    "Sau khi tạo sẽ vào trang chỉnh lương và BHXH theo % hoặc số tiền cụ thể",
  ],
};

const duLieuMacDinh: FormHoSoNhanVien = {
  hoTen: "",
  chucVu: "",
  loaiHoSo: "",
  maNhanVien: "",
  soDienThoai: "",
  gioiTinh: "nu",
  ngaySinh: "",
  ghiChu: "",
};

function tuDongGanLoaiHoSoTheoChucVu(chucVu: ChucVu): LoaiHoSo {
  if (chucVu === "Bảo vệ") return "bao-ve";
  if (chucVu === "Giáo viên HĐ") return "hop-dong";
  return "bien-che";
}

export default function TaoHoSoNhanVienPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormHoSoNhanVien>(duLieuMacDinh);
  const [daLuu, setDaLuu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const thongTinTomTat = useMemo(() => {
    return {
      hoTen: form.hoTen || "Chưa nhập tên",
      chucVu: form.chucVu || "Chưa chọn chức vụ",
      loaiHoSo: form.loaiHoSo || "",
    };
  }, [form]);

  const goiYHienTai = form.loaiHoSo ? goiYTheoLoaiHoSo[form.loaiHoSo] : [];

  function capNhatTruong<K extends keyof FormHoSoNhanVien>(
    key: K,
    value: FormHoSoNhanVien[K],
  ) {
    setDaLuu(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function chonChucVu(value: ChucVu) {
    const loaiHoSo = tuDongGanLoaiHoSoTheoChucVu(value);
    setDaLuu(false);
    setForm((prev) => ({
      ...prev,
      chucVu: value,
      loaiHoSo,
    }));
  }

  async function luuHoSoTam() {
    setError("");
    if (!form.hoTen?.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }
    if (!form.chucVu) {
      setError("Vui lòng chọn chức vụ.");
      return;
    }
    if (!form.loaiHoSo) {
      setError("Vui lòng chọn loại hồ sơ.");
      return;
    }
    if (!form.maNhanVien?.trim()) {
      setError("Vui lòng nhập mã nhân viên.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.hoTen.trim(),
          employeeCode: form.maNhanVien.trim(),
          role: CHUCVU_TO_ROLE[form.chucVu as ChucVu],
          employeeType: form.loaiHoSo,
          phone: form.soDienThoai || undefined,
          gender: form.gioiTinh,
          dateOfBirth: form.ngaySinh || undefined,
          note: form.ghiChu || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Tạo hồ sơ thất bại.");
        return;
      }
      setDaLuu(true);
      const id = data.data?._id;
      if (id) router.push(`/employee/${id}`);
    } catch {
      setError("Lỗi kết nối. Thử lại sau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      <div className="w-full px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]"
        >
          <Card className="overflow-hidden rounded-[28px] border-stone-200 bg-stone-900 text-white shadow-xl">
            <CardContent className="p-6 md:p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-stone-200">
                    <FilePlus2 className="h-3.5 w-3.5" />
                    Trang tạo hồ sơ nhân viên mới
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Tạo hồ sơ nhân viên trước, chỉnh lương sau
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-stone-300 md:text-base">
                    Trang này chỉ tập trung tạo hồ sơ cơ bản như tên, chức vụ,
                    phân loại nhân sự. Sau khi tạo xong mới đi tiếp sang trang
                    chỉnh sửa để nhập hệ số lương, phụ cấp, BHXH và các khoản
                    khấu trừ.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:w-[340px]">
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                      Bước 1
                    </p>
                    <p className="mt-2 text-lg font-semibold">Tạo hồ sơ</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                      Bước 2
                    </p>
                    <p className="mt-2 text-lg font-semibold">Chỉnh lương</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p className="text-sm text-stone-500">Luồng đề xuất</p>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div className="rounded-2xl bg-stone-50 p-3">
                    1. Chọn chức vụ
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-3">
                    2. Hệ thống tự gợi ý loại hồ sơ
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-3">
                    3. Lưu hồ sơ và chuyển sang trang chỉnh chi tiết lương
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800">
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center justify-center"
                  >
                    Về bảng điều khiển
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-stone-300 bg-white"
                >
                  <Link
                    href="/nhan-vien"
                    className="flex w-full items-center justify-center"
                  >
                    Về danh sách nhân viên
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
            <CardHeader className="border-b border-stone-100 pb-4">
              <CardTitle className="text-xl">Xem nhanh hồ sơ sắp tạo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-3xl bg-stone-900 p-5 text-white">
                <p className="text-sm text-stone-300">Hồ sơ xem trước</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {thongTinTomTat.hoTen}
                </h2>
                <p className="mt-1 text-sm text-stone-300">
                  {thongTinTomTat.chucVu}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {form.loaiHoSo ? (
                    <Badge
                      className={`rounded-full border ${trangThaiLoaiHoSo[form.loaiHoSo].mau}`}
                    >
                      {trangThaiLoaiHoSo[form.loaiHoSo].nhan}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-white/10 text-stone-100"
                    >
                      Chưa chọn loại hồ sơ
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
                  <Users className="h-4 w-4" />
                  Gợi ý theo loại hồ sơ
                </div>
                {form.loaiHoSo ? (
                  <div className="mt-3 space-y-2 text-sm text-stone-600">
                    <p>{trangThaiLoaiHoSo[form.loaiHoSo].moTa}</p>
                    <div className="space-y-2 pt-2">
                      {goiYHienTai.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl bg-white px-4 py-3"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">
                    Chọn chức vụ hoặc loại hồ sơ để hệ thống gợi ý đúng luồng
                    tạo nhân viên.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
                  <ShieldCheck className="h-4 w-4" />
                  Lưu ý nghiệp vụ
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Trang này chỉ tạo hồ sơ nền. Các thông tin như hệ số lương,
                  phụ cấp, % TNNG, BHXH, phiếu khấu trừ sẽ cấu hình ở trang
                  chỉnh sửa hồ sơ sau khi tạo xong.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-stone-200 bg-white/80 shadow-sm backdrop-blur">
            <CardHeader className="border-b border-stone-100 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">
                    Biểu mẫu tạo hồ sơ nhân viên
                  </CardTitle>
                  <p className="mt-1 text-sm text-stone-500">
                    Nhập thông tin cơ bản trước. Sau khi lưu hồ sơ, điều hướng
                    sang trang chỉnh sửa lương là hợp lý nhất.
                  </p>
                </div>

                {daLuu ? (
                  <Badge className="rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Đã lưu tạm
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-full border-stone-300 text-stone-600"
                  >
                    <BadgePlus className="mr-1 h-3.5 w-3.5" />
                    Hồ sơ mới
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="hoTen">Họ và tên</Label>
                  <Input
                    id="hoTen"
                    className="h-11 rounded-2xl"
                    placeholder="Ví dụ: Nguyễn Thị A"
                    value={form.hoTen}
                    onChange={(e) => capNhatTruong("hoTen", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maNhanVien">Mã nhân viên</Label>
                  <Input
                    id="maNhanVien"
                    className="h-11 rounded-2xl"
                    placeholder="Nếu có"
                    value={form.maNhanVien}
                    onChange={(e) =>
                      capNhatTruong("maNhanVien", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chức vụ</Label>
                  <Select
                    value={form.chucVu}
                    onValueChange={(value) => chonChucVu(value as ChucVu)}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Chọn chức vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {danhSachChucVu.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Loại hồ sơ</Label>
                  <Select
                    value={form.loaiHoSo}
                    onValueChange={(value) =>
                      capNhatTruong("loaiHoSo", value as LoaiHoSo)
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Chọn loại hồ sơ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bien-che">Biên chế</SelectItem>
                      <SelectItem value="hop-dong">
                        Giáo viên hợp đồng
                      </SelectItem>
                      <SelectItem value="bao-ve">Bảo vệ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soDienThoai">Số điện thoại</Label>
                  <Input
                    id="soDienThoai"
                    className="h-11 rounded-2xl"
                    placeholder="Nhập số điện thoại"
                    value={form.soDienThoai}
                    onChange={(e) =>
                      capNhatTruong("soDienThoai", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngaySinh">Ngày sinh</Label>
                  <Input
                    id="ngaySinh"
                    type="date"
                    className="h-11 rounded-2xl"
                    value={form.ngaySinh}
                    onChange={(e) => capNhatTruong("ngaySinh", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Giới tính</Label>
                <RadioGroup
                  value={form.gioiTinh}
                  onValueChange={(value) =>
                    capNhatTruong("gioiTinh", value as GioiTinh)
                  }
                  className="grid gap-3 md:grid-cols-3"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <RadioGroupItem value="nu" id="gioi-tinh-nu" />
                    <Label htmlFor="gioi-tinh-nu" className="cursor-pointer">
                      Nữ
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <RadioGroupItem value="nam" id="gioi-tinh-nam" />
                    <Label htmlFor="gioi-tinh-nam" className="cursor-pointer">
                      Nam
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <RadioGroupItem value="khac" id="gioi-tinh-khac" />
                    <Label htmlFor="gioi-tinh-khac" className="cursor-pointer">
                      Khác
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghiChu">Ghi chú</Label>
                <Textarea
                  id="ghiChu"
                  placeholder="Ví dụ: hồ sơ mới tạo, chờ nhập hệ số lương sau"
                  className="min-h-[120px] rounded-3xl"
                  value={form.ghiChu}
                  onChange={(e) => capNhatTruong("ghiChu", e.target.value)}
                />
              </div>

              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-stone-900">
                    <Briefcase className="h-4 w-4" />
                    Hành động sau khi tạo hồ sơ
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 text-sm text-stone-600">
                    Lưu hồ sơ cơ bản
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm text-stone-600">
                    Điều hướng sang trang chỉnh sửa lương
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm text-stone-600">
                    Bắt đầu nhập hệ số, phụ cấp, BHXH
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {error && (
                  <p className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                  </p>
                )}
                <Button
                  className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800"
                  onClick={luuHoSoTam}
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Đang tạo..." : "Tạo hồ sơ nhân viên"}
                </Button>

                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-stone-300 bg-white"
                  onClick={luuHoSoTam}
                  disabled={saving}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tạo và qua trang chỉnh sửa
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="h-11 rounded-2xl text-stone-600 hover:text-stone-900"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
