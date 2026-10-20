"use client";

import { useRef, useState, type FormEvent } from "react";

type Preview = { text: string; length: number };
type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; result: Preview }
  | { kind: "error"; message: string };

function isPreview(value: unknown): value is Preview {
  return typeof value === "object" && value !== null && "text" in value && typeof value.text === "string" && "length" in value && typeof value.length === "number";
}

function inputError(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("error" in value)) return undefined;
  const error = value.error;
  if (typeof error !== "object" || error === null || !("code" in error) || !("message" in error)) return undefined;
  if (error.code !== "INVALID_INPUT" || typeof error.message !== "string") return undefined;
  return error.message;
}

export default function PreviewForm() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const sending = useRef(false);
  const pending = state.kind === "pending";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setState({ kind: "pending" });
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const result: unknown = await response.json();
      if (response.ok && isPreview(result)) {
        setState({ kind: "success", result });
      } else {
        setState({ kind: "error", message: response.status === 400 ? inputError(result) ?? "入力を確認してもう一度お試しください。" : "APIで問題が起きました。少し待ってからもう一度お試しください。" });
      }
    } catch {
      setState({ kind: "error", message: "通信に失敗しました。開発サーバーと接続を確認して、もう一度お試しください。" });
    } finally {
      sending.current = false;
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-900/15 bg-white p-6 sm:p-8" aria-label="プレビューの練習">
      <form onSubmit={submit} aria-busy={pending}>
        <label htmlFor="text" className="mb-2 block font-semibold">送信することば</label>
        <textarea id="text" value={text} onChange={(event) => setText(event.target.value)} disabled={pending} rows={4} className="w-full rounded-lg border border-slate-400 p-4 leading-7 disabled:bg-slate-100" placeholder="  こんにちは  " aria-describedby="text-help" />
        <p id="text-help" className="mt-2 text-sm text-slate-600">空白を除いて1〜200コードポイント。空欄を送って、エラーも確かめられます。</p>
        <div className="my-6 flex gap-3">
          <button type="submit" disabled={pending} className="rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "送信中…" : "プレビューを送信"}</button>
          <button type="button" disabled={pending} onClick={() => { setText(""); setState({ kind: "idle" }); }} className="rounded-lg border border-slate-300 px-5 py-3 disabled:opacity-50">クリア</button>
        </div>
      </form>
      <div aria-live="polite" aria-atomic="true">
        {state.kind === "idle" && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">送信すると、ここに結果が表示されます。</p>}
        {state.kind === "pending" && <p role="status" className="rounded-lg bg-slate-50 p-4 text-sm">APIの応答を待っています。</p>}
        {state.kind === "error" && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-900">{state.message}</p>}
        {state.kind === "success" && <div className="rounded-lg border-l-4 border-emerald-700 bg-emerald-50 p-5"><h2 className="text-sm font-semibold text-emerald-900">APIからの返事</h2><p data-testid="preview-result" className="my-3 whitespace-pre-wrap break-words text-lg">{state.result.text}</p><p className="text-sm text-emerald-900">{state.result.length} コードポイント</p></div>}
      </div>
    </section>
  );
}
