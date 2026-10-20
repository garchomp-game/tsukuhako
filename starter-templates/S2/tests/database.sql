\set ON_ERROR_STOP on
begin;
do $$ begin
  if not (select relrowsecurity from pg_class where oid='public.notes'::regclass) then
    raise exception 'RLS must be enabled';
  end if;
  if (select count(*) from pg_policies where schemaname='public' and tablename='notes') <> 4 then
    raise exception 'Expected four explicit local policies';
  end if;
end $$;
set local role anon;
do $$
declare saved_id uuid; observed_body text; before_update timestamptz; after_update timestamptz; rows_changed integer;
begin
  insert into public.notes(body) values ('SQL試験📝') returning id, updated_at into saved_id, before_update;
  select body into observed_body from public.notes where id=saved_id;
  if observed_body <> 'SQL試験📝' then raise exception 'anonymous read failed'; end if;
  update public.notes set body='更新📝' where id=saved_id returning updated_at into after_update;
  if after_update <= before_update then raise exception 'updated_at not advanced'; end if;
  delete from public.notes where id=saved_id;
  if exists(select 1 from public.notes where id=saved_id) then raise exception 'delete failed'; end if;
  update public.notes set body='存在しない' where id='ffffffff-ffff-4fff-8fff-ffffffffffff';
  get diagnostics rows_changed = row_count;
  if rows_changed <> 0 then raise exception 'missing id changed data'; end if;
  insert into public.notes(body) values (repeat('📝', 200)) returning id into saved_id;
  delete from public.notes where id=saved_id;
  begin
    insert into public.notes(body) values ('');
    raise exception 'empty body accepted';
  exception when check_violation then null; end;
  begin
    insert into public.notes(body) values (repeat('📝', 201));
    raise exception 'overlong body accepted';
  exception when check_violation then null; end;
  begin
    insert into public.notes(body) values (chr(9)||'空白');
    raise exception 'untrimmed body accepted';
  exception when check_violation then null; end;
  begin
    insert into public.notes(body) values (chr(12288));
    raise exception 'unicode whitespace accepted';
  exception when check_violation then null; end;
  begin
    insert into public.notes(id, body) values (gen_random_uuid(), 'idの偽装');
    raise exception 'anonymous metadata insert accepted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: anon CRUD, RLS, grants, timestamps, missing id, Unicode and constraints' as result;
