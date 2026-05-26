-- أعمدة ولي الأمر في طلبات الانضمام (لاعب قاصر)
-- نفّذ في Supabase → SQL Editor إذا ظهر خطأ: guardian_name غير موجود في join_requests

alter table public.join_requests add column if not exists guardian_name text;
alter table public.join_requests add column if not exists guardian_phone text;
alter table public.join_requests add column if not exists guardian_national_id text;

-- تحقق:
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'join_requests'
--   and column_name like 'guardian%';
