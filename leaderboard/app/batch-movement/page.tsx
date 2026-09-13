import { rankStudents } from "@/app/_lib/ranking";
import { loadStudentsFromDisk } from "@/app/_lib/students";
import { BatchMovementApp } from "./_components/batch-movement-app";

export default async function BatchMovementPage() {
  const students = await loadStudentsFromDisk();
  const ranked = rankStudents(students);

  return (
    <div className="flex flex-1 bg-background">
      <main className="w-full px-6 py-10 sm:px-10 lg:px-16">
        <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.6px] text-foreground">
          Batch Movement
        </h1>
        <BatchMovementApp students={ranked} />
      </main>
    </div>
  );
}
