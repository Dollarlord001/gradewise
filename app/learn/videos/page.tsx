import { VideoLibraryBrowser } from "@/components/video/VideoLibraryBrowser";
import { emptyVideoList } from "@/lib/video-catalogue";

/**
 * Video library hub. Lists are always paginated/filtered.
 * Scale is unlimited at the data layer; UI never dumps the full catalogue.
 */
export default function VideoLibraryPage() {
  const initial = emptyVideoList();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">Video library</h1>
      <p className="mt-2 max-w-2xl text-navy-600">
        Browse by subject and topic. Only approved, licensed videos appear when the catalogue is
        populated.
      </p>
      <div className="mt-8">
        <VideoLibraryBrowser initial={initial} />
      </div>
    </div>
  );
}
