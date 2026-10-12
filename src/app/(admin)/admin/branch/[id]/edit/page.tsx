"use client";

import { useEffect, useState } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { BranchForm, ExistingBranchData } from "@/components/admin/BranchForm";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EditBranchPage({ params }: { params: { id: string } }) {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [branchData, setBranchData] = useState<ExistingBranchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Edit Branch");
    setBadge("Website");
    setDateFilter(""); 

    (async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<ExistingBranchData>(`/branches/${params.id}`);
        setBranchData(data);
        if (data?.name) {
          setTitle(`Edit Branch: ${data.name}`);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load branch details");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.id, setTitle, setBadge, setDateFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex gap-6">
          <Skeleton className="h-[400px] w-2/3" />
          <Skeleton className="h-[250px] w-1/3" />
        </div>
      </div>
    );
  }

  if (!branchData) {
    return <div className="p-8 text-center text-slate-500">Branch not found.</div>;
  }

  return (
    <div className="pb-10">
      <BranchForm isEdit={true} initialData={branchData} branchId={params.id} />
    </div>
  );
}
