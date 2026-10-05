import Link from "next/link";
import type { LearningResource } from "@/types/learning";

export function ResourceCard({ resource }: { resource: LearningResource }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-navy-50 text-xs text-navy-400">
        {resource.resourceType}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-navy-900">
          <Link href={`/learn/resources/${resource.id}`} className="hover:text-orange-600">
            {resource.title}
          </Link>
        </h3>
        {(resource.author || resource.publisher) && (
          <p className="text-xs text-navy-500">
            {[resource.author, resource.publisher].filter(Boolean).join(" · ")}
          </p>
        )}
        {resource.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-navy-600">{resource.description}</p>
        ) : null}
        <p className="mt-2 text-xs text-navy-400">
          Access: {resource.accessType.replace("_", " ")} · Rights: {resource.rightsStatus}
        </p>
      </div>
    </article>
  );
}
