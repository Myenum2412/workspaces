"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Users, X, Plus, Bookmark, ChevronDownIcon } from "lucide-react";
const intervalPresets = [
  { id: "2d", label: "2 Days", frequency: "daily" as const, interval: 2 },
  { id: "3d", label: "3 Days", frequency: "daily" as const, interval: 3 },
  { id: "4d", label: "4 Days", frequency: "daily" as const, interval: 4 },
  { id: "5d", label: "5 Days", frequency: "daily" as const, interval: 5 },
  { id: "6d", label: "6 Days", frequency: "daily" as const, interval: 6 },
  { id: "15", label: "7 Days", frequency: "daily" as const, interval: 7 },
  { id: "1w", label: "1 Week", frequency: "weekly" as const, interval: 1 },
  { id: "2w", label: "2 Weeks", frequency: "weekly" as const, interval: 2 },
  { id: "1m", label: "1 Month", frequency: "monthly" as const, interval: 1 },
  { id: "3m", label: "3 Months", frequency: "monthly" as const, interval: 3 },
  { id: "6m", label: "6 Months", frequency: "monthly" as const, interval: 6 },
  { id: "1y", label: "1 Year", frequency: "yearly" as const, interval: 1 },
];
import { z } from "zod";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AllocationModeSelectorProps,
  IntervalPresetButtonsProps,
  AssigneeSelectorProps,
  Employee,
  Team,
  TeamMember,
  Priority
} from './types';

// Zod schema for custom days validation
const customDaysSchema = z.object({
  days: z.string()
    .refine((val) => val === "" || !isNaN(Number(val)), {
      message: "Must be a valid number",
    })
    .refine((val) => val === "" || (Number(val) >= 1 && Number(val) <= 365), {
      message: "Days must be between 1 and 365",
    })
});

// Interval Preset Buttons Component (NEW)
export const IntervalPresetButtons = ({
  onSelect,
  selectedPresetId
}: IntervalPresetButtonsProps) => (
  <div className="space-y-2">
    {/* <Label className="text-xs font-medium">Quick Intervals</Label> */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {intervalPresets.map((preset) => (
        <Button
          key={preset.id}
          type="button"
          variant={selectedPresetId === preset.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(preset)}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  </div>
);

// Allocation Mode Selector Component (UPDATED - No role restrictions)
export const AllocationModeSelector = ({
  mode,
  onChange,
  saveAsTemplate,
  onToggleSave
}: AllocationModeSelectorProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Allocation Mode <span className="text-destructive">*</span>
      </Label>
      <button
        type="button"
        onClick={onToggleSave}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ",
          saveAsTemplate 
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/10" 
            : "text-muted-foreground hover:bg-muted border border-transparent"
        )}
      >
        <Bookmark className={cn("h-5 w-5", saveAsTemplate && "fill-current")} />
        {saveAsTemplate && (
          <span className="text-[11px] font-extrabold uppercase tracking-tight">Saved Task</span>
        )}
      </button>
    </div>
    <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50 gap-1 w-fit">
      <button
        type="button"
        onClick={() => onChange('individual')}
        className={cn(
          "flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
          mode === 'individual'
            ? "bg-green-500 text-black  -green-500/20"
            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
        )}
      >
        <User className={cn("h-4 w-4 transition-transform", mode === 'individual' && "scale-110")} />
        Individual
      </button>
      <button
        type="button"
        onClick={() => onChange('team')}
        className={cn(
          "flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
          mode === 'team'
            ? "bg-green-500 text-black  -green-500/20"
            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
        )}
      >
        <Users className={cn("h-4 w-4 transition-transform", mode === 'team' && "scale-110")} />
        Team
      </button>
    </div>
  </div>
);

// Staff Selection Component
export const StaffSelector = ({
  selectedStaff,
  employees,
  onSelect,
  onRemove
}: {
  selectedStaff: string[];
  employees: Employee[];
  onSelect: (staffId: string) => void;
  onRemove: (staffId: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor="individual-staff" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Staff Members *</Label>
    {/* Staff Selection Dropdown */}
    <div className="flex gap-2">
      <Select
        value=""
        onValueChange={(staffId) => {
          if (staffId && staffId !== 'quick-add' && !selectedStaff.includes(staffId)) {
            onSelect(staffId);
          } else if (staffId === 'quick-add') {
            onSelect(staffId);
          }
        }}
      >
        <SelectTrigger className="flex-1 h-9">
          <SelectValue placeholder="Select staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quick-add" className="text-emerald-600 font-semibold border-b border-dashed mb-1">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Quick Add Staff</span>
            </div>
          </SelectItem>
          {employees
            .filter(staff => !selectedStaff.includes(staff.id))
            .map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                <div className="flex items-center gap-2">
                  <span>{staff.name}</span>
                  <span className="text-xs text-muted-foreground">({staff.role})</span>
                </div>
              </SelectItem>
            ))}
          {employees.length > 0 && employees.filter(staff => !selectedStaff.includes(staff.id)).length === 0 && (
            <SelectItem value="all-staff-selected" disabled>All staff already selected</SelectItem>
          )}
          {employees.length === 0 && (
            <SelectItem value="no-staff" disabled>No staff available</SelectItem>
          )}
        </SelectContent>
      </Select>
      <Button 
        type="button" 
        size="icon" 
        variant="outline" 
        className="h-9 w-9 shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        onClick={() => onSelect('quick-add')}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>

    {/* Selected Staff Display */}
    {selectedStaff.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedStaff.map((staffId) => {
          const staff = employees.find(e => e.id === staffId);
          return staff ? (
            <div
              key={staffId}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
            >
              <span>{staff.name}</span>
              <span className="text-xs text-muted-foreground">({staff.role})</span>
              <button
                type="button"
                onClick={() => onRemove(staffId)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null;
        })}
      </div>
    )}


    {/* {selectedStaff.length === 0 && (
      <p className="text-xs text-muted-foreground">Please select at least one staff member</p>
    )} */}
  </div>
);

// Team Selection Component
export const TeamSelector = ({
  selectedTeams,
  teams,
  teamMembers,
  onSelect,
  onRemove
}: {
  selectedTeams: string[];
  teams: Team[];
  teamMembers: TeamMember[];
  onSelect: (teamId: string) => void;
  onRemove: (teamId: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor="team" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Teams *</Label>



    {/* Team Selection Dropdown */}
    <div className="flex gap-2">
      <Select
        value=""
        onValueChange={(teamId) => {
          if (teamId && teamId !== 'quick-add' && !selectedTeams.includes(teamId)) {
            onSelect(teamId);
          } else if (teamId === 'quick-add') {
            onSelect(teamId);
          }
        }}
      >
        <SelectTrigger className="flex-1 h-9">
          <SelectValue placeholder="Select teams to assign" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quick-add" className="text-emerald-600 font-semibold border-b border-dashed mb-1">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Quick Add Team</span>
            </div>
          </SelectItem>
          {teams
            .filter(team => !selectedTeams.includes(team.id))
            .map((team) => (
              <SelectItem key={team.id} value={team.id}>
                <div className="flex items-center gap-2">
                  <span>{team.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({team.memberCount || 0} members)
                  </span>
                </div>
              </SelectItem>
            ))}
          {teams.length > 0 && teams.filter(team => !selectedTeams.includes(team.id)).length === 0 && (
            <SelectItem value="all-teams-selected" disabled>All teams already selected</SelectItem>
          )}
          {teams.length === 0 && (
            <SelectItem value="no-teams" disabled>No teams available</SelectItem>
          )}
        </SelectContent>
      </Select>
      <Button 
        type="button" 
        size="icon" 
        variant="outline" 
        className="h-9 w-9 shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        onClick={() => onSelect('quick-add')}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    {/* Selected Teams Display */}
    {selectedTeams.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTeams.map((teamId) => {
          const team = teams.find(t => t.id === teamId);
          return team ? (
            <div
              key={teamId}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
            >
              <span>{team.name}</span>
              <span className="text-xs opacity-70">
                ({team.memberCount || 0} members)
              </span>
              <button
                type="button"
                onClick={() => onRemove(teamId)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null;
        })}
      </div>
    )}
    {/* {selectedTeams.length === 0 && (
      <p className="text-xs text-muted-foreground">Please select at least one team</p>
    )} */}
  </div>
);

// Combined Assignee Selector (Staff + Team in one dropdown)
export const AssigneeSelector = ({
  selectedAssignee,
  selectedAssigneeType,
  employees,
  teams,
  onSelect,
  onRemove,
}: AssigneeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedStaff = selectedAssigneeType === 'staff'
    ? employees.find(e => e.id === selectedAssignee)
    : null;
  const selectedTeam = selectedAssigneeType === 'team'
    ? teams.find(t => t.id === selectedAssignee)
    : null;

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Assign To *
      </Label>

      {selectedStaff ? (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm border border-blue-200">
          <User className="h-4 w-4" />
          <span className="font-medium">{selectedStaff.name}</span>
          <span className="text-xs text-blue-600">({selectedStaff.role})</span>
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto hover:bg-blue-100 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : selectedTeam ? (
        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm border border-purple-200">
          <Users className="h-4 w-4" />
          <span className="font-medium">{selectedTeam.name}</span>
          <span className="text-xs text-purple-600">
            ({selectedTeam.memberCount || 0} members)
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto hover:bg-purple-100 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between h-9"
            >
              <span className="text-muted-foreground">Select staff or team...</span>
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="max-h-[300px] overflow-y-auto">
              {/* Staff Section */}
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                STAFF MEMBERS
              </div>
              {employees.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No staff available
                </div>
              ) : (
                employees.map((staff) => (
                  <button
                    key={`staff-${staff.id}`}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                    onClick={() => {
                      onSelect(staff.id, 'staff');
                      setIsOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 text-blue-600" />
                    <span>{staff.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {staff.role}
                    </span>
                  </button>
                ))
              )}

              {/* Teams Section */}
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-t">
                TEAMS
              </div>
              {teams.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No teams available
                </div>
              ) : (
                teams.map((team) => (
                  <button
                    key={`team-${team.id}`}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                    onClick={() => {
                      onSelect(team.id, 'team');
                      setIsOpen(false);
                    }}
                  >
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>{team.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {team.memberCount || 0} members
                    </span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

// Priority Selection Component (Single Select)
export const PrioritySelector = ({
  selectedPriority,
  priorities,
  onSelect
}: {
  selectedPriority: string;
  priorities: Priority[];
  onSelect: (priorityId: string) => void;
}) => (
  <div className="flex gap-2">
    <Select
      value={selectedPriority}
      onValueChange={(val) => {
        if (val === 'quick-add') {
          onSelect('quick-add');
        } else {
          onSelect(val);
        }
      }}
    >
      <SelectTrigger className="flex-1 h-9">
        <SelectValue placeholder="Select priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="quick-add" className="text-emerald-600 font-semibold border-b border-dashed mb-1">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Quick Add Priority</span>
          </div>
        </SelectItem>
        {priorities.map((priority) => (
          <SelectItem key={priority.id} value={priority.id}>
            {priority.name.charAt(0).toUpperCase() + priority.name.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Button 
      type="button" 
      size="icon" 
      variant="outline" 
      className="h-9 w-9 shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
      onClick={() => onSelect('quick-add')}
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);

// Custom Days Input Component (NEW)
export const CustomDaysInput = ({
  value,
  onChange,
  onBlur
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) => {
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Validate on change
    const result = customDaysSchema.safeParse({ days: inputValue });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Invalid input");
    } else {
      setError("");
    }
  };

  const handleBlur = () => {
    // Validate on blur
    const result = customDaysSchema.safeParse({ days: value });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Invalid input");
    } else {
      setError("");
    }
    onBlur?.();
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="custom-days" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Custom Days *
      </Label>
      <Input
        id="custom-days"
        type="text"
        placeholder="Enter number of days"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
      {!error && value && (
        <p className="text-xs text-muted-foreground">
          Task will repeat every {value} day{Number(value) !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};