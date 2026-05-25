"use client";

import { api, Task } from "@/lib/api";

const statusColors: Record<string, string> = {
  todo: "bg-zinc-200 text-zinc-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const priorityColors: Record<string, string> = {
  low: "border-l-zinc-400",
  medium: "border-l-yellow-400",
  high: "border-l-red-500",
};

export default function TaskCard({
  task,
  onRefresh,
}: {
  task: Task;
  onRefresh: () => void;
}) {
  const handleStatusChange = async (status: Task["status"]) => {
    await api.updateTask(task._id, { status });
    onRefresh();
  };

  const handleDelete = async () => {
    await api.deleteTask(task._id);
    onRefresh();
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 border-l-4 ${priorityColors[task.priority]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 truncate">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="text-zinc-400 hover:text-red-500 transition-colors text-sm shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[task.status]}`}
        >
          {task.status}
        </span>
        <span className="text-xs text-zinc-400">{task.priority}</span>
      </div>

      <div className="flex gap-1 mt-3">
        {(["todo", "in-progress", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              task.status === s
                ? "bg-zinc-800 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
