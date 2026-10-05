import Link from "next/link";
import { cn } from "@/lib/utils";

export function SubjectCard({
  name,
  href,
  questionCount,
  className,
}: {
  name: string;
  href: string;
  questionCount?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "card-base flex items-center justify-between gap-3 p-4 transition hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500",
        className
      )}
    >
      <div>
        <h3 className="font-medium text-navy-900">{name}</h3>
        {questionCount != null ? (
          <p className="text-xs text-navy-500">{questionCount} questions</p>
        ) : null}
      </div>
      <span className="text-navy-400" aria-hidden>
        →
      </span>
    </Link>
  );
}
