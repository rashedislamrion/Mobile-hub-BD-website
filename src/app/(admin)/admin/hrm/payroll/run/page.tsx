"use client";

import { useEffect, useState } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { CheckCircle2, AlertCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api-client";

export default function RunPayrollPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [runResult, setRunResult] = useState<any>(null);

  useEffect(() => {
    setTitle("Run Payroll");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    apiGet<any[]>("/departments")
      .then((res) => {
        if (Array.isArray(res)) setDepartments(res);
      })
      .catch(() => {});
  }, []);

  const handleRun = async () => {
    try {
      setIsProcessing(true);
      const res = await apiPost<any>("/payroll/run", {
        month,
        departmentId: departmentId || undefined,
      });

      setRunResult(res);
      setStep(2);
      toast.success(res.message || "Payroll generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payroll");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    router.push("/admin/hrm/payroll");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-500 -z-10" style={{ width: step === 1 ? '0%' : '100%' }} />
        
        <div className={`flex flex-col items-center gap-2 bg-slate-50 px-2 ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-emerald-500 bg-white' : 'border-slate-300 bg-slate-100'}`}>
            1
          </div>
          <span className="text-sm font-semibold">Configuration</span>
        </div>
        
        <div className={`flex flex-col items-center gap-2 bg-slate-50 px-2 ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-emerald-500 bg-white' : 'border-slate-300 bg-slate-100'}`}>
            2
          </div>
          <span className="text-sm font-semibold">Review & Finish</span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800">Configure Payroll Run</h2>
            <p className="text-slate-500 mt-1">Select the month and optional department to generate salary sheets for.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Salary Month *</label>
              <input 
                type="month" 
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Department</label>
              <select 
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">All Departments (Global)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold mb-1">Automated Net Salary Calculation:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Net Salary = Basic Salary + Sum(Configured Allowances) - Deductions</li>
                <li>Employees who already have a payroll record for this month will be automatically skipped.</li>
                <li>Generated records will be initialized as PENDING for admin review before payout.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => router.push('/admin/hrm/payroll')}
              className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleRun}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" /> Generate Payroll
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  Payroll Batch Processed
                </h2>
                <p className="text-slate-500 mt-1">Review the batch results below.</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Month</p>
                <p className="text-lg font-bold text-slate-800">{month}</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700 font-medium">Generated Sheets</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{runResult?.createdCount || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Already Existed / Skipped</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{runResult?.skippedCount || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Status</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">Pending Approval</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Payroll List
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
