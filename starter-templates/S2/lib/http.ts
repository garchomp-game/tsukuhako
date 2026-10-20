import { DatabaseError } from "./database";
import { validateNote } from "./note-input";

export function error(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}
export function databaseError(cause: unknown) {
  if (cause instanceof DatabaseError) return error(cause.status, cause.code, cause.message);
  return error(500, "INTERNAL_ERROR", "処理できませんでした。時間をおいて再試行してください");
}
export async function readBody(request: Request): Promise<string | Response> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") ?? "")) {
    return error(415, "UNSUPPORTED_MEDIA_TYPE", "JSONで送信してください");
  }
  let input: unknown;
  try { input = await request.json(); } catch { return error(400, "INVALID_JSON", "JSONを確認してください"); }
  const result = validateNote(input);
  return result.ok ? result.body : error(400, "INVALID_INPUT", result.message);
}
