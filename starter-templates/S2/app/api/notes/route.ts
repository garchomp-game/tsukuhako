import { notesRequest } from "../../../lib/database";
import { readBody, databaseError } from "../../../lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ notes: await notesRequest("GET") }); } catch (cause) { return databaseError(cause); }
}
export async function POST(request: Request) {
  const body = await readBody(request);
  if (body instanceof Response) return body;
  try { return Response.json({ note: (await notesRequest("POST", undefined, body))[0] }, { status: 201 }); }
  catch (cause) { return databaseError(cause); }
}
