"use client";

import { useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { EmployeeForm } from "@/components/admin/EmployeeForm";

export default function CreateEmployeePage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  useEffect(() => {
    setTitle("Add New Employee");
    setBadge("Website");
    setDateFilter(""); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <EmployeeForm />;
}
