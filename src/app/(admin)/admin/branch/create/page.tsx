"use client";

import { useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { BranchForm } from "@/components/admin/BranchForm";

export default function CreateBranchPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  useEffect(() => {
    setTitle("Add New Branch");
    setBadge("Website");
    setDateFilter(""); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-10">
      <BranchForm isEdit={false} />
    </div>
  );
}
