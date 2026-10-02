export async function GET() {
  return Response.json({ status: "ok", service: "tutor-me" }, { headers: { "Cache-Control": "no-store" } });
}
