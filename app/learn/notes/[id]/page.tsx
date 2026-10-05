import { notFound } from "next/navigation";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  void (await params);
  notFound();
}
