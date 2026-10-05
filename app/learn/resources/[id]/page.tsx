import { notFound } from "next/navigation";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  void (await params);
  notFound();
}
