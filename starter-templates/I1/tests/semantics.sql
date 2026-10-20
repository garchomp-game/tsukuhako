\set ON_ERROR_STOP on
BEGIN;

-- This transaction rolls back all test rows and edits, even when a check fails.
DO $test$
DECLARE
  item_id bigint;
  observed_name text;
  observed_quantity integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.schema_migrations WHERE name = '001_create_sample_items.sql') THEN
    RAISE EXCEPTION 'migration history missing';
  END IF;

  INSERT INTO public.sample_items (code, name, quantity)
    VALUES ('test-semantic-crud', '日本語😀', 2) RETURNING id INTO item_id;
  SELECT name, quantity INTO observed_name, observed_quantity
    FROM public.sample_items WHERE id = item_id;
  IF observed_name <> '日本語😀' OR observed_quantity <> 2 THEN
    RAISE EXCEPTION 'insert/select did not preserve values';
  END IF;

  UPDATE public.sample_items SET name = '<script>文字列</script>', quantity = 5 WHERE id = item_id;
  SELECT name, quantity INTO observed_name, observed_quantity
    FROM public.sample_items WHERE id = item_id;
  IF observed_name <> '<script>文字列</script>' OR observed_quantity <> 5 THEN
    RAISE EXCEPTION 'update did not preserve literal text';
  END IF;

  BEGIN
    INSERT INTO public.sample_items (code, name) VALUES ('test-empty', '   ');
    RAISE EXCEPTION 'blank name was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.sample_items (code, name) VALUES ('test-long', repeat('あ', 81));
    RAISE EXCEPTION 'long name was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO public.sample_items (code, name) VALUES ('test-boundary', repeat('😀', 80));
  BEGIN
    UPDATE public.sample_items SET quantity = -1 WHERE id = item_id;
    RAISE EXCEPTION 'negative quantity was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.sample_items (code, name) VALUES ('test-null', NULL);
    RAISE EXCEPTION 'null name was accepted';
  EXCEPTION WHEN not_null_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.sample_items (code, name) VALUES ('test-semantic-crud', '重複');
    RAISE EXCEPTION 'duplicate code was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.sample_items (code, name) VALUES ('INVALID CODE', '無効');
    RAISE EXCEPTION 'invalid code was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  DELETE FROM public.sample_items WHERE id = item_id;
  IF EXISTS (SELECT 1 FROM public.sample_items WHERE id = item_id) THEN
    RAISE EXCEPTION 'delete failed';
  END IF;
END
$test$;
ROLLBACK;
\echo 'PASS: SQL CRUD / 日本語・絵文字 / 制約 / rollback'
