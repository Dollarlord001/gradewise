import { WeakAreasList } from "@/components/diagnosis/WeakAreasList";

export default function WeakAreasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Weak areas</h1>
      <p className="mt-2 text-sm text-navy-500">Based on topics with enough attempts and accuracy under 70%.</p>
      <div className="mt-6">
        <WeakAreasList areas={[]} />
      </div>
    </div>
  );
}
