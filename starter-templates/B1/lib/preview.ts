export type Preview = { text: string; length: number };
export type ApiError = { error: { code: string; message: string } };

function error(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } } satisfies ApiError, { status });
}

export async function preview(request: Request): Promise<Response> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return error(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Typeはapplication/jsonにしてください");
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return error(400, "INVALID_JSON", "JSONを確認してください");
  }

  if (typeof input !== "object" || input === null || !("text" in input) || typeof input.text !== "string") {
    return error(400, "INVALID_INPUT", "textには文字列を指定してください");
  }
  const text = input.text.trim();
  const length = Array.from(text).length;
  if (length === 0) return error(400, "INVALID_INPUT", "空白以外の文字を入力してください");
  if (length > 200) return error(400, "INVALID_INPUT", "200コードポイント以内で入力してください");

  return Response.json({ text, length } satisfies Preview);
}
