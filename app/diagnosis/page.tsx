import Link from "next/link";

export default function DiagnosisPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Diagnosis</h1>
      <p className="mt-2 text-navy-600">
        Insights come from your real attempts. Until there is enough data:
      </p>
      <p className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/50 p-5 text-navy-800">
        Let&apos;s get to know your level. Complete a short practice set so we can highlight subjects and topics that need attention.
      </p>
      <Link href="/practice/setup" className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
        Start diagnostic practice
      </Link>
    </div>
  );
}
