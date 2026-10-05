import type { Metadata } from "next";

const siteName = "TUTOR-ME";

export function buildMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title: `${title} | ${siteName}`,
    description:
      description ??
      "TUTOR-ME helps Nigerian students learn, practise, prepare and improve for their exams.",
    alternates: {
      canonical: path,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
