-- Re-running seed leaves existing rows and user edits untouched.
INSERT INTO public.sample_items (code, name, quantity)
VALUES ('notebook', '架空のノート', 3), ('pencil', '架空の鉛筆', 8)
ON CONFLICT (code) DO NOTHING;
