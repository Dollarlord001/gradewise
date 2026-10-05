export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Questions to review</h1>
      <p className="mt-2 text-navy-600">Incorrect, bookmarked, and marked-for-review items from your own attempts.</p>
      <p className="mt-8 rounded-2xl border border-dashed border-navy-200 px-6 py-10 text-center text-sm text-navy-500">
        Nothing to review yet.
      </p>
    </div>
  );
}
