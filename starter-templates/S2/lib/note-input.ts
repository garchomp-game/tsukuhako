export type Note = { id: string; body: string; created_at: string; updated_at: string };
export type Validation = { ok: true; body: string } | { ok: false; message: string };

export function validateNote(input: unknown): Validation {
  if (!input || typeof input !== "object" || !("body" in input) || typeof input.body !== "string") {
    return { ok: false, message: "本文は文字列で入力してください" };
  }
  const body = input.body.trim();
  const length = Array.from(body).length;
  if (length === 0) return { ok: false, message: "本文を1文字以上入力してください" };
  if (length > 200) return { ok: false, message: "本文は200文字以内で入力してください" };
  if (body.includes("\u0000") || !body.isWellFormed()) return { ok: false, message: "本文に扱えない文字が含まれています" };
  return { ok: true, body };
}

export function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
