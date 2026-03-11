"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  "hieu-truong": "Hiệu trưởng",
  "pho-hieu-truong": "Phó hiệu trưởng",
  "giao-vien": "Giáo viên",
  "ke-toan": "Kế toán",
  "van-thu": "Văn thư",
  "bao-ve": "Bảo vệ",
  "giao-vien-hop-dong": "Giáo viên HĐ",
};

type Employee = {
  _id: string;
  fullName: string;
  employeeCode: string;
  role: string;
  employeeType: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
};

function roleLabel(slug: string) {
  return ROLE_LABELS[slug] ?? slug;
}

export default function EmployeesPage() {
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingHardId, setDeletingHardId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!showInactive) params.set("isActive", "true");
      const res = await fetch(`/api/employees?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) setList(data.data);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn ngừng hoạt động nhân viên này? (Soft delete)")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) await fetchList();
      else alert(data?.message || "Không thể thực hiện.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleHardDelete(id: string) {
    if (
      !confirm(
        "Xóa hẳn nhân viên? Sẽ xóa luôn hồ sơ lương và mọi phiếu khấu trừ. Không thể hoàn tác."
      )
    )
      return;
    setDeletingHardId(id);
    try {
      const res = await fetch(`/api/employees/${id}?hard=true`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) await fetchList();
      else alert(data?.message || "Không thể xóa.");
    } finally {
      setDeletingHardId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      <div className="w-full px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Danh sách nhân viên
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Tạo mới hoặc ngừng hoạt động nhân viên. Chỉnh sửa hồ sơ lương tại trang từng nhân viên.
            </p>
          </div>
          <Link href="/employee">
            <Button className="h-11 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 gap-2">
              <UserPlus className="h-4 w-4" />
              Tạo nhân viên
            </Button>
          </Link>
        </div>

        <Card className="rounded-2xl border-stone-200 bg-white/90">
          <CardHeader className="border-b border-stone-100 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nhân sự
              </CardTitle>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-stone-300"
                />
                Hiện cả nhân viên đã ngừng hoạt động
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center text-stone-500">
                Đang tải...
              </div>
            ) : list.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-stone-500">
                <Users className="h-12 w-12 text-stone-300" />
                <p>Chưa có nhân viên nào.</p>
                <Link href="/employee">
                  <Button variant="outline" className="rounded-2xl">
                    Tạo nhân viên đầu tiên
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-stone-600">
                      <th className="px-4 py-3 font-medium">Họ tên</th>
                      <th className="px-4 py-3 font-medium">Mã NV</th>
                      <th className="px-4 py-3 font-medium">Chức vụ</th>
                      <th className="px-4 py-3 font-medium">Loại hồ sơ</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((emp) => (
                      <tr
                        key={emp._id}
                        className="border-b border-stone-100 hover:bg-stone-50/50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/employee/${emp._id}`}
                            className="font-medium text-stone-900 hover:underline"
                          >
                            {emp.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{emp.employeeCode}</td>
                        <td className="px-4 py-3">{roleLabel(emp.role)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {emp.employeeType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {emp.isActive !== false ? (
                            <span className="text-emerald-600">Đang dùng</span>
                          ) : (
                            <span className="text-stone-400">Ngừng hoạt động</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/employee/${emp._id}`}>
                            <Button variant="ghost" size="sm" className="rounded-xl">
                              Sửa
                            </Button>
                          </Link>
                          {emp.isActive !== false && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDelete(emp._id)}
                              disabled={deletingId === emp._id}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {deletingId === emp._id ? "..." : "Ngừng HĐ"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                            onClick={() => handleHardDelete(emp._id)}
                            disabled={deletingHardId === emp._id}
                            title="Xóa hẳn khỏi hệ thống (không hoàn tác được)"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {deletingHardId === emp._id ? "..." : "Xóa hẳn"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
