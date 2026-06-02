import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedTaskTable } from "@/components/tasks/saved-task-table";

export default function SavedTasksPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Saved Tasks
              </CardTitle>
              <CardDescription>
                Manage and use your saved task templates and drafts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <SavedTaskTable />
        </CardContent>
      </Card>
    </section>
  );
}
