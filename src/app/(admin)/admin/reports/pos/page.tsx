import { redirect } from "next/navigation";

export default function PosReportRedirect() {
  redirect("/admin/reports/pos-sales");
}
