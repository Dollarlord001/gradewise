import Link from "next/link";
import type { ExamDefinition } from "@/lib/exams";
import { cn } from "@/lib/utils";

export function ExamCard({ exam, className }: { exam: ExamDefinition; className?: string }) {
  return (
    <Link
      href={`/exams/${exam.slug}`}
      className={cn(
        "card-base group flex flex-col gap-3 p-5 transition hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-sm font-bold text-navy-700">
        {exam.shortName.slice(0, 2)}
      </div>
      <div>
        <h3 className="font-semibold text-navy-900 group-hover:text-orange-600">{exam.name}</h3>
        <p className="mt-1 text-sm text-navy-500 line-clamp-2">{exam.description}</p>
      </div>
      <span className="text-sm font-medium text-orange-600">Explore →</span>
    </Link>
  );
}
