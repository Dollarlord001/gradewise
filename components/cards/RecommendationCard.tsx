import Link from "next/link";
import { cn } from "@/lib/utils";

export function RecommendationCard({
  title,
  description,
  href,
  meta,
  className,
}: {
  title: string;
  description?: string;
  href: string;
  meta?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "card-base block p-4 transition hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500",
        className
      )}
    >
      <h3 className="font-medium text-navy-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-navy-500 line-clamp-2">{description}</p> : null}
      {meta ? <p className="mt-2 text-xs text-navy-400">{meta}</p> : null}
    </Link>
  );
}
