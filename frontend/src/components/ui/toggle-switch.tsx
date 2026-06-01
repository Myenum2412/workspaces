import { cn } from "@/lib/utils";
import { useState } from "react";

interface ToggleSwitchProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    className?: string;
}

export function ToggleSwitch({ checked = false, onChange, label, className }: ToggleSwitchProps) {
    return (
        <label className={cn("relative inline-flex cursor-pointer items-center gap-3 text-gray-900", className)}>
            <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={checked} 
                onChange={(e) => onChange?.(e.target.checked)} 
            />
            <div className="peer h-7 w-12 rounded-full bg-slate-300 ring-offset-1 transition-colors duration-200 peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary"></div>
            <span className="dot absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
            {label && <span className="text-sm font-medium">{label}</span>}
        </label>
    );
}