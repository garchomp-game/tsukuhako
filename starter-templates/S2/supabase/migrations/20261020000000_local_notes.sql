-- LOCAL LEARNING ONLY. Anonymous CRUD is intentionally allowed on fake notes.
-- Do not apply this migration to a hosted or production Supabase project.
create function public.trim_note(value text)
returns text language sql immutable strict set search_path = '' as $$
  select btrim(value,
    chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||
    chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||
    chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||
    chr(8287)||chr(12288)||chr(65279));
$$;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_body_trimmed check (body = public.trim_note(body)),
  constraint notes_body_length check (char_length(body) between 1 and 200)
);

create function public.touch_note_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
create trigger notes_touch_updated_at before update on public.notes
for each row execute function public.touch_note_updated_at();

alter table public.notes enable row level security;
revoke all on public.notes from public, anon, authenticated;
revoke all on function public.trim_note(text) from public;
revoke all on function public.touch_note_updated_at() from public;
grant usage on schema public to anon;
grant execute on function public.trim_note(text) to anon;
grant select, delete on public.notes to anon;
grant insert (body), update (body) on public.notes to anon;
create policy local_notes_read on public.notes for select to anon using (true);
create policy local_notes_create on public.notes for insert to anon with check (true);
create policy local_notes_update on public.notes for update to anon using (true) with check (true);
create policy local_notes_delete on public.notes for delete to anon using (true);

comment on table public.notes is 'LOCAL ONLY: anonymous CRUD for fictional learning notes; never deploy to cloud.';
