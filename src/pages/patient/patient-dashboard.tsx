
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function PatientDashboard() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">Patient Dashboard</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="rounded-xl bg-muted/50 p-6">
          Select a menu item from the sidebar.
        </div>
      </div>
    </div>
  );
}
