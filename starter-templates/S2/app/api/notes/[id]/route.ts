import { notesRequest } from "../../../../lib/database";
import { validId } from "../../../../lib/note-input";
import { error, readBody, databaseError } from "../../../../lib/http";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  if (!validId(id)) return error(400, "INVALID_ID", "メモのIDを確認してください");
  const body = await readBody(request);
  if (body instanceof Response) return body;
  try {
    const notes = await notesRequest("PATCH", id, body);
    return notes.length ? Response.json({ note: notes[0] }) : error(404, "NOT_FOUND", "メモが見つかりません");
  } catch (cause) { return databaseError(cause); }
}
export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!validId(id)) return error(400, "INVALID_ID", "メモのIDを確認してください");
  try {
    const notes = await notesRequest("DELETE", id);
    return notes.length ? new Response(null, { status: 204 }) : error(404, "NOT_FOUND", "メモが見つかりません");
  } catch (cause) { return databaseError(cause); }
}
