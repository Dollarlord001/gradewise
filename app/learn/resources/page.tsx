import { ResourceLibraryBrowser } from "@/components/library/ResourceLibraryBrowser";

export default function ResourcesLibraryPage() {
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><h1 className="text-2xl font-semibold text-navy-900">Digital library</h1><p className="mt-2 max-w-2xl text-navy-600">Browse open and authorized textbooks, study notes, syllabi and reference materials by exam, subject and topic. Each record links back to its source and licence terms.</p><div className="mt-8"><ResourceLibraryBrowser /></div></main>;
}
