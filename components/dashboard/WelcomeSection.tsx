import { formatCountdown } from "@/lib/utils";
import type { StudentProfile } from "@/types/student";

export function WelcomeSection({ student }: { student: StudentProfile | null }) {
  const name = student?.displayName?.trim() || "Student";
  const exam = student?.exam ?? null;
  const countdown = formatCountdown(student?.examDate);
  const target = student?.targetScore;

  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6" aria-labelledby="welcome-heading">
      <h1 id="welcome-heading" className="text-2xl font-semibold text-navy-900 sm:text-3xl">
        Welcome back, {name}
      </h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-navy-600">
        {exam ? (
          <span className="rounded-full bg-navy-50 px-3 py-1 font-medium text-navy-800">{exam}</span>
        ) : (
          <span className="text-navy-400">Exam not set</span>
        )}
        {countdown ? (
          <span className="rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-800">{countdown}</span>
        ) : null}
        {target != null ? (
          <span className="rounded-full bg-seagreen-50 px-3 py-1 font-medium text-seagreen-800">
            Target {target}
          </span>
        ) : null}
      </div>
    </section>
  );
}
