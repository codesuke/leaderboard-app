import { Suspense } from "react";
import { LeaderboardApp } from "./_components/leaderboard-app";
import { rankStudents } from "./_lib/ranking";
import { loadStudentsFromDisk } from "./_lib/students";

export default async function Home() {
  const students = await loadStudentsFromDisk();
  const ranked = rankStudents(students);

  return (
    <div className="flex flex-1 bg-background">
      <main className="w-full px-6 py-10 sm:px-10 lg:px-16">
        <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.6px] text-foreground">
          Leaderboard
        </h1>
        <Suspense>
          <LeaderboardApp students={ranked} />
        </Suspense>
      </main>
    </div>
  );
}
