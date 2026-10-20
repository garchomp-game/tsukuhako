\set ON_ERROR_STOP on
-- Run after sample SQL ONLY in a disposable local DB dedicated to this test.
begin;
do $$ begin
  if not (select relrowsecurity from pg_class where oid='public.learning_products'::regclass) then raise exception 'RLS disabled'; end if;
  if not has_table_privilege('anon','public.learning_products','SELECT') then raise exception 'SELECT grant missing'; end if;
  if has_table_privilege('anon','public.learning_products','INSERT,UPDATE,DELETE') then raise exception 'write grants must be absent'; end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='learning_products' and cmd <> 'SELECT') then raise exception 'write policy present'; end if;
end $$;
set local role anon;
do $$ begin
  if (select count(*) from public.learning_products) <> 2 then raise exception 'public SELECT/RLS filtering failed'; end if;
  if exists(select 1 from public.learning_products where is_public=false) then raise exception 'private row exposed'; end if;
  begin insert into public.learning_products(name,price_yen,is_public) values('未許可',1,true); raise exception 'INSERT allowed'; exception when insufficient_privilege then null; end;
  begin update public.learning_products set name='未許可'; raise exception 'UPDATE allowed'; exception when insufficient_privilege then null; end;
  begin delete from public.learning_products; raise exception 'DELETE allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Exercise RLS separately: temporary grants in this transaction must not allow writes.
grant insert,update,delete on public.learning_products to anon;
set local role anon;
do $$ declare changed integer; begin
  begin insert into public.learning_products(name,price_yen,is_public) values('RLS拒否',1,true); raise exception 'RLS INSERT allowed'; exception when insufficient_privilege then null; end;
  update public.learning_products set name='RLS拒否'; get diagnostics changed=row_count;
  if changed <> 0 then raise exception 'RLS UPDATE changed rows'; end if;
  delete from public.learning_products; get diagnostics changed=row_count;
  if changed <> 0 then raise exception 'RLS DELETE changed rows'; end if;
end $$;
rollback;
select 'PASS: actual anon SELECT, hidden row filtering, INSERT/UPDATE/DELETE grant rejection and independent RLS denial' as result;
