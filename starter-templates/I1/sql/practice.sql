-- Change the label, save, and run: bash scripts/db.sh query sql/practice.sql
SELECT 'SQLの練習' AS lesson, code, name, quantity
FROM public.sample_items
ORDER BY code;
