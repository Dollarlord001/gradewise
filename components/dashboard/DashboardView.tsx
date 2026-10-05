import type { DashboardSnapshot } from "@/types/student";
import { WelcomeSection } from "./WelcomeSection";
import { TodaysPlan } from "./TodaysPlan";
import { NextActionCard } from "@/components/cards/NextActionCard";
import { PerformanceSnapshot } from "./PerformanceSnapshot";
import { NeedsAttention } from "./NeedsAttention";
import { StreakCard } from "./StreakCard";
import { RecentActivity } from "./RecentActivity";
import Link from "next/link";

/**
 * Student command centre. Data must come from real student records —
 * this component never invents accuracy, streaks, or weak topics.
 */
export function DashboardView({ data }: { data: DashboardSnapshot }) {
  const weakTopics = data.mastery.filter((m) => m.mastery < 50).sort((a, b) => a.mastery - b.mastery);

  return (
    <div className="space-y-6">
      <WelcomeSection student={data.student} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {data.nextAction ? <NextActionCard action={data.nextAction} /> : null}
          <TodaysPlan items={data.planItems} />
          <NeedsAttention weakTopics={weakTopics} reviewCount={data.mistakesToReview.length} />
          <RecentActivity items={data.recentActivity} />
        </div>
        <div className="space-y-6">
          <PerformanceSnapshot
            accuracyPercent={data.accuracyPercent}
            questionsAttempted={data.questionsAttempted}
            studyMinutes={data.studyMinutes}
          />
          <StreakCard days={data.streakDays} />
          <section className="card-base p-5">
            <h2 className="text-base font-semibold text-navy-900">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/practice" className="text-orange-600 hover:underline">
                  Practice
                </Link>
              </li>
              <li>
                <Link href="/cbt" className="text-orange-600 hover:underline">
                  Full CBT
                </Link>
              </li>
              <li>
                <Link href="/ask-tutor" className="text-orange-600 hover:underline">
                  Ask Tutor
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-orange-600 hover:underline">
                  Learn
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
