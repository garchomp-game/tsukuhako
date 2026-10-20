-- Fixed IDs make an intentional repeat of this seed safe; edited notes are preserved.
insert into public.notes (id, body) values
('11111111-1111-4111-8111-111111111111', '架空の学習メモ: 画面からメモを追加してみる'),
('22222222-2222-4222-8222-222222222222', '架空の学習メモ: 停止とリセットの違いを確認する')
on conflict (id) do nothing;
