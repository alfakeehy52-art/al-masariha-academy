-- اعتماد النماذج الرسمية (المدير / المسؤول عن التوقيع)
-- نفّذ في Supabase → SQL Editor

alter table public.academy_settings add column if not exists official_signatory_title_ar text;
alter table public.academy_settings add column if not exists official_signatory_name_ar text;

update public.academy_settings
set
  official_signatory_title_ar = coalesce(official_signatory_title_ar, 'مدير أكاديمية المسارحة'),
  official_signatory_name_ar = coalesce(official_signatory_name_ar, '')
where id = 'default';
