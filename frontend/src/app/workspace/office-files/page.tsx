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
  { name: "Employee Information", icon: Building2, color: "text-amber-500" },
  { name: "Leave Tracker", icon: Umbrella, color: "text-sky-500" },
  { name: "Files", icon: FolderOpen, color: "text-sky-500" },
  { name: "HR Letters", icon: Star, color: "text-orange-500" },
  { name: "Travel", icon: Star, color: "text-orange-500" },
  { name: "Tasks", icon: ClipboardCheck, color: "text-orange-500" },
  { name: "General", icon: Building, color: "text-amber-500" },
  { name: "Approvals", icon: FileCheck2, color: "text-orange-500" },
  { name: "Data Administration", icon: Files, color: "text-pink-600" },
];

export default function OfficeFilesPage() {
  return (
    <div className="space-y-6 w-full pb-10 min-h-screen px-2 pt-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
          Explore Office Files
        </h1>
        <SearchBar />
      </div>

      <div className="pt-8 space-y-6">
        <h2 className="text-[15px] font-semibold text-slate-700">Services</h2>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.name} className="flex flex-col items-center gap-3 cursor-pointer group">
                <div className="flex items-center justify-center w-[100px] h-[100px] bg-white rounded-[20px] shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all">
                  <Icon className={`size-8 ${service.color}`} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-slate-600 text-center max-w-[90px] leading-snug group-hover:text-slate-900 transition-colors">
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
