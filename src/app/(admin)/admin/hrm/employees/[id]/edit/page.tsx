"use client";

import { useEffect, useState } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Edit Employee");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    setIsLoading(true);
    apiGet<any>(`/employees/${params.id}`)
      .then((res) => {
        setEmployee(res);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load employee profile");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        <div className="w-full lg:w-2/3 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="w-full lg:w-1/3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return <div className="p-6 text-slate-500">Employee not found.</div>;
  }

  return <EmployeeForm initialData={employee} isEdit />;
}
