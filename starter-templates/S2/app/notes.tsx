"use client";
import { useCallback, useEffect, useState } from "react";
import type { Note } from "../lib/note-input";

async function fetchNotes(): Promise<Note[]> {
  const response = await fetch("/api/notes", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "一覧を取得できませんでした");
  return data.notes;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setNotes(await fetchNotes());
  }, []);
  useEffect(() => {
    let active = true;
    fetchNotes().then(data => { if (active) setNotes(data); })
      .catch((cause: Error) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function mutate(method: "POST" | "PATCH" | "DELETE", id?: string) {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(id ? `/api/notes/${id}` : "/api/notes", {
        method, headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify({ body }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "操作に失敗しました");
      }
      if (method !== "DELETE" || editing === id) { setBody(""); setEditing(null); }
      setMessage(method === "DELETE" ? "削除しました" : method === "PATCH" ? "更新しました" : "保存しました");
      await load();
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== "Failed to fetch" ? cause.message : "通信できません。開発サーバーとDBの起動を確認してください");
    } finally { setBusy(false); }
  }
  return <>
    <section className="panel" aria-labelledby="editor-title">
      <h2 id="editor-title">{editing ? "メモを編集" : "新しいメモ"}</h2>
      <form onSubmit={event => { event.preventDefault(); void mutate(editing ? "PATCH" : "POST", editing ?? undefined); }}>
        <label htmlFor="body">本文</label>
        <textarea id="body" value={body} onChange={event => setBody(event.target.value)} disabled={busy} placeholder="今日試したことを、ひとつ。" rows={3} aria-describedby="limit" />
        <div className="form-bottom"><p id="limit">{Array.from(body.trim()).length} / 200 文字（空白除去後）</p><div className="actions">
          {editing && <button type="button" className="secondary" disabled={busy} onClick={() => { setEditing(null); setBody(""); }}>キャンセル</button>}
          <button type="submit" disabled={busy}>{busy ? "処理中…" : editing ? "更新する" : "保存する"}</button>
        </div></div>
      </form>
    </section>
    {error && <p role="alert" aria-label="操作エラー" className="error">{error}</p>}
    <p role="status" className="status">{message}</p>
    <section aria-labelledby="list-title">
      <div className="list-title"><h2 id="list-title">保存したメモ <span>{notes.length}</span></h2><button className="secondary" disabled={busy || loading} onClick={async () => { setLoading(true); setError(""); try { await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "一覧を取得できませんでした"); } finally { setLoading(false); } }}>一覧を再読込</button></div>
      {loading ? <p>読み込み中…</p> : notes.length === 0 && !error ? <p className="empty">まだメモがありません。上の欄から最初のメモを保存しましょう。</p> : null}
      <ul className="notes">{notes.map(note => <li key={note.id} data-note-id={note.id}>
        <p className="note-body">{note.body}</p>
        <div className="note-bottom"><time dateTime={note.updated_at}>更新 {new Date(note.updated_at).toLocaleString("ja-JP")}</time><div className="actions">
          <button className="secondary" aria-label={`編集: ${note.body}`} disabled={busy} onClick={() => { setEditing(note.id); setBody(note.body); setError(""); setMessage(""); document.getElementById("body")?.focus(); }}>編集</button>
          <button className="danger" aria-label={`削除: ${note.body}`} disabled={busy} onClick={() => void mutate("DELETE", note.id)}>削除</button>
        </div></div>
      </li>)}</ul>
    </section>
  </>;
}
