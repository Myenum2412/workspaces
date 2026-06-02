import {
  Building2,
  Umbrella,
  FolderOpen,
  Star,
  ClipboardCheck,
  Building,
  FileCheck2,
  Files,
} from "lucide-react";
import { SearchBar } from "./search-bar";

const services = [
  { name: "Employee Information", icon: Building2, color: "text-secondary-foreground" },
  { name: "Leave Tracker", icon: Umbrella, color: "text-primary" },
  { name: "Files", icon: FolderOpen, color: "text-primary" },
  { name: "HR Letters", icon: Star, color: "text-secondary-foreground" },
  { name: "Travel", icon: Star, color: "text-secondary-foreground" },
  { name: "Tasks", icon: ClipboardCheck, color: "text-secondary-foreground" },
  { name: "General", icon: Building, color: "text-secondary-foreground" },
  { name: "Approvals", icon: FileCheck2, color: "text-secondary-foreground" },
  { name: "Data Administration", icon: Files, color: "text-primary" },
];

export default function OfficeFilesPage() {
  return (
    <div className="space-y-6 w-full pb-10 min-h-screen px-2 pt-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-center">
          Explore Office Files
        </h1>
        <SearchBar />
      </div>

      <div className="pt-8 space-y-6">
        <h2 className="text-[15px] font-semibold text-foreground">Services</h2>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.name} className="flex flex-col items-center gap-3 cursor-pointer group">
                <div className="flex items-center justify-center w-[100px] h-[100px] bg-white rounded-[20px] shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all">
                  <Icon className={`size-8 ${service.color}`} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-muted-foreground text-center max-w-[90px] leading-snug group-hover:text-foreground transition-colors">
                  {service.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
