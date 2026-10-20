-- Apply manually only to a dedicated EMPTY learning Supabase project.
-- Existing tables intentionally cause an error; this script does not overwrite them.
begin;
create table public.learning_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  price_yen integer not null check (price_yen >= 0),
  is_public boolean not null default false
);
alter table public.learning_products enable row level security;
revoke all on public.learning_products from public, anon, authenticated;
grant usage on schema public to anon;
grant select on public.learning_products to anon;
create policy public_catalog_read on public.learning_products for select to anon using (is_public = true);

insert into public.learning_products(id,name,price_yen,is_public) values
('33333333-3333-4333-8333-333333333333','架空の青いノート',300,true),
('44444444-4444-4444-8444-444444444444','架空の緑のしおり',120,true),
('55555555-5555-4555-8555-555555555555','非公開の架空商品（権限確認用）',999,false);
comment on table public.learning_products is 'Fictional public read-only learning catalog. No anonymous writes.';
commit;
