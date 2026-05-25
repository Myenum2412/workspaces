"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Task } from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch {
      api.clearToken();
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!api.getToken()) {
      router.push("/");
      return;
    }
    loadTasks();
  }, [loadTasks, router]);

  const handleLogout = () => {
    api.clearToken();
    router.push("/");
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900">Task Manager</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "todo", "in-progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filter === s
                  ? "bg-zinc-800 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border"
              }`}
            >
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Add task */}
        <TaskForm onAdded={loadTasks} />

        {/* Task list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No tasks yet</p>
          ) : (
            filtered.map((task) => (
              <TaskCard key={task._id} task={task} onRefresh={loadTasks} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
