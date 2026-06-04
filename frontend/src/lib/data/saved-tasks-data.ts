export interface SavedTask {
  id: string
  title: string
  description: string
  priority: string
  taskType: string
  assignedType: string
  estimatedTime: string
  templateCategory: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export const savedTasks: SavedTask[] = []

export function getSavedTasks() {
  return savedTasks
}
