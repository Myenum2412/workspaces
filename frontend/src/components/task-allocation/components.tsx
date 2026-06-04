interface AssigneeSelectorProps {
  selectedAssignee: string | null
  selectedAssigneeType: string | null
  employees: Array<{ id: string; name: string; role: string }>
  teams: Array<{ id: string; name: string; created_by: string; memberCount: number }>
  onSelect: (id: string, type: string) => void
  onRemove: () => void
}
export const AssigneeSelector = (_props: AssigneeSelectorProps) => null

interface PrioritySelectorProps {
  selectedPriority: string
  priorities: Array<{ id: string; name: string }>
  onSelect: (val: string) => void
}
export const PrioritySelector = (_props: PrioritySelectorProps) => null
