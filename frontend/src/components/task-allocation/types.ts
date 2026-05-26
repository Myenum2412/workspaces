// Type definitions for Task Allocation Dialog

export interface IntervalPreset {
  id: string;
  label: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string;
  memberCount?: number; // Number of members in the team (including leader)
}

export interface TeamMember {
  team_id: string;
  member_id: string;
}

export interface Priority {
  id: string;
  name: string;
}

export type AllocationMode = 'individual' | 'team';
export type RepeatFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

// Component Props Types
export interface AllocationModeSelectorProps {
  mode: AllocationMode;
  onChange: (mode: AllocationMode) => void;
  saveAsTemplate: boolean;
  onToggleSave: () => void;
}

export interface IntervalPresetButtonsProps {
  onSelect: (preset: IntervalPreset) => void;
  selectedPresetId?: string;
}

export interface RepeatSettingsBlockProps {
  frequency: RepeatFrequency;
  interval: number;
  endDate?: Date;
  customDays: number[];
  hasSpecificTime: boolean;
  startTime: string;
  endTime: string;
  selectedPresetId?: string;
  onFrequencyChange: (freq: RepeatFrequency) => void;
  onIntervalChange: (interval: number) => void;
  onEndDateChange: (date?: Date) => void;
  onCustomDaysToggle: (day: number) => void;
  onTimeToggle: (enabled: boolean) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onPresetSelect: (preset: IntervalPreset) => void;
}

export interface AssignmentSelectorProps {
  mode: AllocationMode;
  selectedStaff: string[];
  selectedTeams: string[];
  employees: Employee[];
  teams: Team[];
  teamMembers: TeamMember[];
  onStaffSelect: (staffId: string) => void;
  onStaffRemove: (staffId: string) => void;
  onTeamSelect: (teamId: string) => void;
  onTeamRemove: (teamId: string) => void;
}

export type AssigneeType = 'staff' | 'team';
export interface AssigneeSelectorProps {
  selectedAssignee: string | null;
  selectedAssigneeType: AssigneeType | null;
  employees: Employee[];
  teams: Team[];
  onSelect: (id: string, type: AssigneeType) => void;
  onRemove: () => void;
}

export interface CustomDaysInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}