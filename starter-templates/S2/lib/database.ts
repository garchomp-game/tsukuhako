import "server-only";
import type { Note } from "./note-input";

export class DatabaseError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function notesRequest(method: string, id?: string, body?: string): Promise<Note[]> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) throw new DatabaseError(503, "DB_NOT_CONFIGURED", "ホストで bash scripts/db.sh start を実行し、開発サーバーを再起動してください");
  // Server-only URL points at Kong on the project's isolated Docker network.
  const url = new URL("/rest/v1/notes", base);
  url.searchParams.set("select", "id,body,created_at,updated_at");
  if (id) url.searchParams.set("id", `eq.${id}`);
  if (method === "GET") url.searchParams.set("order", "created_at.desc,id.desc");
  let response: Response;
  try {
    response = await fetch(url, {
      method, cache: "no-store", signal: AbortSignal.timeout(5000),
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: body === undefined ? undefined : JSON.stringify({ body }),
    });
  } catch {
    throw new DatabaseError(503, "DB_UNAVAILABLE", "保存先へ接続できません。ホストでDBの起動状態を確認してください");
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    if (result.code === "23514" || result.code === "22021") throw new DatabaseError(400, "INVALID_INPUT", "本文は空白を除いて1〜200文字で入力してください");
    throw new DatabaseError(503, "DB_UNAVAILABLE", "保存先で処理できませんでした。DBの起動とmigrationを確認してください");
  }
  return response.json() as Promise<Note[]>;
}
