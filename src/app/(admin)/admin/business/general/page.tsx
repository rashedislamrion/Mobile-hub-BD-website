import { redirect } from "next/navigation";

export default function LegacyBusinessGeneralPage() {
  redirect("/admin/business-settings/general");
}
