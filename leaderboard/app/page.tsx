import { LeaderboardApp } from "./_components/leaderboard-app";
import { rankStudents } from "./_lib/ranking";
import { loadStudentsFromDisk } from "./_lib/students";

export default async function Home() {
  const students = await loadStudentsFromDisk();
  const ranked = rankStudents(students);

  return (
    <div className="flex flex-1 justify-center bg-background">
      <main className="w-full max-w-6xl px-8 py-12">
        <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.6px] text-foreground">
          Leaderboard
        </h1>
        <LeaderboardApp students={ranked} />
      </main>
    </div>
  );
}
